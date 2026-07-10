# Scra Atlas 模块化特效运行时架构

**状态：当前有效**  
**更新日期：2026-07-10**

## 架构目标

- 内容、页面状态、视觉编排和底层渲染可以独立替换。
- 单个效果崩溃、性能下降或被禁用时，不影响导航和内容。
- 特效可以大胆，但影响范围必须可控。
- 技术选型服务于效果质量，不由全局偏好提前锁死。

## 当前技术基线

以下选择作为实现计划的默认起点。版本号在实现计划中根据当时的官方稳定版本锁定。

- **Next.js App Router + React + TypeScript**：负责路由、页面 metadata、服务端内容渲染和客户端交互边界。没有交互需求的内容默认保持服务端渲染；主秀场景才进入客户端边界。参考 [Next.js App Router 官方文档](https://nextjs.org/docs/app)。
- **Tailwind CSS + CSS custom properties**：Tailwind 负责布局和常规样式，CSS variables 负责主题、层级、效果强度和可被渲染器共享的参数。场景专属复杂样式可以使用同目录 CSS，不把全部视觉塞进 utility class。
- **Motion for React**：负责组件进入退出、布局变化、手势、SVG 路径和共享 motion primitives。它不直接拥有 Canvas/WebGL 绘制循环。参考 [Motion for React 官方文档](https://motion.dev/docs/react)。
- **本地 Markdown / MDX + Shiki**：负责 Blog 内容和构建时代码高亮。初期不引入 CMS；参考 [Next.js MDX 官方指南](https://nextjs.org/docs/app/guides/mdx) 与 [Shiki 官方文档](https://shiki.style/)。
- **原生滚动优先**：先用浏览器滚动、Intersection Observer 和 scroll progress 实现叙事。只有视觉原型证明平滑滚动层有明确收益，才隔离引入 Lenis 等库。
- **GSAP 为条件依赖**：默认不与 Motion 重叠安装。只有某个主秀需要复杂的可控时间线或滚动编排，且 Motion 原型无法满足时，才在该 scene 内引入 GSAP / ScrollTrigger 适配器。参考 [GSAP 官方文档](https://gsap.com/docs/v3/)。
- **Canvas / WebGL 为场景级能力**：不成为全站前提。需要时通过 renderer adapter 懒加载，语义内容继续由 DOM 提供。

不引入 Monaco 作为代码展示默认方案；只有真实编辑需求才使用完整编辑器运行时。

## 分层模型

```text
Content
  ↓
Feature state
  ↓
Scene choreography
  ↓
Shared motion primitives
  ↓
Renderer adapters
  ↓
DOM / CSS / SVG / Canvas / WebGL / media
```

### Content

保存项目、文章、时间线和站点身份。它不导入组件、动画库或渲染器。

### Feature state

处理当前项目、展开节点、文章筛选、时间线活动记录等业务状态。它决定“发生什么”，不决定像素如何运动。

### Scene choreography

编排页面独有的主秀效果。它可以理解本 feature 的状态，不要求伪装成全站通用组件。

### Shared motion primitives

提供字符收敛、路径绘制、焦点移动、metadata reveal 和转场等可复用动作。它们不读取项目或文章数据。

### Renderer adapters

隔离 DOM、SVG、Canvas、WebGL 或媒体运行时。上层场景依赖能力接口，不直接散落第三方库调用。

## 建议目录

```text
src/
  app/                     路由、metadata、页面组合、错误边界
  content/                 项目、文章、时间线、站点身份
  core/                    类型、格式化、URL、locale、能力检测
  features/
    home/
      scene/               Home 专属编排
    projects/
      scene/               Project Tree 专属编排
    blog/
    timeline/
    lab/
  effects/
    primitives/            resolve、draw、reveal、focus、transfer
    renderers/             dom、svg、canvas、webgl、media 适配
    runtime/               调度、可见性、质量模式、性能降级
  motion/                  时长、缓动、reduced-motion 替代
  ui/                      可访问的按钮、树、链接、标签、容器
  styles/                  tokens、字体、全局层级和响应式规则
```

页面只能组合 feature，不在路由文件中编写复杂时间线。feature 之间不能导入彼此内部组件；确实需要复用的能力提升到 `ui/`、`effects/` 或 `core/`。

## 场景契约

每个主秀场景至少接受以下上下文：

```ts
type EffectMode = 'full' | 'reduced' | 'static';

type SceneContext = {
  mode: EffectMode;
  visible: boolean;
  focused: boolean;
  pointer: 'fine' | 'coarse' | 'none';
};
```

场景生命周期为：

```text
dormant → entering → active → exiting → suspended → disposed
```

- `suspended` 用于页面隐藏、离屏或性能降级。
- `disposed` 必须释放事件、observer、animation frame、纹理和 GPU 资源。
- React 组件卸载不是唯一清理机制，渲染器必须提供显式销毁能力。

## 渲染技术决策

不设置“Canvas 不好”或“WebGL 更高级”的全局结论。每个场景按下表选择：

| 技术 | 适合 | 不适合 |
| --- | --- | --- |
| DOM / CSS | 语义文本、布局、控件、轻量状态变化 | 大量独立对象和逐像素合成 |
| SVG | 路径文字、连线、精确图形、少量可交互节点 | 数千节点的持续高频更新 |
| Canvas 2D | 大量点、文字场、纹理合成、可控绘制循环 | 可访问内容和复杂表单交互 |
| WebGL / shader | 高密度合成、扭曲、滤镜、并行图形计算 | 普通排版、仅为炫技的全屏背景 |
| Raster / video / Lottie / Rive | 已经完成艺术指导的确定性画面 | 需要实时语义数据和自由交互的核心结构 |

采用 Canvas 或 WebGL 前，至少制作一个静态构图和一个最小动态原型，与 DOM/SVG 版本按视觉质量、帧率、包体和维护成本比较。没有原型证据，不写成全站基础设施。

## 运行时隔离

- 语义内容始终由 DOM 提供，Canvas/WebGL 层默认 `aria-hidden`。
- 重型场景按路由或可见性懒加载，不能阻塞首屏可读内容。
- 每个场景有独立错误边界。视觉层报错时显示静态最终帧或直接移除装饰层。
- 首页首版使用动态场景边界隔离 `KineticTypeField`；场景 chunk、render 或动画生命周期失败时只移除装饰层，身份、导航、索引和入口解锁仍保持可用。
- 全站只允许一个动画帧调度入口，避免多个库各自运行永久循环。
- 页面离屏、浏览器隐藏或用户切换到 static 时暂停所有连续渲染。
- 不同时引入多个承担同一职责的动画库。

## 性能降级

降级不能只依赖设备型号或 user-agent。运行时综合：

- `prefers-reduced-motion`。
- fine / coarse pointer 和触摸能力。
- 页面可见性与场景交叉状态。
- 实际帧耗时和连续长任务。
- 用户手动选择的特效强度。

当连续一秒无法维持质量目标时，依次降低对象数量、指针响应、后处理、连续背景和渲染分辨率；最后切换到静态最终帧。内容和交互控件不参与降级。

## 内容边界

初期使用本地、版本化内容。是否使用 Markdown、MDX、JSON 或 TypeScript 数据由具体模块决定，解析结果必须进入稳定契约。

建议核心模型：

- `Project`：slug、名称、状态、摘要、技术栈、模块树、证据、链接。
- `Post`：slug、标题、日期、摘要、标签、正文、草稿状态。
- `TimelineEntry`：id、开始、结束、类别、标题、摘要、关联项目。

具体内容不能写进动画时间线。场景通过选择器获得当前展示数据。

## 第三方依赖边界

- Framer Motion、Motion、GSAP、Lenis、Three.js、React Three Fiber 等都不是默认必选。
- 引入依赖时必须写明它唯一负责的职责、替代方案和退出成本。
- 滚动平滑库不能改变可访问性、锚点定位和浏览器历史行为。
- 编辑器展示优先使用轻量代码渲染；只有真实编辑需求才引入 Monaco 等重型编辑器。

## 变更规则

- 改项目内容，只改 `content/`。
- 改当前节点逻辑，只改 feature state。
- 改页面主秀，只改该 feature 的 `scene/`。
- 改通用节奏，只改 `motion/`。
- 替换 Canvas 为 WebGL，只改 renderer 和场景适配，不改路由与内容。
- 删除特效时，保留完整 DOM 信息与操作路径。
