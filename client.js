window.__ModuleLoader__.load({
  id: 'dsh-session-navigator',
  factory: (require) => {
    const module = { exports: {} }

    const SESSION_ID_RE = /session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const CSS_STYLES = `
      /* Official composer @ session chip (ReferenceChip): one 6px plate, bubble + title. */
      code.dsh-session-anchor-host {
        display: contents !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        background-color: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        font: inherit !important;
        font-size: inherit !important;
        font-family: inherit !important;
        color: inherit !important;
        line-height: inherit !important;
        box-shadow: none !important;
      }
      .dsh-session-anchor-capsule {
        display: inline-flex !important;
        align-items: center !important;
        gap: 3px !important;
        box-sizing: border-box !important;
        height: 22px !important;
        max-width: 240px !important;
        margin: 0 2px !important;
        padding: 0 6px !important;
        border: none !important;
        border-radius: 6px !important;
        background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12)) !important;
        color: var(--dsw-alias-state-business-primary, #2563eb) !important;
        font: inherit !important;
        font-size: 13px !important;
        font-weight: 400 !important;
        font-family: var(--dsw-font-family, inherit) !important;
        line-height: 22px !important;
        text-decoration: none !important;
        cursor: pointer !important;
        user-select: none !important;
        vertical-align: bottom !important;
      }
      .dsh-session-anchor-capsule:hover {
        background: var(--dsw-alias-button-ghost-active-fill, rgba(128, 128, 128, 0.18)) !important;
      }
      .dsh-session-anchor-icon {
        flex: none;
        width: 14px;
        height: 14px;
        display: block;
      }
      .dsh-session-anchor-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      [data-dsh-nav-lead-hidden] {
        display: none !important;
      }
      @keyframes dshTurnPulse {
        0% { outline: 3px solid rgba(59, 130, 246, 0.9); background-color: rgba(59, 130, 246, 0.16); }
        100% { outline: 3px solid transparent; background-color: transparent; }
      }
      .dsh-navigator-highlight {
        animation: dshTurnPulse 2.4s ease-out forwards !important;
        border-radius: 8px !important;
      }
      #dsh-nav-id-hits {
        margin: 4px 8px 8px;
        padding-bottom: 4px;
      }
      .dsh-nav-id-hits-header {
        font-size: 11px;
        font-weight: 600;
        color: var(--dsw-alias-label-tertiary, #888);
        padding: 2px 4px 6px;
      }
      .dsh-nav-id-row {
        position: relative;
        display: flex;
        align-items: stretch;
        gap: 4px;
        margin: 0 0 2px;
      }
      .dsh-nav-id-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 6px 8px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
        user-select: none;
      }
      .dsh-nav-id-main:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.12)); }
      .dsh-nav-id-title {
        font-size: 13px;
        line-height: 18px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dsh-nav-id-meta {
        font-size: 11px;
        line-height: 16px;
        color: var(--dsw-alias-label-tertiary, #888);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dsh-nav-new-window {
        flex: none;
        align-self: center;
        width: 26px;
        height: 26px;
        border-radius: 6px;
        border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25));
        background: var(--dsw-alias-bg-base, transparent);
        color: var(--dsw-alias-label-secondary, #666);
        font-size: 13px;
        line-height: 24px;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
        user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .dsh-nav-new-window:hover {
        background: #2563eb !important;
        border-color: #2563eb !important;
        color: #fff !important;
      }

      /* 官方搜索结果项注入的小图标按钮：默认完全静默，悬停时优雅淡出，不遮挡日常视觉 */
      .dsh-nav-tree-item-arrow {
        flex: none;
        width: 20px;
        height: 20px;
        margin-left: auto;
        margin-right: 4px;
        border-radius: 4px;
        border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));
        background: var(--dsw-alias-bg-base, rgba(128, 128, 128, 0.08));
        color: var(--dsw-alias-label-secondary, #666);
        font-size: 11px;
        line-height: 18px;
        text-align: center;
        cursor: pointer;
        user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease, transform 0.12s ease, background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
      }
      [role="treeitem"]:hover .dsh-nav-tree-item-arrow {
        opacity: 0.85;
        pointer-events: auto;
      }
      .dsh-nav-tree-item-arrow:hover {
        opacity: 1 !important;
        background: #2563eb !important;
        border-color: #2563eb !important;
        color: #fff !important;
        transform: scale(1.08);
      }
      .dsh-copy-mention-toast {
        position: fixed;
        z-index: 10000;
        left: 50%;
        bottom: 88px;
        transform: translateX(-50%);
        padding: 8px 14px;
        border-radius: 8px;
        background: var(--dsw-alias-bg-layer-2, #fff);
        border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25));
        color: var(--dsw-alias-label-primary, #111);
        font-size: 13px;
        line-height: 18px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        pointer-events: none;
      }
      .dsh-nav-deeplink-hint {
        position: fixed;
        z-index: 9000;
        left: 50%;
        top: 15%;
        transform: translateX(-50%);
        max-width: min(460px, 80vw);
        padding: 10px 16px;
        border-radius: 10px;
        text-align: center;
        background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.96));
        border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25));
        color: var(--dsw-alias-label-primary, #111);
        box-shadow: 0 10px 30px rgba(0,0,0,0.14);
        pointer-events: none;
      }
      .dsh-nav-deeplink-hint-title {
        font-size: 13px;
        font-weight: 600;
        line-height: 20px;
      }
      .dsh-nav-deeplink-hint-sub {
        margin-top: 2px;
        font-size: 12px;
        line-height: 18px;
        color: var(--dsw-alias-label-tertiary, #888);
      }
      #dsh-nav-pin-group {
        margin: 0 0 6px;
        padding: 2px 0 6px;
        border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.16));
      }
      .dsh-nav-pin-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px 6px;
        font-size: 11px;
        font-weight: 600;
        line-height: 16px;
        color: var(--dsw-alias-label-tertiary, #888);
        user-select: none;
      }
      .dsh-nav-pin-header svg {
        width: 12px;
        height: 12px;
        color: var(--dsw-alias-state-business-primary, #2563eb);
      }
      .dsh-nav-pin-row {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 34px;
        padding: 0 8px 0 10px;
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
        color: var(--dsw-alias-label-primary, inherit);
      }
      .dsh-nav-pin-row:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.12));
      }
      .dsh-nav-pin-row[aria-selected="true"] {
        background: var(--dsw-alias-interactive-bg-hover, rgba(37,99,235,0.12));
      }
      .dsh-nav-pin-row.is-missing {
        opacity: 0.55;
      }
      .dsh-nav-pin-row-icon {
        flex: none;
        width: 14px;
        height: 14px;
        color: var(--dsw-alias-state-business-primary, #2563eb);
      }
      .dsh-nav-pin-row-title {
        flex: 1;
        min-width: 0;
        font-size: 13px;
        line-height: 18px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dsh-nav-pin-row-time {
        flex: none;
        font-size: 11px;
        line-height: 16px;
        color: var(--dsw-alias-label-tertiary, #888);
      }
      .dsh-nav-pin-row-unpin {
        flex: none;
        width: 22px;
        height: 22px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--dsw-alias-label-tertiary, #888);
        cursor: pointer;
        opacity: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .dsh-nav-pin-row:hover .dsh-nav-pin-row-unpin,
      .dsh-nav-pin-row-unpin:focus {
        opacity: 1;
      }
      .dsh-nav-pin-row-unpin:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.18));
        color: var(--dsw-alias-label-primary, #111);
      }
      [role="treeitem"][data-dsh-pinned="true"] {
        box-shadow: inset 2px 0 0 var(--dsw-alias-state-business-primary, #2563eb);
      }
    `

    let bootNav = captureBootNavNow()
    let searchHandoffQuery = ''
    let searchHandoffHintTimer = null
    let sessionsRef = null
    let conversationRef = null
    let uiWorkspaceRef = null
    let workspacesRef = null
    let pendingMenuSessionId = null
    let toastTimer = null
    let deepLinkJob = null
    let deepLinkHint = null
    const SESSION_REFERENCE_SCHEME = 'dsh-session:'
    const SESSION_MENTION_RE = /@\[((?:\\.|[^\\\]])*)\]\((dsh-session:[A-Za-z0-9_-]+)\)|(dsh-session:[A-Za-z0-9_-]+)/gu
    const COPY_ID_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.25"/><path d="M3.5 11H3a1 1 0 0 1-1-1V3.5A1.5 1.5 0 0 1 3.5 2h6.5a1 1 0 0 1 1 1v.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>'
    const COPY_MENTION_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.25" stroke="currentColor" stroke-width="1.25"/><path d="M10.2 8.15c0 1.15-.84 1.85-1.95 1.85-.46 0-.86-.12-1.16-.34" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/><circle cx="8.15" cy="8.05" r=".7" fill="currentColor"/><path d="M6.55 6.35c.28-.38.78-.6 1.4-.6.96 0 1.7.58 1.7 1.55v1.7" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>'
    const PIN_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8.2 1.8l5 5-1.35 1.05-1.15 3.2-1.7-1.7-3.55 3.55-.95-.95 3.55-3.55-1.7-1.7 3.2-1.15L8.2 1.8z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><path d="M6.4 9.6L3.2 14" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>'
    const PIN_REMOVE_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>'
    const PINS_ROUTE = '/dsh-session-navigator/pins'
    const PIN_ROUTE = '/dsh-session-navigator/pin'
    const PIN_GROUP_ID = 'dsh-nav-pin-group'
    let pinsDoc = { version: 1, pins: [] }
    let menuWatchTimer = null
    let hydrateUnsub = null
    const HYDRATE_RETRY_MS = [0, 16, 32, 80, 160, 400, 800]

    // 深链意图的存活上限。宿主在会话很多时 session.list 可能几十秒到数分钟才到，
    // 旧的 8 秒重试窗口会在列表到达前就放弃，窗口于是永远停在别处/空白。
    const DEEP_LINK_MAX_WAIT_MS = 15 * 60 * 1000
    const DEEP_LINK_POLL_MS = 250
    // 列表就绪后的抢回窗口：足够压过官方自己的启动导航，又不会长期和用户抢。
    const DEEP_LINK_SETTLE_MS = 20 * 1000

    function captureBootNavNow() {
      // 只认 URL。sessionStorage 会被 window.open 从父窗口克隆，
      // 用它做兜底会把父窗口的旧意图泄漏进无关的新窗口。
      if (typeof window === 'undefined') return null
      return parseNavFromUrl(window.location.href)
    }

    function normalizeSessionId(value) {
      const match = String(value || '').match(SESSION_ID_RE)
      return match ? match[0].toLowerCase() : null
    }

    function parseTurn(value) {
      if (typeof value === 'number') {
        return Number.isSafeInteger(value) && value > 0 ? value : null
      }
      if (typeof value !== 'string') return null
      const trimmed = value.trim()
      if (!/^\d+$/.test(trimmed)) return null
      const n = parseInt(trimmed, 10)
      return Number.isSafeInteger(n) && n > 0 ? n : null
    }

    function parseNavFromUrl(raw) {
      if (!raw) return null
      try {
        const url = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3080')
        const sessionId = normalizeSessionId(url.searchParams.get('session') || url.pathname || '')
        if (!sessionId) return null
        const turn = parseTurn(url.searchParams.get('turn'))
        return { sessionId, turn }
      } catch {
        return null
      }
    }

    function isSessionIdQuery(query) {
      const raw = String(query || '').trim()
      if (!raw) return false
      // 显式前缀: #xxx, @id:xxx, id:xxx
      if (/^(?:#|@id:|id:)\s*\S+/i.test(raw)) return true
      // 以 session- 开头
      if (/^session-[0-9a-fA-F-]{2,}/i.test(raw)) return true
      // 纯十六进制或 UUID 片段（至少 8 位 hex）
      if (/^[0-9a-f]{8}(?:-[0-9a-f]{4}){0,4}$/i.test(raw)) return true
      return false
    }

    function cleanSessionIdQuery(query) {
      let raw = String(query || '').trim()
      raw = raw.replace(/^(?:#|@id:|id:)\s*/i, '')
      return raw.trim()
    }

    function extractTurnFromText(text) {
      if (!text || typeof text !== 'string') return null
      const matchCn = text.match(/第\s*(\d+)\s*(?:轮|回合)/)
      if (matchCn) return parseTurn(matchCn[1])
      const matchEn = text.match(/\bturn[\s:#_-]*(\d+)\b/i)
      return matchEn ? parseTurn(matchEn[1]) : null
    }

    function findTurnForCode(el) {
      if (!el) return null
      // 1. 优先扫描紧邻其前面的兄弟节点（文本节点或行内元素）
      let prev = el.previousSibling
      while (prev) {
        const t = extractTurnFromText(prev.textContent)
        if (t) return t
        prev = prev.previousSibling
      }
      // 2. 从直接父元素中提取（例如 <li> 或 <p>）
      const parentTurn = extractTurnFromText(el.parentElement?.textContent)
      if (parentTurn) return parentTurn
      // 3. 从最近的结构容器（li, td, p, blockquote）提取
      const containerTurn = extractTurnFromText(el.closest('li, td, p, blockquote')?.textContent)
      if (containerTurn) return containerTurn
      // 4. 回退到元素上已设置的合法数字属性
      return parseTurn(el.getAttribute('data-dsh-turn'))
    }

    function formatCapsuleLabel(title, sessionId, _turn) {
      const id = normalizeSessionId(sessionId) || String(sessionId || '').trim()
      const name = String(title || '').trim()
      if (name && name !== id) return name
      return id
    }

    function formatCapsuleTooltip(title, sessionId, turn) {
      const id = normalizeSessionId(sessionId) || String(sessionId || '').trim()
      const name = formatCapsuleLabel(title, sessionId, turn)
      const turnN = parseTurn(turn)
      const lines = []
      if (name) lines.push(name)
      if (turnN) lines.push(`第 ${turnN} 轮`)
      if (id && id !== name) lines.push(id)
      lines.push('在新窗口打开')
      return lines.join('\n')
    }

    const LEAD_IN_HINT_RE = /查看会话|查看對話|Open session/i

    function isRedundantSessionLeadIn(text, { title, sessionId, turn } = {}) {
      const raw = String(text || '').replace(/\s+/g, ' ').trim()
      if (!raw || !LEAD_IN_HINT_RE.test(raw)) return false
      const id = normalizeSessionId(sessionId) || ''
      const name = String(title || '').trim()
      if (!name || name === id) return false
      let rest = raw.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, ' ')
      rest = rest.replace(/(?:查看会话|查看對話|Open session)\s*[：:]?/gi, ' ')
      rest = rest.split(name).join(' ')
      if (id) rest = rest.split(id).join(' ')
      rest = rest.replace(/第\s*\d+\s*(?:轮|回合)/g, ' ')
      rest = rest.replace(/\bturn[\s:#_-]*\d+\b/gi, ' ')
      rest = rest.replace(/[·•.,，。:：;；!！?？↗~\-_/\\|'"“”‘’()[\]【】（）\s]/g, '')
      return rest.length === 0
    }

    const SESSION_REF_ICON_PATH =
      'M8 0.597656C3.91296 0.597656 0.599716 3.91103 0.599609 7.99805C0.599609 9.13171 0.854567 10.2079 1.31152 11.1699L1.59277 11.7607L2.77441 11.1992L2.49414 10.6084L2.36035 10.3076C2.06865 9.59612 1.90723 8.81645 1.90723 7.99805C1.90733 4.63362 4.63554 1.90625 8 1.90625C11.3644 1.90635 14.0917 4.63368 14.0918 7.99805C14.0918 11.3625 11.3644 14.0907 8 14.0908C7.311 14.0908 6.80642 14.0414 6.35938 13.918C5.919 13.7963 5.50105 13.5929 5.00098 13.2441C4.26805 12.7329 3.21756 12.5526 2.35156 13.0996L2.33789 13.1084L2.32422 13.1182L1.74805 13.5234L2.18164 14.8184L3.05957 14.2002C3.37505 14.0068 3.84248 14.0319 4.25195 14.3174C4.84447 14.7307 5.39718 15.009 6.01172 15.1787C6.61963 15.3465 7.25579 15.3984 8 15.3984C12.087 15.3983 15.4004 12.0851 15.4004 7.99805C15.4003 3.9111 12.087 0.59776 8 0.597656ZM4.56836 8.50977V9.80371H8.12402V8.50977H4.56836ZM4.56836 7.30078H11.4619V6.00684H4.56836V7.30078Z'

    function createSessionRefIcon() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '14')
      svg.setAttribute('height', '14')
      svg.setAttribute('viewBox', '0 0 16 16')
      svg.setAttribute('fill', 'none')
      svg.setAttribute('aria-hidden', 'true')
      svg.classList.add('dsh-session-anchor-icon')
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', SESSION_REF_ICON_PATH)
      path.setAttribute('fill', 'currentColor')
      svg.appendChild(path)
      return svg
    }

    function paintSessionChip(anchor, { title, sessionId, turn }) {
      const id = normalizeSessionId(sessionId)
      if (!id || !(anchor instanceof Element)) return
      const label = formatCapsuleLabel(title, id, turn)
      const tooltip = formatCapsuleTooltip(title, id, turn)
      anchor.classList.add('dsh-session-anchor-capsule')
      anchor.classList.remove('dsh-session-anchor-host')
      anchor.dataset.dshSession = id
      if (turn) anchor.dataset.dshTurn = String(turn)
      else delete anchor.dataset.dshTurn
      anchor.setAttribute('title', tooltip)
      makeNativeAnchor(anchor, id, turn)
      const labelNode = anchor.querySelector('.dsh-session-anchor-label')
      const iconNode = anchor.querySelector('.dsh-session-anchor-icon')
      if (anchor.dataset.dshNavLabel === label && labelNode && iconNode) {
        if (labelNode.textContent !== label) labelNode.textContent = label
        return
      }
      anchor.textContent = ''
      const span = document.createElement('span')
      span.className = 'dsh-session-anchor-label'
      span.textContent = label
      anchor.append(createSessionRefIcon(), span)
      anchor.dataset.dshNavLabel = label
    }

    function hideRedundantLeadIn(host) {
      if (!(host instanceof Element)) return
      const sessionId = normalizeSessionId(
        host.getAttribute('data-dsh-session') ||
        host.querySelector('[data-dsh-session]')?.getAttribute('data-dsh-session') ||
        '',
      )
      if (!sessionId) return
      const title = sessionTitleOf(sessionId)
      if (!title || title === sessionId) return
      const turn = parseTurn(
        host.getAttribute('data-dsh-turn') ||
        host.querySelector('[data-dsh-turn]')?.getAttribute('data-dsh-turn'),
      )
      const opts = { title, sessionId, turn }

      const hideElement = (el) => {
        if (!(el instanceof Element) || el.getAttribute('data-dsh-nav-lead-hidden') === 'true') return
        if (el.contains(host)) return
        el.setAttribute('data-dsh-nav-lead-hidden', 'true')
        el.hidden = true
      }

      const hideTextNode = (node) => {
        if (!(node instanceof Text) || node.parentElement?.closest('[data-dsh-nav-lead-hidden]')) return
        const wrap = document.createElement('span')
        wrap.setAttribute('data-dsh-nav-lead-hidden', 'true')
        wrap.hidden = true
        node.parentNode.insertBefore(wrap, node)
        wrap.appendChild(node)
        let br = wrap.nextSibling
        while (br && br.nodeType === Node.TEXT_NODE && !String(br.nodeValue).trim()) br = br.nextSibling
        if (br && br.nodeName === 'BR') br.remove()
      }

      const tryHide = (node) => {
        if (!node) return false
        if (node.nodeType === Node.TEXT_NODE) {
          if (!isRedundantSessionLeadIn(node.nodeValue, opts)) return false
          hideTextNode(node)
          return true
        }
        if (!(node instanceof Element)) return false
        if (node.getAttribute('data-dsh-nav-lead-hidden') === 'true') return true
        if (node.contains(host)) return false
        if (node.matches?.('code, a, svg, .dsh-session-anchor-capsule, .dsh-session-anchor-host')) return false
        if (!isRedundantSessionLeadIn(node.textContent || '', opts)) return false
        hideElement(node)
        return true
      }

      let cursor = host
      for (let depth = 0; depth < 3 && cursor; depth += 1) {
        let prev = cursor.previousSibling
        while (prev) {
          if (prev.nodeType === Node.TEXT_NODE && !String(prev.nodeValue || '').trim()) {
            prev = prev.previousSibling
            continue
          }
          if (prev.nodeName === 'BR') {
            prev = prev.previousSibling
            continue
          }
          if (tryHide(prev)) return
          break
        }
        const parent = cursor.parentElement
        if (!parent || /^(LI|TD|BODY|HTML|ARTICLE)$/i.test(parent.tagName)) break
        cursor = parent
      }
    }

    function sessionTitleOf(sessionId) {
      const snap = sessionsRef?.list?.getSnapshot?.()
      const row = snap?.byId?.[sessionId]
      return row?.displayTitle || row?.title || ''
    }

    function findOfficialSearchInput() {
      const inputs = document.querySelectorAll('input')
      for (const input of inputs) {
        if (isOfficialSearchInput(input)) return input
      }
      return null
    }

    function isOfficialSearchInput(el) {
      if (!(el instanceof HTMLInputElement)) return false
      const label = (el.getAttribute('aria-label') || '').toLowerCase()
      const holder = (el.getAttribute('placeholder') || '').toLowerCase()
      return label.includes('搜索会话') || label.includes('search sessions') ||
        holder.includes('搜索会话') || holder.includes('search sessions')
    }

    function injectStyles() {
      let style = document.getElementById('dsh-session-navigator-styles')
      if (!style) {
        style = document.createElement('style')
        style.id = 'dsh-session-navigator-styles'
        document.head.appendChild(style)
      }
      style.textContent = CSS_STYLES
    }

    function removeStrayOverlay() {
      document.getElementById('dsh-search-enhancer')?.remove()
      document.querySelectorAll('.dsh-search-enhancer-box').forEach((el) => el.remove())
    }

    /**
     * 新标签的候选地址：只有当前这一个。
     *
     * 0.4.1 起不再往 localhost ⇄ 127.0.0.1 的另一边分流。分流的理由曾经成立——
     * 浏览器对单个 host:port 只给约 6 条并发连接，而每个 DSH 标签要常驻两条
     * （官方 client-hmr 的 /plugins/events + badge 通知流），三四个标签就挤满。
     * 现在这两条都归零（client-hmr 已关、badge 只留单例），容量不再需要靠换
     * 地址解决；而换地址的代价是确定的：登录 cookie 按 host:port 签发，另一边
     * 没有 cookie，打开就是一个 401「dsh web authentication required」页面。
     */
    function candidateOrigins() {
      return [window.location.origin]
    }

    function navUrlAt(origin, sessionId, turn, probeToken) {
      const url = new URL(origin)
      url.pathname = '/'
      url.searchParams.set('session', sessionId)
      if (turn) url.searchParams.set('turn', String(turn))
      else url.searchParams.delete('turn')
      if (probeToken) url.searchParams.set(NEW_TAB_PROBE_KEY, probeToken)
      url.hash = ''
      return url.toString()
    }

    function navUrl(sessionId, turn) {
      return navUrlAt(window.location.origin, sessionId, turn)
    }

    function sessionWindowName(sessionId) {
      const id = normalizeSessionId(sessionId)
      return id ? `dsh-session-${id}` : 'dsh-session'
    }

    // 官方把「当前会话」持久化在共享的 localStorage `dsh.sessions.current` 里，
    // 新窗口启动时会先恢复这个值。开新窗口前把它预置成目标会话，新窗口就能
    // 直接落在目标上，不必等 session.list 到达后再抢一次选择。
    const CURRENT_SELECTION_KEY = 'dsh.sessions.current'

    function primePersistedSelection(sessionId) {
      // 故意空操作。dsh.sessions.current 是同源所有窗口共用的官方状态，
      // 开窗前改它会把原标签的「当前会话」一起改掉，新标签还可能读到半截值。
      // 新标签只认自己 URL 上的 ?session=，由 openSessionInThisWindow 兑现。
      void sessionId
    }

    function isBlankPopupHref(href) {
      if (href == null) return true
      const value = String(href).trim()
      if (!value) return true
      return value === 'about:blank' || value.startsWith('about:blank')
    }

    function popupNeedsUrlAssign(openedHref, sessionId, turn) {
      if (isBlankPopupHref(openedHref)) return true
      const nav = parseNavFromUrl(openedHref)
      if (!nav) return true
      if (nav.sessionId !== sessionId) return true
      if (turn && nav.turn !== turn) return true
      return false
    }

    function sameOriginOpenerRoot() {
      let host = window
      const seen = new Set()
      while (host.opener && !host.opener.closed && !seen.has(host)) {
        seen.add(host)
        try {
          if (host.opener.location.origin !== window.location.origin) break
          host = host.opener
        } catch {
          break
        }
      }
      return host
    }

    function tryWindowOpen(host, url, name) {
      try {
        return host.open(url, name) || null
      } catch {
        return null
      }
    }

    function assignPopupUrl(win, url) {
      try {
        win.location.replace(url)
        return true
      } catch {
        try {
          win.location.href = url
          return true
        } catch {
          return false
        }
      }
    }

    function focusOpenedWindow(win) {
      try { win.focus() } catch { /* ignore */ }
    }

    // DSH 每个标签要维持约 4 条长连接（HMR 事件流 / 连接流 / 会话控制流 / 日志流），
    // 实测单个 origin 的连接额度约 13 条 —— 于是**每个 origin 同时只能养活 3 个
    // DSH 标签**，第 4 个会静默停在 about:blank（Chrome 不报错，JS 也捕获不到）。
    //
    // 所以开新标签一律「先开、再验、不行换 origin、最后才退回当前窗口」。
    const NEW_TAB_PROBE_KEY = 'navprobe'
    const NEW_TAB_PROBE_STEP_MS = 400
    // 「还是 about:blank」的判定要快：window.open 的用户手势只有约 5 秒有效期，
    // 探测拖太久，换 origin 重试的那次 window.open 就必被拦（实测确认）。
    const NEW_TAB_BLANK_MS = 3000
    const ORIGIN_MEMORY_KEY = 'dsh-nav.origin-exhausted'
    const ORIGIN_MEMORY_TTL_MS = 90 * 1000

    /** 本 origin 最近是否被判定为连接额度耗尽。 */
    function readOriginExhausted() {
      try {
        const raw = localStorage.getItem(ORIGIN_MEMORY_KEY)
        if (!raw) return false
        const at = Number(raw)
        return Number.isFinite(at) && Date.now() - at < ORIGIN_MEMORY_TTL_MS
      } catch {
        return false
      }
    }

    function markOriginExhausted() {
      try {
        localStorage.setItem(ORIGIN_MEMORY_KEY, String(Date.now()))
      } catch {
        /* ignore */
      }
    }

    function clearOriginExhausted() {
      try {
        localStorage.removeItem(ORIGIN_MEMORY_KEY)
      } catch {
        /* ignore */
      }
    }

    /**
     * 容量探测已下线。它存在的唯一目的是提前发现「本地址连接挤满」并引导用户换地址；
     * 现在每个标签的常驻连接是 0，「挤满」不再发生，而它给出的出口（换到
     * 127.0.0.1 / localhost 的另一边）恰恰会落到没有登录 cookie 的 401 页面上。
     * 保留函数是为了不打断调用点；顺手清掉可能残留的历史标记。
     */
    function startOriginHealthWatch() {
      clearOriginExhausted()
      return null
    }

    /**
     * 新页面报到：告诉开窗方「这个标签真的起来了」。
     *
     * 跨 origin（localhost ⇄ 127.0.0.1）读不到对方的 location / DOM，这个握手是唯一
     * 能区分「加载成功」和「401 认证页 / 空白页」的信号。
     */
    function announceEntry() {
      try {
        const url = new URL(window.location.href)
        const token = url.searchParams.get(NEW_TAB_PROBE_KEY)
        if (!token) return
        url.searchParams.delete(NEW_TAB_PROBE_KEY)
        window.history.replaceState(window.history.state, '', url.toString())
        if (window.opener) window.opener.postMessage({ [NEW_TAB_PROBE_KEY]: token }, '*')
      } catch {
        /* ignore */
      }
    }

    /**
     * 默认动作：在**新标签**打开目标会话（同源，不开到别的地址）。
     * 全程静默，只有新标签确实起不来时才退回当前窗口并给一次说明。
     */
    function openInNewWindow(sessionId, turn) {
      const origins = candidateOrigins()
      const token = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
      let settled = false
      let finished = false

      const onMessage = (event) => {
        const data = event.data
        if (!data || typeof data !== 'object') return
        if (data[NEW_TAB_PROBE_KEY] !== token) return
        settled = true
        done()
      }
      const done = () => {
        if (finished) return
        finished = true
        window.removeEventListener('message', onMessage)
      }
      window.addEventListener('message', onMessage)

      const fallbackToThisWindow = (message) => {
        done()
        openSessionInThisWindow(sessionId, turn)
        showCopyToast(message)
      }

      const attempt = (index) => {
        if (settled || finished) return
        if (index >= origins.length) {
          fallbackToThisWindow('新标签没能打开，已在当前窗口打开这个会话')
          return
        }
        const origin = origins[index]
        let win = null
        try {
          // 不能用 noopener：那会让 window.open 返回 null，没有句柄就验证不了。
          win = window.open(navUrlAt(origin, sessionId, turn, token), '_blank')
        } catch {
          win = null
        }
        if (!win) {
          // 弹窗被拦。首次尝试时交给宿主用 osascript 开（不经过弹窗拦截）；
          // 注意这条路由只接受 session/turn 两个参数，所以不能带 probe token。
          if (index === 0) {
            openChromeTab(navUrlAt(origin, sessionId, turn), 2000).then(
              (ok) => { if (ok) done(); else attempt(index + 1) },
              () => attempt(index + 1),
            )
            return
          }
          attempt(index + 1)
          return
        }

        const startedAt = Date.now()
        const probe = () => {
          if (settled || finished) return
          let closed = false
          try { closed = win.closed } catch { closed = false }
          if (closed) { done(); return } // 用户自己关了：别再补开
          let href = null
          try { href = win.location.href } catch { href = null }
          if (href !== null && href !== 'about:blank') {
            // 同源且导航已提交 —— 起来了。
            if (origin === window.location.origin) clearOriginExhausted()
            done()
            return
          }
          if (href === null) {
            // 跨源读不到 = 导航已提交（localhost ⇄ 127.0.0.1 互为跨源）—— 起来了。
            if (origin === window.location.origin) clearOriginExhausted()
            done()
            return
          }
          // 仍是 about:blank：要么首屏还没提交，要么这个 origin 的连接额度已用尽。
          if (Date.now() - startedAt >= NEW_TAB_BLANK_MS) {
            markOriginExhausted()
            try { win.close() } catch { /* 关不掉就留着，不阻塞主流程 */ }
            attempt(index + 1)
            return
          }
          setTimeout(probe, NEW_TAB_PROBE_STEP_MS)
        }
        setTimeout(probe, NEW_TAB_PROBE_STEP_MS)
      }

      attempt(0)
    }

    /**
     * 请求宿主用 osascript 开一个真正的 Chrome 标签（弹窗被拦时的备用通道）。
     * @param timeoutMs - 必须带超时：origin 连接耗尽时这个 fetch 会永久挂起，
     *                    没有超时的话调用点会一直等下去，点击就被静静吞掉。
     * @returns 是否成功排入开标签队列。
     */
    async function openChromeTab(url, timeoutMs) {
      const controller = typeof AbortController === 'function' ? new AbortController() : null
      const timer = controller && timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null
      try {
        const res = await fetch('/dsh-session-navigator/chrome-tab', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller ? controller.signal : undefined,
        })
        let data = null
        try {
          data = await res.json()
        } catch {
          data = null
        }
        return res.ok && data !== null && data.ok === true
      } finally {
        if (timer) clearTimeout(timer)
      }
    }

    function jumpToTurn(turn) {
      if (!turn) return
      let attempts = 0
      const timer = setInterval(() => {
        attempts += 1
        const row = document.querySelector(`[data-chat-turn="${turn}"]`)
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' })
          row.classList.add('dsh-navigator-highlight')
          clearInterval(timer)
          return
        }
        const labeled = document.querySelector(
          `button[aria-label="第 ${turn} 轮"], button[aria-label="Turn ${turn}"]`,
        )
        if (labeled) {
          labeled.scrollIntoView({ behavior: 'smooth', block: 'center' })
          labeled.classList.add('dsh-navigator-highlight')
          clearInterval(timer)
          return
        }
        if (attempts >= 40) clearInterval(timer)
      }, 200)
    }

    function trySelfHealConnectingWorkspace() {
      try {
        const ws = uiWorkspaceRef || (typeof window !== 'undefined' && window.__dshUiWorkspace)
        if (ws && ws.connecting instanceof Map && ws.connecting.size > 0) {
          console.warn('[dsh-session-navigator] self-healing stuck uiWorkspace.connecting state')
          ws.connecting.clear()
        }
      } catch {
        /* ignore */
      }
    }

    /**
     * 已停用：深链路径不再调用它。
     *
     * 它调用的 uiWorkspace.connectWorkspace() 找不到该工作区里的空白会话时，会直接
     * sessions.create({ workspaceId }) 造一个新会话。而列表未加载时 sessions.ids 就是空数组，
     * 「找不到空白会话」是必然结果 —— 于是每次深链都白送一个垃圾空白会话，还可能把刚选中的
     * 目标挤掉。内容区渲染并不需要它：ConversationRoot 只是从 workspaces.items 里只读查找
     * sessionWorkspace，找不到也只是少一个工作区标签。
     * 函数体保留作排查参照，不要在深链流程里重新调用。
     */
    function ensureSessionWorkspace(sessionId) {
      try {
        const snap = sessionsRef?.list?.getSnapshot?.()
        const row = snap?.byId?.[sessionId]
        if (!row || !row.cwd) return
        const wsSnap = workspacesRef?.list?.getSnapshot?.() || uiWorkspaceRef?.workspaces?.list?.getSnapshot?.()
        if (!wsSnap?.items) return
        const matchingWs = wsSnap.items.find((item) => item.path === row.cwd || (item.sessionIds && item.sessionIds.includes(sessionId)))
        if (matchingWs && uiWorkspaceRef && typeof uiWorkspaceRef.connectWorkspace === 'function') {
          // 确保目标工作区已知，避免 ConversationRoot 因为找不到 sessionWorkspace 而进入空白分支
          uiWorkspaceRef.connectWorkspace(matchingWs.workspaceId).catch(() => {})
        }
      } catch (err) {
        console.warn('[dsh-session-navigator] ensureSessionWorkspace warning:', err)
      }
    }

    // 深链等待提示：宿主在会话很多时列表要几十秒到数分钟才到，期间官方的
    // 会话区是「探索未至之境 + 选择工作区」的空壳。给用户一个明确的进度提示，
    // 而不是让他以为窗口坏了。
    function showDeepLinkHint(label, detail) {
      try {
        let el = deepLinkHint
        if (!el || !el.isConnected) {
          el = document.createElement('div')
          el.id = 'dsh-nav-deeplink-hint'
          el.className = 'dsh-nav-deeplink-hint'
          el.setAttribute('data-dsh-nav-internal', 'true')
          document.body.appendChild(el)
          deepLinkHint = el
        }
        el.innerHTML = ''
        const title = document.createElement('div')
        title.className = 'dsh-nav-deeplink-hint-title'
        title.textContent = label
        el.appendChild(title)
        if (detail) {
          const sub = document.createElement('div')
          sub.className = 'dsh-nav-deeplink-hint-sub'
          sub.textContent = detail
          el.appendChild(sub)
        }
      } catch {
        /* ignore */
      }
    }

    function hideDeepLinkHint() {
      try {
        deepLinkHint?.remove()
      } catch {
        /* ignore */
      }
      deepLinkHint = null
    }

    const SUMMARY_ENDPOINT = '/dsh-session-navigator/session-summary'

    /**
     * 让官方 `sessions.select()` 的守卫立刻放行。
     *
     * 官方 select() 拒绝任何「还不在已加载会话列表里」的 id，而那份列表要对全库
     * 每个冷会话逐个算投影（本机 429 个会话实测要几分钟）。但官方自己推送
     * 「新增了一个会话」走的就是 `handleSessionAdded(summary)`：它经过
     * mergeSummary → applyMutation 的 upsert 分支直接前插，不校验列表。
     * 借这条官方增量通道把目标单独喂进去，代价只有「读一个投影缓存文件」。
     *
     * @returns Promise<boolean>，false 表示注入不可用（宿主改了内部方法、缓存缺失
     *          或目标已在列表里），调用方回落到等列表的老路径。
     */
    function injectTargetSummary(sessions, target) {
      const snap = sessions.list?.getSnapshot?.()
      // 已经在列表或已是当前会话：不需要注入，交给正常路径。
      if (snap?.byId?.[target] !== undefined || snap?.current === target) return Promise.resolve(false)
      // 内部方法缺失（官方未来改实现）：静默回落，不让深链变成一个抛错的空窗口。
      if (typeof sessions.handleSessionAdded !== 'function') return Promise.resolve(false)
      return fetch(`${SUMMARY_ENDPOINT}?id=${encodeURIComponent(target)}`, {
        headers: { accept: 'application/json' },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const summary = data?.ok === true ? data.summary : null
          if (!summary || normalizeSessionId(summary.sessionId) !== target) return false
          sessions.handleSessionAdded(summary)
          return true
        })
        .catch(() => false)
    }

    /**
     * 核心切换逻辑：把「目标会话成为当前会话」当成一个必须完成的任务。
     * 与旧实现的区别：
     * - 不再 8 秒放弃。列表晚到（本机 400+ 会话时实测要几分钟）也一定会被兑现；
     * - 列表就绪后的「结算窗口」内持续抢回选择，压过官方自己的启动导航；
     * - 结算窗口之后，只要官方还停在空状态就继续抢；用户已经选了别的会话就退位，
     *   绝不和用户抢；
     * - 目标确认落地后清掉 URL 上的深链参数，避免刷新时重复抢选择。
     */
    function openSessionInThisWindow(sessionId, turn) {
      const sessions = sessionsRef
      const target = normalizeSessionId(sessionId)
      if (!sessions || !target) return

      deepLinkJob?.finish()

      const startedAt = Date.now()
      let listReadyAt = null
      let settleTimer = null
      let pollTimer = null
      let unsub = null
      let jumpDone = false

      const isCurrent = () => sessions.list?.getSnapshot?.()?.current === target

      const tryJump = () => {
        if (!turn || jumpDone) return
        jumpDone = true
        setTimeout(() => jumpToTurn(turn), 300)
      }

      const job = {
        target,
        finish() {
          if (unsub) {
            unsub()
            unsub = null
          }
          if (settleTimer) {
            clearTimeout(settleTimer)
            settleTimer = null
          }
          if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
          }
          hideDeepLinkHint()
          if (deepLinkJob === job) deepLinkJob = null
        },
      }

      const isListed = (snap) =>
        Boolean(snap?.ids && snap.ids.includes(target)) || Boolean(snap?.byId && snap.byId[target])

      // 与 protocol.js 的 nextDeepLinkAction / DEEP_LINK_ACTION 保持同语义
      // （client.js 是独立客户端 bundle，不能 import 本地模块）。
      /** @returns 'done' | 'wait' | 'open' | 'yield' | 'timeout' */
      const decide = (snap) => {
        if (!snap) return 'wait'
        const now = Date.now()
        if (snap.current === target) return 'done'
        if (!isListed(snap)) {
          return now - startedAt > DEEP_LINK_MAX_WAIT_MS ? 'timeout' : 'wait'
        }
        if (listReadyAt === null) listReadyAt = now
        if (now - listReadyAt > DEEP_LINK_SETTLE_MS && snap.current !== undefined) return 'yield'
        return 'open'
      }

      /** @returns true 表示任务可以收尾（已达成，或应当退位）。 */
      const attempt = () => {
        if (job !== deepLinkJob) return true
        const action = decide(sessions.list?.getSnapshot?.())
        if (action === 'timeout') {
          showDeepLinkHint('目标会话仍未就绪', '可以稍后刷新，或用左上角搜索直接打开')
          setTimeout(() => job.finish(), 4000)
          return true
        }
        if (action !== 'open') return action === 'done' || action === 'yield'
        try {
          sessions.open(target)
        } catch (error) {
          console.warn('[dsh-session-navigator] sessions.open warning:', error)
          return false
        }
        return isCurrent()
      }

      const onSettled = () => {
        const landed = isCurrent()
        job.finish()
        if (landed) {
          tryJump()
          clearDeepLinkQuery()
        }
      }

      // 必须先挂上 job，再做首次 attempt。否则 attempt 里的
      // `job !== deepLinkJob` 会把「还没开始」误判成「已被取代」，
      // 列表还没到就把深链收掉，新标签永远停在探索未至之境。
      deepLinkJob = job
      showDeepLinkHint('正在打开目标会话…', '正在读取会话摘要')

      const startWaiting = () => {
        if (job !== deepLinkJob) return
        // 首次尝试：已经是当前会话就立刻收工；否则挂上订阅和轮询等列表。
        if (attempt()) {
          onSettled()
          return
        }

        if (typeof sessions.list?.subscribe === 'function') {
          unsub = sessions.list.subscribe(() => {
            if (job !== deepLinkJob) return
            if (attempt()) onSettled()
          })
        }

        // 主动轮询：订阅在某些宿主实现里只推增量，轮询是廉价且可靠的兜底。
        // 超时判定放在 decide() 里，这里不再自己抢答，避免两处规则漂移。
        pollTimer = setInterval(() => {
          if (job !== deepLinkJob) {
            job.finish()
            return
          }
          if (attempt()) onSettled()
        }, DEEP_LINK_POLL_MS)
      }

      // 注入只对「目标还不在列表里」有意义，而那正是新标签的场景：摘要一到，
      // startWaiting 的首次 attempt 就能落地，等列表的兜底逻辑根本不会启动。
      injectTargetSummary(sessions, target)
        .catch(() => false)
        .then((injected) => {
          if (job !== deepLinkJob) return
          if (injected) showDeepLinkHint('正在打开目标会话…', '正在载入会话内容')
          startWaiting()
        })
    }

    function clearDeepLinkQuery() {
      try {
        const url = new URL(window.location.href)
        if (!url.searchParams.has('session') && !url.searchParams.has('turn')) return
        url.searchParams.delete('session')
        url.searchParams.delete('turn')
        window.history.replaceState(window.history.state, '', url.toString())
      } catch {
        /* ignore */
      }
    }

    // 意图隔离：只有明确具有 Session ID 语法特征时才搜 ID，避免输入 ce、测试等普通词时误伤
    function collectIdHits(query) {
      if (!isSessionIdQuery(query)) return []
      const cleaned = cleanSessionIdQuery(query).toLowerCase()
      if (cleaned.length < 2) return []
      const snap = sessionsRef?.list?.getSnapshot?.()
      if (!snap?.ids) return []
      const hits = []
      for (const id of snap.ids) {
        if (typeof id !== 'string' || !id.toLowerCase().includes(cleaned)) continue
        const row = snap.byId?.[id]
        if (row?.blank) continue
        hits.push({
          sessionId: id,
          title: row?.displayTitle || row?.title || id,
          workspace: row?.cwd ? String(row.cwd).split(/[/\\]/).pop() : '',
        })
        if (hits.length >= 10) break
      }
      return hits
    }

    function findSearchResultsHost() {
      const tree = document.querySelector('[role="tree"][aria-label="搜索结果"]')
        || document.querySelector('[role="tree"][aria-label="Search results"]')
      if (tree?.parentElement) return tree.parentElement
      const input = findOfficialSearchInput()
      if (!input) return null
      let el = input.parentElement
      for (let i = 0; i < 12 && el; i++) {
        const status = [...el.querySelectorAll('[role="status"]')].find((node) => /搜索|Search/.test(node.textContent || ''))
        if (status?.parentElement) return status.parentElement
        el = el.parentElement
      }
      return null
    }

    function hideOfficialEmpty(host, hasHits) {
      if (!host) return
      for (const el of host.querySelectorAll('[role="status"], [class*="empty"], [class*="searchStatus"]')) {
        const text = (el.textContent || '').trim()
        if (!/正在搜索会话历史|无匹配会话|Searching session history|No matching sessions/.test(text)) continue
        if (text.length > 40) continue
        el.style.display = hasHits ? 'none' : ''
      }
    }

    function renderInstantIdHits(query) {
      const host = findSearchResultsHost()
      const hits = collectIdHits(query)
      let box = document.getElementById('dsh-nav-id-hits')
      if (!query || query.trim().length < 2 || hits.length === 0) {
        box?.remove()
        if (host) hideOfficialEmpty(host, false)
        return
      }
      if (!host) return
      if (!box) {
        box = document.createElement('div')
        box.id = 'dsh-nav-id-hits'
        host.insertBefore(box, host.firstChild)
      } else if (box.parentElement !== host) {
        host.insertBefore(box, host.firstChild)
      }
      box.innerHTML = ''
      const header = document.createElement('div')
      header.className = 'dsh-nav-id-hits-header'
      header.textContent = `会话 ID 精准直达（${hits.length}）`
      box.appendChild(header)

      for (const hit of hits) {
        const row = document.createElement('div')
        row.className = 'dsh-nav-id-row'
        const main = document.createElement('button')
        main.type = 'button'
        main.className = 'dsh-nav-id-main'
        main.dataset.dshSession = hit.sessionId
        main.innerHTML = `<span class="dsh-nav-id-title"></span><span class="dsh-nav-id-meta"></span>`
        main.querySelector('.dsh-nav-id-title').textContent = hit.title || hit.sessionId
        main.querySelector('.dsh-nav-id-meta').textContent = [hit.workspace, hit.sessionId].filter(Boolean).join(' · ')

        const triggerOpen = (event) => {
          event.preventDefault()
          event.stopPropagation()
          openSessionInThisWindow(hit.sessionId)
        }
        main.addEventListener('pointerdown', (e) => {
          e.preventDefault()
        })
        main.addEventListener('pointerup', triggerOpen)
        main.addEventListener('click', triggerOpen)

        const arrow = document.createElement('a')
        arrow.className = 'dsh-nav-new-window'
        arrow.href = `/?session=${encodeURIComponent(hit.sessionId)}`
        arrow.dataset.dshSession = hit.sessionId
        arrow.title = '在新窗口打开此会话'
        arrow.textContent = '↗'

        const triggerNewWindow = (event) => {
          event.preventDefault()
          event.stopPropagation()
          openInNewWindow(hit.sessionId)
        }
        arrow.addEventListener('pointerdown', (e) => {
          e.preventDefault()
          e.stopPropagation()
        })
        arrow.addEventListener('pointerup', triggerNewWindow)
        arrow.addEventListener('click', triggerNewWindow)

        row.appendChild(main)
        row.appendChild(arrow)
        box.appendChild(row)
      }
      hideOfficialEmpty(host, true)
    }

    // 核心方法：基于 React Fiber 100% 精确提取 Session ID，消灭脆弱的文本猜测
    function getSessionIdFromElement(el) {
      if (!(el instanceof Element)) return null
      const direct = el.getAttribute('data-dsh-session') || el.dataset?.dshSession
      if (direct) return normalizeSessionId(direct)

      const target = el.closest('[role="treeitem"]') || el
      const key = Object.keys(target).find((k) => k.startsWith('__reactFiber$'))
      if (key) {
        let curr = target[key]
        while (curr) {
          const resId = curr.memoizedProps?.result?.id
          if (typeof resId === 'string' && resId.startsWith('session-')) {
            return normalizeSessionId(resId)
          }
          const nodeId = curr.memoizedProps?.node?.id
          if (typeof nodeId === 'string' && nodeId.startsWith('session-')) {
            return normalizeSessionId(nodeId)
          }
          curr = curr.return
        }
      }
      return null
    }

    function mentionLocale() {
      return String(document.documentElement?.lang || '').toLowerCase().startsWith('en') ? 'en' : 'zh'
    }

    function bytesToBase64Url(bytes) {
      let binary = ''
      for (const byte of bytes) binary += String.fromCharCode(byte)
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    }

    function base64UrlToBytes(payload) {
      const padded = payload.replace(/-/g, '+').replace(/_/g, '/')
      const b64 = padded + '='.repeat((4 - (padded.length % 4)) % 4)
      const binary = atob(b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
      return bytes
    }

    function encodeSessionReferenceUri(sessionId) {
      return `${SESSION_REFERENCE_SCHEME}${bytesToBase64Url(new TextEncoder().encode(JSON.stringify(sessionId)))}`
    }

    function decodeSessionReferenceUri(uri) {
      if (typeof uri !== 'string' || !uri.startsWith(SESSION_REFERENCE_SCHEME)) return null
      const payload = uri.slice(SESSION_REFERENCE_SCHEME.length)
      if (!/^[A-Za-z0-9_-]+$/.test(payload)) return null
      try {
        const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)))
        if (typeof parsed !== 'string') return null
        if (encodeSessionReferenceUri(parsed) !== uri) return null
        return parsed
      } catch {
        return null
      }
    }

    function escapeSessionMentionLabel(label) {
      return String(label ?? '').replace(/[\\\]]/gu, (match) => `\\${match}`)
    }

    function unescapeSessionMentionLabel(label) {
      return String(label ?? '').replace(/\\(.)/gu, '$1')
    }

    function formatSessionReferenceMention(sessionId, label) {
      return `@[${escapeSessionMentionLabel(label || sessionId)}](${encodeSessionReferenceUri(sessionId)})`
    }

    function parseSessionReferenceMentions(text) {
      if (typeof text !== 'string' || text === '') return []
      const mentions = []
      const pattern = new RegExp(SESSION_MENTION_RE.source, 'gu')
      let match
      while ((match = pattern.exec(text))) {
        const uri = match[2] || match[3]
        const sessionId = decodeSessionReferenceUri(uri)
        if (!sessionId) continue
        const label = match[2] === undefined ? sessionId : unescapeSessionMentionLabel(match[1])
        mentions.push({
          match: match[0],
          index: match.index,
          sessionId,
          label,
          mention: formatSessionReferenceMention(sessionId, label),
        })
      }
      return mentions
    }

    function clipboardOffsetToDetect(occurrences, clipboardOffset) {
      let clip = 0
      let detect = 0
      for (const occ of occurrences || []) {
        const start = occ.offset
        const length = occ.length
        if (!Number.isFinite(start) || !Number.isFinite(length) || length < 0) continue
        if (clipboardOffset <= start) return detect + (clipboardOffset - clip)
        detect += start - clip
        clip = start
        if (clipboardOffset < start + length) return detect + 1
        clip += length
        detect += 1
      }
      return detect + (clipboardOffset - clip)
    }

    function findPlainSessionMentions(draft, occurrences) {
      return parseSessionReferenceMentions(draft).filter((item) => {
        const end = item.index + item.match.length
        return !(occurrences || []).some((occ) => occ.offset <= item.index && item.index < occ.offset + occ.length && end <= occ.offset + occ.length)
      })
    }

    function isSessionActionsButton(btn) {
      if (!(btn instanceof HTMLElement)) return false
      const label = btn.getAttribute('aria-label') || ''
      if (/工作区|Workspace actions/.test(label)) return false
      return /会话.*的操作$/.test(label) || /^Session actions for /.test(label)
    }

    function isSessionActionsMenuText(text) {
      const value = String(text || '')
      return (value.includes('分叉会话') || value.includes('Fork session'))
        && (value.includes('归档会话') || value.includes('Archive session'))
    }

    function sessionMenuItemHost(menuItem) {
      if (!menuItem || typeof menuItem !== 'object') return null
      const wrap = menuItem.parentElement
      if (!wrap) return null
      const host = wrap.parentElement
      if (!host) return null
      return { host, before: wrap }
    }

    function sessionCopyMenuLabels(locale) {
      const en = String(locale || '').toLowerCase().startsWith('en')
      if (en) {
        return {
          id: 'Copy session ID',
          mention: 'Copy session mention',
          copiedId: 'Copied session ID',
          copiedMention: 'Copied session mention',
          failed: 'Copy failed',
        }
      }
      return {
        id: '复制会话 ID',
        mention: '复制会话引用',
        copiedId: '已复制会话 ID',
        copiedMention: '已复制会话引用',
        failed: '复制失败',
      }
    }

    function parseExclusiveSessionMention(text) {
      const trimmed = String(text ?? '').trim()
      if (!trimmed) return null
      const parsed = parseSessionReferenceMentions(trimmed)
      if (parsed.length !== 1) return null
      if (parsed[0].match !== trimmed) return null
      return parsed[0]
    }

    function nextSessionMentionHydration(snapshot) {
      if (!snapshot || (snapshot.phase !== 'plain' && snapshot.phase !== 'claimed')) return null
      const draft = typeof snapshot.draft === 'string' ? snapshot.draft : ''
      const occurrences = snapshot.occurrences || []
      const plains = findPlainSessionMentions(draft, occurrences)
      if (plains.length === 0) return null
      const item = plains[0]
      const start = clipboardOffsetToDetect(occurrences, item.index)
      const end = clipboardOffsetToDetect(occurrences, item.index + item.match.length)
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
      if (typeof snapshot.draftRev !== 'number') return null
      return {
        sessionId: item.sessionId,
        label: item.label,
        mention: item.mention,
        start,
        end,
        draftRev: snapshot.draftRev,
      }
    }


    function ownValue(object, key) {
      if (!object || typeof object !== 'object') return undefined
      if (!Object.prototype.hasOwnProperty.call(object, key)) return undefined
      return object[key]
    }

    function asPinRecord(value) {
      if (typeof value === 'string') {
        const sessionId = normalizeSessionId(value)
        return sessionId ? { sessionId, pinnedAt: 0 } : null
      }
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null
      const sessionId = normalizeSessionId(ownValue(value, 'sessionId') || ownValue(value, 'id'))
      if (!sessionId) return null
      const pinnedAt = Number(ownValue(value, 'pinnedAt'))
      return {
        sessionId,
        pinnedAt: Number.isFinite(pinnedAt) && pinnedAt > 0 ? pinnedAt : 0,
      }
    }

    function normalizePinDocument(raw) {
      const listed = Array.isArray(raw) ? raw : ownValue(raw, 'pins')
      const source = Array.isArray(listed) ? listed : []
      const pins = []
      const seen = new Set()
      for (const item of source) {
        const record = asPinRecord(item)
        if (!record || seen.has(record.sessionId)) continue
        seen.add(record.sessionId)
        pins.push(record)
        if (pins.length >= 40) break
      }
      return { version: 1, pins }
    }

    function isSessionPinned(document, sessionId) {
      const id = normalizeSessionId(sessionId)
      if (!id) return false
      return normalizePinDocument(document).pins.some((item) => item.sessionId === id)
    }

    function togglePinnedSession(document, sessionId, pinned, now = Date.now()) {
      const id = normalizeSessionId(sessionId)
      const current = normalizePinDocument(document)
      if (!id) return { ok: false, error: 'invalid session id', document: current, pinned: false }
      const nextPins = current.pins.filter((item) => item.sessionId !== id)
      if (pinned) {
        const at = Number(now)
        nextPins.unshift({
          sessionId: id,
          pinnedAt: Number.isFinite(at) && at > 0 ? at : Date.now(),
        })
        if (nextPins.length > 40) nextPins.length = 40
      }
      return { ok: true, document: { version: 1, pins: nextPins }, pinned: pinned === true }
    }

    function sessionPinMenuLabels(locale) {
      const en = String(locale || '').toLowerCase().startsWith('en')
      if (en) {
        return {
          pin: 'Pin session',
          unpin: 'Unpin session',
          group: 'Pinned',
          pinnedToast: 'Pinned',
          unpinnedToast: 'Unpinned',
          failed: 'Pin failed',
          missing: 'Unavailable',
        }
      }
      return {
        pin: '置顶会话',
        unpin: '取消置顶',
        group: '置顶',
        pinnedToast: '已置顶',
        unpinnedToast: '已取消置顶',
        failed: '置顶失败',
        missing: '会话不可用',
      }
    }

    function compactRelativeTime(updatedAt, now, locale = 'zh') {
      const t = Number(updatedAt)
      if (!Number.isFinite(t) || t <= 0) return ''
      const delta = Math.max(0, Number(now) - t)
      const en = String(locale || '').toLowerCase().startsWith('en')
      const minutes = Math.floor(delta / 60000)
      if (minutes < 1) return en ? 'now' : '刚刚'
      if (minutes < 60) return en ? `${minutes}m` : `${minutes}分钟`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return en ? `${hours}h` : `${hours}小时`
      const days = Math.floor(hours / 24)
      if (days < 30) return en ? `${days}d` : `${days}天`
      const months = Math.floor(days / 30)
      if (months < 12) return en ? `${months}mo` : `${months}个月`
      const years = Math.floor(days / 365)
      return en ? `${years}y` : `${years}年`
    }

    function tagSessionRows() {
      for (const row of document.querySelectorAll('[role="treeitem"]')) {
        if (row.getAttribute('data-dsh-session')) continue
        const sid = getSessionIdFromElement(row)
        if (sid) row.setAttribute('data-dsh-session', sid)
      }
    }

    async function writeClipboard(text) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
          return true
        }
      } catch { /* fall through */ }
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.left = '-9999px'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        area.remove()
        return ok
      } catch {
        return false
      }
    }

    function showCopyToast(okOrMessage) {
      document.getElementById('dsh-copy-mention-toast')?.remove()
      const toast = document.createElement('div')
      toast.id = 'dsh-copy-mention-toast'
      toast.className = 'dsh-copy-mention-toast'
      if (typeof okOrMessage === 'string') {
        toast.textContent = okOrMessage
      } else {
        const labels = sessionCopyMenuLabels(mentionLocale())
        toast.textContent = okOrMessage ? labels.copiedMention : labels.failed
      }
      document.body.appendChild(toast)
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => toast.remove(), 1600)
    }

    function closeOpenMenus() {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }

    async function copySessionId(sessionId) {
      const sid = normalizeSessionId(sessionId)
      if (!sid) return
      const labels = sessionCopyMenuLabels(mentionLocale())
      const ok = await writeClipboard(sid)
      showCopyToast(ok ? labels.copiedId : labels.failed)
      closeOpenMenus()
    }

    async function copySessionMention(sessionId) {
      const sid = normalizeSessionId(sessionId)
      if (!sid) return
      const labels = sessionCopyMenuLabels(mentionLocale())
      const label = sessionTitleOf(sid) || sid
      const mention = formatSessionReferenceMention(sid, label)
      const ok = await writeClipboard(mention)
      showCopyToast(ok ? labels.copiedMention : labels.failed)
      closeOpenMenus()
    }

    function replaceMenuItemLabel(item, label) {
      const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT)
      let textNode = walker.nextNode()
      while (textNode) {
        if ((textNode.textContent || '').trim()) {
          textNode.textContent = label
          return
        }
        textNode = walker.nextNode()
      }
      item.append(label)
    }

    function findOpenSessionMenu() {
      for (const el of document.querySelectorAll('[role="menu"]')) {
        if (isSessionActionsMenuText(el.textContent)) return el
      }
      const fork = [...document.querySelectorAll('button, [role="menuitem"]')].find((el) => /分叉会话|Fork session/.test(el.textContent || ''))
      const parent = fork?.parentElement
      return parent && isSessionActionsMenuText(parent.textContent) ? parent : null
    }

    function sessionIdForOpenMenu() {
      return pendingMenuSessionId
        || getSessionIdFromElement(document.querySelector('[role="treeitem"][aria-selected="true"]'))
    }

    function officialMenuSample(menu) {
      const items = [...menu.querySelectorAll('[role="menuitem"], button')].filter((el) => {
        if (!(el instanceof HTMLElement)) return false
        if (el.closest('[data-dsh-copy-menu]')) return false
        return /重命名|Rename|分叉会话|Fork session|归档会话|Archive session/.test(el.textContent || '')
      })
      return items[0] || null
    }

    function prepareClonedCopyItem(wrap, { key, sessionId, label, iconSvg, onCopy }) {
      wrap.dataset.dshCopyMenu = key
      wrap.dataset.dshSession = sessionId
      wrap.querySelector('[class*="check"]')?.remove()
      const btn = wrap.querySelector('[role="menuitem"], button') || wrap
      if (btn instanceof HTMLElement) {
        btn.dataset.dshCopyMenu = key
        btn.dataset.dshSession = sessionId
        btn.removeAttribute('aria-haspopup')
        btn.removeAttribute('aria-expanded')
        btn.removeAttribute('disabled')
      }
      replaceMenuItemLabel(wrap, label)
      const svg = wrap.querySelector('svg')
      if (svg) svg.outerHTML = iconSvg
      const handle = (event) => {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        onCopy()
      }
      wrap.addEventListener('pointerdown', handle, true)
      wrap.addEventListener('click', handle, true)
      btn.addEventListener('pointerdown', handle, true)
      btn.addEventListener('click', handle, true)
      return wrap
    }

    function injectSessionCopyMenuItems() {
      const menu = findOpenSessionMenu()
      if (!menu) return
      const sessionId = sessionIdForOpenMenu()
      if (!sessionId) return
      const pinned = isSessionPinned(pinsDoc, sessionId)
      const existingId = menu.querySelector('[data-dsh-copy-menu="id"]')
      const existingMention = menu.querySelector('[data-dsh-copy-menu="mention"]')
      const existingPin = menu.querySelector('[data-dsh-copy-menu="pin"]')
      if (existingId && existingMention && existingPin
        && existingId.getAttribute('data-dsh-session') === sessionId
        && existingMention.getAttribute('data-dsh-session') === sessionId
        && existingPin.getAttribute('data-dsh-session') === sessionId
        && existingPin.getAttribute('data-dsh-pinned') === (pinned ? '1' : '0')) {
        return
      }
      menu.querySelectorAll('[data-dsh-copy-menu]').forEach((el) => el.remove())

      const sample = officialMenuSample(menu)
      if (!sample) return
      const slot = sessionMenuItemHost(sample)
      if (!slot) return
      const copyLabels = sessionCopyMenuLabels(mentionLocale())
      const pinLabels = sessionPinMenuLabels(mentionLocale())
      const mentionWrap = prepareClonedCopyItem(slot.before.cloneNode(true), {
        key: 'mention',
        sessionId,
        label: copyLabels.mention,
        iconSvg: COPY_MENTION_ICON_SVG,
        onCopy: () => { copySessionMention(sessionId) },
      })
      const idWrap = prepareClonedCopyItem(slot.before.cloneNode(true), {
        key: 'id',
        sessionId,
        label: copyLabels.id,
        iconSvg: COPY_ID_ICON_SVG,
        onCopy: () => { copySessionId(sessionId) },
      })
      const pinWrap = prepareClonedCopyItem(slot.before.cloneNode(true), {
        key: 'pin',
        sessionId,
        label: pinned ? pinLabels.unpin : pinLabels.pin,
        iconSvg: PIN_ICON_SVG,
        onCopy: () => { setSessionPinned(sessionId, !pinned) },
      })
      pinWrap.setAttribute('data-dsh-pinned', pinned ? '1' : '0')
      const pinBtn = pinWrap.querySelector('[role="menuitem"], button')
      if (pinBtn) pinBtn.setAttribute('data-dsh-pinned', pinned ? '1' : '0')
      try {
        slot.host.insertBefore(pinWrap, slot.before)
        slot.host.insertBefore(idWrap, slot.before)
        slot.host.insertBefore(mentionWrap, slot.before)
      } catch (error) {
        console.warn('[dsh-session-navigator] session menu inject failed:', error)
      }
    }

    function startMenuWatch() {
      if (menuWatchTimer) return
      let ticks = 0
      menuWatchTimer = setInterval(() => {
        ticks += 1
        injectSessionCopyMenuItems()
        if (!findOpenSessionMenu() || ticks > 80) {
          clearInterval(menuWatchTimer)
          menuWatchTimer = null
        }
      }, 50)
    }

    function findSessionTree() {
      for (const tree of document.querySelectorAll('[role="tree"]')) {
        const label = tree.getAttribute('aria-label') || ''
        if (label === '会话' || label === 'Sessions') return tree
      }
      return null
    }

    function pinGroupSignature() {
      const snap = sessionsRef?.list?.getSnapshot?.()
      const current = snap?.current || ''
      return pinsDoc.pins.map((item) => {
        const row = snap?.byId?.[item.sessionId]
        const title = row?.displayTitle || row?.title || ''
        return `${item.sessionId}\t${title}\t${item.sessionId === current ? '1' : '0'}`
      }).join('|')
    }

    let pinsBroadcast = null
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        pinsBroadcast = new BroadcastChannel('dsh-pins-sync')
        pinsBroadcast.onmessage = (ev) => {
          if (ev?.data?.type === 'pins-updated' && ev.data.document) {
            pinsDoc = normalizePinDocument(ev.data.document)
            renderPinnedGroup()
            markOfficialPinnedRows()
          }
        }
      }
    } catch {}

    async function loadPins(silent = false) {
      try {
        const res = await fetch(PINS_ROUTE, {
          credentials: 'same-origin',
          headers: { accept: 'application/json' },
        })
        const data = await res.json()
        if (data?.ok) {
          const next = normalizePinDocument(data.document)
          const currSig = pinsDoc.pins.map((p) => `${p.sessionId}:${p.pinnedAt}`).join('|')
          const nextSig = next.pins.map((p) => `${p.sessionId}:${p.pinnedAt}`).join('|')
          if (currSig !== nextSig || !silent) {
            pinsDoc = next
            renderPinnedGroup()
            markOfficialPinnedRows()
          }
        }
      } catch (error) {
        if (!silent) console.warn('[dsh-session-navigator] load pins failed:', error)
      }
    }

    async function setSessionPinned(sessionId, pinned) {
      const id = normalizeSessionId(sessionId)
      if (!id) return
      const previous = pinsDoc
      const local = togglePinnedSession(pinsDoc, id, pinned, Date.now())
      if (!local.ok) return
      pinsDoc = local.document
      renderPinnedGroup()
      markOfficialPinnedRows()
      closeOpenMenus()
      const labels = sessionPinMenuLabels(mentionLocale())
      try {
        const res = await fetch(PIN_ROUTE, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ sessionId: id, pinned: pinned === true }),
        })
        let data = null
        try { data = await res.json() } catch { data = null }
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'pin failed')
        pinsDoc = normalizePinDocument(data.document)
        try { pinsBroadcast?.postMessage({ type: 'pins-updated', document: pinsDoc }) } catch {}
        renderPinnedGroup()
        markOfficialPinnedRows()
        showCopyToast(pinned ? labels.pinnedToast : labels.unpinnedToast)
      } catch (error) {
        pinsDoc = previous
        renderPinnedGroup()
        markOfficialPinnedRows()
        showCopyToast(labels.failed)
        console.warn('[dsh-session-navigator] pin failed:', error)
      }
    }

    function markOfficialPinnedRows() {
      const pinned = new Set(pinsDoc.pins.map((item) => item.sessionId))
      for (const row of document.querySelectorAll('[role="treeitem"][data-dsh-session]')) {
        if (row.closest(`#${PIN_GROUP_ID}`)) continue
        const id = normalizeSessionId(row.getAttribute('data-dsh-session'))
        if (id && pinned.has(id)) row.setAttribute('data-dsh-pinned', 'true')
        else row.removeAttribute('data-dsh-pinned')
      }
    }

    function renderPinnedGroup() {
      const tree = findSessionTree()
      const existing = document.getElementById(PIN_GROUP_ID)
      if (!tree) {
        existing?.remove()
        return
      }
      if (pinsDoc.pins.length === 0) {
        existing?.remove()
        return
      }
      const signature = pinGroupSignature()
      if (existing && existing.getAttribute('data-dsh-pin-signature') === signature && existing.parentElement === tree) {
        return
      }
      const labels = sessionPinMenuLabels(mentionLocale())
      const locale = mentionLocale()
      const snap = sessionsRef?.list?.getSnapshot?.()
      const now = Date.now()
      const group = document.createElement('div')
      group.id = PIN_GROUP_ID
      group.setAttribute('data-dsh-nav-internal', 'true')
      group.setAttribute('data-dsh-pin-signature', signature)
      const header = document.createElement('div')
      header.className = 'dsh-nav-pin-header'
      header.innerHTML = `${PIN_ICON_SVG}<span></span>`
      header.querySelector('span').textContent = `${labels.group} · ${pinsDoc.pins.length}`
      group.appendChild(header)
      for (const item of pinsDoc.pins) {
        const rowSnap = snap?.byId?.[item.sessionId]
        const title = rowSnap?.displayTitle || rowSnap?.title || labels.missing
        const missing = !rowSnap || rowSnap.blank
        const row = document.createElement('div')
        row.className = 'dsh-nav-pin-row' + (missing ? ' is-missing' : '')
        row.setAttribute('role', 'treeitem')
        row.setAttribute('data-dsh-session', item.sessionId)
        row.setAttribute('aria-selected', snap?.current === item.sessionId ? 'true' : 'false')
        row.title = item.sessionId
        const icon = document.createElement('span')
        icon.className = 'dsh-nav-pin-row-icon'
        icon.innerHTML = PIN_ICON_SVG
        const name = document.createElement('span')
        name.className = 'dsh-nav-pin-row-title'
        name.textContent = title
        const time = document.createElement('span')
        time.className = 'dsh-nav-pin-row-time'
        time.textContent = compactRelativeTime(rowSnap?.updatedAt, now, locale)
        const unpin = document.createElement('button')
        unpin.type = 'button'
        unpin.className = 'dsh-nav-pin-row-unpin'
        unpin.title = labels.unpin
        unpin.setAttribute('aria-label', labels.unpin)
        unpin.innerHTML = PIN_REMOVE_ICON_SVG
        unpin.addEventListener('pointerdown', (event) => {
          event.preventDefault()
          event.stopPropagation()
        })
        unpin.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          setSessionPinned(item.sessionId, false)
        })
        row.addEventListener('click', (event) => {
          if (event.target.closest('.dsh-nav-pin-row-unpin')) return
          if (!sessionsRef) return
          try { sessionsRef.open(item.sessionId) } catch (error) {
            console.warn('[dsh-session-navigator] open pinned session failed:', error)
          }
        })
        row.append(icon, name, time, unpin)
        group.appendChild(row)
      }
      existing?.remove()
      tree.insertBefore(group, tree.firstChild)
    }

    function getComposerShell() {
      const current = sessionsRef?.list?.getSnapshot?.()?.current
      if (!current) return null
      const conversation = (typeof ctxGetConversation === 'function' ? ctxGetConversation() : null) || conversationRef
      const input = conversation?.input
      if (!input || typeof input.for !== 'function') return null
      try {
        const actx = sessionsRef.scope?.(current) || sessionsRef.binding?.(current)?.ctx
        if (!actx) return null
        return input.for(actx)
      } catch {
        return null
      }
    }

    function insertSessionChip(item, span) {
      const shell = getComposerShell()
      if (!shell || typeof shell.insertReference !== 'function') return false
      const label = sessionTitleOf(item.sessionId) || item.label
      try {
        return shell.insertReference({
          source: 'reference',
          ref: item.mention,
          label,
          appearance: 'session',
          clipboardText: item.mention,
        }, span) === true
      } catch (error) {
        console.warn('[dsh-session-navigator] insertReference failed:', error)
        return false
      }
    }

    function insertSessionChipAtCaret(item) {
      const shell = getComposerShell()
      if (!shell) return false
      const snapshot = typeof shell.state?.getSnapshot === 'function' ? shell.state.getSnapshot() : shell.snapshot
      if (!snapshot || (snapshot.phase !== 'plain' && snapshot.phase !== 'claimed')) return false
      const caret = typeof shell.caretSpan === 'function' ? shell.caretSpan() : null
      const start = Number.isFinite(caret?.start) ? caret.start : (snapshot.draft || '').length
      const end = Number.isFinite(caret?.end) ? caret.end : start
      return insertSessionChip(item, { start, end, draftRev: snapshot.draftRev })
    }

    function hydratePastedMentions() {
      const shell = getComposerShell()
      if (!shell) return false
      const snapshot = typeof shell.state?.getSnapshot === 'function' ? shell.state.getSnapshot() : shell.snapshot
      const plan = nextSessionMentionHydration(snapshot)
      if (!plan) return true
      const ok = insertSessionChip(plan, {
        start: plan.start,
        end: plan.end,
        draftRev: plan.draftRev,
      })
      if (ok) setTimeout(hydratePastedMentions, 0)
      return ok
    }

    function schedulePasteHydrate() {
      if (hydrateUnsub) {
        try { hydrateUnsub() } catch { /* ignore */ }
        hydrateUnsub = null
      }
      for (const ms of HYDRATE_RETRY_MS) setTimeout(hydratePastedMentions, ms)
      const shell = getComposerShell()
      if (!shell?.state?.subscribe) return
      const startedAt = Date.now()
      hydrateUnsub = shell.state.subscribe(() => {
        const done = hydratePastedMentions()
        if (done || Date.now() - startedAt > 2000) {
          try { hydrateUnsub?.() } catch { /* ignore */ }
        try { pinsListUnsub?.() } catch { /* ignore */ }
          hydrateUnsub = null
        }
      })
      setTimeout(() => {
        try { hydrateUnsub?.() } catch { /* ignore */ }
        hydrateUnsub = null
      }, 2200)
    }

    let ctxGetConversation = null

    // 给官方原生搜索结果列表项挂上优雅悬停态的 [ ↗ ] 按钮
    function injectArrowsToOfficialSearchResults() {
      const tree =
        document.querySelector('[role="tree"][aria-label="搜索结果"]') ||
        document.querySelector('[role="tree"][aria-label="Search results"]') ||
        document.querySelector('.searchTree')
      if (!tree) return

      const rows = tree.querySelectorAll('[role="treeitem"]:not([data-dsh-arrow-injected])')
      for (const row of rows) {
        if (row.closest('#dsh-nav-id-hits')) continue
        row.setAttribute('data-dsh-arrow-injected', 'true')

        const sid = getSessionIdFromElement(row)
        if (!sid) continue

        row.setAttribute('data-dsh-session', sid)

        const arrow = document.createElement('a')
        arrow.className = 'dsh-nav-tree-item-arrow'
        arrow.textContent = '↗'
        arrow.title = '在新窗口打开此会话（亦可按住 Cmd/Ctrl 点击整行）'
        arrow.dataset.dshSession = sid
        makeNativeAnchor(arrow, sid)

        arrow.addEventListener('pointerdown', (e) => {
          e.stopPropagation()
        })
        arrow.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          openInNewWindow(sid)
        })

        row.appendChild(arrow)
      }
    }

    function navFromElement(el) {
      if (!(el instanceof Element)) return null
      if (el.closest('.dsh-nav-id-main, [data-dsh-copy-menu]')) return null
      // ↗ 自己有 handler；侧栏 / 搜索 treeitem 普通点击必须交给官方切会话
      if (el.closest('.dsh-nav-new-window, .dsh-nav-tree-item-arrow')) return null
      if (el.closest('[role="treeitem"]')) return null
      const host = el.closest('.dsh-session-anchor-capsule, .dsh-session-anchor-host, a[href], code')
      if (!host) return null
      if (host.closest('.dsh-navx-root, .dsh-navx-panel, .dsh-navx-results')) return null
      const fromData = normalizeSessionId(host.getAttribute('data-dsh-session') || '')
      const fromHref = parseNavFromUrl(host.getAttribute('href') || host.href || '')
      const trimmed = (host.textContent || '').trim()
      const fromText = host.tagName === 'CODE' && trimmed.length <= 120 ? normalizeSessionId(host.getAttribute('data-dsh-session') || trimmed) : null
      const sessionId = fromData || fromHref?.sessionId || fromText
      if (!sessionId) return null
      const turn =
        fromHref?.turn ||
        findTurnForCode(host) ||
        extractTurnFromText(host.closest('[data-chat-turn], p, li, div')?.textContent || '') ||
        parseTurn(host.getAttribute('data-dsh-turn'))
      return { sessionId, turn }
    }

    function rewriteSessionAnchors(root) {
      const scope = root || document
      for (const a of scope.querySelectorAll('a[href]')) {
        if (a.classList.contains('dsh-nav-new-window') || a.classList.contains('dsh-nav-tree-item-arrow')) continue
        const nav = parseNavFromUrl(a.getAttribute('href') || '') || parseNavFromUrl(a.href)
        if (!nav) continue
        const next = `/?session=${encodeURIComponent(nav.sessionId)}${nav.turn ? `&turn=${nav.turn}` : ''}`
        if (a.getAttribute('href') !== next) a.setAttribute('href', next)
        const title = sessionTitleOf(nav.sessionId)
        paintSessionChip(a, { title, sessionId: nav.sessionId, turn: nav.turn })
        hideRedundantLeadIn(a.closest('.dsh-session-anchor-host') || a)
      }
    }

    // 让胶囊走浏览器原生 target=_blank：原生点击永不被弹窗拦截，
    // 也不会像 window.open 那样在 Chrome 应用模式里拿到 about:blank。
    function makeNativeAnchor(anchor, sessionId, turn) {
      const id = normalizeSessionId(sessionId)
      if (!id) return
      // 绝对地址，但**只指向当前 origin**：一旦写成另一个 loopback 地址
      // （localhost ⇄ 127.0.0.1），新标签就没有那边的登录 cookie，会落到
      // 「dsh web authentication required」的 401 页面上。
      anchor.setAttribute('href', navUrl(id, turn))
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noopener')
      anchor.setAttribute('data-dsh-nav-native', 'true')
    }

    /** 点击瞬间按当前额度重算胶囊地址：数标签数比渲染时刻准。 */
    function refreshNativeAnchorTarget(anchor) {
      try {
        const nav = parseNavFromUrl(anchor.getAttribute('href')) || parseNavFromUrl(anchor.getAttribute('data-dsh-session') || '')
        if (!nav) return
        const next = navUrlAt(candidateOrigins()[0], nav.sessionId, nav.turn)
        if (next !== anchor.getAttribute('href')) anchor.setAttribute('href', next)
      } catch (err) {
        console.warn('[dsh-session-navigator] refreshNativeAnchorTarget failed:', err)
      }
    }

    function markSessionCode(root) {
      const scope = root || document
      for (const el of scope.querySelectorAll('code')) {
        if (el.closest('pre')) continue
        const raw = (
          el.getAttribute('data-dsh-session') ||
          el.querySelector('[data-dsh-session]')?.getAttribute('data-dsh-session') ||
          el.textContent ||
          ''
        ).trim()
        const id = normalizeSessionId(raw)
        if (!id) continue
        if ((el.textContent || '').trim().length > 120 && !el.dataset.dshSession) continue
        const title = sessionTitleOf(id)
        const turn = findTurnForCode(el)
        const label = formatCapsuleLabel(title, id, turn)
        el.classList.remove('dsh-session-anchor-capsule')
        el.classList.add('dsh-session-anchor-host')
        el.dataset.dshSession = id
        if (turn) {
          el.dataset.dshTurn = String(turn)
        } else {
          delete el.dataset.dshTurn
        }
        // 行内 code 没有 href：把标签换成内层 <a>，只画这一层芯片，外壳保持透明。
        let inner = el.querySelector('a[data-dsh-nav-native="true"]')
        if (!inner || !inner.isConnected) {
          inner = document.createElement('a')
          inner.setAttribute('data-dsh-nav-native', 'true')
          el.textContent = ''
          el.appendChild(inner)
          el.dataset.dshNavLabel = ''
        }
        paintSessionChip(inner, { title, sessionId: id, turn })
        el.dataset.dshNavLabel = label
        el.removeAttribute('title')
        hideRedundantLeadIn(el)
      }
    }

    // ── 裸 session id 兜底 ──────────────────────────────────────────────
    //
    // 上面 markSessionCode 只认行内 <code>，rewriteSessionAnchors 只认真实 <a>。
    // 两者都够不着「id 以纯文字出现」的情况，而这恰恰是 Agent 最常见的写法之一。
    //
    // 官方 markdown 渲染器对相对地址的处理更彻底：非 http/https/mailto 的 href
    // 只渲染链接文字、把 URL 整个丢掉（dsh-web-frontend 里 Xu() 的 l === "" 分支），
    // 所以 `[标题](/?session=…)` 那种写法连 id 都不在 DOM 里，事后谁也救不回来 ——
    // 那一种只能靠 skill 让 Agent 一开始就写对。这里救的是「id 还在页面上」的那一种：
    // 扫文本节点，把它做成和其他胶囊一模一样的可点元素，等同于「当作 Agent 写对了」。
    const BARE_SESSION_RE = /session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

    // 预筛：一个完整 id 至少 44 个字符，短于此的文本节点直接跳过。
    // 用大小写不敏感的正则而不是 indexOf('session-')，否则全大写的 id 会漏掉。
    const BARE_SESSION_HINT_RE = /session-/i

    // 不该改写的区域：已处理过的、代码、插件自己的界面、表单控件。
    const BARE_TEXT_SKIP_SELECTOR = [
      'a[href]',
      'code',
      'pre',
      'input',
      'textarea',
      'select',
      'script',
      'style',
      'button',
      '[data-dsh-nav-internal="true"]',
      '[data-dsh-nav-lead-hidden]',
      '.dsh-session-anchor-capsule',
      '.dsh-session-anchor-host',
      '#dsh-nav-id-hits',
      '#dsh-nav-deeplink-hint',
      '#dsh-copy-mention-toast',
      '.dsh-navx-root',
      '.dsh-navx-panel',
      '.dsh-navx-results',
    ].join(', ')

    /** 文本节点所属消息块的轮次：优先读官方容器的 data-chat-turn。 */
    function turnForTextNode(textNode) {
      const parent = textNode.parentElement
      if (!parent) return null
      const block = parent.closest('[data-chat-turn]')
      const fromBlock = parseTurn(block?.getAttribute('data-chat-turn'))
      if (fromBlock) return fromBlock
      // 同块内往前找「第 N 轮」字样
      let prev = textNode.previousSibling
      while (prev) {
        const found = extractTurnFromText(prev.textContent)
        if (found) return found
        prev = prev.previousSibling
      }
      return extractTurnFromText(parent.closest('li, td, p, blockquote')?.textContent)
    }

    function markBareSessionText(root) {
      const scope = root || document
      if (!scope || typeof document.createTreeWalker !== 'function') return
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const text = node.nodeValue
          if (!text || text.length < 44) return NodeFilter.FILTER_REJECT
          if (!BARE_SESSION_HINT_RE.test(text)) return NodeFilter.FILTER_REJECT
          const parent = node.parentElement
          if (!parent || parent.closest(BARE_TEXT_SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      })
      const targets = []
      let node = walker.nextNode()
      while (node) {
        targets.push(node)
        node = walker.nextNode()
      }
      for (const textNode of targets) {
        const text = textNode.nodeValue || ''
        BARE_SESSION_RE.lastIndex = 0
        if (!BARE_SESSION_RE.test(text)) continue
        const turn = turnForTextNode(textNode)
        const frag = document.createDocumentFragment()
        const painted = []
        let cursor = 0
        let match = null
        BARE_SESSION_RE.lastIndex = 0
        while ((match = BARE_SESSION_RE.exec(text)) !== null) {
          if (match.index > cursor) {
            frag.appendChild(document.createTextNode(text.slice(cursor, match.index)))
          }
          const id = normalizeSessionId(match[0])
          if (id) {
            const title = sessionTitleOf(id)
            const anchor = document.createElement('a')
            paintSessionChip(anchor, { title, sessionId: id, turn })
            frag.appendChild(anchor)
            painted.push(anchor)
          } else {
            frag.appendChild(document.createTextNode(match[0]))
          }
          cursor = match.index + match[0].length
        }
        if (cursor < text.length) {
          frag.appendChild(document.createTextNode(text.slice(cursor)))
        }
        if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode)
        for (const anchor of painted) hideRedundantLeadIn(anchor)
      }
    }

    function setupClickRouter(signal) {
      const opts = { capture: true, signal }
      document.addEventListener(
        'pointerdown',
        (event) => {
          try {
            if (!(event.target instanceof Element)) return
            // 原生胶囊：先把目标预置进官方「当前会话」格，新窗口启动即落在目标上
            const nativeAnchor = event.target.closest('a[data-dsh-nav-native="true"]')
            if (nativeAnchor) {
              primePersistedSelection(
                nativeAnchor.getAttribute('data-dsh-session') || nativeAnchor.getAttribute('href') || '',
              )
              // 点击瞬间按「这个地址还剩多少额度」重算目标
              refreshNativeAnchorTarget(nativeAnchor)
              return
            }
            // 守护官方新建会话按钮：若 connecting Map 存在挂死残留，执行静默自愈
            if (event.target.closest('button.hHd-Xa_newSession, [aria-label="新建会话"], [aria-label="New session"]')) {
              trySelfHealConnectingWorkspace()
              return
            }
            const btn = event.target.closest('button[aria-label]')
            if (!btn || !isSessionActionsButton(btn)) return
            pendingMenuSessionId = getSessionIdFromElement(btn)
              || normalizeSessionId(btn.closest('[data-dsh-session]')?.getAttribute('data-dsh-session'))
            requestAnimationFrame(injectSessionCopyMenuItems)
            setTimeout(injectSessionCopyMenuItems, 0)
            setTimeout(injectSessionCopyMenuItems, 32)
            setTimeout(injectSessionCopyMenuItems, 80)
            startMenuWatch()
          } catch (err) {
            console.warn('[dsh-session-navigator] pointerdown handler error:', err)
          }
        },
        opts,
      )

      document.addEventListener(
        'click',
        (event) => {
          try {
            if (!(event.target instanceof Element)) return
            // 内部自主探针，绝不二次拦截，坚决杜绝递归与死循环
            if (event.target.closest('[data-dsh-nav-internal="true"]')) return
            // 守护官方新建会话按钮：放行原生行为并自愈可能挂起的状态
            if (event.target.closest('button.hHd-Xa_newSession, [aria-label="新建会话"], [aria-label="New session"]')) {
              trySelfHealConnectingWorkspace()
              return
            }
            if (event.target.closest('.dsh-nav-id-main, [data-dsh-copy-menu]')) return
            if (event.target.closest('.dsh-nav-new-window, .dsh-nav-tree-item-arrow')) return

            const nav = navFromElement(event.target)

            // 1. Cmd/Ctrl + 点击 = 「取反」：
            //    侧栏会话行官方默认是当前窗口切换 → ⌘ 开新标签；
            //    聊天胶囊插件默认是开新标签 → ⌘ 在当前窗口打开。
            if (event.metaKey || event.ctrlKey) {
              const sid = (nav && nav.sessionId) || getSessionIdFromElement(event.target)
              if (sid) {
                event.preventDefault()
                event.stopImmediatePropagation()
                if (nav) openSessionInThisWindow(nav.sessionId, nav.turn)
                else openInNewWindow(sid)
                return
              }
            }

            // 2. 聊天正文中的会话胶囊 / code / 导航链接：默认**开新标签**。
            //    侧栏 treeitem、搜索 treeitem、↗ 都被 navFromElement 排除在外。
            //    新标签起不来时会自动换 origin，最后才退回当前窗口（见 openInNewWindow）。
            if (!nav) return
            if (event.target.closest('.dsh-navx-root, .dsh-navx-panel')) return
            event.preventDefault()
            event.stopImmediatePropagation()
            openInNewWindow(nav.sessionId, nav.turn)
          } catch (error) {
            console.error('[dsh-session-navigator] click handler error:', error)
          }
        },
        opts,
      )

      document.addEventListener(
        'input',
        (event) => {
          try {
            if (!isOfficialSearchInput(event.target)) return
            renderInstantIdHits(event.target.value)
          } catch (err) {
            console.warn('[dsh-session-navigator] input handler error:', err)
          }
        },
        opts,
      )

      document.addEventListener(
        'paste',
        (event) => {
          try {
            const text = event.clipboardData?.getData('text/plain') || ''
            const target = event.target instanceof Element ? event.target : event.target?.parentElement
            if (!(target instanceof Element)) return
            if (!target.closest('[contenteditable="true"], [data-lexical-editor]')) return
            const exclusive = parseExclusiveSessionMention(text)
            if (exclusive && insertSessionChipAtCaret(exclusive)) {
              event.preventDefault()
              event.stopImmediatePropagation()
              return
            }
            if (!parseSessionReferenceMentions(text).length) return
            schedulePasteHydrate()
          } catch (err) {
            console.warn('[dsh-session-navigator] paste handler error:', err)
          }
        },
        opts,
      )
    }

    function handleDeepLinkStartup() {
      const nav = bootNav || captureBootNavNow()
      if (!nav || !nav.sessionId) return
      openSessionInThisWindow(nav.sessionId, nav.turn)
    }

    /**
     * `?q=<session id>` opens this window on the session search instead of the
     * session itself: the official results list appears and the human picks the
     * row. Handing off to search keeps deep linking out of the path, so this
     * window never waits on session summaries or the whole session list.
     */
    function parseSearchHandoffFromUrl(raw) {
      if (!raw) return ''
      try {
        const url = new URL(raw, window.location.origin)
        return String(url.searchParams.get('q') || url.searchParams.get('search') || '').trim()
      } catch {
        return ''
      }
    }

    /**
     * Type into the official search box the way a human would. The shell keeps
     * its own copy of the field value, so assigning `.value` alone is ignored:
     * the native setter plus a bubbling input event is what makes the
     * framework treat it as a real edit.
     */
    function fillOfficialSearch(query) {
      const input = findOfficialSearchInput()
      if (!input) return false
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      try {
        if (setter) setter.call(input, query)
        else input.value = query
      } catch {
        return false
      }
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      try {
        input.setSelectionRange?.(query.length, query.length)
      } catch {
        /* selection is cosmetic */
      }
      return true
    }

    /** Retry until the shell has painted its search box, then hand the query over. */
    function runSearchHandoff(query, attempt = 0) {
      if (fillOfficialSearch(query)) {
        showDeepLinkHint('已填入搜索框', '在下面的结果里点一下就能打开这个会话')
        clearTimeout(searchHandoffHintTimer)
        searchHandoffHintTimer = setTimeout(() => hideDeepLinkHint(), 8000)
        return
      }
      if (attempt >= 60) return
      searchHandoffHintTimer = setTimeout(() => runSearchHandoff(query, attempt + 1), 200)
    }

    function enhanceDom() {
      removeStrayOverlay()
      rewriteSessionAnchors(document)
      markSessionCode(document)
      markBareSessionText(document)
      injectArrowsToOfficialSearchResults()
      tagSessionRows()
      injectSessionCopyMenuItems()
      renderPinnedGroup()
      markOfficialPinnedRows()
      const input = findOfficialSearchInput()
      if (input) renderInstantIdHits(input.value)
    }

    function apply(ctx) {
      bootNav = parseNavFromUrl(window.location.href)
      searchHandoffQuery = parseSearchHandoffFromUrl(window.location.href)
      injectStyles()
      removeStrayOverlay()
      sessionsRef = ctx.sessions || (typeof ctx.get === 'function' ? ctx.get('sessions') : null)
      conversationRef = typeof ctx.get === 'function' ? ctx.get('conversation') : null
      uiWorkspaceRef = typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : null
      workspacesRef = typeof ctx.get === 'function' ? ctx.get('workspaces') : null
      ctxGetConversation = () => (typeof ctx.get === 'function' ? ctx.get('conversation') : null) || conversationRef
      if (typeof ctx.inject === 'function') {
        ctx.inject(['conversation'], (sub) => {
          conversationRef = sub.conversation || (typeof sub.get === 'function' ? sub.get('conversation') : null)
        })
        ctx.inject(['uiWorkspace'], (sub) => {
          uiWorkspaceRef = sub.uiWorkspace || (typeof sub.get === 'function' ? sub.get('uiWorkspace') : null)
        })
        ctx.inject(['workspaces'], (sub) => {
          workspacesRef = sub.workspaces || (typeof sub.get === 'function' ? sub.get('workspaces') : null)
        })
      }
      if (!sessionsRef) {
        console.warn('[dsh-session-navigator] sessions service missing')
        return () => {}
      }
      // 排障入口：控制台可查深链状态、可手动重放一次直达。
      try {
        window.__dshSessionNavigator = {
          version: '0.4.4',
          openInNewWindow,
          openSessionInThisWindow,
          get state() {
            const snap = sessionsRef?.list?.getSnapshot?.()
            return {
              current: snap?.current,
              phase: snap?.phase,
              listed: snap?.ids?.length ?? 0,
              deepLink: deepLinkJob ? { target: deepLinkJob.target } : null,
              bootNav,
            }
          },
        }
      } catch {
        /* ignore */
      }
      const clickRouter = new AbortController()
      setupClickRouter(clickRouter.signal)
      loadPins()
      let pinsListUnsub = null
      if (typeof sessionsRef.list?.subscribe === 'function') {
        pinsListUnsub = sessionsRef.list.subscribe(() => {
          loadPins(true)
          renderPinnedGroup()
          markOfficialPinnedRows()
        })
      }

      // 实时同步：窗口获得焦点或从后台切回时毫秒级静默拉取最新置顶
      window.addEventListener('focus', () => { loadPins(true) })
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'hidden') loadPins(true)
      })

      // 前台静默低频心跳探针（2.5 秒，仅在页面处于可见状态时静默查询，开销极低）
      setInterval(() => {
        if (document.visibilityState === 'hidden') return
        void loadPins(true)
      }, 2500)
      const originWatchTimer = startOriginHealthWatch()
      // 若本页是被 openInNewWindow 开出来的，回报一次「已就绪」。
      announceEntry()
      if (searchHandoffQuery) runSearchHandoff(searchHandoffQuery)
      else handleDeepLinkStartup()
      let enhanceTimer = null
      let observer = null
      // 自触发防抖：enhanceDom 自己也会改 DOM，若观察器在期间保持连接，
      // 每一轮改写都会再触发下一轮，形成永不停止的 12Hz 重扫
      // （大会话下表现为标签页持续占 CPU、界面发顿）。改 DOM 时先断开。
      const runEnhance = () => {
        if (observer) observer.disconnect()
        try {
          enhanceDom()
        } finally {
          if (observer) observer.observe(document.body, { childList: true, subtree: true })
        }
      }
      runEnhance()
      observer = new MutationObserver(() => {
        injectSessionCopyMenuItems()
        renderPinnedGroup()
        markOfficialPinnedRows()
        if (enhanceTimer) return
        enhanceTimer = setTimeout(() => {
          enhanceTimer = null
          runEnhance()
        }, 80)
      })
      observer.observe(document.body, { childList: true, subtree: true })
     return () => {
       clickRouter.abort()
       clearInterval(originWatchTimer)
       clearTimeout(searchHandoffHintTimer)
       observer?.disconnect()
       deepLinkJob?.finish()
       hideDeepLinkHint()
       if (enhanceTimer) clearTimeout(enhanceTimer)
       if (toastTimer) clearTimeout(toastTimer)
       if (menuWatchTimer) clearInterval(menuWatchTimer)
       try { hydrateUnsub?.() } catch { /* ignore */ }
       document.getElementById('dsh-session-navigator-styles')?.remove()
       document.getElementById('dsh-nav-id-hits')?.remove()
       document.getElementById('dsh-copy-mention-toast')?.remove()
       document.getElementById('dsh-nav-pin-group')?.remove()
       removeStrayOverlay()
     }
   }

   module.exports.apply = apply
    module.exports.inject = ['sessions']
   return module.exports
  },
})
