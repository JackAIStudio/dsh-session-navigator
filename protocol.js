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
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null
  }
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const n = parseInt(trimmed, 10)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

export function extractTurnFromText(text) {
  if (!text || typeof text !== 'string') return null
  const matchCn = text.match(/第\s*(\d+)\s*(?:轮|回合)/)
  if (matchCn) return parseTurn(matchCn[1])
  const matchEn = text.match(/\bturn[\s:#_-]*(\d+)\b/i)
  return matchEn ? parseTurn(matchEn[1]) : null
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

export function isSessionIdQuery(query) {
  const raw = String(query || '').trim()
  if (!raw) return false
  // 显式前缀: #xxx, @id:xxx, id:xxx
  if (/^(?:#|@id:|id:)\s*\S+/i.test(raw)) return true
  // 以 session- 开头
  if (/^session-[0-9a-fA-F-]{2,}/i.test(raw)) return true
  // 纯十六进制或 UUID 片段（至少 8 位 hex），排除常见英文单词和常规词
  if (/^[0-9a-f]{8}(?:-[0-9a-f]{4}){0,4}$/i.test(raw)) return true
  return false
}

export function cleanSessionIdQuery(query) {
  let raw = String(query || '').trim()
  raw = raw.replace(/^(?:#|@id:|id:)\s*/i, '')
  return raw.trim()
}

export function collectIdHitsFromList(ids, query, limit = 20) {
  const raw = String(query || '').trim()
  if (!isSessionIdQuery(raw)) return []
  const q = cleanSessionIdQuery(raw).toLowerCase()
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

export const SESSION_REFERENCE_SCHEME = 'dsh-session:'

const SESSION_MENTION_RE = /@\[((?:\\.|[^\\\]])*)\]\((dsh-session:[A-Za-z0-9_-]+)\)|(dsh-session:[A-Za-z0-9_-]+)/gu

function bytesToBase64Url(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url')
  }
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(payload) {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(payload, 'base64url'))
  }
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/')
  const b64 = padded + '='.repeat((4 - (padded.length % 4)) % 4)
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function utf8Decode(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('utf8')
  return new TextDecoder().decode(bytes)
}

function utf8Encode(text) {
  if (typeof Buffer !== 'undefined') return Uint8Array.from(Buffer.from(text, 'utf8'))
  return new TextEncoder().encode(text)
}

export function escapeSessionMentionLabel(label) {
  return String(label ?? '').replace(/[\\\]]/gu, (match) => `\\${match}`)
}

export function unescapeSessionMentionLabel(label) {
  return String(label ?? '').replace(/\\(.)/gu, '$1')
}

/** Canonical lossless `dsh-session:` URI used by the official session-reference package. */
export function encodeSessionReferenceUri(sessionId) {
  return `${SESSION_REFERENCE_SCHEME}${bytesToBase64Url(utf8Encode(JSON.stringify(sessionId)))}`
}

export function decodeSessionReferenceUri(uri) {
  if (typeof uri !== 'string' || !uri.startsWith(SESSION_REFERENCE_SCHEME)) return null
  const payload = uri.slice(SESSION_REFERENCE_SCHEME.length)
  if (!/^[A-Za-z0-9_-]+$/.test(payload)) return null
  try {
    const parsed = JSON.parse(utf8Decode(base64UrlToBytes(payload)))
    if (typeof parsed !== 'string') return null
    if (encodeSessionReferenceUri(parsed) !== uri) return null
    return parsed
  } catch {
    return null
  }
}

export function formatSessionReferenceMention(sessionId, label) {
  const visible = escapeSessionMentionLabel(label || sessionId)
  return `@[${visible}](${encodeSessionReferenceUri(sessionId)})`
}

/**
 * Extract official Markdown mentions and bare `dsh-session:` URIs.
 * @returns {{ match: string, index: number, sessionId: string, label: string, mention: string }[]}
 */
export function parseSessionReferenceMentions(text) {
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

/**
 * Map a clipboard-projection offset onto detect coordinates.
 * Chips occupy their full clipboardText in the clipboard view and one unit in detect.
 */
export function clipboardOffsetToDetect(occurrences, clipboardOffset) {
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

export function isCoveredByOccurrence(occurrences, start, end) {
  return (occurrences || []).some((occ) => {
    const from = occ.offset
    const to = occ.offset + occ.length
    return from <= start && start < to && end <= to
  })
}

/** Mentions that exist as plain text in the clipboard draft, not already chips. */
export function findPlainSessionMentions(draft, occurrences) {
  return parseSessionReferenceMentions(draft).filter((item) => {
    const end = item.index + item.match.length
    return !isCoveredByOccurrence(occurrences, item.index, end)
  })
}

export function isSessionActionsMenuText(text) {
  const value = String(text || '')
  return (value.includes('分叉会话') || value.includes('Fork session'))
    && (value.includes('归档会话') || value.includes('Archive session'))
}

/** Stable window name so the same session reuses one popup instead of spawning `_blank` copies. */
export function sessionWindowName(sessionId) {
  const id = normalizeSessionId(sessionId)
  return id ? `dsh-session-${id}` : 'dsh-session'
}

export function isBlankPopupHref(href) {
  if (href == null) return true
  const value = String(href).trim()
  if (!value) return true
  return value === 'about:blank' || value.startsWith('about:blank')
}

/**
 * Chrome App Mode nested `window.open` often lands on about:blank.
 * Also re-assign when the popup exists but is showing a different session/turn.
 */
export function popupNeedsUrlAssign(openedHref, sessionId, turn = null) {
  if (isBlankPopupHref(openedHref)) return true
  const nav = parseNavFromUrl(openedHref)
  if (!nav) return true
  const id = normalizeSessionId(sessionId)
  if (!id || nav.sessionId !== id) return true
  const expectedTurn = parseTurn(turn)
  if (expectedTurn && nav.turn !== expectedTurn) return true
  return false
}

/**
 * Plain clicks on sidebar / official search `treeitem` rows stay in-window.
 * Cmd/Ctrl and the ↗ control are handled by dedicated paths.
 */
export function isInWindowSessionRowClick({ inTreeItem, inNewWindowControl, modifiedClick } = {}) {
  if (modifiedClick || inNewWindowControl) return false
  return Boolean(inTreeItem)
}
