import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveDshHome } from './home-paths.js'

export const SESSION_SUMMARY_ROUTE = '/dsh-session-navigator/session-summary'

/**
 * Canonical physical session id: the literal prefix plus a UUID. This is also
 * the only filename shape this module will ever join onto the cache directory,
 * so the pattern doubles as the path-traversal guard.
 */
const SESSION_ID_RE = /^session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function isSessionId(value) {
  return typeof value === 'string' && SESSION_ID_RE.test(value)
}

/**
 * Locate the Harness projection cache this profile writes.
 *
 * The cache is per profile, exactly like the sessions it projects: reading the
 * default `~/.dsh` cache from an app profile would summarize another profile's
 * corpus and miss the app's own sessions.
 *
 * @param configuredHome - explicit harness-home override from plugin config.
 * @returns the sessions directory, or null when the profile has none.
 */
export function defaultProjectionCacheDir(configuredHome) {
  const dir = join(resolveDshHome(configuredHome), 'storages', 'session_projcache', 'sessions')
  return existsSync(dir) ? dir : null
}

/** Read one projection row's folded value (the row's `val`, never its envelope). */
function rowValue(rows, key) {
  const row = rows?.[key]
  return row !== null && typeof row === 'object' ? row.val : undefined
}

/**
 * Build one Session-list summary for a single session without touching the
 * full corpus.
 *
 * The client's `sessions.select()` refuses any id that is not already in its
 * loaded list, and that list summarizes every session the profile has ever
 * kept — on a large profile that is minutes of work for one row. The official
 * projection cache already holds exactly the fields a list row needs
 * (`title`, `sessionListMetadata`, `identity.cwd`), so reading one file
 * yields a summary the client accepts through its own
 * `handleSessionAdded` increment path.
 *
 * @param sessionId - canonical session id to summarize.
 * @param cacheDir - projection cache sessions directory.
 * @returns the summary, or null when the id is unknown or unreadable.
 */
export async function readSessionSummary(sessionId, cacheDir) {
  if (!cacheDir || !isSessionId(sessionId)) return null

  let raw
  try {
    raw = await readFile(join(cacheDir, `${sessionId}.json`), 'utf8')
  } catch {
    return null
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const record = parsed?.record
  const identity = record?.identity
  if (record === null || typeof record !== 'object') return null
  if (identity === null || typeof identity !== 'object') return null

  const rows = record.rows ?? {}
  const metadata = rowValue(rows, 'sessionListMetadata')
  const title = rowValue(rows, 'title')
  const createdAt = Number(identity.createdAt) || 0
  const lastPromptAt = Number(metadata?.lastPromptAt) || 0

  const summary = {
    sessionId,
    updatedAt: Math.max(createdAt, lastPromptAt) || Date.now(),
    // Nothing here can be running: the client owns live status, and a stale
    // `true` would strand a spinner on a session this process is not driving.
    running: false,
    blank: metadata?.blank === true,
  }

  if (typeof identity.cwd === 'string' && identity.cwd !== '') summary.cwd = identity.cwd

  // The list row's title is read from the session's projection store, not from
  // a summary field, so the title has to travel in the projections block.
  if (typeof title === 'string' && title !== '') {
    const seq = Number(rows.title?.seq)
    summary.projections = {
      asOfSeq: Number.isSafeInteger(seq) && seq >= 0 ? seq : 0,
      values: { title },
    }
  }

  return summary
}
