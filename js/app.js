(function () {
  "use strict";

  const config = window.blogConfig;
  const app = document.querySelector("#app");
  const searchInput = document.querySelector("#searchInput");
  let currentSearch = "";
  let renderVersion = 0;
  let posts = Array.isArray(config.posts) ? config.posts : [];

  function site() {
    return config.site || {};
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initials(value) {
    return String(value || "博").trim().slice(0, 1) || "博";
  }

  function formatDate(value) {
    const date = new Date(String(value) + "T00:00:00");
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date).replace(/\//g, "-");
  }

  function readingTime(post) {
    return post.readingTime || "约 3 分钟";
  }

  function allPosts() {
    return [...posts].sort(function (first, second) {
      return String(second.date).localeCompare(String(first.date));
    });
  }

  async function loadPosts() {
    if (!config.postsFile) {
      return;
    }

    try {
      const response = await fetch(config.postsFile, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("文章目录加载失败");
      }
      const data = await response.json();
      if (!Array.isArray(data.posts)) {
        throw new Error("文章目录格式无效");
      }
      posts = data.posts.filter(function (post) {
        return post && post.slug && post.title && post.date && post.file;
      });
    } catch (error) {
      console.warn("无法加载文章目录，将使用备用文章配置。", error);
    }
  }

  function allTags() {
    const tags = new Set();
    allPosts().forEach(function (post) {
      (post.tags || []).forEach(function (tag) {
        tags.add(tag);
      });
    });
    return [...tags];
  }

  function setSiteChrome() {
    const currentSite = site();
    const title = currentSite.title || "个人博客";
    const description = currentSite.description || "记录技术、生活与思考";
    const author = currentSite.author || "你的名字";

    document.querySelectorAll("[data-site-title]").forEach(function (element) {
      element.textContent = title;
    });
    document.querySelectorAll("[data-site-description]").forEach(function (element) {
      element.textContent = description;
    });
    document.querySelectorAll("[data-site-author]").forEach(function (element) {
      element.textContent = author;
    });
    document.querySelector("[data-brand-mark]").textContent = initials(title);
    document.querySelector("[data-current-year]").textContent = String(new Date().getFullYear());
    document.querySelector("meta[name=description]").setAttribute("content", description);
  }

  function updateActiveNav(route) {
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      const isHome = link.dataset.nav === "home" && (route === "/" || route.startsWith("/post/") || route.startsWith("/article/"));
      const isAbout = link.dataset.nav === "about" && route === "/about";
      link.classList.toggle("active", isHome || isAbout);
    });
  }

  function parseRoute() {
    const hash = decodeURIComponent(location.hash.replace(/^#/, "") || "/");
    const parts = hash.split("?");
    const path = parts[0] || "/";
    const params = new URLSearchParams(parts[1] || "");

    if (path === "/about") {
      return { name: "about", path: path };
    }
    if (path.startsWith("/post/") || path.startsWith("/article/")) {
      return { name: "article", path: path, slug: path.split("/").slice(2).join("/") };
    }
    return { name: "home", path: "/", tag: params.get("tag") || "" };
  }

  function showLoading() {
    app.innerHTML = '<div class="loading" role="status"><span class="loading-bar"></span>正在加载内容...</div>';
  }

  function showError(message) {
    app.innerHTML = '<div class="container container--narrow"><div class="not-found"><h1 class="not-found-title">暂时无法打开</h1><p class="not-found-text">' + escapeHtml(message) + '</p><a href="#/" class="back-link">← 返回首页</a></div></div>';
  }

  function renderSidebar(selectedTag) {
    const currentSite = site();
    const posts = allPosts();
    const tags = allTags();
    const links = (currentSite.links || []).map(function (link) {
      return '<a class="social-btn" href="' + escapeHtml(link.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(link.label) + '</a>';
    }).join("");
    const tagLinks = tags.map(function (tag) {
      const active = tag === selectedTag ? " is-selected" : "";
      return '<a class="tag" href="#/?tag=' + encodeURIComponent(tag) + '"' + (active ? ' aria-current="true"' : "") + '>#' + escapeHtml(tag) + '</a>';
    }).join("");

    return '<aside class="sidebar"><section class="sidebar-card author-card"><div class="author-avatar">' + (currentSite.avatar ? '<img src="' + escapeHtml(currentSite.avatar) + '" alt="' + escapeHtml(currentSite.author) + '">' : escapeHtml(initials(currentSite.author))) + '</div><h2 class="author-name">' + escapeHtml(currentSite.author || "你的名字") + '</h2><p class="author-title">个人博客作者</p><p class="author-bio">' + escapeHtml(currentSite.description || "记录技术、生活与思考") + '</p><div class="author-stats"><div><span>文章</span><strong>' + posts.length + '</strong></div><div><span>标签</span><strong>' + tags.length + '</strong></div><div><span>更新</span><strong>' + (posts[0] ? formatDate(posts[0].date).slice(5) : "--") + '</strong></div></div><div class="author-socials">' + links + '</div></section><section class="sidebar-card"><h2 class="sidebar-card-title"><span class="title-bar"></span>文章标签</h2><div class="tag-cloud">' + tagLinks + '</div></section></aside>';
  }

  function renderPostCard(post) {
    const tags = (post.tags || []).slice(0, 4).map(function (tag) {
      return '<span class="tag">#' + escapeHtml(tag) + '</span>';
    }).join("");
    return '<a class="card" href="#/post/' + encodeURIComponent(post.slug) + '"><div class="card-meta"><span class="card-category">' + escapeHtml((post.tags || ["随笔"])[0]) + '</span><time datetime="' + escapeHtml(post.date) + '">' + formatDate(post.date) + '</time><span>' + readingTime(post) + '</span></div><h2 class="card-title">' + escapeHtml(post.title) + '</h2><p class="card-excerpt">' + escapeHtml(post.summary || "") + '</p><div class="card-bottom"><div class="card-tags">' + tags + '</div><span class="card-read-more">查看详情 <span aria-hidden="true">→</span></span></div></a>';
  }

  function renderHome(selectedTag) {
    const query = currentSearch.trim().toLowerCase();
    let posts = allPosts();

    if (query) {
      posts = posts.filter(function (post) {
        const haystack = [post.title, post.summary, ...(post.tags || [])].join(" ").toLowerCase();
        return haystack.includes(query);
      });
    }
    if (selectedTag) {
      posts = posts.filter(function (post) {
        return (post.tags || []).includes(selectedTag);
      });
    }

    const filterBar = query || selectedTag ? '<div class="filter-bar"><span>当前筛选：' + (selectedTag ? '#' + escapeHtml(selectedTag) + ' ' : "") + (query ? '“' + escapeHtml(currentSearch) + '”' : "") + '</span><a href="#/">重置</a></div>' : "";
    const cards = posts.length ? posts.map(renderPostCard).join("") : '<div class="empty-state"><p>暂无匹配的文章。</p><a href="#/">清除筛选条件</a></div>';
    const heading = selectedTag ? "#" + escapeHtml(selectedTag) + " 的文章" : "最新文章";

    app.innerHTML = '<div class="container"><div class="home-layout"><section class="article-list">' + filterBar + '<div class="section-heading"><div class="section-heading-left"><span class="section-heading-bar"></span><h1>' + heading + '</h1></div><span class="post-count">' + posts.length + ' 篇</span></div><div class="card-list">' + cards + '</div></section>' + renderSidebar(selectedTag) + '</div></div>';
    document.title = site().title || "个人博客";
    if (searchInput) {
      searchInput.value = currentSearch;
    }
  }

  async function renderArticle(slug, version) {
    const post = allPosts().find(function (item) {
      return item.slug === slug;
    });
    if (!post) {
      showError("找不到这篇文章，它可能已经被移动或删除了。");
      return;
    }

    try {
      const response = await fetch(post.file);
      if (!response.ok) {
        throw new Error("文章加载失败");
      }
      const markdown = await response.text();
      if (version !== renderVersion) {
        return;
      }
      document.title = post.title + " - " + site().title;
      app.innerHTML = '<div class="container container--narrow"><article class="article-detail"><div class="article-breadcrumb"><a href="#/" class="back-link">← 返回首页</a><div class="breadcrumb-path"><span>首页</span><span>/</span><span class="breadcrumb-current">' + escapeHtml(post.title) + '</span></div></div><h1 class="article-title">' + escapeHtml(post.title) + '</h1><div class="article-meta"><span>' + escapeHtml(site().author || "作者") + '</span><span>|</span><time datetime="' + escapeHtml(post.date) + '">' + formatDate(post.date) + '</time><span>|</span><span>' + readingTime(post) + '</span></div><div class="article-content">' + window.renderMarkdown(markdown) + '</div><div class="article-tags"><span>标签：</span>' + (post.tags || []).map(function (tag) { return '<span class="tag">#' + escapeHtml(tag) + '</span>'; }).join("") + '</div></article></div>';
      app.focus({ preventScroll: true });
    } catch (error) {
      if (version === renderVersion) {
        showError("文章暂时无法加载，请检查 Markdown 文件路径。");
      }
    }
  }

  async function renderAbout(version) {
    try {
      const response = await fetch(config.aboutFile);
      if (!response.ok) {
        throw new Error("关于页加载失败");
      }
      const markdown = await response.text();
      if (version !== renderVersion) {
        return;
      }
      document.title = "关于 - " + site().title;
      app.innerHTML = '<div class="container container--narrow"><article class="article-detail"><div class="article-breadcrumb"><a href="#/" class="back-link">← 返回首页</a><div class="breadcrumb-path"><span class="breadcrumb-current">关于我</span></div></div><div class="article-content">' + window.renderMarkdown(markdown) + '</div></article></div>';
      app.focus({ preventScroll: true });
    } catch (error) {
      if (version === renderVersion) {
        showError("关于页面暂时无法加载，请检查 Markdown 文件路径。");
      }
    }
  }

  function renderRoute() {
    const route = parseRoute();
    const version = ++renderVersion;
    updateActiveNav(route.path);

    if (route.name === "home") {
      renderHome(route.tag);
      return;
    }

    showLoading();
    if (route.name === "about") {
      renderAbout(version);
      return;
    }
    renderArticle(route.slug, version);
  }

  function setupInteractions() {
    const menuButton = document.querySelector("#menuToggle");
    const nav = document.querySelector("#site-nav");
    const backToTop = document.querySelector("#backToTop");

    menuButton.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.matches("a")) {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
    searchInput.addEventListener("input", function () {
      currentSearch = searchInput.value;
      const route = parseRoute();
      if (route.name !== "home") {
        location.hash = "#/";
        return;
      }
      renderHome(route.tag);
    });
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function bootstrap() {
    setSiteChrome();
    setupInteractions();
    await loadPosts();
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
  }

  bootstrap();
})();
