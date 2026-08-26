# corner-weather-card 设计文档

> Corner Cards 系列第一款组件 · 2026-08-26 定稿

## 目标

为博客提供一个"好看且动态适配所有天气"的天气卡片：一行代码接入任意博客系统，UI 为动态天气场景风格，数据来自和风天气 API，后期接入 DeepSeek 提供 AI 提醒能力。

## 关键决策

| 决策点 | 结论 | 理由 |
| --- | --- | --- |
| 品牌命名 | Corner Cards 系列（呼应博客 corner.ink），本项目包名 `corner-weather-card`，仓库 `corner-cards` | 个人品牌资产复用，可持续扩展同类小组件 |
| 技术形态 | Web Component（Lit 3 + TypeScript + Vite） | 任意博客可 `<script>` 接入；Lit 仅 ~5KB，样式天然隔离 |
| 数据链路 | 直连与自建代理二选一（`key` 或 `api-base`） | 兼顾零门槛接入与 Key 安全 |
| UI 方向 | 动态天气场景风（类 iOS 天气）：渐变背景 + Canvas 粒子随天气变化 | 项目核心卖点 |
| 尺寸适配 | 三种预设：compact / standard / banner | 覆盖侧边栏、正文、页头页脚场景 |
| AI 模块 | 二期实现 DeepSeek 提醒文案；一期预留 `/api/ai` 代理路由与组件 `ai` 扩展点 | 先把本体做到极致，控制首发范围 |

## 架构

```
packages/
├── core/                  corner-weather-card（npm 主包）
│   └── src/
│       ├── corner-weather.ts    Lit 组件：属性解析、状态机、渲染编排
│       ├── layouts.ts           compact/standard/banner 三套布局模板
│       ├── api.ts               和风 v7 now+3d 并行请求，支持直连/代理
│       ├── cache.ts             localStorage TTL 缓存（默认 30 分钟）
│       ├── types.ts             和风响应与视图类型
│       ├── scenes/
│       │   ├── registry.ts      天气图标码 → 场景映射表（数据驱动核心）
│       │   ├── palettes.ts      每种场景的昼夜双渐变色板
│       │   ├── particles.ts     Canvas 粒子引擎（雨/雪/尘/星空）
│       │   └── icons.ts         场景 SVG 图标（含 CSS 微动效）
│       └── utils/day-night.ts   日出日落昼夜判断
└── proxy/                 corner-weather-proxy（Cloudflare Worker 模板）
    └── src/worker.ts            /api/weather/* 转发 + /api/ai 预留路由
```

## 数据流

1. 解析属性 → 组装缓存键 `corner-weather:wx:{location}:{lang}:{unit}`
2. 读 localStorage：有数据先立即渲染（过期则显示"x 分钟前"角标）
3. 缓存未命中或已过期 → 并行请求 `/v7/weather/now` + `/v7/weather/3d`
4. 成功 → 写缓存（TTL 30 分钟）、派发 `weather:loaded`
5. 失败 → 派发 `weather:error`；若有过期缓存则继续展示旧数据并提供重试按钮

同页面多个卡片实例通过相同缓存键共享数据，避免重复请求打爆免费额度。

## 天气场景映射（动态适配所有天气的核心）

和风约 30 种天气图标码归并为 12 个场景：clear / partly / cloudy / shower / thunder / rain / sleet / snow / fog / haze / sand / unknown。

每个场景 = `{ 渐变色板(昼/夜), Canvas 粒子类型, SVG 图标(昼/夜) }`，全部由映射表驱动：
新增或微调某种天气只需改表，不动逻辑代码。

昼夜判断：优先使用和风返回的日出日落时间；缺失时按 6:00–18:00 兜底。
已知局限：当前以访客本地时间比较，跨时区城市存在偏差，后续迭代引入时区修正。

粒子引擎细节：DPR 感知（上限 2x）、按面积缩放粒子数（上限 160）、尊重 `prefers-reduced-motion`；晴夜显示闪烁星空，白昼晴天无粒子。

## 错误处理

- HTTP 非 200 / 和风 code 非 "200"：抛出并进入 error 态，展示错误信息 + 重试
- 请求竞态：AbortController 取消上一次未完成请求
- localStorage 不可用：静默降级为无缓存模式

## 二期 AI 扩展点

- 代理端：`POST /api/ai` 路由已预留（当前返回 501），届时注入 DeepSeek Key 作为 Worker Secret
- 组件端：计划新增 `ai` 属性开关，在 banner/standard 布局中追加一条 AI 提醒文案位
- 协议：一期不定死请求/响应结构，二期结合提醒场景再定稿

## 构建与发布

- `pnpm build`：tsc --noEmit 类型检查 + Vite lib 模式产出 `dist/index.js`（ESM）与 `dist/corner-weather-card.iife.js`（IIFE，全局变量 `CornerWeatherCard`）
- 发布：`pnpm publish --filter corner-weather-card`；CDN 用户走 jsdelivr 引用 dist 产物
- 后续测试规划：Vitest 单测（cache/api/registry 纯函数）+ Playwright 视觉冒烟

## 里程碑

- [x] M1 monorepo 脚手架 + 组件骨架（本仓库初始状态）
- [ ] M2 场景视觉打磨：全量天气码覆盖验证、动效细化、多主题
- [ ] M3 文档站 + playground 在线演示
- [ ] M4 npm 首发 + GitHub Actions 自动发布
- [ ] M5 DeepSeek AI 提醒模块
