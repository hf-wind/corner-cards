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

## weather-card 特性

- 动态天气场景：背景渐变与 Canvas 粒子（雨丝 / 飘雪 / 浮尘 / 星空）实时映射当前天气
- 昼夜自适应：根据当地日出日落自动切换日间 / 夜间配色
- 三种预设尺寸：`compact`（侧边栏）/ `standard`（正文）/ `banner`（页头页脚横幅）
- 数据缓存 + 失败降级，不打爆和风天气免费额度
- 同时支持和风 **API Key** 与 **JWT** 两种凭据认证

---

# weather-card 接入教程

## 第零步：准备和风天气账号

1. 注册 [和风天气开发服务](https://console.qweather.com)，创建一个**项目**
2. 在项目中创建**凭据**。凭据有两种类型，任选其一：

| 凭据类型 | 说明 | 建议 |
| --- | --- | --- |
| API Key | 一串固定字符串，配置最简单 | ⚠️ 官方公告：2027 年起将降低 API Key 的请求配额，适合短期试用 |
| JSON Web Token | Ed25519 密钥对签名认证，配额不受影响 | ✅ 推荐长期使用，需配合本文的代理方式 |

3. 打开控制台**左侧「设置」页面**——每个账号在这里都有一个**专属 API Host**（形如 `xxxxx.re.qweatherapi.com`，同时展示开发者 ID 等账号信息），记下它；新账号的凭据已绑定此 Host，旧的通用域名 `devapi.qweather.com` 会返回 403 Invalid Host，接入时必须替换（见方式 B-4）

## 接入方式一览

| | 方式 A：API Key 直连 | 方式 B：代理 + JWT（推荐） | 方式 C：直传 JWT Token |
| --- | --- | --- | --- |
| 你需要填写 | `key` 一个属性 | `api-base` 一个属性 | `jwt` 一个属性 |
| 首次额外工作 | 无 | 部署一次代理（约 5 分钟） | 自行签发并定期更换 Token |
| 安全性 | Key 暴露在网页源码中，仅靠和风后台白名单缓解 | 私钥只存在你的 Worker 里，前端零泄露 | Token 最长 24 小时有效 |
| 和风 2027 政策 | 受影响（配额降低） | 不受影响 | 不受影响 |
| 适合场景 | 本地试用、快速验证 | 博客正式部署 | 已有自建后端/Serverless 的进阶用户 |

---

## 方式 A：API Key 直连（两行代码）

在博客模板的合适位置加入：

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/corner-weather-card/dist/index.js"></script>

<corner-weather key="你的APIKey" location="101010100"></corner-weather>
```

- `location` 填城市 Location ID（可在[和风地理信息查询](https://console.qweather.com/setting)查找），也支持 `"116.41,39.90"` 经纬度格式
- 由于 Key 会出现在页面源码里，建议在和风控制台把该 Key 的访问限制绑定到你的博客域名

## 方式 B：代理 + JWT（推荐，一次性配置约 5 分钟）

原理：你的 Cloudflare Worker 替你保管和风私钥、自动签发 JWT 并转发请求。博客端永远只需要一个 `api-base` 地址。

> 两个概念先分清：`workers.dev` 地址只是 Worker 的"门牌号"，部署即存在；凭据三件套（凭据 ID、项目 ID、私钥）是"门禁钥匙"。钥匙没配齐时天气接口按设计返回 503 提示——这不是故障。

完整教程与一键部署入口已独立在代理仓库：**[corner-weather-proxy](https://github.com/hf-wind/corner-weather-proxy)**

### 路线一：网页操作（推荐，全程无需命令行）

点击按钮并按引导授权 GitHub 创建 Worker：

**[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hf-wind/corner-weather-proxy)**

流程概要（逐步细节见 [代理仓库 README](https://github.com/hf-wind/corner-weather-proxy#五步接入网页操作为主约-5-分钟)）：

1. 本地生成密钥对——唯一需要终端的一步，Git Bash / Terminal 三条复制粘贴命令
2. 和风控制台：上传公钥创建「JSON Web Token」凭据 → 记下凭据 ID、项目 ID；左侧「设置」页记下专属 API Host
3. 一键部署 → 得到 `workers.dev` 访问地址
4. Cloudflare 控制台 Variables and Secrets 里填入三件套 + API Host
5. 验证接口返回 `"code":"200"` 后，博客卡片填 `api-base`

### 路线二：命令行部署（开发者备选）

```bash
git clone https://github.com/hf-wind/corner-weather-proxy.git
cd corner-weather-proxy
npm install -g wrangler && npx wrangler login
```

⚠️ 之后所有 `wrangler` 命令都必须在该仓库目录内执行，否则报 `Required Worker name missing`。

编辑 `wrangler.toml`：

```toml
[vars]
JWT_KID = "凭据ID"
JWT_SUB = "项目ID"
QWEATHER_HOST = "你的专属host.re.qweatherapi.com"
ALLOWED_ORIGIN = "*"
```

> **三个配置要点**
>
> - **QWEATHER_HOST**：每个和风账号都有专属 API Host（控制台左侧「设置」页查看），必须替换默认值，否则返回 403 `"Invalid Host"`
> - **别混淆三个 ID**：`JWT_SUB` 是项目 ID；「开发者 ID」是账号级标识不用于 JWT；凭据 ID 才是 `JWT_KID`
> - **ALLOWED_ORIGIN**：`*` 允许全网调用（调试方便）；生产建议填博客域名，防止配额被陌生人消耗

首次部署并上传私钥（按终端类型三选一）：

```bash
npx wrangler deploy

# macOS / Linux / Git Bash
npx wrangler secret put JWT_PRIVATE_KEY < ~/.ssh/qweather/qweather-ed25519.key
```

```powershell
# Windows PowerShell（不支持 < 重定向，用管道）
Get-Content "$env:USERPROFILE\.ssh\qweather\qweather-ed25519.key" -Raw | npx wrangler secret put JWT_PRIVATE_KEY
```

secret 上传后自动生效，无需重复 deploy。

### 验证并接入博客

用 curl 验证全链路。⚠️ 路径中必须带 `/v7/weather/now`——组件会自动拼接完整路径，手动测试容易漏掉这一段：

```bat
curl.exe -x http://127.0.0.1:7892 "https://corner-weather-proxy.<你的子域>.workers.dev/api/weather/v7/weather/now?location=101010100&lang=zh"
```

✅ HTTP 200 且响应体含 `"code":"200"` 与 `now` 天气对象即为打通（国内网络需给 curl 加 `-x` 指定本机代理）。然后博客里只需一行标签：

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/corner-weather-card/dist/index.js"></script>

<corner-weather api-base="https://corner-weather-proxy.<你的子域>.workers.dev" location="101010100"></corner-weather>
```

此后无需再关心认证细节——Token 过期前 5 分钟代理会自动重签。更多排错项见[代理仓库的常见问题表](https://github.com/hf-wind/corner-weather-proxy#常见问题)。

### 兼容说明

暂时不想用 JWT？也可以只上传一个旧式 API Key（`npx wrangler secret put QWEATHER_KEY`），代理会以转发模式工作——同一份代码，按你配置了哪组变量自动切换模式。

### 常见问题

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 一键部署报「无法获取存储库内容」，或提示 Monorepo 尚不完全支持 | Deploy 按钮 URL 指向了本仓库——它是 monorepo，Worker 不在根目录 | 改用指向独立仓库的按钮：`https://deploy.workers.cloudflare.com/?url=https://github.com/hf-wind/corner-weather-proxy` |

代理部署、验证与和风鉴权的完整排错表（SSL 签发等待、PowerShell `<`、cmd `cd /d`、503 / 403 Invalid Host / 404 路径 / 401 等）见 [corner-weather-proxy 常见问题](https://github.com/hf-wind/corner-weather-proxy#常见问题)。

## 方式 C：直传现成 JWT Token（进阶）

如果你已有自建后端并能签发和风 JWT，可直接传入：

```html
<corner-weather jwt="eyJhbGciOiJFZERTQSIsImtpZCI6Ii4uLiJ9..." location="101010100"></corner-weather>
```

⚠️ 注意：和风 JWT 有效期上限 24 小时，过期后卡片会请求失败。此方式适合能定时刷新页面注入新 Token 的场景（如 SSR 注入）。三种方式的优先级为 `jwt` > `api-base` > `key`，请勿同时配置多个。

---

## 组件属性参考

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `location` | 和风 Location ID 或 `经度,纬度` | 必填 |
| `key` | API Key 直连（方式 A） | - |
| `api-base` | 代理地址，配置后无需任何凭据（方式 B） | - |
| `jwt` | 现成的 JWT Token（方式 C） | - |
| `host` | 和风 API Host，付费订阅专用域名时使用 | `devapi.qweather.com` |
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

## 本地开发

```bash
pnpm install
pnpm dev        # 打开 playground 调试卡片
pnpm build      # 类型检查 + 构建 ESM/IIFE 双格式产物
```

## License

[MIT](./LICENSE) © hf-wind
