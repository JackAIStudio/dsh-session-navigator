window.__ModuleLoader__.load({
  id: 'dsh-session-navigator',
  factory: (require) => {
    const module = { exports: {} }

    const SESSION_ID_RE = /session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const CSS_STYLES = `
      .dsh-session-anchor-capsule {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 2px 10px !important;
        margin: 0 2px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        line-height: 1.4 !important;
        color: #2563eb !important;
        background: rgba(37, 99, 235, 0.08) !important;
        border: 1px solid rgba(37, 99, 235, 0.28) !important;
        border-radius: 999px !important;
        text-decoration: none !important;
        cursor: pointer !important;
        vertical-align: baseline !important;
        max-width: 100%;
      }
      .dsh-session-anchor-capsule:hover {
        background: rgba(37, 99, 235, 0.16) !important;
        border-color: rgba(37, 99, 235, 0.55) !important;
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
    `

    let bootNav = captureBootNavNow()
    let sessionsRef = null
    let conversationRef = null
    let pendingMenuSessionId = null
    let toastTimer = null
    const SESSION_REFERENCE_SCHEME = 'dsh-session:'
    const SESSION_MENTION_RE = /@\[((?:\\.|[^\\\]])*)\]\((dsh-session:[A-Za-z0-9_-]+)\)|(dsh-session:[A-Za-z0-9_-]+)/gu
    const COPY_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.25"/><path d="M3.5 11H3a1 1 0 0 1-1-1V3.5A1.5 1.5 0 0 1 3.5 2h6.5a1 1 0 0 1 1 1v.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>'

    function captureBootNavNow() {
      if (typeof window === 'undefined') return null
      try {
        const href = window.location.href
        const nav = parseNavFromUrl(href)
        if (nav) sessionStorage.setItem('dsh-nav-boot', href)
        const stored = sessionStorage.getItem('dsh-nav-boot')
        return nav || (stored ? parseNavFromUrl(stored) : null)
      } catch {
        return parseNavFromUrl(window.location.href)
      }
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

    function formatCapsuleLabel(title, sessionId, turn) {
      const parts = ['🧭']
      if (title) parts.push(title)
      else if (sessionId) parts.push(sessionId.slice(0, 8))
      if (turn) parts.push(`第 ${turn} 轮`)
      parts.push('↗')
      return parts.join(' · ')
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
      if (document.getElementById('dsh-session-navigator-styles')) return
      const style = document.createElement('style')
      style.id = 'dsh-session-navigator-styles'
      style.textContent = CSS_STYLES
      document.head.appendChild(style)
    }

    function removeStrayOverlay() {
      document.getElementById('dsh-search-enhancer')?.remove()
      document.querySelectorAll('.dsh-search-enhancer-box').forEach((el) => el.remove())
    }

    function navUrl(sessionId, turn) {
      const origin = window.location.origin
      const url = new URL(origin)
      url.pathname = '/'
      url.searchParams.set('session', sessionId)
      if (turn) url.searchParams.set('turn', String(turn))
      else url.searchParams.delete('turn')
      url.hash = ''
      return url.toString()
    }

    function sessionWindowName(sessionId) {
      const id = normalizeSessionId(sessionId)
      return id ? `dsh-session-${id}` : 'dsh-session'
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

    // Chrome 应用模式（mac工作台 --app）里，从已被 window.open 打开的窗口再
    // window.open('_blank') 经常得到 about:blank。用命名窗口复用，空白时强制
    // 导航；弹窗被拦则回退到当前窗口切会话，绝不再丢一个空白窗给用户。
    function openInNewWindow(sessionId, turn) {
      const url = navUrl(sessionId, turn)
      const name = sessionWindowName(sessionId)
      const hosts = [window]
      const root = sameOriginOpenerRoot()
      if (root !== window) hosts.push(root)

      for (const host of hosts) {
        const opened = tryWindowOpen(host, url, name)
        if (!opened) continue
        try {
          if (popupNeedsUrlAssign(opened.location.href, sessionId, turn)) {
            assignPopupUrl(opened, url)
          }
        } catch {
          assignPopupUrl(opened, url)
        }
        focusOpenedWindow(opened)
        return
      }

      // 嵌套弹窗里 window.open 常被拦或返回 null：不要再丢一个空白窗，本窗口切会话。
      if (root !== window) {
        openSessionInThisWindow(sessionId, turn)
        return
      }

      const probe = document.createElement('a')
      probe.href = url
      probe.target = name
      probe.rel = 'opener'
      probe.click()
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

    // 核心切换逻辑：生命周期自愈与就绪等待，杜绝 pending 状态下 select 抛错与空白页
    function openSessionInThisWindow(sessionId, turn) {
      const sessions = sessionsRef
      if (!sessions || !sessionId) return

      let jumpDone = false
      const tryJump = () => {
        if (!turn || jumpDone) return
        jumpDone = true
        setTimeout(() => jumpToTurn(turn), 300)
      }

      const isCurrent = () => {
        return sessions.list?.getSnapshot?.()?.current === sessionId
      }

      const tryOpen = () => {
        if (isCurrent()) {
          tryJump()
          return true
        }
        const snap = sessions.list?.getSnapshot?.()
        // 关键防护：如果列表还在从 Host 获取，先不要触发 select 导致 unknown session 异常
        if (snap && snap.phase === 'pending' && (!snap.ids || snap.ids.length === 0)) {
          return false
        }
        try {
          if (typeof sessions.open === 'function') {
            sessions.open(sessionId)
          }
        } catch (error) {
          console.warn('[dsh-session-navigator] sessions.open retry warning:', error)
          return false
        }
        return isCurrent()
      }

      if (tryOpen()) return

      // 订阅 sessions.list 状态变化
      let unsub = null
      if (typeof sessions.list?.subscribe === 'function') {
        unsub = sessions.list.subscribe(() => {
          if (isCurrent()) {
            tryJump()
            if (unsub) {
              unsub()
              unsub = null
            }
            return
          }
          const snap = sessions.list?.getSnapshot?.()
          if (snap?.phase === 'ready' || (snap?.ids && snap.ids.includes(sessionId))) {
            if (tryOpen() && unsub) {
              unsub()
              unsub = null
            }
          }
        })
      }

      // 兜底定时器（最大等待 8 秒）
      let elapsed = 0
      const interval = 120
      const maxWait = 8000
      const timer = setInterval(() => {
        elapsed += interval
        if (isCurrent() || elapsed >= maxWait) {
          clearInterval(timer)
          if (unsub) {
            unsub()
            unsub = null
          }
          if (isCurrent()) tryJump()
          return
        }
        tryOpen()
      }, interval)
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
      return /会话.+的操作$/.test(label) || /^Session actions for /.test(label)
    }

    function isSessionActionsMenuText(text) {
      const value = String(text || '')
      return (value.includes('分叉会话') || value.includes('Fork session'))
        && (value.includes('归档会话') || value.includes('Archive session'))
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

    function showCopyToast(ok) {
      document.getElementById('dsh-copy-mention-toast')?.remove()
      const toast = document.createElement('div')
      toast.id = 'dsh-copy-mention-toast'
      toast.className = 'dsh-copy-mention-toast'
      toast.textContent = mentionLocale() === 'en'
        ? (ok ? 'Copied session mention' : 'Copy failed')
        : (ok ? '已复制会话引用' : '复制失败')
      document.body.appendChild(toast)
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => toast.remove(), 1600)
    }

    function closeOpenMenus() {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }

    async function copySessionMention(sessionId) {
      const sid = normalizeSessionId(sessionId)
      if (!sid) return
      const label = sessionTitleOf(sid) || sid
      const mention = formatSessionReferenceMention(sid, label)
      const ok = await writeClipboard(mention)
      showCopyToast(ok)
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

    const injectedMenus = new WeakSet()

    function injectCopyMenuItem() {
      const menu = findOpenSessionMenu()
      if (!menu || injectedMenus.has(menu) || menu.querySelector('[data-dsh-copy-mention]')) return
      const sessionId = pendingMenuSessionId
        || getSessionIdFromElement(document.querySelector('[role="treeitem"][aria-selected="true"]'))
      if (!sessionId) return
      const samples = [...menu.querySelectorAll('button, [role="menuitem"]')].filter((el) => !el.dataset.dshCopyMention)
      const fallback = [...menu.children].filter((el) => el instanceof HTMLElement && !el.dataset.dshCopyMention && (el.textContent || '').trim())
      const sample = samples[0] || fallback[0]
      if (!sample) return
      const item = sample.cloneNode(true)
      item.dataset.dshCopyMention = sessionId
      item.setAttribute('role', sample.getAttribute('role') || 'menuitem')
      replaceMenuItemLabel(item, mentionLocale() === 'en' ? 'Copy session mention' : '复制会话引用')
      const iconHost = item.querySelector('svg')?.parentElement || item.querySelector('svg')
      if (iconHost?.tagName === 'svg') iconHost.outerHTML = COPY_ICON_SVG
      else if (iconHost) {
        const svg = item.querySelector('svg')
        if (svg) svg.outerHTML = COPY_ICON_SVG
      }
      const onCopy = (event) => {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        copySessionMention(sessionId)
      }
      item.addEventListener('pointerdown', onCopy, true)
      item.addEventListener('click', onCopy, true)
      injectedMenus.add(menu)
      menu.insertBefore(item, sample)
    }

   function getComposerShell() {
     const current = sessionsRef?.list?.getSnapshot?.()?.current
     if (!current) return null
      const conversation = (typeof ctxGetConversation === 'function' ? ctxGetConversation() : null) || conversationRef
     const input = conversation?.input
      if (!input) return null
      try {
        const actx = sessionsRef.scope?.(current) || sessionsRef.binding?.(current)?.ctx
        if (!actx) return null
        return input.for(actx)
      } catch {
        return null
      }
    }

    function hydratePastedMentions() {
      const shell = getComposerShell()
      if (!shell) return
      const snapshot = typeof shell.state?.getSnapshot === 'function' ? shell.state.getSnapshot() : shell.snapshot
      if (!snapshot || (snapshot.phase !== 'plain' && snapshot.phase !== 'claimed')) return
      if (typeof shell.insertReference !== 'function') return
      const plains = findPlainSessionMentions(snapshot.draft || '', snapshot.occurrences || [])
      if (plains.length === 0) return
      const item = plains[plains.length - 1]
      const start = clipboardOffsetToDetect(snapshot.occurrences, item.index)
      const end = clipboardOffsetToDetect(snapshot.occurrences, item.index + item.match.length)
      const ok = shell.insertReference({
        source: 'reference',
        ref: item.mention,
        label: sessionTitleOf(item.sessionId) || item.label,
        appearance: 'session',
        clipboardText: item.mention,
      }, {
        start,
        end,
        draftRev: snapshot.draftRev,
      })
      if (ok && plains.length > 1) setTimeout(hydratePastedMentions, 0)
    }

    function schedulePasteHydrate() {
      queueMicrotask(hydratePastedMentions)
      requestAnimationFrame(hydratePastedMentions)
      setTimeout(hydratePastedMentions, 0)
      setTimeout(hydratePastedMentions, 24)
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

        const arrow = document.createElement('span')
        arrow.className = 'dsh-nav-tree-item-arrow'
        arrow.textContent = '↗'
        arrow.title = '在新窗口打开此会话（亦可按住 Cmd/Ctrl 点击整行）'

        const triggerNewWin = (e) => {
          e.preventDefault()
          e.stopPropagation()
          openInNewWindow(sid)
        }
        arrow.addEventListener('pointerdown', (e) => {
          e.preventDefault()
          e.stopPropagation()
        })
        arrow.addEventListener('pointerup', triggerNewWin)
        arrow.addEventListener('click', triggerNewWin)

        row.appendChild(arrow)
      }
    }

    function navFromElement(el) {
      if (!(el instanceof Element)) return null
      if (el.closest('.dsh-nav-id-main, [data-dsh-copy-mention]')) return null
      // ↗ 自己有 handler；侧栏 / 搜索 treeitem 普通点击必须交给官方切会话
      if (el.closest('.dsh-nav-new-window, .dsh-nav-tree-item-arrow')) return null
      if (el.closest('[role="treeitem"]')) return null
      const host = el.closest('.dsh-session-anchor-capsule, a[href], code')
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
        a.classList.add('dsh-session-anchor-capsule')
        a.dataset.dshSession = nav.sessionId
        if (nav.turn) a.dataset.dshTurn = String(nav.turn)
        const title = sessionTitleOf(nav.sessionId)
        const label = formatCapsuleLabel(title, nav.sessionId, nav.turn)
        if ((a.textContent || '').trim() === nav.sessionId || a.dataset.dshNavLabel !== label) {
          a.textContent = label
          a.dataset.dshNavLabel = label
        }
        a.setAttribute('title', `${title || nav.sessionId}\n${nav.sessionId}\n在新窗口打开`)
      }
    }

    function markSessionCode(root) {
      const scope = root || document
      for (const el of scope.querySelectorAll('code')) {
        if (el.closest('pre')) continue
        const raw = (el.getAttribute('data-dsh-session') || el.textContent || '').trim()
        const id = normalizeSessionId(raw)
        if (!id) continue
        if ((el.textContent || '').trim().length > 120 && !el.dataset.dshSession) continue
        const title = sessionTitleOf(id)
        const turn = findTurnForCode(el)
        const label = formatCapsuleLabel(title, id, turn)
        el.classList.add('dsh-session-anchor-capsule')
        el.dataset.dshSession = id
        if (turn) {
          el.dataset.dshTurn = String(turn)
        } else {
          delete el.dataset.dshTurn
        }
        if (el.dataset.dshNavLabel !== label) {
          el.textContent = label
          el.dataset.dshNavLabel = label
        }
        el.setAttribute('title', `${title || id}\n${id}\n在新窗口打开`)
      }
    }

    function setupClickRouter(signal) {
      const opts = { capture: true, signal }
      document.addEventListener(
        'pointerdown',
        (event) => {
          if (!(event.target instanceof Element)) return
          const btn = event.target.closest('button[aria-label]')
          if (!btn || !isSessionActionsButton(btn)) return
          pendingMenuSessionId = getSessionIdFromElement(btn)
          requestAnimationFrame(injectCopyMenuItem)
          setTimeout(injectCopyMenuItem, 0)
          setTimeout(injectCopyMenuItem, 32)
        },
        opts,
      )

      document.addEventListener(
        'click',
        (event) => {
          if (!(event.target instanceof Element)) return
          if (event.target.closest('.dsh-nav-id-main, [data-dsh-copy-mention]')) return
          if (event.target.closest('.dsh-nav-new-window, .dsh-nav-tree-item-arrow')) return

          // 1. 原生快捷操作：Cmd/Ctrl + 点击 任意会话行直接在新窗口打开
          if (event.metaKey || event.ctrlKey) {
            const sid = getSessionIdFromElement(event.target)
            if (sid) {
              event.preventDefault()
              event.stopImmediatePropagation()
              openInNewWindow(sid)
              return
            }
          }

          // 2. 聊天正文中的会话胶囊/code/导航链接点击。侧栏 treeitem 不走这里。
          const nav = navFromElement(event.target)
          if (!nav) return
          if (event.target.closest('.dsh-navx-root, .dsh-navx-panel')) return
          event.preventDefault()
          event.stopImmediatePropagation()
          openInNewWindow(nav.sessionId, nav.turn)
        },
        opts,
      )

      document.addEventListener(
        'input',
        (event) => {
          if (!isOfficialSearchInput(event.target)) return
          renderInstantIdHits(event.target.value)
        },
        opts,
      )

      document.addEventListener(
        'paste',
        (event) => {
          const text = event.clipboardData?.getData('text/plain') || ''
          if (!parseSessionReferenceMentions(text).length) return
          const target = event.target instanceof Element ? event.target : event.target?.parentElement
          if (!(target instanceof Element)) return
          if (!target.closest('[contenteditable="true"], [data-lexical-editor]')) return
          schedulePasteHydrate()
        },
        opts,
      )
    }

    function handleDeepLinkStartup() {
      const nav = bootNav || captureBootNavNow()
      if (!nav || !nav.sessionId) return
      try {
        sessionStorage.removeItem('dsh-nav-boot')
      } catch {
        /* ignore */
      }
      openSessionInThisWindow(nav.sessionId, nav.turn)
    }

    function enhanceDom() {
      removeStrayOverlay()
      rewriteSessionAnchors(document)
      markSessionCode(document)
      injectArrowsToOfficialSearchResults()
      tagSessionRows()
      injectCopyMenuItem()
      const input = findOfficialSearchInput()
      if (input) renderInstantIdHits(input.value)
    }

    function apply(ctx) {
      bootNav = parseNavFromUrl(window.location.href)
     injectStyles()
     removeStrayOverlay()
     sessionsRef = ctx.sessions || (typeof ctx.get === 'function' ? ctx.get('sessions') : null)
      conversationRef = typeof ctx.get === 'function' ? ctx.get('conversation') : null
      ctxGetConversation = () => (typeof ctx.get === 'function' ? ctx.get('conversation') : null) || conversationRef
      if (typeof ctx.inject === 'function') {
        ctx.inject(['conversation'], (sub) => {
          conversationRef = sub.conversation || (typeof sub.get === 'function' ? sub.get('conversation') : null)
        })
      }
     if (!sessionsRef) {
        console.warn('[dsh-session-navigator] sessions service missing')
        return () => {}
      }
      const clickRouter = new AbortController()
      setupClickRouter(clickRouter.signal)
      handleDeepLinkStartup()
      enhanceDom()
      let enhanceTimer = null
      const observer = new MutationObserver(() => {
        injectCopyMenuItem()
        if (enhanceTimer) return
        enhanceTimer = setTimeout(() => {
          enhanceTimer = null
          enhanceDom()
        }, 80)
      })
      observer.observe(document.body, { childList: true, subtree: true })
     return () => {
       clickRouter.abort()
       observer.disconnect()
       if (enhanceTimer) clearTimeout(enhanceTimer)
       if (toastTimer) clearTimeout(toastTimer)
       document.getElementById('dsh-session-navigator-styles')?.remove()
       document.getElementById('dsh-nav-id-hits')?.remove()
       document.getElementById('dsh-copy-mention-toast')?.remove()
       removeStrayOverlay()
     }
   }

   module.exports.apply = apply
    module.exports.inject = ['sessions']
   return module.exports
  },
})
