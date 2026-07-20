(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeUrl(value) {
    const url = String(value).trim();

    if (/^(javascript|vbscript|data):/i.test(url)) {
      return "#";
    }

    return url;
  }

  function parseInline(value) {
    const tokens = [];
    let output = escapeHtml(value);

    output = output.replace(/`([^`]+)`/g, function (_, code) {
      const token = "@@MD_TOKEN_" + tokens.length + "@@";
      tokens.push("<code>" + code + "</code>");
      return token;
    });

    output = output.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+&quot;([^&]*?)&quot;)?\)/g, function (_, alt, url, title) {
      const titleAttribute = title ? " title=\"" + title + "\"" : "";
      return "<img src=\"" + safeUrl(url) + "\" alt=\"" + alt + "\"" + titleAttribute + " loading=\"lazy\">";
    });

    output = output.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+&quot;([^&]*?)&quot;)?\)/g, function (_, label, url, title) {
      const titleAttribute = title ? " title=\"" + title + "\"" : "";
      return "<a href=\"" + safeUrl(url) + "\"" + titleAttribute + " target=\"_blank\" rel=\"noreferrer\">" + label + "</a>";
    });

    output = output
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");

    tokens.forEach(function (token, index) {
      output = output.replace("@@MD_TOKEN_" + index + "@@", token);
    });

    return output;
  }

  function isBlockStart(line) {
    return /^(?:\s*$|\s{0,3}#{1,6}\s+|\s{0,3}[-*_](?:\s*[-*_]){2,}\s*$|\s{0,3}>|\s{0,3}(?:[-*+]\s+|\d+\.\s+)|\s{0,3}```)/.test(line);
  }

  function renderBlocks(source) {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const html = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];

      if (/^\s*$/.test(line)) {
        index += 1;
        continue;
      }

      const fence = line.match(/^\s{0,3}```\s*([\w-]*)\s*$/);
      if (fence) {
        const codeLines = [];
        index += 1;
        while (index < lines.length && !/^\s{0,3}```\s*$/.test(lines[index])) {
          codeLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) {
          index += 1;
        }
        const language = fence[1].replace(/[^\w-]/g, "");
        const className = language ? " class=\"language-" + language + "\"" : "";
        html.push("<pre><code" + className + ">" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
        continue;
      }

      const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (heading) {
        const level = heading[1].length;
        html.push("<h" + level + ">" + parseInline(heading[2]) + "</h" + level + ">");
        index += 1;
        continue;
      }

      if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
        html.push("<hr>");
        index += 1;
        continue;
      }

      if (/^\s{0,3}>/.test(line)) {
        const quoteLines = [];
        while (index < lines.length && /^\s{0,3}>/.test(lines[index])) {
          quoteLines.push(lines[index].replace(/^\s{0,3}>\s?/, ""));
          index += 1;
        }
        html.push("<blockquote>" + renderBlocks(quoteLines.join("\n")) + "</blockquote>");
        continue;
      }

      const unordered = line.match(/^\s{0,3}[-*+]\s+(.+)$/);
      if (unordered) {
        const items = [];
        while (index < lines.length) {
          const item = lines[index].match(/^\s{0,3}[-*+]\s+(.+)$/);
          if (!item) {
            break;
          }
          items.push("<li>" + parseInline(item[1]) + "</li>");
          index += 1;
        }
        html.push("<ul>" + items.join("") + "</ul>");
        continue;
      }

      const ordered = line.match(/^\s{0,3}\d+\.\s+(.+)$/);
      if (ordered) {
        const items = [];
        while (index < lines.length) {
          const item = lines[index].match(/^\s{0,3}\d+\.\s+(.+)$/);
          if (!item) {
            break;
          }
          items.push("<li>" + parseInline(item[1]) + "</li>");
          index += 1;
        }
        html.push("<ol>" + items.join("") + "</ol>");
        continue;
      }

      const paragraphLines = [line];
      index += 1;
      while (index < lines.length && !isBlockStart(lines[index])) {
        paragraphLines.push(lines[index]);
        index += 1;
      }
      html.push("<p>" + parseInline(paragraphLines.join("\n")).replace(/\n/g, "<br>") + "</p>");
    }

    return html.join("\n");
  }

  window.renderMarkdown = function (source) {
    const content = String(source || "").replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, "");
    return renderBlocks(content);
  };
})();
