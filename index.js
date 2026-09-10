import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { collectIdHitsFromList, mergeIdHits } from './protocol.js'

export const name = 'dsh-session-navigator'
export const inject = ['webServer']

const SEARCH_ROUTE = '/dsh-session-navigator/search'
const INFO_ROUTE = '/dsh-session-navigator/info'

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

  ctx.inject(['webServer'], (web) => {
    const webServer = web.get('webServer')

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
          version: '0.3.1',
          dbAvailable: Boolean(dbPath),
          dbPath,
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
  })
}
