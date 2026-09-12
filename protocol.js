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

/** Visible chip text: session title only, matching the official @ mention chip. */
export function formatCapsuleLabel(title, sessionId, _turn) {
  const id = normalizeSessionId(sessionId) || String(sessionId || '').trim()
  const name = String(title || '').trim()
  if (name && name !== id) return name
  return id
}

/** Tooltip carries turn, raw id, and the new-window hint. */
export function formatCapsuleTooltip(title, sessionId, turn) {
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

/**
 * Skill used to emit a "查看会话：标题 · 第 N 轮" line above the session id.
 * Once the chip already shows that title, the extra line is noise.
 */
export function isRedundantSessionLeadIn(text, { title, sessionId, turn } = {}) {
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

export function isSessionActionsButton(el) {
  if (!el || typeof el.getAttribute !== 'function') return false
  const label = el.getAttribute('aria-label') || ''
  if (/工作区|Workspace actions/.test(label)) return false
  return /会话.*的操作$/.test(label) || /^Session actions for /.test(label)
}

/**
 * Official Menu portals `role="menu"` → viewport → itemWrap → menuitem.
 * Insert against the viewport using the wrap as the reference node; inserting
 * the menuitem as a direct child of `role="menu"` throws NotFoundError.
 */
export function sessionMenuItemHost(menuItem) {
  if (!menuItem || typeof menuItem !== 'object') return null
  const wrap = menuItem.parentElement
  if (!wrap) return null
  const host = wrap.parentElement
  if (!host) return null
  return { host, before: wrap }
}

export function sessionCopyMenuLabels(locale) {
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

/** True when clipboard text is exactly one session mention (optional trim). */
export function parseExclusiveSessionMention(text) {
  const trimmed = String(text ?? '').trim()
  if (!trimmed) return null
  const parsed = parseSessionReferenceMentions(trimmed)
  if (parsed.length !== 1) return null
  if (parsed[0].match !== trimmed) return null
  return parsed[0]
}

/**
 * First plain (not-yet-chip) session mention in a composer snapshot, mapped
 * onto detect coordinates for `insertReference`.
 */
export function nextSessionMentionHydration(snapshot) {
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

export const INTERNAL_NAV_ATTR = 'data-dsh-nav-internal'

export function isInternalNavElement(el) {
  if (!el || typeof el.getAttribute !== 'function') return false
  return el.getAttribute(INTERNAL_NAV_ATTR) === 'true' || Boolean(el.hasAttribute?.(INTERNAL_NAV_ATTR))
}

export function isOfficialNewSessionElement(el) {
  if (!el) return false
  if (typeof el.closest === 'function') {
    return Boolean(el.closest('button.hHd-Xa_newSession, [aria-label="新建会话"], [aria-label="New session"]'))
  }
  const label = typeof el.getAttribute === 'function' ? el.getAttribute('aria-label') : ''
  const cls = typeof el.getAttribute === 'function' ? el.getAttribute('class') : ''
  return /新建会话|New session/i.test(label || '') || /hHd-Xa_newSession/.test(cls || '')
}

/** Official persisted "current session" cell. Shared by every window of one origin. */
export const CURRENT_SELECTION_KEY = 'dsh.sessions.current'

/**
 * Relative deep-link href for one session (and optional turn).
 * @returns the href, or null when the id is not a canonical session id.
 */
export function sessionDeepLinkHref(sessionId, turn = null) {
  const id = normalizeSessionId(sessionId)
  if (!id) return null
  const target = parseTurn(turn)
  return `/?session=${encodeURIComponent(id)}${target ? `&turn=${target}` : ''}`
}

/**
 * Decide what (if anything) to write into the persisted current-session cell.
 *
 * Opening a window natively cannot run script first, so the opener primes this
 * cell on `pointerdown`: the new window then restores the target on boot instead
 * of whatever session the previous window left behind.
 *
 * @param rawJson - current stored value (may be absent or malformed).
 * @param sessionId - session the new window should land on.
 * @returns the JSON to write, or null when the stored value already matches.
 */
export function nextSelectionWrite(rawJson, sessionId) {
  const id = normalizeSessionId(sessionId)
  if (!id) return null
  let parsed = null
  try {
    parsed = rawJson ? JSON.parse(rawJson) : null
  } catch {
    parsed = null
  }
  if (parsed && typeof parsed === 'object' && parsed.sessionId === id) return null
  return JSON.stringify({ sessionId: id })
}

/** Deep-link actions, in the order the engine evaluates them. */
export const DEEP_LINK_ACTION = {
  /** The target is already current: jump to the turn and stop. */
  DONE: 'done',
  /** The list has not arrived yet, or the target is not listed: keep waiting. */
  WAIT: 'wait',
  /** The target is listed but not current: select it. */
  OPEN: 'open',
  /** Another session is current well after the list settled: the user chose it. */
  YIELD: 'yield',
  /** The wait budget is exhausted. */
  TIMEOUT: 'timeout',
}

/**
 * Decide the next deep-link step from observed session-list state.
 *
 * The regression this encodes: a fresh window in a home with hundreds of
 * sessions can take minutes to receive `session.list`. An 8-second retry window
 * silently gave up long before the list existed, so the window settled on
 * whatever session the shared persisted cell held — the "clicked a link, got a
 * blank/other window" report. Waiting is therefore governed by a budget, never
 * by a short retry count.
 *
 * @param state - observed list state plus the engine's clock.
 * @returns one of {@link DEEP_LINK_ACTION}.
 */
export function nextDeepLinkAction(state = {}) {
  const {
    target,
    current,
    listed,
    listReadyAt = null,
    startedAt = 0,
    now = 0,
    settleMs = 0,
    maxWaitMs = 0,
  } = state
  const id = normalizeSessionId(target)
  if (!id) return DEEP_LINK_ACTION.DONE
  if (current === id) return DEEP_LINK_ACTION.DONE
  if (!listed) {
    return now - startedAt > maxWaitMs ? DEEP_LINK_ACTION.TIMEOUT : DEEP_LINK_ACTION.WAIT
  }
  const readyAt = listReadyAt === null || listReadyAt === undefined ? now : listReadyAt
  if (now - readyAt > settleMs && current !== undefined && current !== null) {
    return DEEP_LINK_ACTION.YIELD
  }
  return DEEP_LINK_ACTION.OPEN
}

export const PIN_DOCUMENT_VERSION = 1
export const MAX_PINNED_SESSIONS = 40

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

/** Coerce unknown JSON into `{ version, pins: [{ sessionId, pinnedAt }] }`. Newest pin first. */
export function normalizePinDocument(raw) {
  const listed = Array.isArray(raw) ? raw : ownValue(raw, 'pins')
  const source = Array.isArray(listed) ? listed : []
  const pins = []
  const seen = new Set()
  for (const item of source) {
    const record = asPinRecord(item)
    if (!record || seen.has(record.sessionId)) continue
    seen.add(record.sessionId)
    pins.push(record)
    if (pins.length >= MAX_PINNED_SESSIONS) break
  }
  return { version: PIN_DOCUMENT_VERSION, pins }
}

export function isSessionPinned(document, sessionId) {
  const id = normalizeSessionId(sessionId)
  if (!id) return false
  return normalizePinDocument(document).pins.some((item) => item.sessionId === id)
}

/**
 * Pin (move to front) or unpin a session. Pinning an existing id refreshes
 * pinnedAt and puts it first. Unknown / invalid ids are rejected.
 */
export function togglePinnedSession(document, sessionId, pinned, now = Date.now()) {
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
    if (nextPins.length > MAX_PINNED_SESSIONS) nextPins.length = MAX_PINNED_SESSIONS
  }
  return {
    ok: true,
    document: { version: PIN_DOCUMENT_VERSION, pins: nextPins },
    pinned: pinned === true,
  }
}

export function sessionPinMenuLabels(locale) {
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

export function compactRelativeTime(updatedAt, now, locale = 'zh') {
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

