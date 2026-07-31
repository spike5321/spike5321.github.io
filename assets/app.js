/* ============================================================
   app.js —— 页面逻辑
   一般情况下你不需要改这个文件；要改内容请改 config.js 和 posts/。
   ============================================================ */
(function () {
  "use strict";

  var S = window.SITE || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  /* ---------- 主题色 ---------- */
  if (S.accent) document.documentElement.style.setProperty("--accent", S.accent);

  /* ---------- 深色 / 浅色 ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = $("#themeBtn");
    if (b) {
      b.textContent = t === "dark" ? "☀" : "☾";
      b.title = t === "dark" ? "切换到浅色" : "切换到深色";
    }
  }
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  applyTheme(saved || (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  /* ---------- 顶栏 / 页脚 ---------- */
  function buildChrome(page) {
    var nav = $("#nav");
    if (nav) {
      var items = [
        { href: "index.html", text: "文章", key: "home" },
        { href: "archive.html", text: "归档", key: "archive" },
        { href: "about.html", text: "关于", key: "about" }
      ];
      nav.innerHTML =
        '<div class="nav-inner">' +
        '<a class="nav-brand" href="index.html">' + esc(S.title || "我的网站") + "</a>" +
        '<div class="nav-links">' +
        items.map(function (it) {
          return '<a href="' + it.href + '"' + (it.key === page ? ' class="on"' : "") +
            ">" + it.text + "</a>";
        }).join("") +
        '<button class="theme-btn" id="themeBtn" type="button" aria-label="切换主题"></button>' +
        "</div></div>";
      $("#themeBtn").addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem("theme", next); } catch (e) {}
      });
      applyTheme(document.documentElement.getAttribute("data-theme"));
    }

    var foot = $("#foot");
    if (foot) {
      var y = new Date().getFullYear();
      var span = S.startYear && S.startYear < y ? S.startYear + "–" + y : y;
      foot.innerHTML = "<div>© " + span + " " + esc(S.author || "") + "</div>" +
        '<div class="sp">' + (S.links || []).map(function (l) {
          return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.name) + "</a>";
        }).join("") + "</div>";
    }
  }

  function esc(s) { return window.MD ? window.MD.escape(s == null ? "" : s) : String(s == null ? "" : s); }

  /* ---------- 数据 ---------- */
  function loadIndex() {
    return fetch("posts/index.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (list) {
        return list.slice().sort(function (a, b) {
          return (b.date || "").localeCompare(a.date || "");
        });
      });
  }

  function fileError(box) {
    box.innerHTML = '<div class="empty">读不到文章列表。<br><br>' +
      "如果你是直接双击 HTML 文件打开的，浏览器出于安全限制不允许读取本地文件。<br>" +
      "请改用项目里的 <b>本地预览.bat</b> 启动，或把网站部署到 GitHub Pages 后访问。</div>";
  }

  function fmtDate(d) {
    if (!d) return "";
    var p = d.split("-");
    return p.length === 3 ? p[0] + " 年 " + (+p[1]) + " 月 " + (+p[2]) + " 日" : d;
  }

  /* ============================================================
     阅读体验增强
     ============================================================ */

  // 预估阅读时长：中文按每分钟 450 字算
  function readTime(src) {
    var n = String(src).replace(/```[\s\S]*?```/g, "").length;
    return Math.max(1, Math.round(n / 450));
  }

  // 代码块一键复制 + 图片点击放大
  function enhance(root) {
    if (!root) return;

    root.querySelectorAll("pre.code").forEach(function (pre) {
      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "复制";
      btn.addEventListener("click", function () {
        var text = pre.querySelector("code").innerText;
        var done = function () {
          btn.textContent = "已复制";
          btn.classList.add("ok");
          setTimeout(function () { btn.textContent = "复制"; btn.classList.remove("ok"); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }
        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
      pre.appendChild(btn);
    });

    root.querySelectorAll("img").forEach(function (img) {
      img.classList.add("zoomable");
      img.addEventListener("click", function () { openLightbox(img.src, img.alt); });
    });
  }

  function openLightbox(src, alt) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = '<img src="' + src + '" alt="' + (alt || "") + '">' +
      (alt ? '<div class="lb-cap">' + esc(alt) + "</div>" : "");
    box.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() {
      box.remove();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    }
    document.body.appendChild(box);
    document.body.style.overflow = "hidden";
  }

  // 顶部阅读进度条
  function progressBar() {
    var bar = document.createElement("div");
    bar.className = "progress";
    document.body.appendChild(bar);
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // 回到顶部
  function backToTop() {
    var btn = document.createElement("button");
    btn.className = "totop";
    btn.type = "button";
    btn.title = "回到顶部";
    btn.setAttribute("aria-label", "回到顶部");
    btn.innerHTML = "↑";
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(btn);
    function toggle() { btn.classList.toggle("show", window.scrollY > 400); }
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
  }

  /* ============================================================
     首页
     ============================================================ */
  function initHome() {
    var box = $("#list"), tagbar = $("#tags"), search = $("#search"), pager = $("#pager");
    var hero = $("#hero");
    hero.innerHTML = "<h1>" + esc(S.author || S.title || "") + "</h1>" +
      "<p>" + esc(S.tagline || "") + "</p>" +
      '<div class="hero-links">' + (S.links || []).map(function (l) {
        return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.name) + "</a>";
      }).join("") + "</div>";

    var all = [], activeTag = "", q = "", page = 0;
    var size = S.pageSize || 10;

    loadIndex().then(function (list) {
      all = list.filter(function (p) { return !p.draft; });

      var tags = {};
      all.forEach(function (p) { (p.tags || []).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); });
      var names = Object.keys(tags).sort(function (a, b) { return tags[b] - tags[a]; });
      tagbar.innerHTML = '<button class="tag on" data-t="">全部</button>' +
        names.map(function (t) {
          return '<button class="tag" data-t="' + esc(t) + '">' + esc(t) + " " + tags[t] + "</button>";
        }).join("");
      tagbar.addEventListener("click", function (e) {
        var b = e.target.closest(".tag");
        if (!b) return;
        activeTag = b.getAttribute("data-t");
        page = 0;
        [].forEach.call(tagbar.children, function (c) { c.classList.toggle("on", c === b); });
        draw();
      });

      search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); page = 0; draw(); });
      draw();
    }).catch(function () { fileError(box); });

    function filtered() {
      return all.filter(function (p) {
        if (activeTag && (p.tags || []).indexOf(activeTag) < 0) return false;
        if (!q) return true;
        var hay = [p.title, p.summary, (p.tags || []).join(" ")].join(" ").toLowerCase();
        return hay.indexOf(q) >= 0;
      });
    }

    function draw() {
      var items = filtered();
      var total = Math.ceil(items.length / size);
      var shown = items.slice(page * size, page * size + size);

      box.innerHTML = shown.length ? shown.map(function (p) {
        return '<li class="post-item">' +
          '<h2><a href="post.html?p=' + encodeURIComponent(p.slug) + '">' + esc(p.title) + "</a></h2>" +
          '<div class="post-meta"><time>' + esc(fmtDate(p.date)) + "</time>" +
          (p.tags && p.tags.length ? '<span class="dot">·</span><span>' + esc(p.tags.join(" / ")) + "</span>" : "") +
          "</div>" +
          (p.summary ? '<p class="post-sum">' + esc(p.summary) + "</p>" : "") +
          "</li>";
      }).join("") : '<div class="empty">没有找到匹配的文章。</div>';

      pager.innerHTML = total > 1
        ? '<button id="prev"' + (page === 0 ? " disabled" : "") + ">← 上一页</button>" +
          '<button id="next"' + (page >= total - 1 ? " disabled" : "") + ">下一页 →</button>"
        : "";
      if (total > 1) {
        $("#prev").onclick = function () { page--; draw(); window.scrollTo(0, 0); };
        $("#next").onclick = function () { page++; draw(); window.scrollTo(0, 0); };
      }
    }
  }

  /* ============================================================
     文章页
     ============================================================ */
  function initPost() {
    var box = $("#article");
    var slug = new URLSearchParams(location.search).get("p");
    if (!slug) { box.innerHTML = '<div class="empty">没有指定文章。<a href="index.html">回到首页</a></div>'; return; }

    loadIndex().then(function (list) {
      var pub = list.filter(function (p) { return !p.draft; });
      var idx = pub.findIndex(function (p) { return p.slug === slug; });
      var meta = idx >= 0 ? pub[idx] : { title: slug, slug: slug };

      return fetch("posts/" + slug + ".md", { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("404");
        return r.text();
      }).then(function (src) {
        // 去掉正文开头重复的一级标题
        src = src.replace(/^\s*#\s+.*\n/, "");
        var res = window.MD.render(src);

        document.title = meta.title + " · " + (S.title || "");
        var d = document.querySelector('meta[name="description"]');
        if (d && meta.summary) d.setAttribute("content", meta.summary);

        // 同步 OG / Twitter 标签，方便分享时显示正确的标题/描述
        var pageUrl = "https://spike5321.github.io/post.html?p=" + encodeURIComponent(slug);
        var setMeta = function (sel, val) { var m = document.querySelector(sel); if (m && val) m.setAttribute("content", val); };
        setMeta('meta[property="og:title"]', meta.title);
        setMeta('meta[property="og:description"]', meta.summary || S.tagline || "");
        setMeta('meta[property="og:url"]', pageUrl);
        setMeta('meta[name="twitter:title"]', meta.title);
        setMeta('meta[name="twitter:description"]', meta.summary || S.tagline || "");

        var toc = res.headings.filter(function (h) { return h.level === 2 || h.level === 3; });
        var tocHtml = toc.length >= 3
          ? '<nav class="toc"><div class="toc-title">目录</div><ul>' + toc.map(function (h) {
              return '<li class="lv' + h.level + '"><a href="#' + h.id + '">' + esc(h.text) + "</a></li>";
            }).join("") + "</ul></nav>"
          : "";

        var prev = idx > 0 ? pub[idx - 1] : null;       // 更新的一篇
        var next = idx >= 0 && idx < pub.length - 1 ? pub[idx + 1] : null; // 更旧的一篇
        var nb = (prev || next) ? '<nav class="neighbors">' +
          (next ? '<a href="post.html?p=' + encodeURIComponent(next.slug) + '"><span class="lbl">← 上一篇</span>' + esc(next.title) + "</a>" : "<span></span>") +
          (prev ? '<a class="r" href="post.html?p=' + encodeURIComponent(prev.slug) + '"><span class="lbl">下一篇 →</span>' + esc(prev.title) + "</a>" : "<span></span>") +
          "</nav>" : "";

        box.innerHTML =
          '<h1 class="article-title">' + esc(meta.title) + "</h1>" +
          '<div class="article-meta"><time>' + esc(fmtDate(meta.date)) + "</time>" +
          (meta.tags && meta.tags.length ? "<span>" + esc(meta.tags.join(" / ")) + "</span>" : "") +
          "<span>约 " + readTime(src) + " 分钟读完</span>" +
          "</div>" + tocHtml +
          '<div class="prose">' + res.html + "</div>" + nb;

        enhance(box.querySelector(".prose"));
        progressBar();
      });
    }).catch(function () {
      box.innerHTML = '<div class="empty">这篇文章没找到，可能链接有误。<br><br><a href="index.html">回到首页</a><br><br>' +
        "（如果你是直接双击打开的 HTML 文件，请改用 <b>本地预览.bat</b>）</div>";
    });
  }

  /* ============================================================
     归档页
     ============================================================ */
  function initArchive() {
    var box = $("#archive");
    loadIndex().then(function (list) {
      var pub = list.filter(function (p) { return !p.draft; });
      if (!pub.length) { box.innerHTML = '<div class="empty">还没有文章。</div>'; return; }
      var years = {};
      pub.forEach(function (p) {
        var y = (p.date || "----").slice(0, 4);
        (years[y] = years[y] || []).push(p);
      });
      box.innerHTML = Object.keys(years).sort().reverse().map(function (y) {
        return '<h2 class="year">' + y + "<span style='font-size:14px;opacity:.6'> · " + years[y].length + " 篇</span></h2>" +
          '<ul class="arch-list">' + years[y].map(function (p) {
            return "<li><time>" + esc((p.date || "").slice(5)) + "</time>" +
              '<a href="post.html?p=' + encodeURIComponent(p.slug) + '">' + esc(p.title) + "</a></li>";
          }).join("") + "</ul>";
      }).join("");
    }).catch(function () { fileError(box); });
  }

  /* ============================================================
     关于页
     ============================================================ */
  function initAbout() {
    var head = $("#aboutHead"), body = $("#aboutBody");
    var initial = (S.author || "?").trim().charAt(0).toUpperCase();
    head.innerHTML =
      (S.avatar ? '<img class="avatar" src="' + esc(S.avatar) + '" alt="">' :
                  '<div class="avatar">' + esc(initial) + "</div>") +
      "<div><h1>" + esc(S.author || "") + "</h1><p>" + esc(S.role || S.tagline || "") + "</p></div>";

    fetch("pages/about.md", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(); return r.text(); })
      .then(function (src) { body.innerHTML = window.MD.render(src).html; enhance(body); })
      .catch(function () {
        body.innerHTML = "<p>" + esc(S.tagline || "") + "</p>" +
          '<p style="color:var(--text-faint);font-size:14px">（这段文字来自 pages/about.md，' +
          "直接双击打开 HTML 时读不到本地文件，用 本地预览.bat 启动即可正常显示。）</p>";
      });
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    buildChrome(page);
    backToTop();
    if (page === "home") initHome();
    else if (page === "post") initPost();
    else if (page === "archive") initArchive();
    else if (page === "about") initAbout();
  });
})();
