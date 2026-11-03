# Cloudflare 部署

## 构建契约

- 仓库根目录安装依赖：`pnpm install --frozen-lockfile`
- 构建命令：`pnpm build`
- 静态产物：`public/`
- pnpm 版本由 `package.json#packageManager` 指定，Node 版本由 `.node-version` 指定，最低 Node 22
- 构建只消费仓库的 `content/`，不连接思源、不执行同步、不修改公开许可
- 不部署 `.local/`、预览批次、思源工作区或仓库根目录

## Cloudflare Pages

确认现有项目确为 Pages 后，在同一项目核对：

| 设置 | 值 |
| --- | --- |
| Git 仓库 | `mcthesw/sworld-blog` |
| 根目录 | 仓库根目录 |
| 构建命令 | `pnpm build` |
| 输出目录 | `public` |
| pnpm | `10.28.0`，必要时设 `PNPM_VERSION` |
| Node | 遵循 `.node-version`，必要时设 `NODE_VERSION` |

生产分支、预览分支允许列表、自定义域名和项目名称必须从 Cloudflare 现有项目核实，不能依据 Cloudflare 响应头推断。Pages 可能在推送非生产分支时自动生成公开预览，未公开笔记的隔离预览不能提交到 Git。

先确认首批文章及 URL、评论和资源，再安排切换生产构建设置。构建命令与输出目录必须配套修改，旧 VuePress 的 `docs/.vuepress/dist` 不再是本站产物。保留既有 `blog.sworld.club` 域名绑定，避免为构建迁移重建 DNS。

## Workers

如果实际托管项目是 Workers Static Assets，应依据该项目现有的 Wrangler 和构建设置接入 `public/`，不能直接套用 Pages 配置。本站未预置 Wrangler、账户 ID、项目 ID 或部署命令。

## 发布权限

本地导出完成不表示已上线。推送前须确认 Cloudflare 的自动部署范围；GitHub Actions 和 Cloudflare 手动部署、配置变更分别取得授权，不通过部署来探测配置。

参考：[Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[构建镜像](https://developers.cloudflare.com/pages/configuration/build-image/)、[Workers 静态资源](https://developers.cloudflare.com/workers/static-assets/)
