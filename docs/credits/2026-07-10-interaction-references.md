# Scra Atlas 交互参考与来源

**状态：当前有效**  
**更新日期：2026-07-10**

## The Content Architecture

- 页面：https://www.contentarchitecture.dev/
- 访问日期：2026-07-10
- 用途：视觉密度、技术内容呈现与交互语言参考。

### 已直接确认的页面特征

通过公开页面内容可确认：

- 首屏使用简短主张、CTA 与 `INPUT VERIFIED`、`LOC`、`STATUS` 等紧凑状态信息共同构图。
- 页面使用 `001` 至 `010` 的有序问题序列推进内容。
- 存在 “This is the actual repo” 区域，以真实目录和文件名展示仓库结构。
- 导航和 CTA 的公开文本提取中出现重复与随机字符片段，说明页面对文字状态做了视觉编排；具体动画时间、实现代码和渲染技术未被直接验证。

### 允许吸收的原则

- 让短状态信息成为主叙事的证据，而不是装饰性假日志。
- 用滚动和状态变化逐步呈现高密度技术内容。
- 用目录、文件树和代码结构表达真实系统关系。
- 用排版、路径、边界和微交互建立技术感，不依赖天体主视觉。
- 把特效做成页面体验的一部分，而不是独立背景插件。

### 禁止复制

- 不复制其品牌、名称、logo、文案、产品主张、页面顺序、定价和商业内容。
- 不复刻其布局比例、字体组合、颜色、组件几何和具体动画编排。
- 不下载、复制或改写其源代码、资产和动画实现。
- 不把 Scra Atlas 做成该网站的个人作品集换皮。

## 观察与推断边界

当前只把公开页面可读取内容视为直接证据。滚动曲线、hover 细节、移动端行为、减少动画支持、DOM/SVG/Canvas/WebGL 选择均需在浏览器可视审查后再记录，不能由页面文本反推为事实。

## 后续来源规则

- 外部代码、shader、动画片段、字体文件、图片和媒体在采用前记录作者、来源 URL、许可和修改方式。
- 只借鉴交互原则时，也记录访问日期和明确的禁止复制边界。
- 来源不明确的素材不进入正式发布版本。
- 项目产生 `public/assets/` 后，可增加 `public/assets/ASSET_MANIFEST.md` 维护逐资产记录。

## 字体来源与许可

以下字体仅保存 Google Fonts 官方服务提供的 Latin WOFF2 子集，未修改字形或字体名称，并通过 `next/font/local` 随站点构建。访问日期均为 2026-07-10。

### League Gothic

- 作者：The League Gothic Project Authors。
- CSS 来源：[Google Fonts CSS API](https://fonts.googleapis.com/css2?family=League+Gothic&display=swap)。
- 字体文件来源：[Google Fonts 官方静态资源](https://fonts.gstatic.com/s/leaguegothic/v13/qFdR35CBi4tvBz81xy7WG7ep-BQAY7Krj7feObpH_9ahg9UYRshmq0s.woff2)。
- 本地文件：`src/assets/fonts/league-gothic-latin.woff2`。
- 许可：SIL Open Font License 1.1，原始许可来自 [Google Fonts 字体仓库](https://github.com/google/fonts/blob/main/ofl/leaguegothic/OFL.txt)，本地副本为 `src/assets/fonts/OFL-League-Gothic.txt`。

### Manrope

- 作者：The Manrope Project Authors。
- CSS 来源：[Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap)。
- 字体文件来源：[Google Fonts 官方静态资源](https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggexSvfedN4.woff2)。
- 本地文件：`src/assets/fonts/manrope-latin-variable.woff2`，包含 200 至 800 的可变字重范围。
- 许可：SIL Open Font License 1.1，原始许可来自 [Google Fonts 字体仓库](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt)，本地副本为 `src/assets/fonts/OFL-Manrope.txt`。

## 本项目生成的视觉方向稿

- `docs/design/references/2026-07-10-home-palette.png`：由 Codex Image Generation 于 2026-07-10 生成，用于确认黑、骨白、陶土橙和银灰的颜色关系。
- `docs/design/references/2026-07-10-home-north-star.png`：由 Codex Image Generation 于 2026-07-10 生成，基于用户提供的两张参考截图进行原创构图探索。只作为 Home 的视觉北星，不作为发布资产，也不复制参考站的品牌、文案、代码或素材。
