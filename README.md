# Paper2Note

论文阅读笔记与小红书文案工具，生产地址：https://paper2note.pages.dev/。

## AI 优化

前端调用同源 `POST /api/polish`，Cloudflare Pages Functions 使用服务端 `QWEN_API_KEY` 调用通义千问。密钥不进入前端产物。使用用户提供的免费模型池，按到期日优先调用；失败时切换下一个，跳过已到期模型。模型与到期日见 `functions/api/polish.js`。

在 Cloudflare 项目 `paper2note` 的生产环境配置 `QWEN_API_KEY` secret，再部署。未配置密钥时接口明确返回 503。支持标题、研究问题、方法、贡献等资料，输出标题、价值、核心要点和标签；不得依据标题编造研究结果。

## 验证与部署

```sh
npm ci
npm run lint
npm test
npm run build
npx wrangler pages deploy dist --project-name paper2note --branch main
```

本地完整 API 开发：在被 Git 忽略的 `.dev.vars` 中配置 `QWEN_API_KEY`，构建后运行 `npx wrangler pages dev dist`。`npm run dev` 只提供前端。

现有 GitHub Pages 镜像仅提供静态页面，不执行 Pages Functions；AI 功能使用上述 Cloudflare 生产站点。
