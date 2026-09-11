import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { collectIdHitsFromList, mergeIdHits } from './protocol.js'
import {
  CHROME_TAB_ROUTE,
  isLoopbackAddress,
  openGoogleChromeTab,
} from './chrome-tab.js'
import {
  SESSION_SUMMARY_ROUTE,
  defaultProjectionCacheDir,
  isSessionId,
  readSessionSummary,
} from './session-summary.js'

export const name = 'dsh-session-navigator'
export const inject = ['webServer']

const SEARCH_ROUTE = '/dsh-session-navigator/search'
const INFO_ROUTE = '/dsh-session-navigator/info'
const VERSION = '0.4.1'
const BODY_LIMIT = 2048

function sendJson(res, statusCode, value) {
  const body = JSON.stringify(value)
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('content-length', String(Buffer.byteLength(body)))
  res.end(body)
}

function resolveDbPath(config = {}) {
  if (config.dbPath && existsSync(config.dbPath)) return config.dbPath
  const defaultPath = join(homedir(), '.dsh', 'storages', 'sessions-fts.db')
  return existsSync(defaultPath) ? defaultPath : null
}

function resolveSummaryCacheDir(config = {}) {
  if (config.projCacheDir && existsSync(config.projCacheDir)) return config.projCacheDir
  return defaultProjectionCacheDir()
}

function isLoopbackRequest(req) {
  return isLoopbackAddress(req.socket?.remoteAddress)
}

async function readJsonBody(req, limit = BODY_LIMIT) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) {
      const error = new Error('payload too large')
      error.code = 'too-large'
      throw error
    }
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (raw === '') return {}
  return JSON.parse(raw)
}

let sqliteDb = null

async function getDatabase(dbPath) {
  if (sqliteDb) return sqliteDb
  if (!dbPath) return null
  try {
    const { DatabaseSync } = await import('node:sqlite')
    sqliteDb = new DatabaseSync(dbPath, { readOnly: true })
    return sqliteDb
  } catch (error) {
    console.warn('[dsh-session-navigator] Failed to load node:sqlite:', error)
    return null
  }
}

function listPersistedIds(db) {
  try {
    return db.prepare('SELECT id FROM persisted_sessions ORDER BY created_at DESC').all().map((row) => row.id)
  } catch {
    return []
  }
}

function getSessionTurns(db, sessionId) {
  try {
    const rows = db.prepare(`
      SELECT seq, time, text
      FROM persisted_docs
      WHERE session_id = ? AND type = 'user/message'
      ORDER BY seq ASC
    `).all(sessionId)
    return rows.map((row, idx) => {
      const clean = row.text
        .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
        .replace(/## Referenced sessions[\s\S]*?<\/referenced-sessions>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      return {
        turnIndex: idx + 1,
        seq: row.seq,
        time: row.time,
        prompt: clean.slice(0, 120),
      }
    })
  } catch {
    return []
  }
}

function extractSnippet(rawText, query) {
  const clean = rawText
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const qClean = query.replace(/\s+/g, '')
  const cleanNoSpaces = clean.replace(/\s+/g, '')
  const idx = cleanNoSpaces.toLowerCase().indexOf(qClean.toLowerCase())
  if (idx === -1) return clean.slice(0, 100)
  const start = Math.max(0, idx - 30)
  const end = Math.min(cleanNoSpaces.length, idx + 70)
  return `${start > 0 ? '…' : ''}${cleanNoSpaces.slice(start, end)}${end < cleanNoSpaces.length ? '…' : ''}`
}

function querySessions(db, queryText, limit = 20) {
  const q = (queryText || '').trim()
  if (!q) return []

  const idHits = collectIdHitsFromList(listPersistedIds(db), q, limit).map((hit) => ({
    id: hit.sessionId,
    matchType: 'id',
    matchedSnippet: hit.snippet,
    turns: getSessionTurns(db, hit.sessionId),
  }))

  const contentItems = []
  if (idHits.length < limit) {
    try {
      const spacedQ = q.split('').join('%')
      const contentRows = db.prepare(`
        SELECT d.session_id, s.cwd, s.created_at, d.seq, d.text
        FROM persisted_docs d
        JOIN persisted_sessions s ON s.id = d.session_id
        WHERE d.type = 'user/message'
          AND d.text LIKE ?
          AND d.text NOT LIKE '<system-reminder%'
          AND d.text NOT LIKE 'Current runtime context%'
          AND d.text NOT LIKE 'Background subagent%'
        ORDER BY s.created_at DESC
        LIMIT ?
      `).all(`%${spacedQ}%`, (limit - idHits.length) * 2)
      for (const row of contentRows) {
        contentItems.push({
          sessionId: row.session_id,
          cwd: row.cwd,
          createdAt: row.created_at,
          matchType: 'content',
          matchedSnippet: extractSnippet(row.text, q),
        })
      }
    } catch (err) {
      console.warn('[dsh-session-navigator] Content search error:', err)
    }
  }

  const merged = mergeIdHits(
    contentItems.map((item) => ({ sessionId: item.sessionId })),
    idHits.map((item) => ({ sessionId: item.id })),
    limit,
  )

  const byId = new Map(idHits.map((item) => [item.id, item]))
  const contentById = new Map(contentItems.map((item) => [item.sessionId, item]))
  return merged.map((item) => {
    const idHit = byId.get(item.sessionId)
    const content = contentById.get(item.sessionId)
    return {
      id: item.sessionId,
      cwd: content?.cwd,
      createdAt: content?.createdAt,
      matchType: idHit ? 'id' : 'content',
      matchedSnippet: idHit?.matchedSnippet || content?.matchedSnippet,
      turns: getSessionTurns(db, item.sessionId),
    }
  })
}

export function apply(ctx, config = {}) {
  const dbPath = resolveDbPath(config)
  const summaryCacheDir = resolveSummaryCacheDir(config)

  ctx.inject(['webServer'], (web) => {
    const webServer = web.get('webServer')

    // Single-session summary for deep links. This exists so a deep link never
    // has to wait for `session.list` to summarize the whole corpus before the
    // client will accept the target id.
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: SESSION_SUMMARY_ROUTE,
      handler: async (req, res) => {
        if (req.method !== 'GET') {
          res.setHeader('allow', 'GET')
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        try {
          const url = new URL(req.url, 'http://127.0.0.1')
          const id = (url.searchParams.get('id') || '').trim()
          if (!isSessionId(id)) {
            sendJson(res, 400, { ok: false, error: 'invalid session id' })
            return
          }
          const summary = await readSessionSummary(id, summaryCacheDir)
          if (!summary) {
            sendJson(res, 404, { ok: false, error: 'no summary for that session' })
            return
          }
          sendJson(res, 200, { ok: true, summary })
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    }), 'dsh-session-navigator/session-summary')

    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: INFO_ROUTE,
      handler: (req, res) => {
        if (req.method !== 'GET') {
          res.setHeader('allow', 'GET')
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        sendJson(res, 200, {
          ok: true,
          name: 'dsh-session-navigator',
          version: VERSION,
          dbAvailable: Boolean(dbPath),
          dbPath,
          summaryCacheAvailable: Boolean(summaryCacheDir),
          summaryCacheDir,
        })
      },
    }), 'dsh-session-navigator/info')

    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: SEARCH_ROUTE,
      handler: async (req, res) => {
        if (req.method !== 'GET') {
          res.setHeader('allow', 'GET')
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        try {
          const url = new URL(req.url, 'http://127.0.0.1')
          const q = url.searchParams.get('q') || ''
          const limit = parseInt(url.searchParams.get('limit') || '20', 10)
          const db = await getDatabase(dbPath)
          if (!db) {
            sendJson(res, 503, { ok: false, error: 'Session database not available' })
            return
          }
          sendJson(res, 200, { ok: true, query: q, items: querySessions(db, q, limit) })
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    }), 'dsh-session-navigator/search')

    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: CHROME_TAB_ROUTE,
      handler: async (req, res) => {
        if (!isLoopbackRequest(req)) {
          sendJson(res, 403, { ok: false, error: 'chrome tab open is local-only' })
          return
        }
        if (req.method !== 'POST') {
          res.setHeader('allow', 'POST')
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        try {
          const body = await readJsonBody(req)
          const url = typeof body?.url === 'string' ? body.url : ''
          const result = await openGoogleChromeTab(url)
          sendJson(res, 200, result)
        } catch (error) {
          if (error && error.code === 'too-large') {
            sendJson(res, 413, { ok: false, error: 'payload too large' })
            return
          }
          if (error instanceof SyntaxError) {
            sendJson(res, 400, { ok: false, error: 'malformed json' })
            return
          }
          if (error && error.code === 'url-not-allowed') {
            sendJson(res, 400, { ok: false, error: 'url not allowed' })
            return
          }
          if (error && error.code === 'unsupported-platform') {
            sendJson(res, 501, { ok: false, error: error.message })
            return
          }
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    }), 'dsh-session-navigator/chrome-tab')
  })
}
