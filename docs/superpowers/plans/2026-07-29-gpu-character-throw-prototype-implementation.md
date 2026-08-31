# GPU 骨骼角色甩卡技术样机实施计划

- 日期：2026-07-29
- 依据：`docs/superpowers/specs/2026-07-29-gpu-character-throw-prototype-design.md`
- Git：不提交、不推送、不创建分支
- 测试：不新建单元测试；使用类型、构建、浏览器和视觉验收

## 1. 资产

1. 保存 three.js 官方 CC0 `RobotExpressive.glb` 到
   `public/assets/models/robot-expressive.glb`。
2. 从现有舞台编辑出无人物背景
   `public/assets/hero/phantom-courier-background.png`。
3. 在 `public/assets/ASSET_MANIFEST.md` 记录来源、许可、用途和代理性质。

## 2. 场景组件

1. 新增 `GpuCharacter.tsx`：
   - 使用 `GLTFLoader` 和 `SkeletonUtils.clone`。
   - 缓存 `Idle`、`Punch` action 和 `Palm2R`。
   - 以命令式句柄暴露手部世界姿态。
   - 只清理实例克隆的材质与 AnimationMixer。
2. 新增 `ProjectCard.tsx`：
   - 抽出卡片网格、纹理、轨迹和材质。
   - 飞行前复制手骨姿态。
   - 首个飞行帧缓存释放姿态，然后接管现有贝塞尔飞行。
3. 新增 `CameraRig.tsx`：
   - 读取 pointer ref 做阻尼镜头偏移。
   - 转场开始后自动回正。

## 3. 时间线与降级

1. 将 `SceneMotionValues` 拆分为 `characterProgress` 与
   `flightProgress`，继续使用 ref 避免逐帧 React 渲染。
2. 调整 GSAP 主时间线：先驱动角色，约 270ms 后驱动卡片飞行。
3. GLB、动画和手骨全部验证后才设置 `sceneReady=true`。
4. `prefers-reduced-motion` 确认后才决定是否挂载 Canvas。

## 4. 验证

1. `pnpm exec next typegen`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm build`
5. 应用内浏览器：
   - 1920×1080 待机、指针镜头、甩卡关键帧、项目页落地
   - 2560×1440 构图和溢出
   - About / Contact
   - 控制台错误
6. 更新根目录 `design-qa.md`，记录代理模型这一明确偏差。

