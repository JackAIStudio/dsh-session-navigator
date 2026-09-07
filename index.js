import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const name = 'dsh-session-navigator';
export const inject = ['webServer'];

const SEARCH_ROUTE = '/dsh-session-navigator/search';
const INFO_ROUTE = '/dsh-session-navigator/info';

function sendJson(res, statusCode, value) {
  const body = JSON.stringify(value);
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-length', String(Buffer.byteLength(body)));
  res.end(body);
}

function resolveDbPath(config = {}) {
  if (config.dbPath && existsSync(config.dbPath)) {
    return config.dbPath;
  }
  const defaultPath = join(homedir(), '.dsh', 'storages', 'sessions-fts.db');
  if (existsSync(defaultPath)) {
    return defaultPath;
  }
  return null;
}

let sqliteDb = null;

async function getDatabase(dbPath) {
  if (sqliteDb) return sqliteDb;
  if (!dbPath) return null;
  try {
    const { DatabaseSync } = await import('node:sqlite');
    sqliteDb = new DatabaseSync(dbPath, { readOnly: true });
    return sqliteDb;
  } catch (error) {
    console.warn('[dsh-session-navigator] Failed to load node:sqlite:', error);
    return null;
  }
}

function querySessions(db, queryText, limit = 20) {
  const q = (queryText || '').trim();
  if (!q) return [];

  const results = [];
  const seenIds = new Set();

  // 1. 优先按 Session ID 匹配 (前缀或子串)
  try {
    const idStmt = db.prepare(`
      SELECT id, cwd, created_at
      FROM persisted_sessions
      WHERE id LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    const idRows = idStmt.all(`%${q}%`, limit);
    for (const row of idRows) {
      seenIds.add(row.id);
      results.push({
        id: row.id,
        cwd: row.cwd,
        createdAt: row.created_at,
        matchType: 'id',
        turns: getSessionTurns(db, row.id),
      });
    }
  } catch (err) {
    console.warn('[dsh-session-navigator] ID search error:', err);
  }

  // 2. 如果还有名额，按文本内容搜索
  if (results.length < limit) {
    try {
      const remainingLimit = limit - results.length;
      // 为汉字之间添加通配以支持 CJK 空格分词
      const spacedQ = q.split('').join('%');
      const contentStmt = db.prepare(`
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
      `);
      const contentRows = contentStmt.all(`%${spacedQ}%`, remainingLimit * 2);
      for (const row of contentRows) {
        if (!seenIds.has(row.session_id)) {
          seenIds.add(row.session_id);
          results.push({
            id: row.session_id,
            cwd: row.cwd,
            createdAt: row.created_at,
            matchType: 'content',
            matchedSnippet: extractSnippet(row.text, q),
            turns: getSessionTurns(db, row.session_id),
          });
          if (results.length >= limit) break;
        }
      }
    } catch (err) {
      console.warn('[dsh-session-navigator] Content search error:', err);
    }
  }

  return results;
}

function getSessionTurns(db, sessionId) {
  try {
    const stmt = db.prepare(`
      SELECT seq, time, text
      FROM persisted_docs
      WHERE session_id = ? AND type = 'user/message'
      ORDER BY seq ASC
    `);
    const rows = stmt.all(sessionId);
    return rows.map((r, idx) => {
      const clean = r.text
        .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
        .replace(/## Referenced sessions[\s\S]*?<\/referenced-sessions>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        turnIndex: idx + 1,
        seq: r.seq,
        time: r.time,
        prompt: clean.slice(0, 120),
      };
    });
  } catch {
    return [];
  }
}

function extractSnippet(rawText, query) {
  const clean = rawText
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const qClean = query.replace(/\s+/g, '');
  const cleanNoSpaces = clean.replace(/\s+/g, '');
  const idx = cleanNoSpaces.toLowerCase().indexOf(qClean.toLowerCase());
  if (idx === -1) return clean.slice(0, 100);
  const start = Math.max(0, idx - 30);
  const end = Math.min(cleanNoSpaces.length, idx + 70);
  return (start > 0 ? '…' : '') + cleanNoSpaces.slice(start, end) + (end < cleanNoSpaces.length ? '…' : '');
}

export function apply(ctx, config = {}) {
  const dbPath = resolveDbPath(config);

  ctx.inject(['webServer'], (web) => {
    const webServer = web.get('webServer');

    // INFO 路由
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: INFO_ROUTE,
      handler: (req, res) => {
        if (req.method !== 'GET') {
          res.setHeader('allow', 'GET');
          sendJson(res, 405, { ok: false, error: 'method not allowed' });
          return;
        }
        sendJson(res, 200, {
          ok: true,
          name: 'dsh-session-navigator',
          version: '0.1.0',
          dbAvailable: Boolean(dbPath),
          dbPath,
        });
      },
    }), 'dsh-session-navigator/info');

    // SEARCH 路由
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: SEARCH_ROUTE,
      handler: async (req, res) => {
        if (req.method !== 'GET') {
          res.setHeader('allow', 'GET');
          sendJson(res, 405, { ok: false, error: 'method not allowed' });
          return;
        }
        try {
          const url = new URL(req.url, 'http://127.0.0.1:3080');
          const q = url.searchParams.get('q') || '';
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);

          const db = await getDatabase(dbPath);
          if (!db) {
            sendJson(res, 503, { ok: false, error: 'Session database not available' });
            return;
          }

          const items = querySessions(db, q, limit);
          sendJson(res, 200, { ok: true, query: q, items });
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    }), 'dsh-session-navigator/search');
  });
}
