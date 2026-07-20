# CMS 内容后台

本项目已接入 **Decap CMS**。它是一个编辑界面，不保存文章到第三方数据库：登录后，文章、图片和文章目录仍会提交到你的 GitHub 仓库，因此可以继续部署到 GitHub Pages 或 EdgeOne Pages。

## 先完成一次 GitHub 授权配置

纯静态网站无法安全保存 GitHub 的密钥，因此 CMS 登录还需要一个 GitHub OAuth 代理。这是 Decap CMS 使用 GitHub 登录的必要部分，而不是博客页面本身的后端。

1. 将本站代码推送到 GitHub，并记下 `用户名/仓库名` 与默认分支名（通常为 `main`）。
2. 部署一个 Decap CMS GitHub OAuth 代理；可使用你自己部署的代理服务或可信的托管方案。它需要提供 `auth` 和 `callback` 两个地址，并保存 GitHub OAuth App 的 Client ID 与 Client Secret。
3. 在 GitHub 的 **Settings → Developer settings → OAuth Apps** 创建 OAuth App：
   - Homepage URL 填你的博客网址；
   - Authorization callback URL 填代理服务给出的 callback 地址。
4. 编辑 `admin/config.yml`，替换下面三个占位内容：
   - `repo`：当前已设为 `l3469352271-star/personal-blog`；
   - `base_url`：OAuth 代理域名，例如 `https://cms-auth.example.com`；
   - `site_url` 和 `display_url`：你的博客正式网址。
5. 将这些修改提交并部署。随后访问 `你的博客地址/admin/`，选择 GitHub 登录。

> 不要把 GitHub Client Secret、个人访问令牌或密码写进本仓库、`config.yml` 或网站页面。

## 用后台发布文章

登录 `/admin/` 后，按以下顺序操作：

1. 在“文章正文”中新建文章，填写标题、日期、摘要、标签和正文后发布。后台会生成 `content/posts/文章标识.md`。
2. 打开“文章目录 → 首页文章列表”，新增一项，并填写同一篇文章的资料。
   - “标识”与第一步的文件名一致；
   - “文件路径”填写 `content/posts/标识.md`；
   - 日期、标题、摘要和标签会显示在首页。
3. 发布文章目录。GitHub/EdgeOne 完成部署后，新文章就会显示在首页。

文章正文仍是 Markdown；CMS 写入的 YAML 文章信息不会显示在正文中。图片会上传到 `assets/uploads/`，在 Markdown 内会以相对路径插入，兼容 GitHub Pages 的仓库子路径。

## 为什么需要“文章目录”这一步

GitHub Pages 和 EdgeOne Pages 都是静态托管，浏览器无法安全地扫描服务器目录来发现新 Markdown 文件。因此首页需要一份可读取的文章目录，即 `content/posts.json`。这份目录已经在后台中做成可编辑表单，无需手写 JSON。

## 未配置 GitHub 登录时

`/admin/` 会显示配置或登录错误，这是预期行为。先完成上面的 GitHub OAuth 代理配置；网站前台和已有文章不受影响。
