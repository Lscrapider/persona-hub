# Scra Atlas 文档索引

本目录记录 Scra Atlas 当前有效的产品、设计、特效、架构与验收决定。此前互相冲突的视觉方向与技术限制已被清除，不再是实现依据。

## 当前归档基线

根页顺序为 **Hero → Timeline → Projects → Logs**；Current Index 仍在 Hero
构图内。Lab 在本次归档迭代中延后，不属于活动导航或根页章节，旧的 `/lab` 路由
重定向到 `/#index`。

归档内容由 `src/content/timeline.json`、`projects.json`、`logs.json` 与清单中
允许的 `src/content/logs/*.md` 提供。服务端加载器验证并解析这些本地资源，浏览器
只接收类型化、可序列化的记录和安全的 Markdown 块；`HomeExperience` 只组合各章节。

## 当前有效文档

1. [产品基线](PRODUCT.md)：网站为何存在、为谁设计、什么体验优先。
2. [体验与页面设计](design/2026-07-10-effect-first-experience-design.md)：信息架构、页面角色、视觉语言与体验节奏。
3. [特效系统](design/2026-07-10-effects-system.md)：主秀效果、通用动效语法、触发与降级规则。
4. [模块化运行时架构](architecture/2026-07-10-modular-effects-runtime.md)：内容、页面、场景、渲染器和第三方库的隔离边界。
5. [特效验收标准](quality/2026-07-10-effects-quality-gates.md)：视觉、性能、响应式和无障碍门槛。
6. [交互参考与来源](credits/2026-07-10-interaction-references.md)：外部参考的允许影响、禁止复制项与证据边界。
7. [实现后的设计系统](DESIGN.md)：当前已落地的色彩、字体、构图、组件与禁止项。
8. [Timeline、Projects 与 Logs 设计](superpowers/specs/2026-07-11-timeline-projects-logs-design.md)：当前归档内容模型、交互和渲染边界。
9. [对应实施计划](superpowers/plans/2026-07-11-timeline-projects-logs-implementation.md)：已批准的分步实现与验收要求。

## 决策优先级

发生冲突时按以下顺序处理：

1. 用户在当前任务中的明确要求。
2. `AGENTS.md` 的项目约束。
3. 本索引列出的当前有效文档。
4. 经视觉原型和性能验证后记录的技术决策。

未被本索引列出的旧草稿、聊天摘录和实现遗留不具有约束力。

## 维护规则

- 方向改变时直接修订或删除冲突内容，不并列保留两个“当前方案”。
- 视觉目标与实现技术分开记录。视觉目标稳定，渲染方法可经过原型验证后替换。
- 外部代码、动画、图片、字体、着色器或媒体进入项目之前，必须记录来源与许可情况。
- 实现计划放在 `docs/` 下的计划目录（当前归档计划位于
  `docs/superpowers/plans/`），只能在本组设计文档经用户确认后编写。
- 未经用户明确同意，不创建单元测试，不提交、推送或创建 Git 分支。
- 本文档描述需要收集的验收证据，不宣称尚未实际执行的浏览器视觉检查已经完成。
