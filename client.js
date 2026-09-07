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
        padding: 3px 10px !important;
        margin: 2px 4px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        line-height: 1.4 !important;
        color: #2563eb !important;
        background: rgba(37, 99, 235, 0.08) !important;
        border: 1px solid rgba(37, 99, 235, 0.28) !important;
        border-radius: 16px !important;
        text-decoration: none !important;
        cursor: pointer !important;
        transition: all 0.15s ease-in-out !important;
        vertical-align: baseline !important;
      }
      .dsh-session-anchor-capsule:hover {
        background: rgba(37, 99, 235, 0.16) !important;
        border-color: rgba(37, 99, 235, 0.5) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.18) !important;
      }
      .dsh-session-anchor-capsule .dsh-capsule-icon {
        font-size: 13px !important;
        line-height: 1 !important;
      }
      .dsh-session-anchor-capsule .dsh-capsule-arrow {
        font-size: 11px !important;
        opacity: 0.75 !important;
        margin-left: 2px !important;
      }

      /* 目标轮次高亮脉冲动画 */
      @keyframes dshTurnPulse {
        0% {
          outline: 3px solid rgba(59, 130, 246, 0.9);
          background-color: rgba(59, 130, 246, 0.15);
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

      /* 搜索浮层与结果列表容器 */
      .dsh-search-enhancer-box {
        margin: 6px 8px;
        padding: 6px;
        border-radius: 8px;
        background: var(--bg-surface, rgba(255, 255, 255, 0.04));
        border: 1px dashed var(--border-control, rgba(128, 128, 128, 0.25));
      }
      .dsh-search-enhancer-header {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted, #888);
        padding: 2px 6px 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .dsh-search-enhancer-list {
        display: grid;
        gap: 4px;
        max-height: 280px;
        overflow-y: auto;
      }
      .dsh-search-item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 6px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        transition: background 0.12s ease;
      }
      .dsh-search-item-row:hover {
        background: var(--bg-hover, rgba(128, 128, 128, 0.1));
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
        background: rgba(37, 99, 235, 0.1);
        color: #2563eb;
        display: inline-block;
        margin-right: 4px;
      }

      /* 独立小弹窗打开按钮 */
      .dsh-open-window-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--text-muted, #888);
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
        font-size: 14px;
      }
      .dsh-search-item-row:hover .dsh-open-window-btn,
      [role="treeitem"]:hover .dsh-open-window-btn {
        color: #2563eb;
      }
      .dsh-open-window-btn:hover {
        background: rgba(37, 99, 235, 0.15) !important;
        color: #2563eb !important;
        transform: scale(1.1);
      }
    `;

    function injectStyles() {
      if (document.getElementById('dsh-session-navigator-styles')) return;
      const style = document.createElement('style');
      style.id = 'dsh-session-navigator-styles';
      style.textContent = CSS_STYLES;
      document.head.appendChild(style);
    }

    // 在新窗口打开，确保使用当前相同的 window.location.origin
    function openInNewWindow(targetPath) {
      const origin = window.location.origin;
      let fullUrl = targetPath;
      if (targetPath.startsWith('/')) {
        fullUrl = `${origin}${targetPath}`;
      } else if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
        // 如果是绝对路径，强制替换为当前 origin，保证 Cookie 绝对可用且不跨域
        const u = new URL(targetPath);
        fullUrl = `${origin}${u.pathname}${u.search}${u.hash}`;
      }

      const screenW = window.screen.availWidth || 1440;
      const screenH = window.screen.availHeight || 900;
      const width = Math.min(1280, Math.floor(screenW * 0.85));
      const height = Math.min(880, Math.floor(screenH * 0.85));
      const left = Math.max(30, Math.floor((screenW - width) / 2));
      const top = Math.max(30, Math.floor((screenH - height) / 2));

      window.open(
        fullUrl,
        '_blank',
        `popup=true,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    }

    // 1. 全局链接拦截：彻底解决跳外部浏览器及 401 报错
    function setupLinkInterceptor() {
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const link = target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        // 匹配任意指向 session 的链接
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
            const u = new URL(href);
            queryPath = `${u.pathname}${u.search}`;
          } else if (!href.startsWith('/')) {
            queryPath = `/${href}`;
          }

          openInNewWindow(queryPath);
        }
      }, true);
    }

    // 2. 自动把消息里的 session 链接美化为胶囊
    function decorateCapsules() {
      const links = document.querySelectorAll('a[href*="session="]:not(.dsh-session-anchor-capsule)');
      for (const a of links) {
        a.classList.add('dsh-session-anchor-capsule');
        const text = a.textContent.trim();
        const hasArrow = text.includes('↗');
        a.innerHTML = `<span class="dsh-capsule-icon">🧭</span><span>${text}</span>${hasArrow ? '' : '<span class="dsh-capsule-arrow">↗</span>'}`;
        a.setAttribute('title', '在独立新窗口中打开并直达指定轮次');
      }
    }

    // 3. 启动时的深层链接自寻址（自动选会话 + 滚到目标轮次）
    function handleDeepLinkStartup(ctx) {
      const search = window.location.search;
      if (!search || !search.includes('session=')) return;

      const params = new URLSearchParams(search);
      const targetSessionId = params.get('session');
      const targetTurn = params.get('turn') ? parseInt(params.get('turn'), 10) : null;
      const targetSeq = params.get('seq') ? parseInt(params.get('seq'), 10) : null;

      if (!targetSessionId) return;

      let switched = false;
      const selectSession = () => {
        if (switched) return;
        if (ctx?.workspaces && typeof ctx.workspaces.selectSession === 'function') {
          ctx.workspaces.selectSession(targetSessionId);
          switched = true;
        } else if (ctx?.sessions && typeof ctx.sessions.select === 'function') {
          try { ctx.sessions.select(targetSessionId); switched = true; } catch {}
        }
      };

      selectSession();
      if (!switched) {
        setTimeout(selectSession, 200);
        setTimeout(selectSession, 600);
      }

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
      // 方式 1：寻找文章/轮次容器
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

      // 方式 2：联动触发 Codex Timeline 的短横线
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

    // 4. 左侧搜索框增强：监听输入，如果官方报“无匹配”，无缝注入真实匹配结果
    function enhanceSearchUI() {
      let activeQuery = '';
      let fetchTimer = null;

      document.addEventListener('input', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        const placeholder = (target.getAttribute('placeholder') || '').toLowerCase();
        if (!placeholder.includes('搜索') && !placeholder.includes('search')) return;

        const val = target.value.trim();
        activeQuery = val;
        clearTimeout(fetchTimer);

        if (!val || val.length < 2) {
          removeSearchEnhancerBox();
          return;
        }

        fetchTimer = setTimeout(async () => {
          await renderSearchEnhancerResults(val, target);
        }, 180);
      }, true);

      // 给原生的所有树节点也注入 [ ↗ ] 按钮
      const observer = new MutationObserver(() => {
        decorateCapsules();

        const treeItems = document.querySelectorAll('[role="treeitem"]:not([data-dsh-open-ready])');
        for (const item of treeItems) {
          item.setAttribute('data-dsh-open-ready', 'true');
          const btn = document.createElement('button');
          btn.className = 'dsh-open-window-btn';
          btn.title = '在新窗口中打开此会话';
          btn.innerHTML = '↗';
          btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            const sid = item.getAttribute('data-session-id') ||
                        item.getAttribute('id') ||
                        item.getAttribute('key');
            if (sid && sid.startsWith('session-')) {
              openInNewWindow(`/?session=${sid}`);
            } else {
              const text = item.textContent || '';
              const match = text.match(/session-[0-9a-f-]{8,}/);
              if (match) {
                openInNewWindow(`/?session=${match[0]}`);
              } else {
                item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              }
            }
          });
          item.appendChild(btn);
        }
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

        // 寻找搜索容器挂载点（紧跟在输入框所在的父级或列表下方）
        const searchInputBox = inputElement.closest('div') || inputElement.parentElement;
        if (!searchInputBox) return;

        let box = document.getElementById('dsh-search-enhancer');
        if (!box) {
          box = document.createElement('div');
          box.id = 'dsh-search-enhancer';
          box.className = 'dsh-search-enhancer-box';
          // 插入到搜索输入行下方
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
            <span style="font-size:10px;color:#2563eb;">直达 ↗</span>
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
          const snippetText = item.matchedSnippet || item.id;

          row.innerHTML = `
            <div class="dsh-search-item-meta">
              <span class="dsh-search-item-title">${title}</span>
              <span class="dsh-search-item-snippet">
                <span class="dsh-search-item-badge">${matchLabel}</span>
                ${snippetText} · ${cwdName}
              </span>
            </div>
            <button class="dsh-open-window-btn" title="在新窗口中打开此会话">↗</button>
          `;

          // 点击整行：在当前窗口平滑切换
          row.addEventListener('click', (e) => {
            const btn = e.target.closest('.dsh-open-window-btn');
            if (btn) {
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

    // 声明 inject 为 DSH 稳定支持的服务
    const inject = ['connection'];

    module.exports.apply = apply;
    module.exports.inject = inject;
    return module.exports;
  },
});
