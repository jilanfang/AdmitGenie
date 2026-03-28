# AdmitGenie Canonical Product Blueprint

## 1. 这份文档的角色

这份文档是 AdmitGenie 当前产品设计的唯一蓝图。

它负责定义：

- 产品最上位原则
- 用户实际看到的主产品形态
- 系统内部的 canonical objects 与状态边界
- 什么可以写入产品真相，什么只能作为候选或解释
- 首发范围、pilot 纪律、成功指标
- 后续文档如何从这里派生

这份文档不是：

- 合伙人排序文档
- 单个 journey 说明书
- 单轮实现 plan
- 代码级 ADR 替代品

## 2. Product North Star

AdmitGenie 是一个面向北美升学家庭与 counselor 的 AI-native admissions coach。

它不是传统的复杂申请系统，也不是只会聊天的 AI 框。

它的目标形态是：

> 用户登录后直接进入一个 active case 的主对话面，被一个可靠的教练带着走；系统在背后维护 source-grounded、stateful、可追溯的策略状态，并把复杂性藏在内部。

## 3. 最上位产品原则

### 3.1 Single Primary Coach Surface

- 用户默认进入的永远是一个 `active case` 的主对话面
- 不做 dashboard-first
- 不做多模块主界面
- brief、decision、source、history 都是主对话面的派生展开，不是并列主产品

### 3.2 Strong Internals, Quiet Surface

- 内部可以有完整的状态、版本、审计、回放、来源、迁移
- 外部只暴露当前用户理解和推进所必需的最小心智
- 不把内部机制直接变成用户需要学习的系统概念

### 3.3 Conversation First, Not Form First

- 默认交互是教练式对话
- 用户第一次进入不应被要求学习系统或先填大表单
- 输入框旁可以有轻附件能力，但附件只是服务对话，不主导界面

### 3.4 Card-Based Confirmation Within Chat

- 只要涉及确认、冲突消解、优先级选择、状态升格，就优先用卡片完成
- 允许的确认形式只有：
  - `yes / no`
  - `single-select`
  - `multi-select`
- 关键确认不依赖自由文本作为默认主路径

### 3.5 In-Product Is The Only Mainline

- 正式状态、正式确认、正式 brief、正式 snapshot 只在产品内完成
- 外部渠道只负责 bring-back / re-engagement，不承载正式状态

## 4. 首发范围与市场纪律

### 4.1 首发 wedge

首发不平铺所有 journey。

首发只打透旗舰闭环：

`source-grounded intake -> decision -> strategy state -> one next move -> living brief -> returning recap`

### 4.2 首发 persona

真实产品首发优先围绕这两类共同主线：

- `Strategic STEM Striver`
- `First-Gen Ambition Builder`

其他 persona 先保留为：

- demo fixture
- evaluation scenario
- 后续扩展样本

### 4.3 首发发布方式

- 首发采用 `closed pilot / concierge-backed rollout`
- 先服务少量真实家庭与真实 counselor case
- 先验证连续使用、信任建立和策略推进，再决定是否扩大自助开放

## 5. 统一产品模型

### 5.1 Account -> Case(s)

AdmitGenie 不是“家庭产品一套、counselor 产品一套”。

统一模型是：

- `account`
- `case(s)`
- `active case`

家庭与 counselor 本质上都登录进入同一个产品，只是：

- 账号下 case 数量不同
- 角色权限和 source 可见范围不同
- 低强调导航和 attention 需求不同

### 5.2 Active Case First

- 登录后默认进入一个 `active case`
- 家庭用户通常只有一个 case
- counselor 可以有多个 case，但仍然以当前 case 的主对话面为中心
- case 切换只能是低强调导航，不能反客为主变成工作台首页

### 5.3 Lightweight Attention Layer

多 case 用户需要轻量 attention，但不能把产品做成 inbox 系统。

attention layer 只负责回答：

- 哪个 case 现在最值得打开
- 为什么值得打开
- 现在最该处理的 one next move 是什么

## 6. Canonical Product Objects

以下对象是产品真相层的一部分：

- `Account`
- `Case`
- `CaseSource`
- `CandidateFact`
- `ConfirmedFact`
- `DecisionItem`
- `StrategyState`
- `CaseProgress`
- `OneNextMove`
- `LivingBrief`
- `MonthlySnapshot`
- `CaseRecap`
- `Evidence / ProofPoint`
- `SchoolKnowledge`

以下不是产品真相层：

- 纯对话文本本身
- 临时 prompt 输出
- 未经过 write contract 的自由生成
- 仅用于渲染的 UI 层状态

## 7. Canonical Intake Pipeline

所有输入都必须进入同一条 intake pipeline。

不允许出现“聊天走一套、导入走一套、上传走一套、后台修正再走一套”的并行真相。

统一链路是：

`raw source -> candidate facts -> decisions / confirmation -> confirmed facts -> strategy-eligible facts -> strategy state`

这条链同时适用于：

- chat 输入
- 轻附件上传
- 粘贴材料
- 历史文档导入
- 外部 case migration
- counselor 笔记迁移

NotebookLM 可借鉴的能力是：

- source grounding
- 摘要与判断始终可回指来源

但 AdmitGenie 不采用 NotebookLM 的主界面形态。

## 8. Strategy Write Boundary

模型不能直接自由写核心状态。

正式规则是：

- 模型可以理解输入
- 模型可以生成候选提取
- 模型可以生成摘要与解释
- 模型可以为 decision card 提供语言表达

但以下状态只能通过显式 write contract 更新：

- `DecisionItem`
- `ConfirmedFact`
- `StrategyState`
- `CaseProgress`
- `OneNextMove`
- `LivingBrief`
- `MonthlySnapshot`
- `Evidence / ProofPoint`
- `Shared priorities / endorsements`

## 9. Policy Engine + Model Surface

AdmitGenie 采用：

- `policy engine`
- `model surface`

分工如下：

### Policy Engine 负责

- 阶段推进
- decision 触发
- promotion policy
- reopen policy
- case progress contract
- blocker taxonomy
- one next move 选择
- stale knowledge behavior

### Model Surface 负责

- 理解材料
- 生成候选提取
- 生成自然语言解释
- 教练语气表达
- 摘要与润色

## 10. Case Progress Contract

每个 case 都必须显式知道：

- 当前阶段是什么
- 这一阶段何时算完成
- 何时算阻塞
- 哪些事件会 reopen

默认阶段主线：

- `starter_clarity`
- `shortlist_confirmation`
- `school_bucketing`
- `timing_strategy`
- `proof_gap_closure`
- `material_priority`
- `monthly_execution`

## 11. One Next Move Contract

### 11.1 对外只暴露一个主动作

- active case 主界面默认只暴露一个 `one next move`
- 系统内部可以保留多个候选动作
- 用户不应默认面对任务系统

### 11.2 每个主动作必须有 outcome

每个 `one next move` 都应走向：

- `done`
- `blocked`
- `deferred`
- `replaced`

### 11.3 Blocker Taxonomy

当动作没有完成时，系统必须记录原因，而不只是记录“没做”。

默认 blocker taxonomy：

- `missing_info`
- `disagreement`
- `time_constraint`
- `confidence_gap`
- `external_dependency`
- `emotional_resistance`

## 12. Living Brief, Snapshot, Recap

### 12.1 Living Brief

`Monthly Brief` 的产品真义是：

- 平时是 `living brief`
- 周期性沉淀成 `monthly checkpoint snapshot`

living brief 是用户主要看到的持续教练产物，至少回答：

- `what changed`
- `what matters now`
- `one next move`
- `risks`
- `why this advice`

### 12.2 Monthly Snapshot

monthly snapshot 不是每次状态变化都自动升格。

规则：

- living brief 持续更新
- 正式 snapshot 需要轻量确认
- 确认只能通过最小卡片动作完成

### 12.3 Endorsement State

snapshot 必须区分是谁确认的，不能把任意确认都视为家庭共识。

至少区分：

- `coach_published`
- `parent_confirmed`
- `student_confirmed`
- `family_aligned`

### 12.4 Snapshot History

- 默认只展示当前正式版本
- 按需展开查看：
  - 自上次以来变了什么
  - endorsement 轨迹
  - 为什么升格成这一版

### 12.5 Case Recap / Handoff

`CaseRecap` 是系统连续性对象，不是第二个用户主对象。

它服务：

- returning-user opening
- counselor / family 跨人连续性
- case reopen
- operator review

至少包含：

- `since_last_time`
- `confirmed_changes`
- `unresolved_decisions`
- `one_next_move`
- `blocker_reason`
- `why_now`

## 13. Source-Grounded Product Layer

### 13.1 First-Class Case Source Layer

每个 case 都有 source layer。

系统的判断、brief、evidence、next move 都应能回指 source。

### 13.2 On-Demand Source Reveal

- 来源默认不抢主界面
- 用户需要时可展开查看
- 主界面默认仍保持教练式简洁

### 13.3 Role-Aware Source Visibility

每条 source 都需要 visibility / redaction policy。

至少支持：

- `shared_with_case`
- `parent_only`
- `student_only`
- `counselor_private`
- `system_internal`

### 13.4 Snippet-First Reveal

来源展开默认展示：

- supporting snippets
- extracted evidence excerpts

而不是默认打开整份原始材料。

## 14. Claim Status Grammar

用户可见表达必须区分不同 claim 类型，避免把推断说成事实。

至少区分：

- `confirmed`
- `inferred`
- `recommended`
- `season_sensitive`

这个 grammar 要同时作用于：

- chat explanation
- decision cards
- living brief
- snapshot
- source reveal
- school-specific strategy

## 15. School Strategy Layer

### 15.1 Lightweight Canonical School Knowledge

学校判断不能只靠模型临场发挥。

必须有轻量但正式的 `SchoolKnowledge` 层，至少覆盖旗舰 wedge 的关键学校与关键维度。

### 15.2 Two-Speed Knowledge Model

学校知识分为：

- `evergreen`
- `season_bound`

`evergreen` 负责较稳定的：

- fit cues
- proof sensitivity
- culture notes

`season_bound` 负责较容易变化的：

- testing posture
- deadline posture
- application-round specifics
- season-sensitive notes

### 15.3 Stale Knowledge Behavior

当 season-bound school knowledge 过期时：

- 可以继续给通用建议
- 不应继续输出高置信学校判断
- 不应让过期知识驱动高影响写入
- 必要时应明确提示需要复核

### 15.4 Assisted Curation Refresh Loop

season-bound 知识更新采用：

- 系统辅助发现变化
- 生成候选更新
- review 后进入 canonical layer

不采用全自动静默刷新。

## 16. Audit, Replay, Migration, Portability

### 16.1 Audit Ledger

系统必须保留：

- raw source
- extracted candidates
- confirmation / resolution
- final write result

不能 silent overwrite。

### 16.2 Deterministic Reconstruction

必须支持 case replay / deterministic reconstruction，用于：

- pilot 复盘
- 产品调试
- operator review
- evaluation 回归

### 16.3 Schema Versioning

核心 product objects 必须有 schema versioning 与 migration contract。

覆盖对象包括：

- case state
- brief artifact
- snapshot
- export package
- import package
- source artifact

### 16.4 Portability

用户应可导出：

- confirmed strategy state
- brief / snapshot history
- key decisions
- recap / next-move context

## 17. Interaction Grammar

AdmitGenie 的交互语法必须是正式契约，而不是 prompt 偏好。

### 17.1 Default Surface

- 教练式主对话面
- 输入框主导
- 轻附件入口
- 按需展开 brief

### 17.2 When To Use Cards

下列情况默认必须用卡片，而不是自由文本：

- shortlist confirmation
- conflict resolution
- priority selection
- endorsement
- snapshot 升格确认
- blocker reason 选择

### 17.3 When To Use Chat Summary

以下内容默认先在 chat 里简短说明，再允许展开：

- living brief summary
- what changed
- source-backed rationale
- why this next move

## 18. Coaching Content System

用户看到的教练内容不能散落在 prompt 与组件里。

需要一个统一的 content system 来约束：

- 教练语气
- brief 语法
- 卡片文案
- reopen 提示
- source reveal 解释
- returning opening

目标不是模板化，而是保证：

- 同一个产品声音
- 同一种判断边界
- 同一种可信度表达

## 19. Pilot Discipline And Success Metrics

### 19.1 Pilot Discipline

- 真实用户走 durable product mode
- demo mode 与 product mode 明确隔离
- closed pilot 内允许内部人工 review / override 兜底

### 19.2 Success Metrics

首发成功不看表面活跃度，优先看：

- 连续使用
- 决策推进
- brief 采纳
- one next move 完成率
- rescue flow 解卡率
- 人工接管率是否下降
- 家庭 / counselor 对可信度的主观反馈

## 20. Execution Tiers

### P0: 旗舰闭环

先打透：

`active case -> source-grounded intake -> decision -> strategy state -> one next move -> living brief -> returning recap`

### P1: 信任增强层

重点补齐：

- provenance
- source reveal
- claim status grammar
- snapshot endorsement
- history
- replay
- audit / migration contract

### P2: 扩展能力层

后续扩展：

- import breadth
- portability polish
- operator depth
- school refresh tooling
- multi-case attention refinement

## 21. 派生文档关系

以下文档应从本蓝图派生，而不是与本蓝图并列定义产品真相：

- `docs/product/founder-priority-user-journeys-zh.md`
- `docs/product/onboarding-v1.md`
- `docs/product/user-workflows.md`

如果这些文档与本蓝图冲突，以本蓝图为准。

技术实现层文档应继续从这里向下细化，但不得背离这里定义的：

- product object 边界
- write boundary
- interaction grammar
- execution tiers
