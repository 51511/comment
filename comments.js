document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById("comments");
  if (!container) return;

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

  if (!document.getElementById('turnstile-script-tag')) {
    const tsScript = document.createElement('script');
    tsScript.id = 'turnstile-script-tag';
    tsScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    tsScript.async = true;
    tsScript.defer = true;
    document.head.appendChild(tsScript);
  }

  window.setCookie = function(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  };

  window.getCookie = function(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  container.innerHTML = `
  <style>
  .reply-form-box {
    background: #252525;
    border: 1px solid #3a3a3a;
    border-left: 3px solid #007bff;
    border-radius: 6px;
    padding: 12px;
    margin-top: 10px;
    animation: slideDown 0.2s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .reply-btn {
    background: none;
    border: 1px solid #444;
    color: #aaa;
    font-size: 0.78em;
    padding: 3px 10px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s;
    margin-top: 6px;
  }
  .reply-btn:hover {
    border-color: #007bff;
    color: #007bff;
  }
  .reply-item {
    background: #1a1a2e;
    border-left: 3px solid #334;
    border-radius: 0 6px 6px 0;
    padding: 10px 12px;
    margin-top: 8px;
  }
  .reply-item + .reply-item {
    margin-top: 6px;
  }
  .cancel-reply-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 0.8em;
    cursor: pointer;
    margin-left: 8px;
  }
  .cancel-reply-btn:hover { color: #ccc; }
  .reply-submit-btn {
    background: #005cc5;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    transition: background 0.2s;
  }
  .reply-submit-btn:hover { background: #0070e0; }
  .reply-submit-btn:disabled { background: #555; cursor: not-allowed; }
  </style>

  <div id="leaf-comment-box" style="max-width: 800px; margin: 20px auto; font-family: sans-serif; border-top: 2px solid #333; padding-top: 20px; color: #eee;">

  <div style="display: flex; gap: 10px; margin-bottom: 20px; justify-content: center;">
  <button id="btn-custom" data-system="custom" style="padding: 8px 16px; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.2s;">Custom Comments</button>
  <button id="btn-giscus" data-system="giscus" style="padding: 8px 16px; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.2s;">GitHub Discussions (Giscus)</button>
  </div>

  <div id="system-custom">
  <h3 style="color: #fff;">💬 Comments</h3>
  <div id="comments-list" style="margin-bottom: 30px;">
  <p style="color: #888;">Loading comments...</p>
  </div>

  <div style="background: #1e1e1e; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333;">
  <h4 style="margin-top: 0; color: #fff;">Post a Comment</h4>

  <div style="display: none;">
  <input type="text" id="bot-honeypot" name="prevent_bot_field_99" tabindex="-1" autocomplete="new-password">
  </div>

  <div style="margin-bottom: 10px;">
  <input type="text" id="comment-name" placeholder="Your name (max 50 chars)" maxlength="50" style="width: 100%; padding: 8px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px; box-sizing: border-box;">
  </div>

  <div style="margin-bottom: 10px; position: relative;">
  <textarea id="comment-text" rows="4" placeholder="Say something... (max 1000 chars)" maxlength="1000" style="width: 100%; padding: 8px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px; box-sizing: border-box;"></textarea>
  <div id="word-count" style="text-align: right; font-size: 0.8em; color: #888; margin-top: 5px;">0 / 1000</div>
  </div>

  <div style="margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px;">
  <div style="font-size: 0.9em; color: #ccc; display: flex; align-items: center; gap: 8px;">
  <input type="checkbox" id="no-hate-check" style="cursor: pointer; width: 16px; height: 16px;">
  <label for="no-hate-check" style="cursor: pointer; user-select: none;">I agree not to post hateful, discriminatory, or abusive content</label>
  </div>
  <div style="font-size: 0.9em; color: #ccc; display: flex; align-items: center; gap: 8px;">
  <input type="checkbox" id="second-check" style="cursor: pointer; width: 16px; height: 16px;">
  <label for="second-check" style="cursor: pointer; user-select: none;">I understand submitted comments cannot be edited afterwards</label>
  </div>
  </div>

  <div id="turnstile-main" style="margin-bottom: 12px;"></div>

  <button id="submit-btn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Submit</button>
  </div>

  <div style="margin-top: 25px; border-top: 1px dashed #444; padding-top: 15px; display: flex; align-items: center; gap: 10px;">
  <span style="font-size: 0.9em; color: #aaa; white-space: nowrap;">Share this post:</span>

  <div class="a2a_kit a2a_kit_size_32 a2a_default_style" style="display: flex; gap: 8px;">
  <a class="a2a_dd" href="https://www.addtoany.com/share"></a>
  <a class="a2a_button_facebook"></a>
  <a class="a2a_button_facebook_messenger"></a>
  <a class="a2a_button_line"></a>
  <a class="a2a_button_x"></a>
  <a class="a2a_button_email"></a>
  </div>
  </div>

  </div>

  <div id="system-giscus" style="display: none; width: 100%;"></div>
  `;

  if (window.getCookie("agreed_no_hate") === "true") {
    document.getElementById("no-hate-check").checked = true;
  }
  if (window.getCookie("agreed_second") === "true") {
    document.getElementById("second-check").checked = true;
  }
  const savedName = window.getCookie("comment_username");
  if (savedName) {
    document.getElementById("comment-name").value = savedName;
  }

  const API_URL = CONFIG.apiUrl;
  const POST_ID = window.location.pathname;

  let mainTurnstileWidgetId = null;
  const replyTurnstileWidgetIds = {};

  function renderMainTurnstile() {
    if (!window.turnstile) {
      setTimeout(renderMainTurnstile, 200);
      return;
    }
    if (mainTurnstileWidgetId !== null) return;
    mainTurnstileWidgetId = window.turnstile.render("#turnstile-main", {
      sitekey: CONFIG.turnstileSiteKey,
      theme: "dark"
    });
  }
  renderMainTurnstile();

  function renderReplyTurnstile(commentId) {
    if (!window.turnstile) {
      setTimeout(() => renderReplyTurnstile(commentId), 200);
      return;
    }
    const el = document.getElementById(`turnstile-reply-${commentId}`);
    if (!el || replyTurnstileWidgetIds[commentId] !== undefined) return;
    replyTurnstileWidgetIds[commentId] = window.turnstile.render(el, {
      sitekey: CONFIG.turnstileSiteKey,
      theme: "dark"
    });
  }

  window.saveHateSpeechConsent = function(isChecked) {
    if (isChecked) window.setCookie("agreed_no_hate", "true", 365);
    else window.setCookie("agreed_no_hate", "", -1);
  };

  window.saveSecondConsent = function(isChecked) {
    if (isChecked) window.setCookie("agreed_second", "true", 365);
    else window.setCookie("agreed_second", "", -1);
  };

  document.getElementById("no-hate-check").addEventListener("change", function() {
    window.saveHateSpeechConsent(this.checked);
  });
  document.getElementById("second-check").addEventListener("change", function() {
    window.saveSecondConsent(this.checked);
  });

  window.switchSystem = function(system) {
    const customDiv = document.getElementById("system-custom");
    const giscusDiv = document.getElementById("system-giscus");
    const btnCustom = document.getElementById("btn-custom");
    const btnGiscus = document.getElementById("btn-giscus");

    if (!customDiv || !giscusDiv || !btnCustom || !btnGiscus) return;

    if (system === 'custom') {
      customDiv.style.display = "block";
      giscusDiv.style.display = "none";
      btnCustom.style.background = "#007bff";
      btnCustom.style.color = "white";
      btnGiscus.style.background = "#333";
      btnGiscus.style.color = "#ccc";
    } else if (system === 'giscus') {
      customDiv.style.display = "none";
      giscusDiv.style.display = "block";
      btnCustom.style.background = "#333";
      btnCustom.style.color = "#ccc";
      btnGiscus.style.background = "#007bff";
      btnGiscus.style.color = "white";

      if (!window.giscusLoaded) {
        const script = document.createElement("script");
        script.src = "https://giscus.app/client.js";
        script.setAttribute("data-repo", CONFIG.giscus.repo);
        script.setAttribute("data-repo-id", CONFIG.giscus.repoId);
        script.setAttribute("data-category", CONFIG.giscus.category);
        script.setAttribute("data-category-id", CONFIG.giscus.categoryId);
        script.setAttribute("data-mapping", "pathname");
        script.setAttribute("data-strict", "0");
        script.setAttribute("data-reactions-enabled", "1");
        script.setAttribute("data-emit-metadata", "0");
        script.setAttribute("data-input-position", "bottom");
        script.setAttribute("data-theme", "dark");
        script.setAttribute("data-lang", "en");
        script.crossOrigin = "anonymous";
        script.async = true;
        script.onerror = function() {
          giscusDiv.innerHTML = '<p style="color:#ff6b6b;">Failed to load Giscus. Check console for details.</p>';
        };
        giscusDiv.appendChild(script);
        window.giscusLoaded = true;
      }
    }
  };

  document.getElementById("btn-custom").addEventListener("click", function() {
    window.switchSystem(this.dataset.system);
  });
  document.getElementById("btn-giscus").addEventListener("click", function() {
    window.switchSystem(this.dataset.system);
  });

  if (!document.getElementById('a2a-script-tag')) {
    const a2aScript = document.createElement('script');
    a2aScript.id = 'a2a-script-tag';
    a2aScript.src = "https://static.addtoany.com/menu/page.js";
    a2aScript.defer = true;
    document.body.appendChild(a2aScript);
  }

  window.updateWordCount = function() {
    const text = document.getElementById("comment-text").value;
    document.getElementById("word-count").innerText = `${text.length} / 1000`;
  };

  document.getElementById("comment-text").addEventListener("input", window.updateWordCount);

  window.escapeHtml = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  let activeReplyCommentId = null;

  window.toggleReplyForm = function(commentId, replyToName) {
    if (activeReplyCommentId === commentId) {
      closeReplyForm();
      return;
    }
    closeReplyForm();

    activeReplyCommentId = commentId;
    const container = document.getElementById(`replies-${commentId}`);
    if (!container) return;

    const savedName = window.getCookie("comment_username") || "";

    const formHtml = `
    <div class="reply-form-box" id="reply-form-${commentId}">
    <div style="font-size:0.82em; color:#7ab3ff; margin-bottom:8px;">↩ Reply to <strong>${window.escapeHtml(replyToName)}</strong>
    <button class="cancel-reply-btn" data-action="cancel-reply" data-comment-id="${commentId}">Cancel</button>
    </div>
    <div style="margin-bottom:8px;">
    <input type="text" id="reply-name-${commentId}" placeholder="Your name (max 50 chars)" maxlength="50"
    value="${window.escapeHtml(savedName)}"
    style="width:100%; padding:6px 8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:4px; box-sizing:border-box; font-size:0.88em;">
    </div>
    <div style="margin-bottom:8px; position:relative;">
    <textarea id="reply-text-${commentId}" rows="3" maxlength="1000"
    placeholder="Write a reply... (max 1000 chars)"
    data-reply-wc-target="reply-wc-${commentId}"
    style="width:100%; padding:6px 8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:4px; box-sizing:border-box; font-size:0.88em; resize:vertical;"></textarea>
    <div id="reply-wc-${commentId}" style="text-align:right; font-size:0.75em; color:#888;">0 / 1000</div>
    </div>
    <div id="turnstile-reply-${commentId}" style="margin-bottom:8px;"></div>
    <button class="reply-submit-btn" id="reply-submit-${commentId}"
    data-action="submit-reply" data-comment-id="${commentId}">Submit Reply</button>
    </div>
    `;
    container.insertAdjacentHTML('beforeend', formHtml);
    renderReplyTurnstile(commentId);

    const ta = document.getElementById(`reply-text-${commentId}`);
    if (ta) {
      ta.focus();
      ta.addEventListener("input", function() {
        const wc = document.getElementById(this.dataset.replyWcTarget);
        if (wc) wc.innerText = this.value.length + " / 1000";
      });
    }
  };

  function closeReplyForm() {
    if (activeReplyCommentId !== null) {
      const old = document.getElementById(`reply-form-${activeReplyCommentId}`);
      if (old) old.remove();
      delete replyTurnstileWidgetIds[activeReplyCommentId];
      activeReplyCommentId = null;
    }
  }

  window.submitReply = async function(parentId) {
    const nameInput = document.getElementById(`reply-name-${parentId}`);
    const textInput = document.getElementById(`reply-text-${parentId}`);
    const btn = document.getElementById(`reply-submit-${parentId}`);

    const name = nameInput.value.trim();
    const content = textInput.value.trim();

    if (!name || !content) {
      alert("Name and reply content are required.");
      return;
    }

    const noHateCheck = document.getElementById("no-hate-check");
    const secondCheck = document.getElementById("second-check");
    if (!noHateCheck.checked || !secondCheck.checked) {
      alert("Please agree to all the checkboxes below before submitting.");
      return;
    }

    const widgetId = replyTurnstileWidgetIds[parentId];

    if (widgetId === undefined || !window.turnstile) {
      alert("Verification widget is still loading, please try again shortly.");
      return;
    }

    const turnstileToken = window.turnstile.getResponse(widgetId);

    if (!turnstileToken) {
      alert("Please complete the verification challenge before submitting.");
      return;
    }

    btn.disabled = true;
    btn.innerText = "Submitting...";

    try {
      const res = await fetch(`${API_URL}?postId=${encodeURIComponent(POST_ID)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          content: content,
          parentId: String(parentId),
          honeypot: "",
          turnstileToken: turnstileToken
        })
      });

      if (res.ok) {
        window.setCookie("comment_username", name, 365);
        closeReplyForm();
        window.loadComments();
      } else if (res.status === 429) {
        alert("You're posting too frequently. Please wait 60 seconds and try again.");
        if (window.turnstile) window.turnstile.reset(widgetId);
      } else if (res.status === 403) {
        const errText = await res.text();
        alert("Verification failed, please try again. (" + errText + ")");
        if (window.turnstile) window.turnstile.reset(widgetId);
      } else {
        const errText = await res.text();
        alert("Submission failed, please check your input. (" + errText + ")");
        if (window.turnstile) window.turnstile.reset(widgetId);
      }
    } catch (err) {
      alert("An error occurred, please try again later.");
    } finally {
      btn.disabled = false;
      btn.innerText = "Submit Reply";
    }
  };

  window.loadComments = async function() {
    try {
      const res = await fetch(`${API_URL}?postId=${encodeURIComponent(POST_ID)}`);
      if (!res.ok) throw new Error("Failed to load");
      const comments = await res.json();

      const list = document.getElementById("comments-list");
      if (comments.length === 0) {
        list.innerHTML = '<p style="color: #888;">No comments yet. Be the first!</p>';
        return;
      }

      const topLevel = [];
      const repliesMap = {};

      comments.forEach(c => {
        if (c.parentId) {
          if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
          repliesMap[c.parentId].push(c);
        } else {
          topLevel.push(c);
        }
      });

      topLevel.sort((a, b) => new Date(b.date) - new Date(a.date));

      Object.keys(repliesMap).forEach(pid => {
        repliesMap[pid].sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      function renderComment(c, isReply = false) {
        const escapedName = window.escapeHtml(c.name);
        const escapedContent = window.escapeHtml(c.content);
        const dateStr = new Date(c.date).toLocaleString();
        const commentId = c.id;

        const childReplies = repliesMap[commentId] || [];
        const childHtml = childReplies.map(r => renderComment(r, true)).join("");

        if (isReply) {
          return `
          <div class="reply-item" id="comment-${commentId}">
          <strong style="color:#bdd4ff; font-size:0.9em;">${escapedName}</strong>
          <span style="font-size:0.75em; color:#666; margin-left:8px;">${dateStr}</span>
          <p style="margin:5px 0; line-height:1.5; color:#bbb; word-wrap:break-word; white-space:pre-wrap; font-size:0.9em;">${escapedContent}</p>
          <button class="reply-btn" data-action="toggle-reply" data-comment-id="${commentId}" data-reply-name="${escapedName}">↩ Reply</button>
          <div id="replies-${commentId}">${childHtml}</div>
          </div>
          `;
        }

        return `
        <div style="margin-bottom:18px; padding-bottom:12px; border-bottom:1px solid #2a2a2a;" id="comment-${commentId}">
        <strong style="color:#fff;">${escapedName}</strong>
        <span style="font-size:0.8em; color:#888; margin-left:10px;">${dateStr}</span>
        <p style="margin:5px 0; line-height:1.5; color:#ccc; word-wrap:break-word; white-space:pre-wrap;">${escapedContent}</p>
        <button class="reply-btn" data-action="toggle-reply" data-comment-id="${commentId}" data-reply-name="${escapedName}">↩ Reply</button>
        <div id="replies-${commentId}" style="margin-top:4px; padding-left:16px;">${childHtml}</div>
        </div>
        `;
      }

      list.innerHTML = topLevel.map(c => renderComment(c)).join("");

    } catch (err) {
      document.getElementById("comments-list").innerHTML = '<p style="color: #ff6b6b;">Failed to load comments. Check API configuration.</p>';
    }
  };

  document.getElementById("comments-list").addEventListener("click", function(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    const commentId = target.dataset.commentId;

    if (action === "toggle-reply") {
      window.toggleReplyForm(commentId, target.dataset.replyName || "");
    } else if (action === "cancel-reply") {
      window.toggleReplyForm(commentId, "");
    } else if (action === "submit-reply") {
      window.submitReply(commentId);
    }
  });

  window.submitComment = async function() {
    const nameInput = document.getElementById("comment-name");
    const contentInput = document.getElementById("comment-text");
    const honeypotInput = document.getElementById("bot-honeypot");
    const noHateCheck = document.getElementById("no-hate-check");
    const secondCheck = document.getElementById("second-check");
    const btn = document.getElementById("submit-btn");

    const name = nameInput.value.trim();
    const content = contentInput.value.trim();

    if (!name || !content) {
      alert("Name and content are required.");
      return;
    }

    if (!noHateCheck.checked || !secondCheck.checked) {
      alert("Please agree to all the statements before submitting.");
      return;
    }

    if (mainTurnstileWidgetId === null || !window.turnstile) {
      alert("Verification widget is still loading, please try again shortly.");
      return;
    }

    const turnstileToken = window.turnstile.getResponse(mainTurnstileWidgetId);

    if (!turnstileToken) {
      alert("Please complete the verification challenge before submitting.");
      return;
    }

    btn.disabled = true;
    btn.innerText = "Submitting...";
    btn.style.background = "#555";

    try {
      const res = await fetch(`${API_URL}?postId=${encodeURIComponent(POST_ID)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          content: content,
          honeypot: honeypotInput.value,
          turnstileToken: turnstileToken
        })
      });

      if (res.ok) {
        window.setCookie("comment_username", name, 365);
        contentInput.value = "";
        window.updateWordCount();
        window.loadComments();
        if (window.turnstile) window.turnstile.reset(mainTurnstileWidgetId);
      } else if (res.status === 429) {
        alert("You're posting too frequently. Please wait 60 seconds and try again.");
        if (window.turnstile) window.turnstile.reset(mainTurnstileWidgetId);
      } else if (res.status === 403) {
        const errText = await res.text();
        alert("Verification failed, please try again. (" + errText + ")");
        if (window.turnstile) window.turnstile.reset(mainTurnstileWidgetId);
      } else {
        const errText = await res.text();
        alert("Submission failed, please check your input. (" + errText + ")");
        if (window.turnstile) window.turnstile.reset(mainTurnstileWidgetId);
      }
    } catch (err) {
      alert("An error occurred, please try again later.");
    } finally {
      btn.disabled = false;
      btn.innerText = "Submit";
      btn.style.background = "#007bff";
    }
  };

  document.getElementById("submit-btn").addEventListener("click", window.submitComment);

  window.switchSystem('custom');
  window.loadComments();
});
