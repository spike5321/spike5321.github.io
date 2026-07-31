# 个人网站

零依赖静态博客：纯 HTML / CSS / JS + Markdown 文章，无需构建，可直接部署到 GitHub Pages。

## 快速开始

- **本地预览**：双击 `本地预览.bat`，浏览器会自动打开 `http://localhost:8000`
- **改站点信息**（名字、简介、社交链接、主题色）：编辑 `config.js`
- **发新文章**：打开 `http://localhost:8000/new-post.html` 填表单，自动生成 `.md` 和 `index.json`
- **手动发文章**：在 `posts/` 新建 `.md` 文件 → 在 `posts/index.json` 登记一条

## 目录

```
index.html      首页（文章列表 + 搜索 + 标签）
post.html       文章阅读页
archive.html    按年份归档
about.html      关于页（正文在 pages/about.md）
new-post.html   发文助手（填表单生成文章文件，不出现在导航里）
config.js       ★ 站点配置
posts/
  index.json    ★ 文章目录
  *.md          ★ 文章正文
pages/about.md  ★ 关于页内容
assets/         样式与脚本
images/         文章配图
```

带 ★ 的是日常需要改的文件，其余一般不用动。

## 部署

新建名为 `你的用户名.github.io` 的公开仓库 → 上传全部文件 → Settings → Pages → Source 选 `main` / `/(root)` → 访问 `https://你的用户名.github.io`。

详细步骤见随附的《个人网站使用说明》。
