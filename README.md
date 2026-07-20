# 个人博客

这是一个不需要构建工具的静态博客。页面使用原生 HTML、CSS 和 JavaScript，文章使用 Markdown 文件保存。

## 本地预览

不要直接双击 `index.html`，因为浏览器会限制 `fetch` 读取 Markdown 文件。可以在项目根目录启动任意静态服务器，例如：

```bash
python -m http.server 8000
```

然后打开 `http://localhost:8000/`。

## 添加文章

1. 在 `content/posts/` 中新建一个 `.md` 文件。
2. 在 `js/config.js` 的 `posts` 数组中增加文章配置。
3. 确保 `slug` 唯一，并且 `file` 路径与文件位置一致。
4. 提交并重新部署网站。

文章配置示例：

```js
{
  slug: "new-post",
  title: "一篇新的文章",
  date: "2026-07-21",
  summary: "文章摘要会显示在首页卡片中。",
  tags: ["技术"],
  readingTime: "5 分钟",
  file: "content/posts/new-post.md"
}
```

Markdown 支持标题、段落、粗体、斜体、链接、图片、列表、引用、分隔线、行内代码和代码块。

## 修改个人信息

编辑 `js/config.js` 顶部的 `site` 配置即可修改：

- `title`：网站名称；
- `description`：网站简介；
- `author`：作者名称；
- `avatar`：头像地址，可留空使用文字头像；
- `links`：社交账号或邮箱链接。

关于页正文位于 `content/about.md`。

## 部署到 GitHub Pages

1. 将项目推送到 GitHub 仓库。
2. 打开仓库的 `Settings → Pages`。
3. 在构建来源中选择 `Deploy from a branch`。
4. 选择文章所在分支和根目录 `/`。
5. 保存后等待 GitHub Pages 完成发布。

网站使用相对路径和哈希路由，因此可以直接部署到仓库子路径。

## 部署到 EdgeOne Pages

1. 在 EdgeOne Pages 中导入 GitHub 仓库，或上传项目文件。
2. 构建命令留空。
3. 输出目录填写项目根目录，或使用平台的静态文件根目录设置。
4. 完成部署后访问生成的站点地址。

## 路由

- `#/`：文章列表；
- `#/post/<slug>`：文章详情；
- `#/about`：关于页面。
