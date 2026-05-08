# Degenerates Frontend

[degenerates.site](https://degenerates.site) 的前端 Monorepo，包含主页、游戏收藏管理、基金跟踪三个应用。

后端仓库：[degenerates-backend](https://github.com/catalyzer-dot/degenerates-backend)

## 应用

| 应用         | 路径             | 说明               |
| ------------ | ---------------- | ------------------ |
| Home         | `/`              | 门户主页           |
| Game Gallery | `/game-gallery/` | Steam 游戏收藏管理 |
| Fund Tracker | `/fund/`         | 基金持仓跟踪       |

## 开发

```bash
npm install

# 启动全部应用
npm run dev

# 单独启动
npm run dev:home          # localhost:5175
npm run dev:game          # localhost:5173
npm run dev:fund          # localhost:5174
```

## 构建

```bash
# 构建全部
npm run build

# 单独构建
npm run build:home
npm run build:game
npm run build:fund
```

## 备案信息

- ICP 备案号：桂ICP备2026002060号
- 公安备案号：桂公网安备45010502001153号
