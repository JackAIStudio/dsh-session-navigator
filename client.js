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

      /* 官方搜索结果项注入的小图标按钮 */
      .dsh-nav-tree-item-arrow {
        flex: none;
        width: 22px;
        height: 22px;
        margin-left: auto;
        margin-right: 4px;
        border-radius: 4px;
        border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));
        background: var(--dsw-alias-bg-base, rgba(128, 128, 128, 0.06));
        color: var(--dsw-alias-label-secondary, #666);
        font-size: 12px;
        line-height: 20px;
        text-align: center;
        cursor: pointer;
        user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        transition: all 0.12s ease;
      }
      [role="treeitem"]:hover .dsh-nav-tree-item-arrow {
        opacity: 1;
      }
      .dsh-nav-tree-item-arrow:hover {
        background: #2563eb !important;
        border-color: #2563eb !important;
        color: #fff !important;
        transform: scale(1.06);
      }
    `

    let bootNav = captureBootNavNow()
    let sessionsRef = null

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
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.floor(value)
      const text = String(value || '').trim()
      if (!text) return null
      const direct = parseInt(text, 10)
      if (Number.isFinite(direct) && direct > 0) return direct
      const match = text.match(/(?:第|\bturn[-_\s]*)(\d+)(?:\s*轮|\b)/i)
      return match ? parseInt(match[1], 10) : null
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

    function extractTurnFromText(text) {
      return parseTurn(text)
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
      // 保持使用当前 Origin（解决 401 和域名隔离）
      const origin = window.location.origin
      const url = new URL(origin)
      url.pathname = '/'
      url.searchParams.set('session', sessionId)
      if (turn) url.searchParams.set('turn', String(turn))
      else url.searchParams.delete('turn')
      url.hash = ''
      return url.toString()
    }

    function openInNewWindow(sessionId, turn) {
      const url = navUrl(sessionId, turn)
      const opened = window.open(url, '_blank')
      if (!opened) {
        const probe = document.createElement('a')
        probe.href = url
        probe.target = '_blank'
        probe.rel = 'noopener'
        probe.click()
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

    // 核心切换逻辑：带自愈订阅，等待会话数据拉取就绪后精准进入
    function openSessionInThisWindow(sessionId, turn) {
      const sessions = sessionsRef
      if (!sessions) return

      let done = false
      const finish = () => {
        if (done) return true
        if (sessions.list?.getSnapshot?.()?.current === sessionId) {
          done = true
          if (turn) setTimeout(() => jumpToTurn(turn), 250)
          return true
        }
        return false
      }

      const attempt = () => {
        try {
          // 官方 API：sessions.open(sessionId)
          if (typeof sessions.open === 'function') {
            sessions.open(sessionId)
            return finish()
          }
        } catch (error) {
          console.warn('[dsh-session-navigator] sessions.open error:', error)
        }
        return false
      }

      if (attempt()) return

      // 订阅会话列表：一旦数据准备就绪（非空），立刻执行 open
      const unsub = typeof sessions.list?.subscribe === 'function'
        ? sessions.list.subscribe(() => {
          if (attempt() && typeof unsub === 'function') unsub()
        })
        : null

      let tries = 0
      const timer = setInterval(() => {
        tries += 1
        if (attempt() || tries >= 50) {
          clearInterval(timer)
          if (typeof unsub === 'function') unsub()
        }
      }, 120)
    }

    function collectIdHits(query) {
      const q = String(query || '').trim().toLowerCase()
      if (q.length < 2) return []
      const snap = sessionsRef?.list?.getSnapshot?.()
      if (!snap?.ids) return []
      const hits = []
      for (const id of snap.ids) {
        if (typeof id !== 'string' || !id.toLowerCase().includes(q)) continue
        const row = snap.byId?.[id]
        if (row?.blank) continue
        hits.push({
          sessionId: id,
          title: row?.displayTitle || row?.title || id,
          workspace: row?.cwd ? String(row.cwd).split(/[/\\]/).pop() : '',
        })
        if (hits.length >= 20) break
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
      header.textContent = `ID 命中（${hits.length}）`
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

        // 触控板一击必中优化：在 pointerdown 上阻止失焦并立即响应
        const triggerOpen = (event) => {
          event.preventDefault()
          event.stopPropagation()
          openSessionInThisWindow(hit.sessionId)
        }
        main.addEventListener('pointerdown', (e) => {
          e.preventDefault() // 阻止搜索输入框失焦导致丢点击
        })
        main.addEventListener('pointerup', triggerOpen)
        main.addEventListener('click', triggerOpen)

        const arrow = document.createElement('a')
        arrow.className = 'dsh-nav-new-window'
        arrow.href = `/?session=${encodeURIComponent(hit.sessionId)}`
        arrow.dataset.dshSession = hit.sessionId
        arrow.title = '在新窗口打开'
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

    // 给官方原生搜索结果列表项（如搜“测试”）也挂上 [ ↗ ] 按钮
    function injectArrowsToOfficialSearchResults() {
      const tree = document.querySelector('[role="tree"][aria-label="搜索结果"]')
        || document.querySelector('[role="tree"][aria-label="Search results"]')
        || document.querySelector('.searchTree')
      if (!tree) return

      const rows = tree.querySelectorAll('[role="treeitem"]:not([data-dsh-arrow-injected])')
      const snap = sessionsRef?.list?.getSnapshot?.()
      if (!snap?.byId) return

      for (const row of rows) {
        if (row.closest('#dsh-nav-id-hits')) continue
        row.setAttribute('data-dsh-arrow-injected', 'true')

        // 提取该行的 sessionId
        let sid = row.getAttribute('data-session-id') || row.dataset?.sessionId || row.getAttribute('id')
        if (!sid || !sid.startsWith('session-')) {
          const text = (row.textContent || '').trim()
          for (const id of snap.ids) {
            const item = snap.byId[id]
            if (item && (item.title === text || text.includes(item.title) || (item.displayTitle && text.includes(item.displayTitle)))) {
              sid = id
              break
            }
          }
        }

        if (!sid) continue

        const arrow = document.createElement('span')
        arrow.className = 'dsh-nav-tree-item-arrow'
        arrow.textContent = '↗'
        arrow.title = '在新窗口打开此会话'

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
      if (el.closest('.dsh-nav-id-main')) return null
      const host = el.closest('[data-dsh-session], .dsh-session-anchor-capsule, a[href], code')
      if (!host) return null
      if (host.closest('.dsh-navx-root, .dsh-navx-panel, .dsh-navx-results')) return null
      const fromData = normalizeSessionId(host.getAttribute('data-dsh-session') || '')
      const fromHref = parseNavFromUrl(host.getAttribute('href') || host.href || '')
      const trimmed = (host.textContent || '').trim()
      const fromText = host.tagName === 'CODE' && trimmed.length <= 120 ? normalizeSessionId(host.getAttribute('data-dsh-session') || trimmed) : null
      const sessionId = fromData || fromHref?.sessionId || fromText
      if (!sessionId) return null
      const turn =
        parseTurn(host.getAttribute('data-dsh-turn')) ||
        fromHref?.turn ||
        extractTurnFromText(host.closest('[data-chat-turn], p, li, div')?.textContent || '')
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
        const turn = extractTurnFromText(el.parentElement?.textContent || '') || parseTurn(el.getAttribute('data-dsh-turn'))
        const label = formatCapsuleLabel(title, id, turn)
        el.classList.add('dsh-session-anchor-capsule')
        el.dataset.dshSession = id
        if (turn) el.dataset.dshTurn = String(turn)
        if (el.dataset.dshNavLabel !== label) {
          el.textContent = label
          el.dataset.dshNavLabel = label
        }
        el.setAttribute('title', `${title || id}\n${id}\n在新窗口打开`)
      }
    }

    function setupClickRouter() {
      document.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return
        if (event.target.closest('.dsh-nav-id-main')) return
        const nav = navFromElement(event.target)
        if (!nav) return
        if (event.target.closest('.dsh-navx-root, .dsh-navx-panel')) return
        event.preventDefault()
        event.stopImmediatePropagation()
        openInNewWindow(nav.sessionId, nav.turn)
      }, true)
      document.addEventListener('input', (event) => {
        if (!isOfficialSearchInput(event.target)) return
        renderInstantIdHits(event.target.value)
      }, true)
    }

    function handleDeepLinkStartup() {
      const nav = bootNav || captureBootNavNow()
      if (!nav) return
      try { sessionStorage.removeItem('dsh-nav-boot') } catch { /* ignore */ }
      openSessionInThisWindow(nav.sessionId, nav.turn)
    }

    function enhanceDom() {
      removeStrayOverlay()
      rewriteSessionAnchors(document)
      markSessionCode(document)
      injectArrowsToOfficialSearchResults()
      const input = findOfficialSearchInput()
      if (input) renderInstantIdHits(input.value)
    }

    function apply(ctx) {
      bootNav = parseNavFromUrl(window.location.href)
      injectStyles()
      removeStrayOverlay()
      sessionsRef = ctx.sessions || (typeof ctx.get === 'function' ? ctx.get('sessions') : null)
      if (!sessionsRef) {
        console.warn('[dsh-session-navigator] sessions service missing')
        return () => {}
      }
      setupClickRouter()
      handleDeepLinkStartup()
      enhanceDom()
      let enhanceTimer = null
      const observer = new MutationObserver(() => {
        if (enhanceTimer) return
        enhanceTimer = setTimeout(() => {
          enhanceTimer = null
          enhanceDom()
        }, 80)
      })
      observer.observe(document.body, { childList: true, subtree: true })
      return () => {
        observer.disconnect()
        if (enhanceTimer) clearTimeout(enhanceTimer)
        document.getElementById('dsh-session-navigator-styles')?.remove()
        document.getElementById('dsh-nav-id-hits')?.remove()
        removeStrayOverlay()
      }
    }

    module.exports.apply = apply
    module.exports.inject = ['sessions']
    return module.exports
  },
})
