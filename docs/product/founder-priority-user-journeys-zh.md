# AdmitGenie 合伙人排序版用户旅程（10 条，细化版）

## 这份文档是干什么的

这不是一份抽象产品愿景稿，而是一份给合伙人排序、给产品和工程对范围的工作文档。

核心目标只有一个：

> 把 “用户旅程” 拆到足够细，让它可以直接和当前功能点、模块、gap、优先级对齐。

这份文档解决 4 个问题：

1. 我们到底在服务哪些用户旅程？
2. 每条旅程严格由哪些功能点组成？
3. 这些功能点现在已经做到哪里了？
4. 哪些旅程值得优先排序，哪些应该明确后置？

---

## 建议合伙人的使用方式

请不要只回答“喜欢哪条旅程”，而是按下面 4 个维度给每条旅程打分：

- `价值强度`
  - 这条旅程如果成立，用户会不会明显感到值钱？
- `差异化`
  - 这条旅程是不是能明显说明 AdmitGenie 不是普通表单工具或普通 AI 问答？
- `实现杠杆`
  - 我们是不是已经有一部分能力，补 gap 就能形成完整 demo / MVP 价值？
- `当前时机`
  - 这条旅程现在做，是否符合已确认的 MVP 范围？

建议最终给每条旅程一个优先级：

- `P0`：必须最先打透
- `P1`：应该尽快验证
- `P2`：重要但可后置
- `P3`：当前不做

建议合伙人最后必须回答这两个问题：

1. 如果未来 4-6 周只能打透 2 条旅程，选哪 2 条？
2. 哪 1 条旅程最能代表 AdmitGenie 的核心差异化？

---

## Source Of Truth 与判断边界

这份文档遵循的当前 source of truth：

- 产品总蓝图：`docs/product/canonical-product-blueprint-zh.md`
- 产品定位：`AGENTS.md`
- founder 对齐问题：`docs/product/founder-alignment-checklist-zh.md`
- persona 定义：`docs/product/personas.md`
- 产品工作流：`docs/product/user-workflows.md`
- 当前代码能力：`components/`, `lib/domain/`, `lib/server/`, `tests/`

本文件只做两件事：

- 把现有方向拆细
- 帮助排序

本文件对产品形态、核心对象、状态边界、交互语法、execution tiers 不再单独发明定义。

如果与 `docs/product/canonical-product-blueprint-zh.md` 冲突，以 blueprint 为准。

本文件**不做**这几件事：

- 不自动决定最终优先级
- 不把所有 persona 都提升成当前主线
- 不把“有想象力的未来功能”伪装成当前需求

---

## 当前产品形态一句话总结

当前 AdmitGenie 不是：

- 重表单的大学申请资料工具
- 只会聊天、不维护状态的 AI 问答框
- 大而全的申请仪表盘

当前 AdmitGenie 是：

> 一个统一登录后的、conversation-first、source-grounded、stateful 的 AI 升学教练。
> 用户进入后默认落在一个 `active case` 的主对话面，围绕 `Coach Inbox + lightweight material entry + living brief` 工作。

补充判断边界：

- 家庭与 counselor 不是两套产品，而是同一个 `account -> case(s)` 模型里的不同角色
- 主界面永远是 active case 的教练对话面，不做 dashboard-first
- `Monthly Brief` 在蓝图里已经收敛为 `living brief + monthly checkpoint snapshot`
- 所有旅程都应优先服务旗舰闭环：
  - `source-grounded intake -> decision -> strategy state -> one next move -> living brief -> returning recap`

---

## 交互总原则修正版

从现在开始，这份旅程文档一律按下面的交互原则判断对不对：

- 默认交互就是一个开箱即用的教练式对话框
- 用户第一次打开，不需要学习系统，不需要理解一堆按钮分工
- 结构化 UI 不是主界面，只能作为对话流里的轻量补充
- 新材料入口可以保留，但必须是对话框旁的轻附件能力
- 如果系统必须要求用户确认，不能默认靠自由文本确认
- 确认方式统一收敛为卡片：
  - `yes / no`
  - `single-select`
  - `multi-select`
- brief 默认先由教练在对话里摘要说明
- 完整 brief 可以展开看，但不能抢走主交互

这意味着后面的旅程判断标准不再只是“功能有没有”，还要看：

- 是否忠于年轻家庭和学生的自然使用习惯
- 是否让产品看起来像一个好教练，而不是一个复杂系统
- 是否把必须做的结构化决策压缩成最小的卡片动作
- 是否仍然忠于 `strong internals, quiet surface`
- 是否会强化旗舰 wedge，而不是把产品重新摊平成多模块系统

---

## 当前模块状态总览

为了避免后面每条旅程都重新解释一次，这里先列全局模块状态。

## A. 已实现模块

### 1. 入口与访问

- `Demo Access Gate`
  - 共享 access code
  - 进入后直接到主产品界面
  - 代码：
    - `components/demo-access-gate.tsx`
    - `app/page.tsx`
    - `app/api/demo/access/route.ts`

### 2. 主对话界面

- `Coach Inbox`
  - AI 主动开场
  - 对话主界面
  - 输入框居中主导
  - 当前 brief 先摘要，完整内容可展开
  - 代码：
    - `components/coach-shell.tsx`
    - `app/globals.css`

### 3. 材料入口

- `Material Inbox`
  - 对话框旁轻附件
  - 上传文本文件
  - 粘贴更新
  - 快捷 SAT update
  - 代码：
    - `components/coach-shell.tsx`

### 4. 材料理解与 patch 可视化

- `Visible Material Analysis`
  - 提取 facts
  - 显示 affected fields
  - 显示 patch status
  - 显示 profile impact
  - 代码：
    - `lib/domain/demo-state.ts`
    - `components/coach-shell.tsx`

### 5. Patch 状态机

- `Profile Patch Handling`
  - `applied`
  - `needs_confirmation`
  - `conflict`
  - 代码：
    - `lib/domain/demo-state.ts`
    - `lib/domain/demo-contracts.ts`

### 6. 对话推动状态变化

- `Chat-Driven State Update`
  - 用户通过对话或卡片确认 / 更正
  - 系统更新 profile state
  - 代码：
    - `lib/domain/demo-contracts.ts`
    - `app/api/demo/conversation/route.ts`

### 6.1. 决策卡片

- `Inline Decision Cards`
  - `yes / no`
  - `single-select`
  - `multi-select`
  - 只在必须确认时出现
  - 不脱离主对话流
  - 代码：
    - `lib/domain/demo-state.ts`
    - `lib/server/persistence.ts`
    - `components/coach-shell.tsx`

### 7. Monthly Brief / Current Brief

- 已有结构：
  - `what changed`
  - `what matters now`
  - `top actions`
  - `risks`
  - `why this advice`
- 代码：
  - `lib/domain/demo-state.ts`
  - `components/coach-shell.tsx`

### 8. Persona Fixtures

- 已有 persona：
  - strategic stem striver
  - first-gen ambition builder
  - story-rich humanities builder
  - balanced pre-med planner
  - trajectory rebounder
- 代码：
  - `lib/domain/personas.ts`

### 9. Slice 3 执行闭环

- 已实现对话闭环：
  - shortlist confirmation
  - shortlist bucketing
  - application timing
  - story/material priority
  - execution progress
  - blocker resolution
  - ready-to-ship guidance
- 代码：
  - `lib/domain/demo-contracts.ts`
  - `tests/domain/demo-state.test.ts`
  - `tests/api/demo-routes.test.ts`
  - `tests/components/coach-shell.test.tsx`

### 10. Workspace 隔离与 persona switch

- memory mode workspace isolation
- demo persona switcher
- 代码：
  - `lib/server/persistence.ts`
  - `app/api/demo/persona/route.ts`
  - `tests/api/demo-routes.test.ts`

## B. 部分实现模块

### 1. Persona-aware 体验

- 有 persona fixture
- 有 persona opening / brief seed
- 但还没有做到：
  - onboarding 问法 fully persona-aware
  - follow-up strategy fully persona-aware
  - brief tone fully persona-aware

### 2. 家长可读的共享进度视图

- 现在有 notebook / profile memory 辅助栏
- 但没有更明确的“家长与学生共享当前优先级”视图

### 3. Monthly progression

- 当前已经有 current brief / evolving brief
- 但还不是严格产品化的“按月推进系统”

### 4. 家庭共同使用 framing

- 产品叙事上成立
- 但没有独立功能去支持：
  - 家长视角
  - 学生视角
  - shared review moment

## C. 尚未实现模块

- affordability-specific reasoning
- scholarship-sensitive planning
- richer school-fit reasoning
- persona-specific onboarding templates
- persona-specific brief templates
- narrative packaging workflow 的显式模块化版本
- counselor 专用 operator workflow
- execution workspace / task tracker / calendar
- durable real-world usage validation

---

## 每条旅程的统一分析结构

下面 10 条旅程都按同一个框架写，便于横向比较：

1. `旅程名称`
2. `目标 persona`
3. `用户要完成的任务`
4. `用户前置状态`
5. `触发时刻`
6. `理想用户路径`
7. `关键决策点`
8. `系统必须输出`
9. `功能点拆分`
10. `对应模块 / 代码`
11. `当前实现状态`
12. `当前 gap`
13. `失败路径`
14. `验收标准`
15. `排序建议`

---

## Journey 1：Strategic STEM Striver 第一次进入，并在 3-5 分钟内拿到第一轮可执行建议

### 1. 目标 persona

- `Strategic STEM Striver`
- 高 ambition 的学生+家长
- selective engineering / CS / STEM 方向

### 2. 用户要完成的任务

- 不填大表单，也能快速知道“现在最该做什么”

### 3. 用户前置状态

- 家庭已经讨论过 ambition
- 可能提过一些名校名字
- 但没有稳定 shortlist
- testing 还没锁
- 对 strongest profile evidence 也没有排序

### 4. 触发时刻

- 家长开始焦虑“是不是晚了”
- 学生开始问“我现在到底该先搞 SAT 还是学校名单”

### 5. 理想用户路径

1. 用户通过 access gate 进入
2. 看到 AI 先开口，而不是空白页
3. AI 询问最少但高价值的 4-6 个问题
4. 用户回答 grade、major direction、school list、testing 的 rough state
5. 如果用户已有材料，可直接从输入框旁轻附件丢给系统
6. 系统形成首轮理解
7. 系统明确告诉用户：
   - 已知信息
   - 还缺什么
   - 为什么这些缺口重要
8. 系统先在对话里给出第一轮建议和本月 top priority
9. 如有需要，用户再展开完整 brief
10. 用户感觉“终于有人带着我走”

### 6. 关键决策点

- 是否一开始就要收全量资料
  - 当前答案：不要
- 第一轮最先问 school list 还是 testing
  - 当前更偏向两者都尽快触达
- 第一轮建议是否要看起来很聪明
  - 当前更重要的是“有用、可执行、可信”

### 7. 系统必须输出

- AI 主动开场
- guided interview
- 当前理解 summary
- 缺口 explanation
- 第一轮 top priority
- chat-first brief summary
- expandable current brief / monthly brief

### 8. 功能点拆分

- `J1-F1` access gate
- `J1-F2` AI 主动开场
- `J1-F3` 对话式 onboarding
- `J1-F4` initial understanding summary
- `J1-F5` missing info explanation
- `J1-F6` chat-first brief summary + expandable brief
- `J1-F7` STEM persona-specific prompt / tone / recommendation

### 9. 对应模块 / 代码

- `components/demo-access-gate.tsx`
- `components/coach-shell.tsx`
- `lib/domain/personas.ts`
- `lib/domain/demo-contracts.ts`
- `lib/domain/demo-state.ts`

### 10. 当前实现状态

- `J1-F1` 已实现
- `J1-F2` 已实现
- `J1-F3` 已实现
- `J1-F4` 已实现
- `J1-F5` 已实现
- `J1-F6` 已实现
- `J1-F7` 部分实现

### 11. 当前 gap

- persona fixture 在，但 onboarding 还不是真正 STEM-first 模板
- brief 还没有明确强调 engineering proof-point ranking
- 用户虽然能进入首轮建议，但“学生+家长共同使用”的 framing 还不够鲜明

### 12. 失败路径

- 用户一进来就感觉像在填表或在学系统
- AI 虽然开口，但没给出真正有帮助的 first action
- 系统只问问题，不给有效 synthesis
- 建议太 generic，像普通 AI chat

### 13. 验收标准

- 新用户 3-5 分钟内能拿到一版可执行建议
- 不需要填完整 profile
- 用户能复述当前 top priority
- 用户知道下一步要补哪类信息

### 14. 排序建议

- 推荐：`P0`
- 原因：这是当前主 persona 的入口旅程，也是 founder 已确认方向中最关键的第一印象

---

## Journey 2：First-Gen Ambition Builder 从流程混乱走到第一版可执行学校规划

### 1. 目标 persona

- `First-Gen Ambition Builder`
- 有 ambition，但 process model 很弱
- family 对 selectivity / scholarship / affordability / timeline 都不够有概念

### 2. 用户要完成的任务

- 不是被教育很多理论，而是先拿到一版“看得懂、做得动”的学校规划起点

### 3. 用户前置状态

- 可能有强成绩，但没有 admissions framework
- 学校名单是随口听来的
- affordability 是重要变量，但不一定被明确说出
- 家庭真正需要的是 legibility，不是 hype

### 4. 触发时刻

- “我们根本不知道该怎么开始”
- “我们怕选错学校”
- “预算和学校名气怎么平衡”

### 5. 理想用户路径

1. 用户进入 Coach Inbox
2. AI 不先假设用户懂 reach / target
3. AI 先问：
   - 大致想去什么类型的学校
   - 预算或 scholarship 是否重要
   - testing 是否还在计划内
4. 如果需要明确 budget、constraint、学校方向，系统优先用简短卡片
5. 系统把模糊 ambition 转成可理解结构
6. 系统指出当前真正缺口：
   - affordability
   - first list
   - testing clarity
7. 用户拿到第一版现实 school list planning direction
8. 后续继续通过材料和对话迭代，而不是回到零

### 6. 关键决策点

- affordability 要不要作为显式结构字段
- school list 是先做 ambition list，还是先做 practical list
- brief 应该更多解释，还是更多命令式推进

### 7. 系统必须输出

- 不带术语负担的 onboarding
- affordability-aware question
- 可理解的 current state summary
- 第一版 list action plan
- shared priority explanation

### 8. 功能点拆分

- `J2-F1` first-gen friendly onboarding
- `J2-F2` affordability / budget constraint capture
- `J2-F3` first school list scaffolding
- `J2-F4` first-gen readable brief summary
- `J2-F5` shared student-parent priority framing

### 9. 对应模块 / 代码

- `lib/domain/personas.ts`
- `components/coach-shell.tsx`
- `lib/domain/demo-contracts.ts`

### 10. 当前实现状态

- `J2-F1` 部分实现
- `J2-F2` 未实现
- `J2-F3` 部分实现
- `J2-F4` 部分实现
- `J2-F5` 部分实现

### 11. 当前 gap

- affordability-specific reasoning 几乎还没进 state model
- school list scaffolding 还偏 generic
- brief 还没有真正 first-gen tone
- “学生+家长看同一份当前优先级”还缺一个更明确的产品表达

### 12. 失败路径

- 产品默认用户懂很多 admissions 概念
- 输出太抽象，家长看不懂
- 学校规划与 affordability 脱节
- 用户只觉得“AI 很会说”，却不知道怎么做

### 13. 验收标准

- first-gen 家庭在第一次使用后能说清楚：
  - 当前最该先确认什么
  - 第一版学校规划从哪开始
  - affordability 是否进入决策

### 14. 排序建议

- 推荐：`P0`
- 原因：这是当前 secondary persona，也是最能验证“过程变清晰”价值的旅程

---

## Journey 3：用户上传新材料后，系统给出可见分析并直接更新建议

### 1. 目标 persona

- 所有持续使用用户
- 跨 persona 核心旅程

### 2. 用户要完成的任务

- 每次补一条材料，都能立刻看到它对当前规划有没有影响

### 3. 用户前置状态

- 用户已经有一个初步 profile
- 开始持续补充：
  - 分数
  - 活动
  - 学校名单
  - 奖项
  - 近况说明

### 4. 触发时刻

- “我有新 SAT 分数了”
- “我刚多了一个活动”
- “我现在有一个学校名单”

### 5. 理想用户路径

1. 用户从对话框旁上传文件或粘贴更新
2. 系统识别 material type
3. 系统提取 facts
4. 系统解释它准备更新哪些字段
5. 系统显示 patch status
6. 系统要么直接应用，要么进入确认 / 冲突分支
7. current brief 更新

### 6. 关键决策点

- 是不是只存材料，不做结构更新
  - 当前答案：不行
- 是不是黑箱自动化
  - 当前答案：不行，必须可见解释
- 是否每条材料都应该影响 brief
  - 当前答案：要么有 visible impact，要么有 visible non-impact

### 7. 系统必须输出

- 我看到了什么
- 我准备更新什么
- 这会影响什么
- 是否可直接采用
- 如果不可直接采用，还需要你确认什么

### 8. 功能点拆分

- `J3-F1` chat-led material input entry + lightweight attachment
- `J3-F2` material type classification
- `J3-F3` fact extraction
- `J3-F4` patch proposal
- `J3-F5` visible explanation
- `J3-F6` brief refresh or follow-up prompt

### 9. 对应模块 / 代码

- `components/coach-shell.tsx`
- `lib/domain/demo-state.ts`
- `lib/domain/demo-contracts.ts`
- `app/api/demo/materials/route.ts`

### 10. 当前实现状态

- `J3-F1` 已实现
- `J3-F2` 已实现
- `J3-F3` 已实现
- `J3-F4` 已实现
- `J3-F5` 已实现
- `J3-F6` 已实现

### 11. 当前 gap

- 解析深度还是 demo 级
- material-specific reasoning 还不够丰富
- 不同 persona 对同一材料的解读策略还没有明显分化

### 12. 失败路径

- 用户上传材料后只觉得“文件被存了”
- 系统没有说明影响
- brief 没变化，用户不知道为什么
- patch 是黑箱

### 13. 验收标准

- 用户上传任意一条核心材料后，能直接说出“系统从这条材料里读到了什么”
- 用户知道这条材料对当前计划有没有影响
- brief 或下一步提示确实变化

### 14. 排序建议

- 推荐：`P0`
- 原因：这是 founder 对齐问卷中最核心的功能闭环之一

---

## Journey 4：用户上传模糊学校名单后，通过聊天中的卡片确认 shortlist

### 1. 目标 persona

- `Strategic STEM Striver`
- `First-Gen Ambition Builder`
- `Trajectory Rebounder`

### 2. 用户要完成的任务

- 把“模糊学校想法”安全地变成“当前可信 shortlist”

### 3. 用户前置状态

- 用户已经提过一些学校
- 但这些学校未必是最终 shortlist
- 用户表达里会出现：
  - maybe
  - thinking about
  - a few UC schools
  - maybe Purdue / Georgia Tech / UT Austin

### 4. 触发时刻

- 用户上传或粘贴 school list material

### 5. 理想用户路径

1. 用户提交 school list
2. 系统检测到信息不够确定
3. 系统不静默覆盖，而是进入 `needs_confirmation`
4. 用户通过聊天中的单选 / 多选卡片确认
5. 系统把 shortlist 写入可信 profile
6. pending patch 被清掉
7. brief 同步更新

### 6. 关键决策点

- 系统该不该直接覆盖
  - 当前答案：不该
- 用户是否需要离开聊天去别的 flow
  - 当前答案：不需要
- 确认完成后下一步做什么
  - 当前答案：进入更执行化的 list strategy

### 7. 系统必须输出

- pending confirmation 明示
- ambiguity explanation
- card-based confirmation within chat
- confirmed shortlist state
- brief refresh

### 8. 功能点拆分

- `J4-F1` school list parsing
- `J4-F2` ambiguity detection
- `J4-F3` `needs_confirmation` status
- `J4-F4` confirmation card within chat
- `J4-F5` confirmed shortlist writeback
- `J4-F6` post-confirmation brief update

### 9. 对应模块 / 代码

- `lib/domain/demo-state.ts`
- `lib/domain/demo-contracts.ts`
- `components/coach-shell.tsx`
- `tests/components/coach-shell.test.tsx`

### 10. 当前实现状态

- `J4-F1` 已实现
- `J4-F2` 已实现
- `J4-F3` 已实现
- `J4-F4` 已实现
- `J4-F5` 已实现
- `J4-F6` 已实现

### 11. 当前 gap

- school list parsing 还比较保守
- shortlist versioning 还没有
- persona-aware post-confirmation strategy 还不够细

### 12. 失败路径

- 系统误把 brainstorming 当最终 shortlist
- 用户感觉 AI 在乱记
- pending 状态和最终状态不同步

### 13. 验收标准

- 模糊名单不会被直接覆盖进 profile
- 用户完成卡片确认后，状态与 brief 一致更新
- 用户能理解为什么系统当时需要确认

### 14. 排序建议

- 推荐：`P0`
- 原因：这是 founder 问卷里最重要的“不要乱改 profile”信任旅程之一

---

## Journey 5：用户上传冲突测试分数后，通过聊天中的冲突卡片解决冲突

### 1. 目标 persona

- `Strategic STEM Striver`
- `Balanced Pre-Med Planner`
- `Trajectory Rebounder`

### 2. 用户要完成的任务

- 在 conflicting scores 里确定一个可信 baseline，避免系统乱覆盖

### 3. 用户前置状态

- 系统已有 testing state
- 用户又补了一条不一致的 SAT / ACT 更新

### 4. 触发时刻

- 新分数与旧分数冲突

### 5. 理想用户路径

1. 用户提交新 score
2. 系统检测 conflict
3. 系统标记 `conflict`
4. 系统解释冲突点
5. 用户通过冲突卡片明确选择采用哪版
6. 系统把可信版本写入 profile
7. brief 更新为新的可信 baseline

### 6. 关键决策点

- 新分数是不是总该覆盖旧分数
  - 当前答案：不是
- 是否允许 silent overwrite
  - 当前答案：不允许
- 冲突处理是在聊天里完成还是跳新页面
  - 当前答案：在聊天里完成

### 7. 系统必须输出

- conflict 明示
- 冲突解释
- resolution card
- trusted baseline update
- brief refresh

### 8. 功能点拆分

- `J5-F1` testing parsing
- `J5-F2` conflict detection
- `J5-F3` conflict UI / explanation
- `J5-F4` card-based resolution within chat
- `J5-F5` confirmed baseline writeback
- `J5-F6` brief sync after conflict resolution

### 9. 对应模块 / 代码

- `lib/domain/demo-state.ts`
- `lib/domain/demo-contracts.ts`
- `components/coach-shell.tsx`

### 10. 当前实现状态

- `J5-F1` 已实现
- `J5-F2` 已实现
- `J5-F3` 已实现
- `J5-F4` 已实现
- `J5-F5` 已实现
- `J5-F6` 已实现

### 11. 当前 gap

- 目前仅支持轻量 conflict model
- 不支持 superscore / multiple test strategy / optional strategy
- 不支持更复杂 testing history reasoning

### 12. 失败路径

- 系统看起来聪明，但 silently overwrites
- 用户看不懂到底冲突在哪
- brief 建立在错误 baseline 上

### 13. 验收标准

- 系统绝不 silent overwrite conflicting testing data
- 用户可以通过一轮聊天解决冲突
- brief 与 profile 在冲突解除后保持一致

### 14. 排序建议

- 推荐：`P0`
- 原因：这是 founder 明确强调的信任底线

---

## Journey 6：shortlist 确认后，进入 Reach / Target / Safer-fit bucketing

### 1. 目标 persona

- `Strategic STEM Striver`
- `First-Gen Ambition Builder`
- `Trajectory Rebounder`

### 2. 用户要完成的任务

- 从“有学校名”走到“有结构化申请策略”

### 3. 用户前置状态

- shortlist 已确认
- 用户对学校已经有粗略层级感

### 4. 触发时刻

- 用户开始用自然语言表达：
  - Purdue 和 Georgia Tech 是 reach
  - UT Austin 是 target

### 5. 理想用户路径

1. 系统在 shortlist 确认后继续追问
2. 系统先给 bucket 候选，用户用卡片快速确认
3. 系统把 bucket 写入 profile
4. brief 更新为 strategy-aware
5. 用户开始真正进入 list strategy 阶段

### 6. 关键决策点

- school list 只是被存档，还是要转成 strategy
  - 当前答案：必须转 strategy
- strategy 输出是静态展示，还是作为下一步 follow-up 的起点
  - 当前答案：要作为下一步 follow-up 的起点

### 7. 系统必须输出

- bucket-aware coach reply
- bucket selection card
- strategy state update
- brief 转为 list strategy 阶段

### 8. 功能点拆分

- `J6-F1` post-confirmation follow-up
- `J6-F2` bucket suggestion + card confirmation
- `J6-F3` strategy state writeback
- `J6-F4` updated profile summary
- `J6-F5` strategy-aware brief

### 9. 对应模块 / 代码

- `lib/domain/demo-contracts.ts`
- `lib/domain/demo-state.ts`
- `components/coach-shell.tsx`

### 10. 当前实现状态

- `J6-F1` 已实现
- `J6-F2` 已实现
- `J6-F3` 已实现
- `J6-F4` 已实现
- `J6-F5` 已实现

### 11. 当前 gap

- 没有更复杂的多维 bucket
- 没有 school-specific reasoning memory
- 没有 affordability / fit / geography 的并行标签系统

### 12. 失败路径

- shortlist 确认后产品又回到 generic intake
- bucket 成了展示，不推动下一步

### 13. 验收标准

- shortlist 确认后，用户能在一次对话内进入 structured list strategy
- brief 不再停留在 generic onboarding

### 14. 排序建议

- 推荐：`P1`
- 原因：这是从“知道用户是谁”进入“推进用户”的关键桥梁

---

## Journey 7：从 shortlist bucketing 进入 application timing strategy

### 1. 目标 persona

- `Strategic STEM Striver`
- `Balanced Pre-Med Planner`
- `Trajectory Rebounder`

### 2. 用户要完成的任务

- 把学校策略继续推进成 deadline-aware execution

### 3. 用户前置状态

- school buckets 已经存在
- 用户开始区分 early / regular / ED

### 4. 触发时刻

- 用户表达申请时间策略

### 5. 理想用户路径

1. AI 追问 timing
2. 系统优先给 EA / ED / RD / regular 的单选卡片
3. 用户快速确认 timing
4. 系统识别约束条件
5. 系统更新 application timing
6. brief 从 school list strategy 进入 pacing strategy

### 6. 关键决策点

- timing 是不是应该进入 profile state
  - 当前答案：是
- 是不是只做说明，不做后续动作
  - 当前答案：不够，必须推进到下一轮 materials priority

### 7. 系统必须输出

- deadline-aware follow-up
- visible application timing state
- timing-aware brief

### 8. 功能点拆分

- `J7-F1` timing prompt
- `J7-F2` timing parsing
- `J7-F3` constraint parsing
- `J7-F4` profile update
- `J7-F5` brief update

### 9. 对应模块 / 代码

- `lib/domain/demo-contracts.ts`
- `lib/domain/demo-state.ts`
- `components/coach-shell.tsx`

### 10. 当前实现状态

- `J7-F1` 已实现
- `J7-F2` 已实现
- `J7-F3` 已实现
- `J7-F4` 已实现
- `J7-F5` 已实现

### 11. 当前 gap

- 还没有 deadline calendar
- 还没有 per-school timeline view
- 还没有 task/date system

### 12. 失败路径

- 用户说了 timing，但系统没有把它变成结构状态
- brief 没有更具体，仍停留在 broad advice

### 13. 验收标准

- timing 进入 profile
- brief 明显更执行化
- 用户感受到“下一步不再抽象”

### 14. 排序建议

- 推荐：`P1`
- 原因：价值高，但更像执行层增强

---

## Journey 8：从 timing strategy 进入 story / material priority

### 1. 目标 persona

- `Story-Rich Humanities Builder`
- `Strategic STEM Striver`
- `Balanced Pre-Med Planner`

### 2. 用户要完成的任务

- 知道“先准备什么材料”而不是只知道“什么时候申请”

### 3. 用户前置状态

- timing 已明确
- 用户开始知道 early-round 学校哪些更重要

### 4. 触发时刻

- 用户开始描述：
  - 哪些故事更重要
  - 哪些材料先准备

### 5. 理想用户路径

1. 系统询问哪类材料先做
2. 系统优先给材料优先级多选卡片
3. 用户确认 story / material priority
4. 系统更新 current focus
5. brief 明确 highest-leverage material strategy
6. 用户知道该先写 / 先补 / 先证明什么

### 6. 关键决策点

- timing 之后应该问什么
  - 当前答案：材料优先级
- narrative 是否应该 persona-aware
  - 当前答案：应该，但目前还不够

### 7. 系统必须输出

- priority-aware follow-up
- updated current focus
- brief 中的 material priority

### 8. 功能点拆分

- `J8-F1` material-priority prompt
- `J8-F2` story/material parsing
- `J8-F3` current focus update
- `J8-F4` priority-aware brief
- `J8-F5` persona-aware narrative logic

### 9. 对应模块 / 代码

- `lib/domain/demo-contracts.ts`
- `lib/domain/personas.ts`
- `components/coach-shell.tsx`

### 10. 当前实现状态

- `J8-F1` 已实现
- `J8-F2` 已实现
- `J8-F3` 已实现
- `J8-F4` 已实现
- `J8-F5` 部分实现

### 11. 当前 gap

- persona-aware narrative logic 还不够
- 没有结构化 materials priority workspace
- 没有更明确的“为什么这个故事先做”的解释层

### 12. 失败路径

- timing 有了，但执行依然散
- 用户知道 deadline，却不知道先准备什么
- products 对 humanities / STEM / pre-med 的 narrative 没区别

### 13. 验收标准

- 用户能说清楚“为什么这个材料先做”
- brief 明显从时间线进入材料优先级

### 14. 排序建议

- 推荐：`P1`
- 原因：陪跑价值很高，但 persona-specific 深度还不足

---

## Journey 9：从材料优先级进入 execution progress / blocker / ready-to-ship

### 1. 目标 persona

- `Strategic STEM Striver`
- `Balanced Pre-Med Planner`
- `Story-Rich Humanities Builder`

### 2. 用户要完成的任务

- 持续汇报进展、暴露 blocker、拿到下一步推进建议

### 3. 用户前置状态

- 用户已经有一个执行方向
- 开始真的推进材料准备

### 4. 触发时刻

- 用户说：
  - 我们完成了什么
  - 卡在哪儿了
  - 哪些 blocker 解决了

### 5. 理想用户路径

1. 用户汇报 progress
2. 系统更新 execution state
3. 用户暴露 blocker
4. 系统更新 blocker-aware advice
5. 如果需要明确 blocker 状态或 next step，系统可给 yes / no 或单选卡片
6. 用户再说明 blocker 已解决
7. 系统给出 ready-to-ship / final polish guidance

### 6. 关键决策点

- 是否把执行进度只当聊天，不写状态
  - 当前答案：不应该
- blocker 是否要进入 current focus
  - 当前答案：应该

### 7. 系统必须输出

- execution progress understanding
- blocker-aware advice
- resolved blocker follow-up
- ready-to-ship guidance

### 8. 功能点拆分

- `J9-F1` progress parsing
- `J9-F2` blocker parsing
- `J9-F3` blocker-aware current focus
- `J9-F4` resolved blocker parsing
- `J9-F5` ready-to-ship actions
- `J9-F6` execution-stage brief

### 9. 对应模块 / 代码

- `lib/domain/demo-contracts.ts`
- `lib/domain/demo-state.ts`
- `components/coach-shell.tsx`

### 10. 当前实现状态

- `J9-F1` 已实现
- `J9-F2` 已实现
- `J9-F3` 已实现
- `J9-F4` 已实现
- `J9-F5` 已实现
- `J9-F6` 已实现

### 11. 当前 gap

- 没有 task tracker
- 没有 explicit execution dashboard
- 没有 artifact checklist
- 现在更像对话型执行 loop，而不是完整执行系统

### 12. 失败路径

- 用户一旦进入执行，就不得不离开产品用外部工具
- 系统知道 blocker，但无法持续维持上下文

### 13. 验收标准

- 用户可以连续数轮对话推进执行状态
- blocker 会影响 current focus 和 brief
- 产品不会在进入执行后失去价值

### 14. 排序建议

- 推荐：`P1`
- 原因：这是“持续陪跑”最像真的一层，但还不必早于信任核心闭环

---

## Journey 10：合伙人排序与 MVP 焦点收敛旅程

### 1. 目标 persona

- 内部决策者
- 合伙人 / founder / 产品 owner

### 2. 用户要完成的任务

- 不是新增更多旅程，而是决定未来 4-6 周先打透哪 2 条旅程

### 3. 用户前置状态

- 方向已经大致确认
- 但很容易 scope drift
- persona 和 slice 已经不少

### 4. 触发时刻

- 团队准备排接下来几周优先级

### 5. 理想用户路径

1. 看到当前 10 条旅程
2. 每条旅程对应清晰功能点
3. 每条旅程都能看到当前模块和 gap
4. 合伙人排序
5. 团队锁定只做最关键的前 2 条

### 6. 关键决策点

- 是继续平均发力，还是只打透最强 2 条
  - 当前建议：只打透最强 2 条
- 是继续扩 persona，还是先缩 gap
  - 当前建议：先缩 gap

### 7. 系统必须输出

- 一份可排序旅程清单
- 每条旅程可映射到功能点与模块
- 可直接讨论的优先级建议
- 是否忠于“年轻家庭和学子开箱即可使用”的判断标准

### 8. 功能点拆分

- `J10-F1` journey inventory
- `J10-F2` function-point decomposition
- `J10-F3` module mapping
- `J10-F4` gap mapping
- `J10-F5` founder ranking flow

### 9. 对应模块 / 代码

- 本文档
- `docs/product/personas.md`
- `docs/product/founder-alignment-checklist-zh.md`
- `AGENTS.md`

### 10. 当前实现状态

- `J10-F1` 已实现
- `J10-F2` 已实现
- `J10-F3` 已实现
- `J10-F4` 已实现
- `J10-F5` 已实现

### 11. 当前 gap

- 还没拿到合伙人的真实排序结果
- 还没把排序结果反写为下一阶段 roadmap

### 12. 失败路径

- 看起来大家都同意方向，但没人真正做优先级取舍
- 继续同时推进多个旅程，导致没有一条真正打透

### 13. 验收标准

- 合伙人能明确给出前 2 条旅程
- 团队能暂停其他旅程扩展
- 下一阶段工作项能直接从排序结果导出

### 14. 排序建议

- 推荐：`P0`
- 原因：如果不先收敛优先级，后面所有实现都会继续扩散

---

## 10 条旅程的对比表

| 旅程 | 主要 persona | 当前状态 | 差异化强度 | 近期建议 |
| --- | --- | --- | --- | --- |
| Journey 1 | Strategic STEM Striver | 已有主干，persona 深度不足 | 很强 | P0 |
| Journey 2 | First-Gen Ambition Builder | 有 seed，核心 affordability 缺失 | 很强 | P0 |
| Journey 3 | Cross-persona | 主干已成立 | 很强 | P0 |
| Journey 4 | STEM / First-gen / Rebounder | 主干已成立 | 很强 | P0 |
| Journey 5 | STEM / Pre-med / Rebounder | 主干已成立 | 很强 | P0 |
| Journey 6 | STEM / First-gen / Rebounder | 已实现，但偏 demo slice | 中高 | P1 |
| Journey 7 | STEM / Pre-med / Rebounder | 已实现，但缺时间系统 | 中高 | P1 |
| Journey 8 | Humanities / STEM / Pre-med | 已实现，但 persona 化不足 | 高 | P1 |
| Journey 9 | STEM / Pre-med / Humanities | 已实现，但缺执行系统 | 高 | P1 |
| Journey 10 | Founder / internal | 本文档已提供基础 | 极高 | P0 |

---

## 当前建议给合伙人的排序问题

### 问题 1

如果未来 4-6 周只能打透 2 条旅程，你选哪 2 条？

### 问题 2

哪条旅程最能代表 AdmitGenie 和其他工具的差异化？

### 问题 3

哪条旅程如果做不好，用户最容易失去信任？

### 问题 4

哪条旅程虽然有价值，但应该明确后置？

### 问题 5

你更希望下一阶段优先证明：

- A. 第一次进入就能拿到靠谱建议
- B. 上传材料后系统会可见地改变建议
- C. 产品能持续推进执行，不只是给建议

### 新增排序标准

每条旅程排序前，再补问一遍：

- 这条旅程的交互是否忠于“年轻家庭和学子开箱即可使用”
- 它看起来像一个被好教练带着走的体验，还是像一个复杂系统

---

## 我给出的默认推荐排序

### `P0`

- Journey 1
- Journey 2
- Journey 3
- Journey 4
- Journey 5
- Journey 10

### `P1`

- Journey 6
- Journey 7
- Journey 8
- Journey 9

### 为什么这样排

- `Journey 1-5` 更贴近 founder 问卷已经强确认的主问题：
  - 对话优先
  - 新材料可见反馈
  - 不静默改 profile
  - brief 推动行动
- `Journey 6-9` 很重要，但更像“把产品从可信 demo 推向更强真实陪跑”
- `Journey 10` 是防 scope drift 的必要管理旅程

---

## 当前最值得合伙人明确拍板的一句话

如果只能让合伙人确认一句话，我建议是：

> AdmitGenie 下一阶段到底先打透 “首次进入 + 材料反馈 + 确认冲突” 这组信任闭环，还是先打透 “执行推进” 这组深度闭环？
