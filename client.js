window.__ModuleLoader__.load({
  id: 'dsh-session-navigator',
  factory: (require) => {
    const module = { exports: {} };

    const CSS_STYLES = `
      /* 会话与轮次深层直达胶囊 */
      .dsh-session-anchor-capsule {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 9px;
        margin: 2px 4px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.4;
        color: #2563eb !important;
        background: rgba(37, 99, 235, 0.08);
        border: 1px solid rgba(37, 99, 235, 0.25);
        border-radius: 14px;
        text-decoration: none !important;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        vertical-align: baseline;
      }
      .dsh-session-anchor-capsule:hover {
        background: rgba(37, 99, 235, 0.16);
        border-color: rgba(37, 99, 235, 0.45);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
      }
      .dsh-session-anchor-capsule .dsh-capsule-icon {
        font-size: 13px;
        line-height: 1;
      }
      .dsh-session-anchor-capsule .dsh-capsule-arrow {
        font-size: 11px;
        opacity: 0.7;
        margin-left: 1px;
      }

      /* 目标轮次高亮动画 */
      @keyframes dshTurnPulse {
        0% {
          outline: 3px solid rgba(59, 130, 246, 0.8);
          background-color: rgba(59, 130, 246, 0.12);
        }
        70% {
          outline: 3px solid rgba(59, 130, 246, 0.4);
          background-color: rgba(59, 130, 246, 0.06);
        }
        100% {
          outline: 3px solid transparent;
          background-color: transparent;
        }
      }
      .dsh-navigator-highlight {
        animation: dshTurnPulse 2.5s ease-out forwards;
        border-radius: 8px;
      }

      /* 搜索结果项右侧新窗口打开按钮 */
      .dsh-open-window-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        margin-left: auto;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--text-muted, #888);
        cursor: pointer;
        opacity: 0;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }
      [role="treeitem"]:hover .dsh-open-window-btn,
      .dsh-search-custom-row:hover .dsh-open-window-btn {
        opacity: 0.85;
      }
      .dsh-open-window-btn:hover {
        opacity: 1 !important;
        background: rgba(128, 128, 128, 0.15);
        color: var(--text-title, #111);
      }

      /* 自定义补全搜索项样式 */
      .dsh-search-custom-row {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 6px 10px;
        border: none;
        border-radius: 6px;
        background: transparent;
        text-align: left;
        cursor: pointer;
        transition: background 0.1s ease;
      }
      .dsh-search-custom-row:hover {
        background: var(--bg-hover, rgba(128, 128, 128, 0.08));
      }
      .dsh-search-custom-meta {
        display: grid;
        gap: 2px;
        min-width: 0;
        flex: 1;
      }
      .dsh-search-custom-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-title, #222);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dsh-search-custom-sub {
        font-size: 11px;
        color: var(--text-muted, #777);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;

    function injectStyles() {
      if (document.getElementById('dsh-session-navigator-styles')) return;
      const style = document.createElement('style');
      style.id = 'dsh-session-navigator-styles';
      style.textContent = CSS_STYLES;
      document.head.appendChild(style);
    }

    function openInNewWindow(url) {
      const screenW = window.screen.availWidth || 1440;
      const screenH = window.screen.availHeight || 900;
      const width = Math.min(1280, Math.floor(screenW * 0.85));
      const height = Math.min(880, Math.floor(screenH * 0.85));
      const left = Math.max(30, Math.floor((screenW - width) / 2));
      const top = Math.max(30, Math.floor((screenH - height) / 2));
      window.open(
        url,
        '_blank',
        `popup=true,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    }

    // 1. 全局链接拦截：带 session 参数的链接在新窗口打开
    function setupLinkInterceptor() {
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const link = target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        if (
          href.includes('session=') ||
          href.startsWith('dsh://session') ||
          (link.dataset && link.dataset.dshSession)
        ) {
          e.preventDefault();
          e.stopPropagation();

          let targetUrl = href;
          if (href.startsWith('dsh://session/')) {
            const raw = href.replace('dsh://session/', '');
            targetUrl = `/?session=${raw}`;
          } else if (!href.startsWith('http') && !href.startsWith('/')) {
            targetUrl = `/?${href}`;
          }
          openInNewWindow(targetUrl);
        }
      }, true);
    }

    // 2. 将消息中的 session 链接装饰为直达胶囊
    function decorateCapsules() {
      const links = document.querySelectorAll('a[href*="session="]:not(.dsh-session-anchor-capsule)');
      for (const a of links) {
        a.classList.add('dsh-session-anchor-capsule');
        const text = a.textContent.trim();
        const hasArrow = text.includes('↗');
        a.innerHTML = `<span class="dsh-capsule-icon">🧭</span><span>${text}</span>${hasArrow ? '' : '<span class="dsh-capsule-arrow">↗</span>'}`;
        a.setAttribute('title', '在新独立窗口中打开并直达指定轮次');
      }
    }

    // 3. 自动寻址与跳转：检测当前窗口 URL 是否带 session / turn 参数
    function handleDeepLinkStartup(ctx) {
      const search = window.location.search;
      if (!search || !search.includes('session=')) return;

      const params = new URLSearchParams(search);
      const targetSessionId = params.get('session');
      const targetTurn = params.get('turn') ? parseInt(params.get('turn'), 10) : null;
      const targetSeq = params.get('seq') ? parseInt(params.get('seq'), 10) : null;

      if (!targetSessionId) return;

      // 切换会话
      let switched = false;
      const trySwitch = () => {
        if (switched) return;
        if (ctx.uiWorkspace && typeof ctx.uiWorkspace.selectSession === 'function') {
          ctx.uiWorkspace.selectSession(targetSessionId);
          switched = true;
        } else if (ctx.workspaces && typeof ctx.workspaces.selectSession === 'function') {
          ctx.workspaces.selectSession(targetSessionId);
          switched = true;
        }
      };
      trySwitch();
      if (!switched) {
        setTimeout(trySwitch, 200);
        setTimeout(trySwitch, 600);
      }

      // 如果有指定目标轮次，在 DOM 渲染后自动平滑滚动并高亮
      if (targetTurn || targetSeq) {
        let attempts = 0;
        const maxAttempts = 30;
        const locateTimer = setInterval(() => {
          attempts++;
          const found = locateAndHighlightTurn(targetTurn, targetSeq);
          if (found || attempts >= maxAttempts) {
            clearInterval(locateTimer);
          }
        }, 200);
      }
    }

    function locateAndHighlightTurn(targetTurn, targetSeq) {
      // 策略 A：按会话消息容器寻找（寻找用户提问节点）
      // DSH 消息区通常有 role="article" 或特定轮次容器
      const turnCards = document.querySelectorAll(
        '[data-turn-index], [data-turn], [data-seq], .conversation-turn, .chat-turn'
      );
      if (turnCards.length > 0 && targetTurn) {
        const targetElement = turnCards[targetTurn - 1];
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetElement.classList.add('dsh-navigator-highlight');
          return true;
        }
      }

      // 策略 B：查找包含“第 N 轮”或用户消息块的序列
      // 遍历所有可能的轮次卡片
      const allArticles = document.querySelectorAll('article, [role="article"], .message-group');
      if (allArticles.length >= targetTurn && targetTurn > 0) {
        const targetElement = allArticles[targetTurn - 1];
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetElement.classList.add('dsh-navigator-highlight');
          return true;
        }
      }

      // 策略 C：如果安装了 dsh-codex-timeline，联动触发其横线点击
      const timelineTicks = document.querySelectorAll('.codex-timeline-tick, [data-timeline-turn]');
      if (timelineTicks.length >= targetTurn && targetTurn > 0) {
        const tick = timelineTicks[targetTurn - 1];
        if (tick) {
          tick.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
      }

      return false;
    }

    // 4. 左侧搜索框增强：搜 Session ID + 搜索结果添加 [ ↗ ] 按钮
    function enhanceSearchUI() {
      // 观察搜索结果树变化
      const observer = new MutationObserver(() => {
        // 查找所有搜索结果项
        const resultItems = document.querySelectorAll('[role="treeitem"]:not([data-dsh-nav-enhanced])');
        for (const item of resultItems) {
          item.setAttribute('data-dsh-nav-enhanced', 'true');

          // 从 item 或子元素中提取 sessionId
          const sessionId = item.getAttribute('data-session-id') ||
            item.getAttribute('id') ||
            item.getAttribute('key');

          // 创建并在右侧插入 [ ↗ ] 按钮
          const openBtn = document.createElement('button');
          openBtn.className = 'dsh-open-window-btn';
          openBtn.title = '在新窗口打开此会话';
          openBtn.innerHTML = '↗';
          openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 如果有精确 ID 直接打开，否则从行点击事件或上下文解析
            let targetId = sessionId;
            if (!targetId) {
              const text = item.textContent || '';
              const match = text.match(/session-[0-9a-f-]{8,}/);
              if (match) targetId = match[0];
            }

            if (targetId) {
              openInNewWindow(`/?session=${targetId}`);
            } else {
              // 模拟普通打开以探测 ID
              item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
          });

          item.appendChild(openBtn);
        }

        // 装饰消息区里的胶囊链接
        decorateCapsules();
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // 监听搜索框输入，增强 Session ID 检索
      setupSearchInputListener();
    }

    function setupSearchInputListener() {
      let debounceTimer = null;
      document.addEventListener('input', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        const placeholder = target.getAttribute('placeholder') || '';
        if (!placeholder.includes('搜索') && !placeholder.includes('Search')) return;

        const val = target.value.trim();
        if (!val) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          // 如果用户输入了可能是 Session ID 或特殊关键词
          if (val.length >= 3) {
            handleCustomSearchFallback(val);
          }
        }, 200);
      }, true);
    }

    async function handleCustomSearchFallback(query) {
      // 检查当前官方搜索是否提示无匹配
      const emptyMsg = document.querySelector('[class*="empty"], [class*="noMatches"]');
      if (!emptyMsg && !query.startsWith('session-') && query.length < 5) return;

      try {
        const res = await fetch(`/dsh-session-navigator/search?q=${encodeURIComponent(query)}&limit=10`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.ok || !data.items || data.items.length === 0) return;

        // 如果搜索树存在，在空提示处追加补充搜索结果
        const listContainer = emptyMsg ? emptyMsg.parentElement : document.querySelector('[role="tree"]');
        if (!listContainer) return;

        let extraContainer = document.getElementById('dsh-navigator-extra-results');
        if (!extraContainer) {
          extraContainer = document.createElement('div');
          extraContainer.id = 'dsh-navigator-extra-results';
          extraContainer.style.padding = '6px 0';
          extraContainer.style.borderTop = '1px dashed var(--border-subtle, #e5e7eb)';
          listContainer.appendChild(extraContainer);
        }

        extraContainer.innerHTML = `<div style="font-size:11px;color:var(--text-muted,#888);padding:4px 8px;">按 ID / 全文检索命中 (${data.items.length})：</div>`;

        for (const item of data.items) {
          const row = document.createElement('div');
          row.className = 'dsh-search-custom-row';
          const title = item.turns && item.turns[0] ? item.turns[0].prompt : item.id;
          const sub = item.cwd ? item.cwd.split('/').pop() : item.id.slice(0, 16);

          row.innerHTML = `
            <div class="dsh-search-custom-meta">
              <span class="dsh-search-custom-title">${title}</span>
              <span class="dsh-search-custom-sub">ID: ${item.id.slice(0, 14)}… · ${sub}</span>
            </div>
            <button class="dsh-open-window-btn" title="在新窗口打开" style="opacity:0.85;">↗</button>
          `;

          row.addEventListener('click', (e) => {
            const btn = e.target.closest('.dsh-open-window-btn');
            if (btn) {
              e.stopPropagation();
              openInNewWindow(`/?session=${item.id}`);
            } else {
              // 在当前窗口切换
              window.location.href = `/?session=${item.id}`;
            }
          });

          extraContainer.appendChild(row);
        }
      } catch (err) {
        console.warn('[dsh-session-navigator] Fallback search error:', err);
      }
    }

    function apply(ctx) {
      injectStyles();
      setupLinkInterceptor();
      enhanceSearchUI();
      handleDeepLinkStartup(ctx);

      return () => {
        const style = document.getElementById('dsh-session-navigator-styles');
        if (style) style.remove();
      };
    }

    module.exports.apply = apply;
    module.exports.inject = ['uiWorkspace'];
    return module.exports;
  },
});
