# MBTI 灵魂读心术 — 开发计划

> 基于 design.md v2.0 | 适配现有 Rex (Go/Kratos) + H5 (Vite/TS) 技术栈

---

## 0. 架构原则

> **MBTI 是一个完全独立的服务，不与 revol 其他业务服务发生耦合。**
> 唯一的外部依赖：通过 `room_push` 通道将游戏事件推送到房间内用户。

### 0.1 技术栈决策

| 层 | 技术 | 依据 |
|----|------|------|
| Server | Go 1.23 + Kratos v2 + gRPC/HTTP | 复用 Rex 现有框架 |
| DB | MySQL (GORM) | MBTI **独立数据库** (`mbti`)，不依赖任何 revol 表 |
| Cache / 实时状态 | Redis | 游戏状态热数据 |
| 房间推送 | HTTP → `room_push` → `room_gateway` | 经 WS(Op20) → Flutter → H5 |

| 层 | 技术 | 依据 |
|----|------|------|
| H5 前端 | Vite + TypeScript + Vue 3 + Pinia | 轻量 SPA |
| H5 ↔ Server | HTTP API (走 Rex gateway 代理) | H5 主动请求走 HTTP |
| Server → 房间用户 | HTTP POST → `room_push` → `room_gateway` → WS(Op20) → Flutter → H5 | 标准房间推送通道 |
| H5 ↔ Flutter | JSBridge (`window.onDartEvent` / `postMessage`) | 支付、分享、原生动效、推送转发 |

### 0.2 MBTI 服务的隔离边界

```
┌───────────────────────────────────────┐
│         MBTI 独立服务边界              │
│                                       │
│  HTTP/gRPC API                        │
│  biz 层 (游戏逻辑/状态机/计分/画像)    │
│  data 层 (MySQL mbti库 + Redis)       │
│                                       │
│  唯一外部接口:                         │
│  └─ HTTP POST → room_push /push/room  │
│     向房间广播游戏事件                  │
│                                       │
└───────────────────────────────────────┘
         ↑ HTTP             ↓ HTTP POST /push/room
    ┌────┴────┐      ┌──────┴──────────────┐
    │ Rex     │      │ room_push            │
    │ Gateway │      │ (fan-out service)    │
    └────┬────┘      └──────┬──────────────┘
         │                  │ gRPC → room_gateway → WS Op20
    ┌────┴──────────────────┴────────────┐
    │ Flutter App                        │
    │  ├─ HTTP → Rex Gateway → MBTI API  │
    │  └─ WS Op20 → JSBridge → H5       │
    │     ┌─────────────────┐            │
    │     │ H5 WebView      │            │
    │     │ (MBTI Game UI)  │            │
    │     └─────────────────┘            │
    └────────────────────────────────────┘
```

**不依赖的东西：**
- 不依赖 revol 的用户系统（uid 由 HTTP header/token 传入）
- 不依赖 revol 的支付系统（v1.0 无道具付费）
- 不依赖 `plugin_client` / `session_open_platform`
- 不依赖 `session_bridge`
- 不读写任何 revol 业务数据库

**唯一依赖：**
- HTTP POST 调用 `room_push` 服务（`/push/room`），由 room_push 扇出到 `room_gateway` → WS → Flutter → H5
- Flutter 接收 WS Op20 后转发给 H5 WebView

---

## 1. 推送链路详解

### 1.1 Server → 房间用户 完整链路

```
MBTI Go Service
  │
  │ biz 层触发游戏事件 (如 mbti.guessing_started)
  │
  ▼
PushRepo.PushToRoom(sessionID, eventType, data)
  │
  │ HTTP POST → room_push /push/room
  │ body: { room_id, op: 20, body: { type, data } }
  │
  ▼
room_push (Go service)
  │
  │ 查 room_router 获取 uid → gateway 映射
  │ gRPC 扇出到各 room_gateway 节点
  │
  ▼
room_gateway WebSocket → Flutter
  │
  │ Proto { op: 20, body: jsonPayload }
  │
  ▼
Flutter VoiceRoomPage._handlePluginPush()
  │
  │ 解析 JSON, 过滤 mbti.* 事件
  │ _bridge.send(RoomPushEvent(event, data))
  │
  ▼
H5 WebView: window.onDartEvent
  │
  │ useGameState composable 分发到 Pinia store
  │
  ▼
Vue 组件响应式更新 + Router 自动导航
```

### 1.2 推送事件清单

| 事件类型 | 触发时机 | 数据内容 |
|---------|---------|---------|
| `mbti.game_started` | CreateGame | game_id, pack_info, target_user, total_questions |
| `mbti.voting_started` | NextQuestion | 3 道候选题 (id + question text) |
| `mbti.voting_result` | 投票结束 | 选中的题目 id |
| `mbti.guessing_started` | 投票结束自动触发 | question 完整内容 (含选项), deadline |
| `mbti.target_locked` | 被猜者提交答案 | (无答案内容，仅通知锁定) |
| `mbti.guess_count` | 每有人提交猜测 | 当前已提交人数 |
| `mbti.reveal_distribution` | RevealAnswer Step1 | 各选项猜测人数分布 |
| `mbti.reveal_answer` | RevealAnswer Step2 | 正确答案, 猜对率, 猜对用户列表 |
| `mbti.streak_alert` | 有人达到连击 | uid, streak_count |
| `mbti.profile_ready` | 画像生成完毕 | MBTI 类型, 四维比例 |
| `mbti.settlement` | 游戏结束 | Top N 排行榜, 全员排名 |
| `mbti.game_ended` | 游戏终止 | 终止原因 |

### 1.3 H5 → Server 请求链路

```
H5 Vue Component
  │ 调用 api/mbti.ts
  ▼
Axios HTTP → /mbti/v1/xxx
  │
  ▼
Rex Gateway (:443)
  │ 路由 /mbti/** → mbti service (etcd: mbti)
  ▼
MBTI Kratos Service (HTTP handler)
```

---

## 2. Server 端开发

### 2.1 目录结构（`rex/app/mbti`）

```
rex/
├── api/mbti/v1/
│   ├── mbti.proto              # gRPC + HTTP 接口定义
│   └── (generated .pb.go)
├── app/mbti/
│   ├── cmd/
│   │   └── main.go             # Kratos 启动入口 (Wire)
│   ├── configs/
│   │   └── config.yaml         # DB/Redis/open_platform 配置
│   ├── internal/
│   │   ├── conf/
│   │   │   └── conf.proto      # 配置定义
│   │   ├── server/
│   │   │   ├── http.go         # HTTP transport
│   │   │   └── grpc.go         # gRPC transport
│   │   ├── service/
│   │   │   └── mbti.go         # API → biz 适配层
│   │   ├── biz/
│   │   │   ├── repo.go         # 接口 + 领域类型定义
│   │   │   ├── game.go         # 核心游戏逻辑 + 状态机
│   │   │   ├── score.go        # 积分计算引擎
│   │   │   └── profile.go      # MBTI 画像生成
│   │   └── data/
│   │       ├── data.go         # MySQL + Redis 初始化
│   │       ├── model.go        # GORM models
│   │       ├── game.go         # MySQL + Redis 持久化
│   │       ├── question.go     # 题库数据访问
│   │       └── push.go         # PushRepo: HTTP POST → room_push
│   └── Makefile
└── ops/
    ├── mbti.sql                    # 建表 DDL
    └── mbti_questions_seed.sql     # 题库种子数据 (110 题)
```

### 2.2 Proto 接口设计 (`api/mbti/v1/mbti.proto`)

```protobuf
service MBTIGame {
  // ===== 发起者 (Host) =====
  rpc ListPacks(ListPacksReq) returns (ListPacksReply);
  rpc CreateGame(CreateGameReq) returns (CreateGameReply);
  rpc NextQuestion(NextQuestionReq) returns (NextQuestionReply);
  rpc RevealAnswer(RevealAnswerReq) returns (RevealAnswerReply);
  rpc EndGame(EndGameReq) returns (EndGameReply);

  // ===== 被猜者 (Target) =====
  rpc SubmitTargetAnswer(SubmitTargetAnswerReq) returns (SubmitTargetAnswerReply);

  // ===== 猜测者 (Guesser) =====
  rpc JoinGame(JoinGameReq) returns (JoinGameReply);
  rpc Vote(VoteReq) returns (VoteReply);
  rpc SubmitGuess(SubmitGuessReq) returns (SubmitGuessReply);

  // ===== 通用 =====
  rpc GetGameState(GetGameStateReq) returns (GetGameStateReply);
  rpc GetSettlement(GetSettlementReq) returns (GetSettlementReply);
  rpc GetProfile(GetProfileReq) returns (GetProfileReply);
}
```

### 2.3 数据模型

#### MySQL 表（独立数据库 `mbti`，不依赖 revol 任何表）

| 表名 | 用途 |
|------|------|
| `mbti_pack` | 卡包元数据 |
| `mbti_question` | 题库 |
| `mbti_game` | 游戏局记录 |
| `mbti_game_answer` | 用户答题记录 |
| `mbti_game_settlement` | 结算记录 |

#### Redis 数据结构（运行时状态）

```
# 游戏状态 (Hash)
mbti:game:{game_id}
  → state / current_q_idx / target_answer / phase_deadline

# 投票计数 (Hash)
mbti:vote:{game_id}:{round}
  → {question_id}: weighted_score

# 猜测汇总 (Hash)
mbti:guess:{game_id}:{question_id}
  → {uid}: "{answer}|{boost}"

# 猜测分布 (Hash)
mbti:guess_dist:{game_id}:{question_id}
  → {option_value}: count

# 参与者 (Set)
mbti:players:{game_id}

# 连击计数 (Hash)
mbti:streak:{game_id}
  → {uid}: current_streak
```

### 2.4 核心 biz 层：游戏状态机

```
                  CreateGame
                     │
                     ▼
              ┌─────────────┐
              │    SETUP     │
              └──────┬──────┘
                     │ NextQuestion
                     ▼
              ┌─────────────┐  ◄──── (还有下一题时从 REVEALING 回到这里)
              │   VOTING     │  20s 倒计时
              └──────┬──────┘
                     │ 投票结束 / 题目确定
                     ▼
              ┌─────────────┐
              │  GUESSING    │  30s 倒计时
              └──────┬──────┘
                     │ 倒计时结束 / 全部提交
                     ▼
              ┌─────────────┐
              │  REVEALING   │  60s 超时自动揭晓
              └──────┬──────┘
                     │
          ┌──────────┴──────────┐
          ▼ YES                 ▼ NO
     回到 VOTING           ┌─────────────┐
                           │  PROFILE     │
                           └──────┬──────┘
                                  ▼
                           ┌─────────────┐
                           │ SETTLEMENT   │
                           └──────┬──────┘
                                  ▼
                           ┌─────────────┐
                           │    ENDED     │
                           └─────────────┘
```

**关键实现点：**

1. **倒计时管理**：进入有时限的阶段时，Redis 写入 `phase_deadline`，启动 `time.AfterFunc` goroutine 兜底超时
2. **状态推送**：每次状态变更 → `PushRepo.PushToRoom(sid, eventType, data)` → HTTP POST → `room_push` → 到达房间用户
3. **被猜者答案保密**：`SubmitTargetAnswer` 答案写入 Redis 加密存储，仅 `RevealAnswer` 时解密广播
4. **断线重连**：`GetGameState` 返回当前阶段全量快照

### 2.5 配置（room_push 推送地址）

```yaml
# configs/config.yaml
room_push:
  url: http://127.0.0.1:8020
```

MBTI 服务启动时初始化 `PushRepo`，通过 HTTP POST 调用 `room_push` 服务的 `/push/room` 端点推送事件。

### 2.6 定时任务

| 任务 | 触发方式 | 说明 |
|------|---------|------|
| 阶段超时处理 | `time.AfterFunc` | VOTING 20s / GUESSING 30s / REVEALING 60s |
| 游戏清理 | Cron (每 5 min) | 清理超过 30 min 未活动的僵尸游戏 |
| Redis → MySQL 持久化 | 游戏结束时 | 批量写入 answer + settlement |

---

## 3. Client 端开发 (H5)

### 3.1 目录结构（`client/h5_games/mbti/`）

```
client/h5_games/mbti/
├── doc/                        # 策划文档
├── src/
│   ├── main.ts                 # 入口
│   ├── App.vue                 # 根组件
│   ├── router/index.ts         # 路由 (7 个视图)
│   ├── stores/
│   │   ├── game.ts             # 游戏全局状态 (Pinia)
│   │   └── user.ts             # 当前用户信息
│   ├── api/
│   │   ├── http.ts             # Axios 封装
│   │   └── mbti.ts             # MBTI API 调用
│   ├── bridge/
│   │   └── native.ts           # JSBridge (Flutter ↔ H5)
│   ├── composables/
│   │   ├── useCountdown.ts     # 倒计时 hook
│   │   └── useGameState.ts     # 监听推送 + 状态同步
│   ├── views/                  # 7 个页面
│   ├── components/             # 可复用 UI 组件
│   └── styles/theme.css        # 全局样式变量
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 3.2 页面流转

```
LobbyView ──(host 点击开始)──► SetupView ──(确认)──► VotingView
                                                        │
                                                  20s 倒计时结束
                                                        │
                                                        ▼
            RevealView ◄──(host 点击揭晓)── GuessingView
                │                                  30s 倒计时
                │
          ┌─────┴─────┐
          │ 还有题?    │
          ▼ YES        ▼ NO
     VotingView    ProfileView ──► SettlementView ──► LobbyView
```

### 3.3 推送接收流程

```typescript
// bridge/native.ts 注册 onDartEvent 监听
// Flutter 通过 JSBridge 转发 room_push 事件

// composables/useGameState.ts 分发逻辑
bridge.onRoomPush('mbti.*', (event, data) => {
  switch (event) {
    case 'mbti.game_started':     → store.initGame(data); router.push('/lobby')
    case 'mbti.voting_started':   → store.startVoting(data); router.push('/voting')
    case 'mbti.guessing_started': → store.startGuessing(data); router.push('/guessing')
    case 'mbti.target_locked':    → store.setTargetLocked()
    case 'mbti.reveal_distribution': → store.showDistribution(data); router.push('/reveal')
    case 'mbti.reveal_answer':    → store.revealAnswer(data)
    case 'mbti.profile_ready':    → store.setProfile(data); router.push('/profile')
    case 'mbti.settlement':       → store.setSettlement(data); router.push('/settlement')
  }
})
```

### 3.4 关键交互细节

| 场景 | 实现要点 |
|------|---------|
| 倒计时同步 | 服务端下发 `deadline` (unix ms)，前端本地倒计时 |
| 被猜者 vs 猜测者 UI | 同一个 `GuessingView`，按 `myRole` 条件渲染 |
| 答案锁定反馈 | 被猜者提交后本地立即显示"已锁定" + push 通知 |
| 断线重连 | WebView 重新加载时调用 `GetGameState` 恢复状态 |
| 低端机优化 | CSS animation，WebP 图片，关键代码 < 100KB gzip |

---

## 4. Flutter 集成层

Flutter 在此架构中扮演**中转站**角色，不需要理解 MBTI 业务逻辑：

1. **加载 H5**：`VoiceRoomPage` 创建 WebView 加载 `https://www.revolcall.com/mbti/`
2. **转发推送**：收到 WS `Op 20` → JSON 解码 → 过滤 `mbti.*` → JSBridge 转发给 H5
3. **桥接原生能力**（v1.1+）：支付、分享等 H5 请求通过 JSBridge 调用 Flutter 原生

```dart
// voice_room_page.dart — _handlePluginPush
case 20: // OP_PLUGIN_PUSH
  final decoded = utf8.decode(proto.body);
  final map = jsonDecode(decoded);
  final eventType = map['type'] ?? '';
  if (eventType.startsWith('mbti.')) {
    _bridge.send(RoomPushEvent(event: eventType, data: map['data']));
  }
```

---

## 5. 开发阶段划分 (v1.0 MVP)

### Phase 1: 基础骨架（Week 1）✅ 已完成

| # | 任务 | 端 | 状态 |
|---|------|----|----|
| 1.1 | 编写 `mbti.proto`，生成 Go 代码 | Server | ✅ |
| 1.2 | 搭建 Kratos 服务骨架 (cmd/server/service/biz/data) | Server | ✅ |
| 1.3 | 建 MySQL 表 + GORM model | Server | ✅ |
| 1.4 | Gateway 添加 `/mbti/**` 路由 | Server | ✅ |
| 1.5 | 初始化 Vite + Vue 3 + Pinia + Router | Client | ✅ |
| 1.6 | 封装 JSBridge 通信层 | Client | ✅ |
| 1.7 | Flutter WebView 集成 + Op20 转发 | Flutter | ✅ |
| 1.8 | 题库扩充至 120 题 | Data | ✅ |

### Phase 2: 核心游戏循环（Week 2-3）

| # | 任务 | 端 | 关键点 |
|---|------|----|----|
| 2.1 | 实现 `CreateGame` + 题库随机抽题逻辑 | Server | 按卡包/难度/维度抽题 |
| 2.2 | 实现状态机 biz 层 (SETUP → GUESSING → REVEALING → SETTLEMENT) | Server | MVP 先跳过 VOTING |
| 2.3 | 实现 `SubmitTargetAnswer` / `SubmitGuess` | Server | Redis 写入 + 答案保密 |
| 2.4 | 实现 `RevealAnswer`（分布计算 + 正确答案揭晓） | Server | 从 Redis 聚合 |
| 2.5 | 实现积分计算 + 排行榜结算 | Server | `score.go` |
| 2.6 | 实现推送：`PushRepo` → HTTP POST → `room_push` | Server | `push.go` |
| 2.7 | 实现 SetupView + GuessingView + RevealView + SettlementView | Client | 四个核心页面 |
| 2.8 | 实现推送事件监听 + 页面自动流转 | Client | `useGameState` |
| 2.9 | 实现 CountdownBar / DistributionChart / RankingList 组件 | Client | 核心 UI 组件 |

### Phase 3: 投票选题 + 连击（Week 4）

| # | 任务 | 端 | 关键点 |
|---|------|----|----|
| 3.1 | 实现 VOTING 阶段（候选题展示 + 投票 + 权重） | Server | 投票结果聚合 |
| 3.2 | 实现连击机制（连续猜对追踪 + 公屏通知） | Server | Redis streak 计数 |
| 3.3 | 实现 VotingView + VoteBar 组件 | Client | 实时投票进度 |
| 3.4 | 实现连击动效 (StreakBadge) | Client | CSS animation |

### Phase 4: 画像 + 异常处理（Week 5）

| # | 任务 | 端 | 关键点 |
|---|------|----|----|
| 4.1 | 实现 MBTI 画像生成 (`profile.go`) | Server | 四维统计 + 类型判定 |
| 4.2 | 实现异常处理（被猜者离开/超时/断线重连） | Server | 兜底逻辑 |
| 4.3 | 实现 `GetGameState` 断线重连 | Server | 全量快照返回 |
| 4.4 | 实现 ProfileView + RadarChart | Client | SVG/Canvas 雷达图 |
| 4.5 | 实现断线重连前端恢复 | Client | 据 GetGameState 恢复 UI |

### Phase 5: 联调 + 上线（Week 6）

| # | 任务 | 端 | 关键点 |
|---|------|----|----|
| 5.1 | Server ↔ H5 全流程联调 | 双端 | |
| 5.2 | Server ↔ Flutter 推送链路联调 | 双端 | Op20 端到端验证 |
| 5.3 | 性能测试（500 并发模拟） | Server | 压测 |
| 5.4 | 低端机 / 弱网适配测试 | Client | |
| 5.5 | 埋点接入 | 双端 | 核心事件 |
| 5.6 | 灰度发布 | Ops | |

---

## 6. 后续版本 (v1.1+) 增量

| 版本 | 新增任务 | 预估工时 |
|------|---------|---------|
| v1.1 | 道具系统（放大镜/信心之星）、礼物对接 | 1 week |
| v1.2 | 深度契合报告、MBTI 月卡 | 1 week |
| v2.0 | 赛季排行榜（周榜/月榜）、多被猜者轮换 | 2 weeks |
| v2.1 | i18n + 地区适配（tw/ae/sea） | 1 week |
| v3.0 | UGC 题目提交 + 审核后台 | 2 weeks |

---

## 7. 风险与注意事项

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| `room_push` 推送延迟 | 高 | 前端乐观更新 + 服务端推送做兜底确认 |
| 500+ 并发房间 Redis 热 key | 中 | 游戏级 key，单游戏生命周期短（< 15min） |
| 被猜者答案泄露 | 高 | 答案 server 端加密存储，仅 Reveal 时解密广播 |
| H5 WebView 兼容性（低端安卓） | 中 | 避免新 API，CSS 动效降级 |
| 游戏状态不一致（网络分区） | 中 | Server 为 source of truth，GetGameState 可随时校准 |
