/** Shared session-id / deep-link helpers used by the host and tests. */

export const SESSION_ID_PATTERN =
  'session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

export function sessionIdRegex(flags = 'i') {
  return new RegExp(SESSION_ID_PATTERN, flags)
}

export function normalizeSessionId(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const match = String(value).match(sessionIdRegex())
  return match ? match[0].toLowerCase() : null
}

export function parseTurn(value) {
  const n = parseInt(value, 10)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

export function extractTurnFromText(text) {
  const match = String(text || '').match(/第\s*(\d+)\s*轮/)
  if (match) return parseTurn(match[1])
  const en = String(text || '').match(/\bturn\s*(\d+)\b/i)
  return en ? parseTurn(en[1]) : null
}

/**
 * Parse a deep-link URL (absolute, relative, custom scheme, or hash).
 * @returns {{ sessionId: string, turn: number | null } | null}
 */
export function parseNavFromUrl(raw) {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url
  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
      url = new URL(trimmed)
    } else {
      url = new URL(trimmed, 'http://dsh.local/')
    }
  } catch {
    return null
  }

  const fromQuery =
    url.searchParams.get('session') ||
    url.searchParams.get('dsh-session') ||
    ''
  const turnRaw = url.searchParams.get('turn')

  let fromHash = ''
  let hashTurn = null
  if (url.hash && url.hash.length > 1) {
    const hash = url.hash.slice(1)
    try {
      const params = new URLSearchParams(hash.includes('=') ? hash : `dsh-nav=${hash}`)
      fromHash = params.get('dsh-nav') || params.get('session') || ''
      hashTurn = params.get('turn')
    } catch {
      fromHash = ''
    }
  }

  const pathId = url.pathname.startsWith('/session/')
    ? url.pathname.slice('/session/'.length)
    : url.protocol === 'dsh:' && url.hostname === 'session'
      ? url.pathname.replace(/^\//, '')
      : ''

  const sessionId = normalizeSessionId(fromQuery || fromHash || pathId)
  if (!sessionId) return null
  return { sessionId, turn: parseTurn(turnRaw || hashTurn) }
}

export function isWorkspaceSessionSearchMeta(placeholder, ariaLabel) {
  const ph = String(placeholder || '').trim()
  const aria = String(ariaLabel || '').trim()
  return (
    ph === '搜索会话…' ||
    ph === 'Search sessions...' ||
    aria === '搜索会话' ||
    aria === 'Search sessions'
  )
}

export function mergeIdHits(contentItems, idHits, limit = 20) {
  const seen = new Set()
  const out = []
  for (const item of idHits || []) {
    if (!item?.sessionId || seen.has(item.sessionId)) continue
    seen.add(item.sessionId)
    out.push(item)
  }
  for (const item of contentItems || []) {
    if (!item?.sessionId || seen.has(item.sessionId)) continue
    seen.add(item.sessionId)
    out.push(item)
  }
  return out.slice(0, Math.max(1, limit))
}

export function formatCapsuleLabel(title, sessionId, turn) {
  const name = String(title || '').trim()
  const id = normalizeSessionId(sessionId) || String(sessionId || '').trim()
  const head = name && name !== id ? name : id
  const turnLabel = parseTurn(turn) ? ` · 第 ${parseTurn(turn)} 轮` : ''
  return `${head}${turnLabel}`
}

/** Avoid `A, B > child` which only qualifies the last selector. */
export function officialSearchRowSelector() {
  return [
    '[role="tree"][aria-label="搜索结果"] > button[role="treeitem"]',
    '[role="tree"][aria-label="Search results"] > button[role="treeitem"]',
  ].join(', ')
}

export function collectIdHitsFromList(ids, query, limit = 20) {
  const q = String(query || '').trim().toLowerCase()
  if (q.length < 2) return []
  const hits = []
  for (const id of ids || []) {
    if (typeof id !== 'string') continue
    if (!id.toLowerCase().includes(q)) continue
    hits.push({ sessionId: id, snippet: `ID ${id}` })
    if (hits.length >= limit) break
  }
  return hits
}
