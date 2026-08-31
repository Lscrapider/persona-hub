# Persona Hub 卡片投掷式作品站实施计划

**日期：** 2026-07-27  
**状态：** 执行中  
**设计依据：** `docs/superpowers/specs/2026-07-27-card-throw-portfolio-design.md`

## 1. 实施目标

在当前空白开发分支中恢复仓库既有的 Next.js 与 React 技术底座，实现用户确认的两段连续体验：

1. 首页采用概念图 2 的原创女性怪盗角色与黑红浅色构图。
2. 用户点击主要入口后，真正的 WebGL 卡片从角色手部飞向镜头。
3. 卡片逼近镜头后采用概念图 3 的逻辑揭示项目预览，并进入唯一公开项目“城市副本”。
4. 项目内容、导航、About 与 Contact 保持真实 DOM、键盘可用和可直接访问。

首版使用独立生成的原创角色舞台资产与 WebGL 卡片完成效果。角色层通过统一适配器暴露动作、视线和手部锚点，后续可直接替换为正式 Blender GLB，不重写转场。

## 2. 已确认约束

- 不复制现成《女神异闻录 5》人物、服装、标志或界面资产。
- 不增加项目轮播、假项目、随机三维物体、粒子雨或实时物理。
- 不使用滚动劫持；转场由真实链接、点击、触屏或键盘触发。
- 不把项目正文放进 Canvas。
- 不创建单元测试。
- 不提交、推送或创建 Git 分支。
- 验证使用类型检查、Lint、生产构建、浏览器交互、截图对照和运行时检查。

## 3. 技术决策

### 3.1 应用底座

沿用仓库主线已有技术方向：

- Next.js App Router
- React
- TypeScript
- 本地 League Gothic 与 Manrope 字体
- CSS tokens 与 CSS Modules 风格边界

新增最小动画依赖：

- `three`
- `@react-three/fiber`
- `gsap`

首轮不引入物理、后处理、全局状态库、调试面板或滚动动画插件。

### 3.2 角色呈现

首版角色不是从概念图裁切。通过 Image Gen 生成无 UI、无卡片的独立原创角色舞台底图，并作为 WebGL 纹理平面加载。角色适配器提供：

```ts
type CharacterAction = "idle" | "anticipation" | "release" | "recover"

interface CharacterController {
  setAction(action: CharacterAction): void
  getHandAnchor(): { x: number; y: number; z: number }
  setLookOffset(x: number, y: number): void
  setVisibility(visible: boolean): void
}
```

正式 GLB 到位时，只替换 `CharacterPlane` 实现，不修改卡片、DOM 揭示和路由时间线。

### 3.3 WebGL 边界

Three.js 负责：

- 舞台底图的轻微空间视差。
- 有厚度的项目卡片、卡边高光和投掷轨迹。
- 镜头轻微推进与卡片透视。

DOM 负责：

- SCRA、导航、主句和 `THROW TO ENTER`。
- About 与 Contact 面板。
- 卡片覆盖后的项目预览。
- 项目案例正文与所有可访问文本。

### 3.4 转场状态

```text
loading
  → ready
  → preparing
  → throwing
  → revealing
  → navigating
  → project

loading → fallback
任意转场错误 → ready
project → returning → ready
```

状态变化使用单个 `runId` 防止重复点击和过期回调。GSAP 时间线写入普通 ref，R3F 在 `useFrame` 中读取，避免每帧 React 重渲染。

## 4. 文件改动

### 4.1 工程配置

- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `next-env.d.ts`

### 4.2 页面

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/app/work/[slug]/page.tsx`

### 4.3 首页与转场

- `src/components/home/HomeExperience.tsx`
- `src/components/home/HeroOverlay.tsx`
- `src/components/experience/ExperienceCanvas.tsx`
- `src/components/experience/ExperienceScene.tsx`
- `src/components/experience/CharacterPlane.tsx`
- `src/components/experience/ProjectCard.tsx`
- `src/components/experience/quality.ts`
- `src/components/transition/TransitionProvider.tsx`
- `src/components/transition/TransitionOverlay.tsx`
- `src/components/transition/useCardTransition.ts`
- `src/components/transition/transitionMachine.ts`

### 4.4 项目与基础 UI

- `src/components/portfolio/ProjectCaseStudy.tsx`
- `src/components/portfolio/AboutPanel.tsx`
- `src/components/portfolio/ContactPanel.tsx`
- `src/components/ui/SiteNav.tsx`
- `src/content/projects.ts`

### 4.5 设计与静态资源

- `src/assets/fonts/league-gothic-latin.woff2`
- `src/assets/fonts/manrope-latin-variable.woff2`
- `public/assets/hero/phantom-courier-stage.png`
- `public/assets/projects/featured-project-card.png`
- `public/assets/ASSET_MANIFEST.md`

## 5. 实施步骤

### 阶段 A：恢复可运行底座

1. 从仓库主线读取并恢复 Next.js、React、TypeScript 与本地字体配置。
2. 创建新的依赖清单和锁文件。
3. 清理业务层对旧 archive、blog、timeline 和 lab 路由的依赖，不恢复旧产品页面。
4. 建立根布局、全局 tokens 和最小首页。

完成标准：

- 开发服务可启动。
- 根路由和 `/work/urban-sidequest` 可直接访问。
- TypeScript、Lint 和生产构建可运行。

### 阶段 B：静态可访问版本

1. 实现首页 DOM 构图、导航、主句和主要链接。
2. 实现项目案例页与真实项目截图。
3. 实现 About、Contact 面板。
4. 在 WebGL 未加载或减少动态效果时，主要链接仍可进入项目。

完成标准：

- 无 JavaScript 动画时核心路径仍成立。
- 首页复制概念图 2 的文本层级、黑红浅色比例和安全区。
- 项目页能正常阅读、返回和直接刷新。

### 阶段 C：WebGL 舞台与卡片

1. 动态加载 R3F Canvas，避免项目页携带 Three.js。
2. 加载独立角色舞台纹理，不使用概念图作为运行时背景。
3. 建立真正有厚度的项目卡片与手部锚点。
4. 实现有限指针视差和按需渲染。

完成标准：

- 首页只有一个 Canvas。
- 卡片初始位置与角色手势对齐。
- Canvas 失败不会阻断普通链接。

### 阶段 D：投卡与页面揭示

1. 建立 GSAP 统一时间线。
2. 在 280ms 释放卡片，在 680ms 开始 DOM 揭示，在 920ms 更新路由。
3. 卡片达到约 70% 视口覆盖时，项目预览由 DOM 接管。
4. 实现重复输入锁、路由失败恢复和页面隐藏处理。

完成标准：

- 转场总时长约 1.15 秒。
- Canvas 卡面到 DOM 项目预览没有明显跳位。
- 转场中点击多次不会产生双路由。

### 阶段 E：响应式与性能

1. 桌面使用完整角色舞台、DPR 1.5 上限和 60fps 目标。
2. 移动端降低 DPR、视差、卡片数量和更新频率。
3. WebGL 不可用或减少动态效果时使用静态海报与 160ms 淡化。
4. 页面不可见或项目页覆盖后暂停 Canvas。

完成标准：

- 1440×1024、1024×768 和 390×844 无溢出。
- 桌面与现代移动设备达到既定帧时间目标。
- 减少动态效果仍保留完整导航与内容。

### 阶段 F：设计 QA

1. 在 1440×1024 截取首页，与概念图 2 合并对照。
2. 在转场关键帧截取画面，与概念图 3 合并对照。
3. 检查字体、布局、颜色、资产、复制文本和主要交互。
4. 修复所有 P0、P1、P2。
5. 写入根目录 `design-qa.md`，最终结果必须为 `passed`。

## 6. 验证命令

不创建单元测试。按以下顺序验证：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

随后在应用内浏览器验证：

- 首页首次加载与无 WebGL 降级。
- 点击、触屏等价路径和键盘 Enter。
- 投卡关键帧与项目页接管。
- About、Contact、项目返回和浏览器后退。
- 桌面与移动端响应式。
- 控制台无错误。
- 接受图与实现截图的合并视觉对照。

## 7. 完成定义

- 首页和转场分别与概念图 2、3 的核心构图一致。
- 主要入口真实可用，项目页为真实 DOM。
- WebGL 只负责视觉演出，不阻塞内容。
- 性能降级、减少动态效果和失败恢复均可用。
- `typecheck`、`lint`、`build` 通过。
- `design-qa.md` 为 `final result: passed`。
- 本地预览保持运行，供用户直接查看。
