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

### B-1 生成本地密钥对

在本机执行（需安装 openssl，Windows 可用 Git Bash 自带版本）：

```bash
mkdir -p ~/.ssh/qweather
openssl genpkey -algorithm ed25519 -out ~/.ssh/qweather/qweather-ed25519.key
openssl pkey -in ~/.ssh/qweather/qweather-ed25519.key -pubout -out ~/.ssh/qweather/qweather-ed25519.pub
```

得到两个文件：

- `qweather-ed25519.key` —— **私钥**，绝不外传、绝不入库，B-4 要用到
- `qweather-ed25519.pub` —— 公钥，下一步粘贴给和风

### B-2 在和风控制台创建 JWT 凭据

控制台 → 你的项目 → 创建凭据 → 选择 **JSON Web Token** → 把 `.pub` 文件的完整内容（含 BEGIN/END 行）粘贴进去。创建成功后记下：

- **Credential ID**（凭据 ID，即 JWT 的 `kid`）
- **Project ID**（项目 ID，即 JWT 的 `sub`）

### B-3 部署代理到 Cloudflare Workers

点击一键部署：

```markdown
https://deploy.workers.cloudflare.com/?url=https://github.com/hf-wind/corner-cards
```

或手动方式：

```bash
git clone https://github.com/hf-wind/corner-cards.git
cd corner-cards/packages/proxy
npm install -g wrangler && npx wrangler login
npx wrangler deploy
```

部署完成后会得到形如 `https://corner-weather-proxy.你的子域名.workers.dev` 的地址。

### B-4 配置 JWT 三件套

编辑 `packages/proxy/wrangler.toml`（或 Cloudflare 控制台 → Workers → 你的服务 → Settings → Variables）：

```toml
[vars]
JWT_KID = "你在B-2拿到的凭据ID"
JWT_SUB = "你在B-2拿到的项目ID"
ALLOWED_ORIGIN = "https://你的博客域名"   # 建议收紧 CORS 白名单
```

再上传私钥（交互式粘贴 `.key` 文件全文）：

```bash
npx wrangler secret put JWT_PRIVATE_KEY < ~/.ssh/qweather/qweather-ed25519.key
```

重新部署生效：`npx wrangler deploy`

> 兼容说明：如果你暂时不想用 JWT，也可以只上传一个旧式 Key（`npx wrangler secret put QWEATHER_KEY`），代理会以转发模式工作——同一份代码，按你配置了哪组变量自动切换。

### B-5 博客端接入

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/corner-weather-card/dist/index.js"></script>

<corner-weather api-base="https://corner-weather-proxy.你的子域名.workers.dev" location="101010100"></corner-weather>
```

完成。此后无需再关心任何认证细节，Token 过期前代理会自动重签。

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
