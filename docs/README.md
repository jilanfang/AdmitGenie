# AdmitGenie Docs

这套文档现在按三层来读：

1. 现行 source of truth
2. 现行支持文档
3. 历史归档

先读现行文档。只有现行文档代表当前产品和代码真相。

## 快速入口

如果你只想先搞清楚现在这个仓库在做什么，按这个顺序读：

1. `../README.md`
2. `../AGENTS.md`
3. `./product/canonical-product-blueprint-zh.md`
4. `./product/onboarding-v1.md`
5. `./product/user-workflows.md`
6. `./deployment/vercel-demo.md`
7. `./tech/system-architecture.md`

## 当前 Source Of Truth

### 产品

- `./product/canonical-product-blueprint-zh.md`
  当前 AdmitGenie 的最高级产品蓝图。产品形态、状态边界、交互纪律，以这份为准。
- `./product/founder-alignment-checklist-zh.md`
  合伙人/决策对齐用。不是蓝图，但仍代表当前方向判断。

### 派生产品文档

- `./product/onboarding-v1.md`
  首次进入和 active case 激活的现行说明。
- `./product/user-workflows.md`
  主工作流、回流、材料进入、确认和 brief 更新路径。
- `./product/founder-priority-user-journeys-zh.md`
  按 journey 拆开的优先级和覆盖视角。遇到冲突，仍以 blueprint 为准。

### 部署与运行

- `./deployment/vercel-demo.md`
  当前 closed pilot POC 的部署、环境变量、烟测口径。

### 技术基线

- `./tech/system-architecture.md`
  当前系统主结构和部署模型。
- `./tech/adrs/`
  仍然有效的高层决策记录。

## 当前支持文档

这些文档还有用，但不是最高级真相：

- `./glossary.md`
  当前术语表。
- `./product/english-customer-input-corpus.md`
  单轮英文输入语料的人工说明，对应自动化 routing fixture。
- `./product/english-journey-scenarios.md`
  多轮英文 journey fixture 的人工说明，对应回归测试与报告。

## 归档

历史文档都放到 `./archive/`。

进入归档，不代表没有价值，只表示它们不再直接代表当前产品或代码状态。常见原因有三种：

- 已被当前 blueprint 或代码实现覆盖
- 仍有参考价值，但属于某一阶段的工作稿
- 属于已经完成的 superpowers 设计/计划记录

归档入口：

- `./archive/README.md`

## 目录结构

- `docs/product/`
  当前产品真相和现行支持文档
- `docs/tech/`
  当前技术基线与 ADR
- `docs/deployment/`
  当前部署与运行说明
- `docs/archive/`
  历史产品稿、历史技术稿、历史计划和设计文档

## 文档维护规则

- 新的产品真相，优先写入 `product/canonical-product-blueprint-zh.md` 或其现行派生文档
- 新的部署真相，写入 `deployment/vercel-demo.md`
- 新的高层架构决策，优先补 ADR，不要再新增平行“技术总览草稿”
- 一次性设计稿、执行计划、阶段性方案，默认进入 `docs/archive/`
- 如果一份文档和当前代码或 blueprint 冲突，要么更新它，要么把它归档，不要让冲突长期存在
