window.__ModuleLoader__.load({
  id: 'dsh-session-navigator',
  factory: (require) => {
    const module = { exports: {} };

    const CSS_STYLES = `
      /* 会话与轮次深层直达胶囊 */
      .dsh-session-anchor-capsule {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 4px 12px !important;
        margin: 3px 4px !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        line-height: 1.4 !important;
        color: #2563eb !important;
        background: rgba(37, 99, 235, 0.08) !important;
        border: 1px solid rgba(37, 99, 235, 0.3) !important;
        border-radius: 16px !important;
        text-decoration: none !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        vertical-align: baseline !important;
      }
      .dsh-session-anchor-capsule:hover {
        background: rgba(37, 99, 235, 0.18) !important;
        border-color: rgba(37, 99, 235, 0.6) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2) !important;
      }
      .dsh-session-anchor-capsule .dsh-capsule-icon {
        font-size: 14px !important;
        line-height: 1 !important;
      }
      .dsh-session-anchor-capsule .dsh-capsule-arrow {
        font-size: 12px !important;
        font-weight: 600 !important;
        margin-left: 2px !important;
      }

      /* 目标轮次高亮脉冲动画 */
      @keyframes dshTurnPulse {
        0% {
          outline: 3px solid rgba(59, 130, 246, 0.9);
          background-color: rgba(59, 130, 246, 0.18);
        }
        70% {
          outline: 3px solid rgba(59, 130, 246, 0.4);
          background-color: rgba(59, 130, 246, 0.08);
        }
        100% {
          outline: 3px solid transparent;
          background-color: transparent;
        }
      }
      .dsh-navigator-highlight {
        animation: dshTurnPulse 2.5s ease-out forwards !important;
        border-radius: 8px !important;
      }

      /* 搜索增强卡片与容器 */
      .dsh-search-enhancer-box {
        margin: 4px 6px 8px;
        padding: 4px;
        border-radius: 8px;
        background: var(--bg-surface, rgba(128, 128, 128, 0.05));
        border: 1px solid var(--border-subtle, rgba(128, 128, 128, 0.2));
      }
      .dsh-search-enhancer-header {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted, #888);
        padding: 3px 6px 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px dashed var(--border-subtle, rgba(128, 128, 128, 0.15));
        margin-bottom: 4px;
      }
      .dsh-search-enhancer-list {
        display: grid;
        gap: 3px;
        max-height: 300px;
        overflow-y: auto;
      }
      .dsh-search-item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 6px 8px;
        border-radius: 6px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        transition: background 0.12s ease;
        width: 100%;
        box-sizing: border-box;
      }
      .dsh-search-item-row:hover {
        background: var(--bg-hover, rgba(128, 128, 128, 0.12));
      }
      .dsh-search-item-meta {
        display: grid;
        gap: 2px;
        min-width: 0;
        flex: 1;
      }
      .dsh-search-item-title {
        font-size: 12px;
        font-weight: 500;
        color: var(--text-title, #222);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dsh-search-item-snippet {
        font-size: 11px;
        color: var(--text-muted, #777);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dsh-search-item-badge {
        font-size: 10px;
        padding: 1px 4px;
        border-radius: 4px;
        background: rgba(37, 99, 235, 0.12);
        color: #2563eb;
        display: inline-block;
        margin-right: 4px;
      }

      /* 独立弹窗打开按钮 */
      .dsh-open-window-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        padding: 0;
        border: 1px solid var(--border-subtle, rgba(128, 128, 128, 0.2));
        border-radius: 5px;
        background: var(--bg-surface, rgba(255, 255, 255, 0.05));
        color: var(--text-muted, #666);
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
        font-size: 14px;
        line-height: 1;
      }
      .dsh-open-window-btn:hover {
        background: #2563eb !important;
        border-color: #2563eb !important;
        color: #ffffff !important;
        transform: scale(1.05);
      }
    `;

    function injectStyles() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('dsh-session-navigator-styles')) return;
      const style = document.createElement('style');
      style.id = 'dsh-session-navigator-styles';
      style.textContent = CSS_STYLES;
      document.head.appendChild(style);
    }

    // 在新独立窗口中打开指定路径，始终同源以复用登录凭证
    function openInNewWindow(targetPath) {
      if (typeof window === 'undefined') return;
      const origin = window.location.origin;
      let fullUrl = targetPath;
      if (targetPath.startsWith('/')) {
        fullUrl = `${origin}${targetPath}`;
      } else if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
        try {
          const u = new URL(targetPath);
          fullUrl = `${origin}${u.pathname}${u.search}${u.hash}`;
        } catch {
          fullUrl = targetPath;
        }
      }

      // 使用标准 _blank 打开新窗口，绝不添加引发拦截的复杂限制特性
      const newWin = window.open(fullUrl, '_blank');
      if (!newWin) {
        // 如果被浏览器弹窗策略阻拦，回退到普通标签
        window.location.href = fullUrl;
      }
    }

    // 1. 全局链接拦截：拦截所有包含 session= 的链接
    function setupLinkInterceptor() {
      if (typeof document === 'undefined') return;

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

          let queryPath = href;
          if (href.startsWith('dsh://session/')) {
            const raw = href.replace('dsh://session/', '');
            queryPath = `/?session=${raw}`;
          } else if (href.startsWith('http://') || href.startsWith('https://')) {
            try {
              const u = new URL(href);
              queryPath = `${u.pathname}${u.search}`;
            } catch {}
          } else if (!href.startsWith('/')) {
            queryPath = `/${href}`;
          }

          openInNewWindow(queryPath);
        }
      }, true);
    }

    // 2. 自动把消息中的 session 链接美化为带 🧭 的胶囊
    function decorateCapsules() {
      if (typeof document === 'undefined') return;
      const links = document.querySelectorAll('a[href*="session="]:not(.dsh-session-anchor-capsule)');
      for (const a of links) {
        a.classList.add('dsh-session-anchor-capsule');
        const text = a.textContent.trim();
        const hasArrow = text.includes('↗');
        a.innerHTML = `<span class="dsh-capsule-icon">🧭</span><span>${text}</span>${hasArrow ? '' : '<span class="dsh-capsule-arrow">↗</span>'}`;
        a.setAttribute('title', '在新独立窗口中打开并直达指定轮次');
      }
    }

    // 3. 页面启动时的深层链接解析与自动寻址定位
    function handleDeepLinkStartup(ctx) {
      if (typeof window === 'undefined') return;
      const search = window.location.search;
      if (!search || !search.includes('session=')) return;

      const params = new URLSearchParams(search);
      const targetSessionId = params.get('session');
      const targetTurn = params.get('turn') ? parseInt(params.get('turn'), 10) : null;
      const targetSeq = params.get('seq') ? parseInt(params.get('seq'), 10) : null;

      if (!targetSessionId) return;

      // 使用 Cordis 标准动态注入获取 sessions 或 workspaces，绝不直接读 ctx.workspaces
      let switched = false;
      if (typeof ctx?.inject === 'function') {
        ctx.inject(['workspaces'], (sub) => {
          if (switched) return;
          if (typeof sub.workspaces?.selectSession === 'function') {
            sub.workspaces.selectSession(targetSessionId);
            switched = true;
          }
        });
        ctx.inject(['sessions'], (sub) => {
          if (switched) return;
          if (typeof sub.sessions?.select === 'function') {
            try {
              sub.sessions.select(targetSessionId);
              switched = true;
            } catch {}
          }
        });
      }

      // 如果需要定位到具体轮次，等待消息 DOM 出现后平滑滚动并高亮
      if (targetTurn || targetSeq) {
        let attempts = 0;
        const maxAttempts = 30;
        const timer = setInterval(() => {
          attempts++;
          const located = locateAndHighlightTurn(targetTurn, targetSeq);
          if (located || attempts >= maxAttempts) {
            clearInterval(timer);
          }
        }, 250);
      }
    }

    function locateAndHighlightTurn(targetTurn, targetSeq) {
      if (typeof document === 'undefined') return false;

      // 寻找轮次节点
      const turnElements = document.querySelectorAll(
        '[data-turn-index], [data-turn], [data-seq], article, [role="article"], .message-group'
      );
      if (turnElements.length >= targetTurn && targetTurn > 0) {
        const target = turnElements[targetTurn - 1];
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('dsh-navigator-highlight');
          return true;
        }
      }

      // 联动高亮 Codex Timeline
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

    // 4. 侧边栏搜索框增强：只要输入 >= 2 个字符，自动调后端并在下方渲染匹配浮层
    function enhanceSearchUI() {
      if (typeof document === 'undefined') return;

      let fetchTimer = null;

      document.addEventListener('input', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        const placeholder = (target.getAttribute('placeholder') || '').toLowerCase();
        if (!placeholder.includes('搜索') && !placeholder.includes('search')) return;

        const val = target.value.trim();
        clearTimeout(fetchTimer);

        // 只要输入 2 个字符以上（例如 56 或 56c 或 56c6），立即触发检索
        if (!val || val.length < 2) {
          removeSearchEnhancerBox();
          return;
        }

        fetchTimer = setTimeout(async () => {
          await renderSearchEnhancerResults(val, target);
        }, 150);
      }, true);

      // DOM 变化监听：自动胶囊化
      const observer = new MutationObserver(() => {
        decorateCapsules();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    function removeSearchEnhancerBox() {
      const el = document.getElementById('dsh-search-enhancer');
      if (el) el.remove();
    }

    async function renderSearchEnhancerResults(query, inputElement) {
      try {
        const res = await fetch(`/dsh-session-navigator/search?q=${encodeURIComponent(query)}&limit=10`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.ok || !data.items || data.items.length === 0) {
          removeSearchEnhancerBox();
          return;
        }

        const searchInputBox = inputElement.closest('div') || inputElement.parentElement;
        if (!searchInputBox) return;

        let box = document.getElementById('dsh-search-enhancer');
        if (!box) {
          box = document.createElement('div');
          box.id = 'dsh-search-enhancer';
          box.className = 'dsh-search-enhancer-box';
          if (searchInputBox.nextSibling) {
            searchInputBox.parentNode.insertBefore(box, searchInputBox.nextSibling);
          } else {
            searchInputBox.parentNode.appendChild(box);
          }
        }

        const count = data.items.length;
        box.innerHTML = `
          <div class="dsh-search-enhancer-header">
            <span>精准 ID / 内容匹配 (${count})</span>
            <span style="font-size:10px;color:#2563eb;">独立窗口 ↗</span>
          </div>
          <div class="dsh-search-enhancer-list"></div>
        `;

        const listEl = box.querySelector('.dsh-search-enhancer-list');

        for (const item of data.items) {
          const row = document.createElement('div');
          row.className = 'dsh-search-item-row';
          const title = (item.turns && item.turns[0] && item.turns[0].prompt)
            ? item.turns[0].prompt
            : item.id;
          const cwdName = item.cwd ? item.cwd.split('/').pop() : '工作区';
          const matchLabel = item.matchType === 'id' ? 'ID 命中' : '内容命中';
          const snippetText = item.matchedSnippet || item.id.slice(0, 16);

          row.innerHTML = `
            <div class="dsh-search-item-meta">
              <span class="dsh-search-item-title">${title}</span>
              <span class="dsh-search-item-snippet">
                <span class="dsh-search-item-badge">${matchLabel}</span>
                ${snippetText} · ${cwdName}
              </span>
            </div>
            <button class="dsh-open-window-btn" title="在新独立窗口中打开此会话">↗</button>
          `;

          // 点击整行：在当前窗口切换
          row.addEventListener('click', (e) => {
            const btn = e.target.closest('.dsh-open-window-btn');
            if (btn) {
              e.preventDefault();
              e.stopPropagation();
              openInNewWindow(`/?session=${item.id}`);
            } else {
              window.location.href = `/?session=${item.id}`;
            }
          });

          listEl.appendChild(row);
        }
      } catch (err) {
        console.warn('[dsh-session-navigator] Search render error:', err);
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
        removeSearchEnhancerBox();
      };
    }

    // 声明为安全的空注入，依靠动态 ctx.inject 保证绝不报错
    const inject = [];

    module.exports.apply = apply;
    module.exports.inject = inject;
    return module.exports;
  },
});
