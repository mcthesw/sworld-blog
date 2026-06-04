# Privacy Guard 提交前检查

这个仓库通过 `simple-git-hooks` 在 `pre-commit` 阶段执行：

```bash
pnpm exec tsc -p scripts/tsconfig.json
node .local/scripts/privacy-guard.js --staged
```

它只检查当前已暂存（staged）的文件，默认拦截以下风险：

- 常见密钥与私钥片段，例如 GitHub token、OpenAI key、AWS Access Key、私钥块、JWT、带凭据的 URL
- 非白名单邮箱
- 泄露本机用户名的本地路径，例如 `C:\Users\真实用户名\...` <!-- privacy-ignore -->
- 带 GPS 信息的图片元数据
- 高风险文件类型，例如 `.pem`、`.key`、`.p12`、`.pfx`、`.env*`、`.kdbx`、`.ovpn`

## 配置文件

根目录的 `privacy-guard.config.json` 是唯一配置源：

- `allowedEmails`：允许公开提交的完整邮箱地址
- `allowedEmailDomains`：允许公开提交的邮箱域名
- `ignoredPathPrefixes`：跳过检查的路径前缀
- `textFileExtensions`：按文本方式扫描的扩展名
- `imageFileExtensions`：检查 EXIF/XMP GPS 的图片扩展名
- `blockedFileExtensions` / `blockedFileNames`：直接阻止提交的高风险文件

## 审查结论的使用建议

当前策略默认只放行 GitHub `users.noreply.github.com` 与保留示例域名。

如果你**明确要公开**某个邮箱，请把它加到 `allowedEmails`；否则保持默认，让 hook 阻止它进入 Git 历史。

## 行级抑制

在行尾添加 `privacy-ignore`（不区分大小写）即可跳过该行的所有检查，适用于文档示例：

- Markdown / HTML：`<!-- privacy-ignore -->`
- JS / TS / Vue：`// privacy-ignore`

## 手动运行

全仓审查：

```bash
pnpm exec tsc -p scripts/tsconfig.json
node .local/scripts/privacy-guard.js --all
```

按文件试跑：

```bash
pnpm exec tsc -p scripts/tsconfig.json
node .local/scripts/privacy-guard.js --files path/to/file
```
