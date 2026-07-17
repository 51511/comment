export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);

    let allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "";

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");

    if (!postId) return new Response("Missing postId", { status: 400, headers: corsHeaders });

    if (request.method === "GET") {
      const comments = await env.BLOG_COMMENTS.get(postId) || "[]";
      return new Response(comments, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (request.method === "POST") {
      const newComment = await request.json();

      if (newComment.honeypot) {
        return new Response("Comment posted!", { headers: corsHeaders });
      }

      const turnstileToken = newComment.turnstileToken || "";
      if (!turnstileToken) {
        return new Response("Missing verification token", { status: 403, headers: corsHeaders });
      }

      const clientIp = request.headers.get("CF-Connecting-IP");

      const verifyBody = new URLSearchParams();
      verifyBody.append("secret", env.TURNSTILE_SECRET_KEY || "");
      verifyBody.append("response", turnstileToken);
      if (clientIp) verifyBody.append("remoteip", clientIp);

      let verifyResult;
      try {
        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: verifyBody.toString(),
        });
        verifyResult = await verifyRes.json();
      } catch (err) {
        return new Response("Verification service unavailable, please try again later", { status: 502, headers: corsHeaders });
      }

      if (!verifyResult.success) {
        return new Response("Verification failed", { status: 403, headers: corsHeaders });
      }

      const name = (newComment.name || "").trim();
      const content = (newComment.content || "").trim();
      if (!name || name.length > 50) return new Response("Invalid name", { status: 400, headers: corsHeaders });
      if (!content || content.length > 1000) return new Response("Invalid content", { status: 400, headers: corsHeaders });

      let existingComments = JSON.parse(await env.BLOG_COMMENTS.get(postId) || "[]");

      let parentId = null;
      if (newComment.parentId) {
        const raw = String(newComment.parentId).trim();
        if (raw.length > 36) {
          return new Response("Invalid parentId", { status: 400, headers: corsHeaders });
        }
        const parentExists = existingComments.some(c => c.id === raw);
        if (!parentExists) {
          return new Response("Parent comment not found", { status: 404, headers: corsHeaders });
        }
        parentId = raw;
      }

      const finalComment = {
        id: crypto.randomUUID(),
        name: name,
        content: content,
        date: new Date().toISOString(),
        ...(parentId ? { parentId } : {})
      };

      existingComments.push(finalComment);
      await env.BLOG_COMMENTS.put(postId, JSON.stringify(existingComments));

      return new Response("Comment posted!", { headers: corsHeaders });
    }

    if (request.method === "DELETE") {
      const commentId = url.searchParams.get("commentId");

      const ADMIN_SECRET = env.ADMIN_SECRET;
      const authHeader = request.headers.get("Authorization");

      if (!ADMIN_SECRET || authHeader !== ADMIN_SECRET) {
        return new Response("Unauthorized", { status: 403, headers: corsHeaders });
      }

      let existingComments = JSON.parse(await env.BLOG_COMMENTS.get(postId) || "[]");

      const targetExists = existingComments.some(c => c.id === commentId);
      if (!targetExists) {
        return new Response("Comment not found", { status: 404, headers: corsHeaders });
      }

      function collectDescendants(parentId, allComments) {
        const toDelete = new Set([parentId]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const c of allComments) {
            if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
              toDelete.add(c.id);
              changed = true;
            }
          }
        }
        return toDelete;
      }

      const idsToDelete = collectDescendants(commentId, existingComments);
      const newComments = existingComments.filter(c => !idsToDelete.has(c.id));

      await env.BLOG_COMMENTS.put(postId, JSON.stringify(newComments));
      return new Response("Deleted successfully", { headers: corsHeaders });
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
};
