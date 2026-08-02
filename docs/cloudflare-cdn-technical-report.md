# 摄影站图片 CDN 切换技术报告

日期：2026-08-02

## 1. 目标与范围

摄影原始文件继续由 `jyxu0621/gallery-photos` 管理，PicGo 和摄影站后台的上传、删除流程不变。Cloudflare Pages 项目 `gallery-images` 镜像 `photos/` 目录，并通过 `cdn.51shang.top` 对外提供图片。

本次修复只处理摄影站的图片 URL 生成，不处理博客图片，也不改变 `/gallery/` 站点路径。

## 2. 线上审计结果

对 `https://jyxu0621.github.io/gallery/` 中内嵌的 manifest 做了逐项统计：

| 字段 | 数量 | 结果 |
| --- | ---: | --- |
| `originalUrl` | 109 | 109 条均为 `https://cdn.51shang.top/photos/...` |
| `thumbnailUrl` | 109 | 109 条仍为 `/gallery/thumbnails/...` |
| manifest 图片记录 | 109 | 与 GitHub 源仓库的 109 个图片路径一致 |

因此，上一版只切换了原图链接。首页网格、列表和查看器优先使用 `thumbnailUrl`，浏览器实际仍会向 `jyxu0621.github.io` 请求缩略图，这就是用户看到 GitHub Pages 链接的原因。

## 3. 根因

`apps/web/base-path.ts` 的 `rewriteManifestUrls()` 只负责把本地根路径加上 GitHub Pages 的 `/gallery/` 前缀：

```text
/thumbnails/photo.jpg
        -> /gallery/thumbnails/photo.jpg
```

它没有识别 manifest 中已有的 `s3Key`，也没有把本地缩略图路径映射到 Cloudflare 镜像。与此同时，Cloudflare Pages 镜像项目只镜像 `gallery-photos/photos/`，并没有 `/thumbnails/` 目录，所以不能继续依赖站点自身的缩略图路径。

## 4. 修复内容

### 4.1 统一 CDN URL 生成

新增 `GALLERY_IMAGE_CDN = https://cdn.51shang.top/photos`。manifest 中的照片如果有 `s3Key`，且 URL 不是已经存在的远程 URL，则使用 `s3Key` 生成 CDN URL：

```text
旅行/Xiaomi 13.jpg
        -> https://cdn.51shang.top/photos/%E6%97%85%E8%A1%8C/Xiaomi%2013.jpg
```

每个路径段单独执行 URL 编码，兼容中文、空格、括号和子目录。

### 4.2 保留兼容回退

没有 `s3Key` 的历史记录仍使用原有 `withBasePath()` 逻辑；已经是 `http(s)` 或协议相对 URL 的远程地址不会被重写。

### 4.3 缩略图取舍

当前 Cloudflare 镜像只保存原始照片，因此缩略图 URL 复用对应的 CDN 原图 URL。这样可以确保所有图片请求都脱离 GitHub Pages，并保持 PicGo 与后台流程不变。后续如需降低网格流量，可在 Cloudflare Image Transformations 或 Pages 构建阶段增加真正的缩略图资产，再将同一重写函数切换到缩略图路径。

## 5. 验证方案

代码层面：

- `apps/web/base-path.test.ts` 新增中文子目录、空格和 `s3Key` 映射测试。
- `pnpm exec tsx --test apps/web/base-path.test.ts`：5/5 通过。
- `pnpm --filter @afilmory/web type-check`：通过。

生产层面：

1. GitHub Actions 完成摄影站构建后，重新抓取 `/gallery/` 页面。
2. 统计 `originalUrl` 和 `thumbnailUrl`，两者都应为 `cdn.51shang.top` 绝对 URL。
3. 对全部 109 个图片 URL 发起 HEAD 请求，要求 HTTP 200。
4. 对旧的 `/gallery/thumbnails/...` 路径不再出现在 manifest 中进行断言。

## 6. 日常链路

```text
PicGo 上传
    -> GitHub gallery-photos/photos/
    -> Cloudflare Pages 自动构建镜像
    -> 摄影站构建生成 CDN manifest
    -> 浏览器从 cdn.51shang.top 加载原图
```

Cloudflare Pages 的构建监视路径为 `photos/*`，因此新增、删除或替换照片都会触发镜像部署。摄影站构建失败时，GitHub 源文件不会丢失，需先查看 Actions 日志再重试。

## 7. 回滚

若需要回滚，只需回滚本次源码提交并重新运行摄影站 Actions；`gallery-photos` 中的照片和 Cloudflare Pages 项目配置无需回退。
