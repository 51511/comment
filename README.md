# Blog留言系統
我的Blog採用的留言系統 (Giscus+CF方案)


# 須知
這個系統我沒有實作，郵件通知之類的功能，另外要管理留言要到CF後台
我幹麼用KV不用SQL？因為當時想法是把這留言系統當作「備用」並非主要，因此選擇簡單就好，如果你有大量留言需求，就不要用這個系統了

# Setup

## 1. Deploy the Worker

- Create a KV namespace and bind it as `BLOG_COMMENTS` in `wrangler.toml`.
- Set the following environment variables / secrets on the Worker:
  - `TURNSTILE_SECRET_KEY` — your Cloudflare Turnstile secret key
  - `ADMIN_SECRET` — a secret string used to authorize comment deletion
  - `ALLOWED_ORIGINS` — comma-separated list of allowed origins, e.g. `https://yourdomain.com,http://localhost:3000`
- Deploy `worker.js` with `wrangler deploy`.

## 2. Configure the frontend script

Edit the `CONFIG` object at the top of `comments.js`:

```js
const CONFIG = {
  apiUrl: "https://your-worker-subdomain.workers.dev",
  turnstileSiteKey: "YOUR_TURNSTILE_SITE_KEY",
  giscus: {
    repo: "your-github-username/your-repo",
    repoId: "YOUR_REPO_ID",
    category: "Q&A",
    categoryId: "YOUR_CATEGORY_ID"
  }
};
```

## 3. Add to your page

```html
<div id="comments"></div>
<script src="comments.js"></script>
```

## Deleting a comment

```
DELETE https://your-worker-subdomain.workers.dev?postId=/some/post&commentId=<id>
Authorization: <ADMIN_SECRET>
```

Deleting a comment also deletes all of its replies.


# 中文Setup

## 1. 部署 Worker

- 建立一個 KV namespace，並在 `wrangler.toml` 裡綁定成 `BLOG_COMMENTS`。
- 在 Worker 上設定以下環境變數 / secrets：
  - `TURNSTILE_SECRET_KEY` — 你的 Cloudflare Turnstile secret key
  - `ADMIN_SECRET` — 用來授權刪除留言的密鑰字串
  - `ALLOWED_ORIGINS` — 允許的來源網址，用逗號分隔，例如 `https://yourdomain.com,http://localhost:3000`
- 用 `wrangler deploy` 部署 `worker.js`。

## 2. 設定前端 script

編輯 `comments.js` 最上方的 `CONFIG` 物件：

```js
const CONFIG = {
  apiUrl: "https://your-worker-subdomain.workers.dev",
  turnstileSiteKey: "YOUR_TURNSTILE_SITE_KEY",
  giscus: {
    repo: "your-github-username/your-repo",
    repoId: "YOUR_REPO_ID",
    category: "Q&A",
    categoryId: "YOUR_CATEGORY_ID"
  }
};
```

## 3. 加入你的網頁

```html
<div id="comments"></div>
<script src="comments.js"></script>
```


