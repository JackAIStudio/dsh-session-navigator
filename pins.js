import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { resolveDshHome } from './home-paths.js'
import { normalizePinDocument, togglePinnedSession } from './protocol.js'

export const PINS_ROUTE = '/dsh-session-navigator/pins'
export const PIN_ROUTE = '/dsh-session-navigator/pin'

/**
 * Pins belong to the profile that owns the sessions they point at, so the file
 * lives under that profile's own `$DSH_HOME` — not a single shared `~/.dsh`
 * file that every instance on the machine would read.
 *
 * @param configuredHome - explicit harness-home override from plugin config.
 */
export function defaultPinsPath(configuredHome) {
  return join(resolveDshHome(configuredHome), 'session-navigator', 'pins.json')
}

export async function readPinsDocument(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8')
    return normalizePinDocument(JSON.parse(raw))
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error instanceof SyntaxError)) {
      return normalizePinDocument(null)
    }
    throw error
  }
}

export async function writePinsDocument(filePath, document) {
  const normalized = normalizePinDocument(document)
  const json = `${JSON.stringify(normalized, null, 2)}\n`
  await mkdir(dirname(filePath), { recursive: true })
  const tmp = `${filePath}.${process.pid}.tmp`
  await writeFile(tmp, json, 'utf8')
  try {
    await rename(tmp, filePath)
  } catch (error) {
    if (process.platform === 'win32') {
      await writeFile(filePath, json, 'utf8')
      await unlink(tmp).catch(() => {})
      return normalized
    }
    await unlink(tmp).catch(() => {})
    throw error
  }
  return normalized
}

export async function applyPinChange(filePath, sessionId, pinned, now = Date.now()) {
  const current = await readPinsDocument(filePath)
  const result = togglePinnedSession(current, sessionId, pinned, now)
  if (!result.ok) return result
  const document = await writePinsDocument(filePath, result.document)
  return { ok: true, document, pinned: result.pinned }
}
