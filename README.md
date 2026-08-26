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

3. 在项目设置中记下 **Project ID**；同时确认你的订阅类型对应的 API Host（免费订阅为 `devapi.qweather.com`，付费或新建项目可能是形如 `abc123.re.qweatherapi.com` 的专用域名）

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

原理：你的 Cloudflare Worker 替你保管私钥、自动签发 JWT 并转发请求。博客端永远只需要一个 `api-base` 地址。

> **开始前先弄清两个概念**
>
> - `workers.dev` 地址只是 Worker 的"门牌号"——部署完成那一刻就存在且永久有效
> - 凭据 ID + 项目 ID + 私钥是"门禁钥匙"——三件套配齐之前，天气接口会按设计返回 503 配置提示，**这不是故障**，严格按 B-1 → B-7 顺序做完即可

### B-1 生成本地密钥对

在本机执行（需安装 openssl，Windows 可用 Git Bash 自带版本）：

```bash
mkdir -p ~/.ssh/qweather
openssl genpkey -algorithm ed25519 -out ~/.ssh/qweather/qweather-ed25519.key
openssl pkey -in ~/.ssh/qweather/qweather-ed25519.key -pubout -out ~/.ssh/qweather/qweather-ed25519.pub
```

✅ 完成标志：目录下出现两个文件

- `qweather-ed25519.key` —— **私钥**，绝不外传、绝不入库，B-6 要用到
- `qweather-ed25519.pub` —— 公钥，下一步粘贴给和风

### B-2 在和风控制台创建 JWT 凭据

控制台 → 你的项目 → 创建凭据 → 选择 **JSON Web Token** → 把 `.pub` 文件的完整内容（含 BEGIN/END 行）粘贴进去。

✅ 完成标志：记下两串字符

- **Credential ID**（凭据 ID，即 JWT 的 `kid`）
- **Project ID**（项目 ID，即 JWT 的 `sub`）

### B-3 获取代码并登录 Cloudflare

```bash
git clone https://github.com/hf-wind/corner-cards.git
cd corner-cards/packages/proxy
npm install -g wrangler && npx wrangler login
```

⚠️ 重要：**之后所有 `wrangler` 命令都必须在 `packages/proxy` 目录下执行**——wrangler 靠该目录下的 `wrangler.toml` 识别要操作哪个 Worker，在别的目录运行会报 `Required Worker name missing`。

✅ 完成标志：浏览器弹出 Cloudflare 授权页并显示登录成功。

> 不想用命令行？也可以用一键部署按钮（见下方「一键部署路线」），配置改在网页控制台完成。

### B-4 部署前先填入凭据 ID 与项目 ID

编辑 `packages/proxy/wrangler.toml`：

```toml
[vars]
JWT_KID = "B-2 拿到的凭据ID"
JWT_SUB = "B-2 拿到的项目ID"
ALLOWED_ORIGIN = "https://你的博客域名"
```

✅ 完成标志：保存文件。注意 `[vars]` 改动只在**部署后**生效，所以务必先做这步再做 B-5。

### B-5 首次部署

```bash
npx wrangler deploy
```

✅ 完成标志：终端输出访问地址，形如 `https://corner-weather-proxy.<你的子域>.workers.dev`；浏览器打开它应显示 `corner-weather-proxy is running.`

两个正常现象，不要慌：

1. 新注册的 workers.dev 子域名 SSL 证书签发需要几分钟到半小时，期间浏览器可能报 `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`——稍等再试
2. 此时天气接口仍会返回 503 not configured——还差最后一步私钥（B-6）

### B-6 上传私钥（最后一步，上传即生效）

仍在 `packages/proxy` 目录下，按你的终端类型选择命令：

macOS / Linux / Windows Git Bash：

```bash
npx wrangler secret put JWT_PRIVATE_KEY < ~/.ssh/qweather/qweather-ed25519.key
```

Windows PowerShell（不支持 `<` 重定向，用管道等价写法）：

```powershell
Get-Content "$env:USERPROFILE\.ssh\qweather\qweather-ed25519.key" -Raw | npx wrangler secret put JWT_PRIVATE_KEY
```

Windows cmd（注意跨盘符切换目录必须加 `/d`）：

```bat
cd /d d:\你的仓库路径\corner-cards\packages\proxy
npx wrangler secret put JWT_PRIVATE_KEY < %USERPROFILE%\.ssh\qweather\qweather-ed25519.key
```

✅ 完成标志：终端显示 `Success! Uploaded secret JWT_PRIVATE_KEY`。secret 上传后会自动生成新版本并立即生效，**无需再次 deploy**。

至此三件套配齐（`JWT_KID`、`JWT_SUB`、`JWT_PRIVATE_KEY`），代理进入 JWT 模式。

### B-7 验证并接入博客

```bash
curl "https://corner-weather-proxy.<你的子域>.workers.dev/api/weather/now?location=101010100&lang=zh"
```

返回含 `"code":"200"` 与天气数据的 JSON 即全链路打通。博客里只需一行标签：

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/corner-weather-card/dist/index.js"></script>

<corner-weather api-base="https://corner-weather-proxy.<你的子域>.workers.dev" location="101010100"></corner-weather>
```

此后无需再关心认证细节——Token 过期前 5 分钟代理会自动重签。

### 一键部署路线的对应操作

使用 [Deploy 按钮](https://deploy.workers.cloudflare.com/?url=https://github.com/hf-wind/corner-cards) 或控制台导入 GitHub 仓库部署时，B-4 / B-6 改在网页上完成：
Cloudflare 控制台 → Workers & Pages → 你的 Worker → Settings → **Variables and Secrets**

- 添加变量（Type: Text）：`JWT_KID`、`JWT_SUB`
- 添加密钥（Type: Secret）：`JWT_PRIVATE_KEY`，粘贴 `.key` 文件全文

每次保存都会自动重新部署生效。

### 兼容说明

暂时不想用 JWT？也可以只上传一个旧式 API Key（`npx wrangler secret put QWEATHER_KEY`），代理会以转发模式工作——同一份代码，按你配置了哪组变量自动切换模式。

### 常见问题

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| PowerShell 报「"<"运算符是为将来使用而保留的」 | PowerShell 不支持输入重定向 `<` | 改用上方管道版命令 |
| cmd 报 `Required Worker name missing` | 不在 `packages/proxy` 目录执行（cmd 跨盘符需 `cd /d` 才真正切换） | 先 `cd /d <路径>\packages\proxy` 再运行 wrangler |
| 浏览器报 `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` | 新注册子域名的 SSL 证书尚未签发完 | 等 10~30 分钟重试；国内网络确认浏览器走了代理 |
| 天气接口返回 503 not configured | 三件套未配齐或未生效 | 核对 B-4 是否已 deploy、B-6 是否显示 Success，缺一即为 503 |
| 和风返回 401 等业务错误码 | kid/sub 填错，或公钥与本地私钥不是同一对 | 核对 B-2 两串 ID 与上传的公钥内容 |

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
