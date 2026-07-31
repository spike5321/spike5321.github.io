/* ============================================================
   markdown.js —— 轻量 Markdown 渲染器（自带，无任何外部依赖）
   支持：标题 / 段落 / 粗体斜体删除线 / 行内代码 / 链接 / 图片 /
        有序无序列表（可嵌套）/ 引用 / 围栏代码块（含语法高亮）/
        表格 / 分割线 / 任务列表
   ------------------------------------------------------------
   一般情况下你不需要改这个文件。
   ============================================================ */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- 语法高亮 ---------- */
  var GRAMMAR = {
    js: {
      kw: /\b(?:const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|null|undefined|true|false|this|switch|case|break|continue|do|delete|yield)\b/,
      cmt: /\/\/[^\n]*|\/\*[\s\S]*?\*\//,
      str: /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/
    },
    py: {
      kw: /\b(?:def|class|return|if|elif|else|for|while|in|not|and|or|import|from|as|with|try|except|finally|raise|lambda|None|True|False|self|pass|break|continue|yield|global|assert|async|await)\b/,
      cmt: /#[^\n]*/,
      str: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/
    },
    css: {
      kw: /@[a-z-]+|\b(?:important)\b/,
      cmt: /\/\*[\s\S]*?\*\//,
      str: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/
    },
    html: {
      kw: /<\/?[a-zA-Z][\w-]*|\/?>/,
      cmt: /&lt;!--[\s\S]*?--&gt;/,
      str: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/
    },
    bash: {
      kw: /\b(?:if|then|fi|else|for|do|done|while|case|esac|function|echo|cd|ls|mkdir|rm|cp|mv|git|npm|python|pip|sudo|export|source)\b/,
      cmt: /#[^\n]*/,
      str: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/
    },
    json: {
      kw: /\b(?:true|false|null)\b/,
      cmt: /(?!)/,
      str: /"(?:\\.|[^"\\])*"/
    }
  };
  var ALIAS = {
    javascript: "js", jsx: "js", ts: "js", typescript: "js", node: "js",
    python: "py", py3: "py", sh: "bash", shell: "bash", zsh: "bash",
    console: "bash", xml: "html", vue: "html", scss: "css", less: "css"
  };

  function highlight(code, lang) {
    var g = GRAMMAR[ALIAS[lang] || lang];
    if (!g) return esc(code);
    var master = new RegExp(
      "(" + g.cmt.source + ")|(" + g.str.source + ")|(" + g.kw.source +
      ")|(\\b\\d+(?:\\.\\d+)?\\b)", "g"
    );
    var out = "", last = 0, m;
    while ((m = master.exec(code)) !== null) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : "n";
      out += '<span class="tok-' + cls + '">' + esc(m[0]) + "</span>";
      last = m.index + m[0].length;
      if (m[0].length === 0) master.lastIndex++;
    }
    return out + esc(code.slice(last));
  }

  /* ---------- 行内元素 ---------- */
  function inline(text) {
    var codes = [];
    var s = esc(text);

    s = s.replace(/`([^`\n]+)`/g, function (_, c) {
      codes.push(c);
      return "\u0000C" + (codes.length - 1) + "\u0000";
    });

    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
      function (_, alt, url, title) {
        return '<img src="' + url + '" alt="' + alt + '"' +
          (title ? ' title="' + title + '"' : "") + ' loading="lazy">';
      });

    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
      function (_, txt, url, title) {
        var ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : "";
        return '<a href="' + url + '"' + (title ? ' title="' + title + '"' : "") +
          ext + ">" + txt + "</a>";
      });

    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener">$2</a>');

    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
    s = s.replace(/ {2,}$/g, "<br>");

    s = s.replace(/\u0000C(\d+)\u0000/g, function (_, i) {
      return "<code>" + codes[+i] + "</code>";
    });
    return s;
  }

  function slugify(str) {
    return String(str).trim().toLowerCase()
      .replace(/[\s]+/g, "-")
      .replace(/[^\w\u4e00-\u9fa5-]/g, "")
      .replace(/-+/g, "-") || "section";
  }

  /* ---------- 列表（支持嵌套） ---------- */
  function parseList(lines, i, indent, out) {
    var first = lines[i];
    var ordered = /^\s*\d+[.)]\s/.test(first);
    out.push(ordered ? "<ol>" : "<ul>");
    while (i < lines.length) {
      var line = lines[i];
      var m = line.match(/^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/);
      if (!m) break;
      var ind = m[1].replace(/\t/g, "    ").length;
      if (ind < indent) break;
      if (ind > indent) {
        var sub = [];
        i = parseList(lines, i, ind, sub);
        out[out.length - 1] = out[out.length - 1].replace(/<\/li>$/, "") +
          sub.join("") + "</li>";
        continue;
      }
      var body = m[2];
      var task = body.match(/^\[([ xX])\]\s+(.*)$/);
      if (task) {
        out.push('<li class="task"><input type="checkbox" disabled' +
          (task[1] === " " ? "" : " checked") + "> " + inline(task[2]) + "</li>");
      } else {
        out.push("<li>" + inline(body) + "</li>");
      }
      i++;
    }
    out.push(ordered ? "</ol>" : "</ul>");
    return i;
  }

  /* ---------- 主解析 ---------- */
  function render(src, opts) {
    opts = opts || {};
    var headings = [];
    var lines = String(src).replace(/\r\n?/g, "\n").split("\n");
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      // 围栏代码块
      var fence = line.match(/^\s*```+\s*([\w+-]*)\s*$/);
      if (fence) {
        var lang = (fence[1] || "").toLowerCase();
        var buf = [];
        i++;
        while (i < lines.length && !/^\s*```+\s*$/.test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push('<pre class="code"' + (lang ? ' data-lang="' + esc(lang) + '"' : "") +
          "><code>" + highlight(buf.join("\n"), lang) + "</code></pre>");
        continue;
      }

      // 标题
      var h = line.match(/^(#{1,6})\s+(.*?)\s*#*$/);
      if (h) {
        var lvl = h[1].length, txt = h[2];
        var id = slugify(txt);
        headings.push({ level: lvl, text: txt, id: id });
        out.push("<h" + lvl + ' id="' + id + '">' + inline(txt) + "</h" + lvl + ">");
        i++;
        continue;
      }

      // 分割线
      if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) { out.push("<hr>"); i++; continue; }

      // 引用
      if (/^\s*>/.test(line)) {
        var q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) {
          q.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        out.push("<blockquote>" + render(q.join("\n")).html + "</blockquote>");
        continue;
      }

      // 表格
      if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        var cells = function (r) {
          return r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(function (c) { return c.trim(); });
        };
        var head = cells(line);
        var align = cells(lines[i + 1]).map(function (c) {
          if (/^:.*:$/.test(c)) return "center";
          if (/:$/.test(c)) return "right";
          return "left";
        });
        i += 2;
        var rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) rows.push(cells(lines[i++]));
        var t = "<div class='table-wrap'><table><thead><tr>";
        head.forEach(function (c, n) {
          t += '<th style="text-align:' + (align[n] || "left") + '">' + inline(c) + "</th>";
        });
        t += "</tr></thead><tbody>";
        rows.forEach(function (r) {
          t += "<tr>";
          r.forEach(function (c, n) {
            t += '<td style="text-align:' + (align[n] || "left") + '">' + inline(c) + "</td>";
          });
          t += "</tr>";
        });
        out.push(t + "</tbody></table></div>");
        continue;
      }

      // 列表
      if (/^(\s*)(?:[-*+]|\d+[.)])\s+/.test(line)) {
        var ind0 = (line.match(/^(\s*)/)[1] || "").replace(/\t/g, "    ").length;
        var lo = [];
        i = parseList(lines, i, ind0, lo);
        out.push(lo.join(""));
        continue;
      }

      // 段落
      var p = [];
      while (i < lines.length && lines[i].trim() &&
             !/^\s*```/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) &&
             !/^\s*>/.test(lines[i]) &&
             !/^(\s*)(?:[-*+]|\d+[.)])\s+/.test(lines[i]) &&
             !/^\s*([-*_])\s*(\1\s*){2,}$/.test(lines[i])) {
        p.push(lines[i++]);
      }
      if (p.length) out.push("<p>" + inline(p.join("\n")) + "</p>");
      else i++;
    }

    return { html: out.join("\n"), headings: headings };
  }

  global.MD = { render: render, escape: esc, slugify: slugify };
})(window);
