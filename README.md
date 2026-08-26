# Corner Cards

> 为博客角落而生的小组件系列 · by [hf-wind](https://github.com/hf-wind) · [corner.ink](https://corner.ink)

![License](https://img.shields.io/badge/license-MIT-green)
![Lit](https://img.shields.io/badge/built%20with-Lit-324fff)

Corner Cards 是一组轻量、精致、开箱即用的博客嵌入组件，全部基于标准 **Web Component** 实现——不绑定任何框架，Hexo、Hugo、WordPress、VitePress、纯 HTML 页面都能一行代码接入。

## 系列组件

| 组件 | 包名 | 状态 |
| --- | --- | --- |
| weather-card 动态天气场景卡片 | `corner-weather-card` | 开发中 |
| clock-card 时钟卡片 | - | 规划中 |
| music-card 音乐卡片 | - | 规划中 |

## weather-card 预览特性

- 动态天气场景：背景渐变与 Canvas 粒子（雨丝 / 飘雪 / 浮尘 / 星空）实时映射当前天气
- 昼夜自适应：根据当地日出日落自动切换日间 / 夜间配色
- 三种预设尺寸：`compact`（侧边栏）/ `standard`（正文）/ `banner`(页头页脚横幅)
- 数据缓存 + 失败降级，不打爆和风天气免费额度
- 可选 Cloudflare Worker 代理，API Key 不暴露在前端

## 快速开始

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/corner-weather-card/dist/index.js"></script>

<corner-weather
  key="你的和风天气Key"
  location="101010100">
</corner-weather>
```

### 属性说明

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `location` | 和风 Location ID 或 `经度,纬度` | 必填 |
| `key` | 和风天气 API Key（直连模式） | - |
| `api-base` | 自建代理地址，配置后无需 key | - |
| `size` | `compact` / `standard` / `banner` | `standard` |
| `theme` | `auto` / `light` / `dark` | `auto` |
| `lang` | 语言，如 `zh` / `en` | `zh` |
| `unit` | 温度单位 `c` / `f` | `c` |

CSS 变量微调：`--cw-radius`（圆角）、`--cw-font`（字体）、`--cw-height`（banner 高度）。

### 事件

```js
card.addEventListener('weather:loaded', (e) => console.log(e.detail))
card.addEventListener('weather:error', (e) => console.warn(e.detail))
```

## 保护你的 API Key（推荐）

直连模式下 Key 会暴露在页面源码中。更安全的做法是部署一份代理：

```bash
cd packages/proxy
npx wrangler secret put QWEATHER_KEY   # 输入你的和风 Key
npx wrangler deploy                     # 一键部署到 Cloudflare Workers
```

然后在卡片上改用代理地址：

```html
<corner-weather api-base="https://corner-weather-proxy.你的域名.workers.dev" location="101010100"></corner-weather>
```

> 代理已预留 `/api/ai` 路由，后续版本将接入 DeepSeek 实现天气提醒等 AI 能力。

## 本地开发

```bash
pnpm install
pnpm dev        # 打开 playground 调试卡片
pnpm build      # 类型检查 + 构建 ESM/IIFE 双格式产物
```

## License

[MIT](./LICENSE) © hf-wind
