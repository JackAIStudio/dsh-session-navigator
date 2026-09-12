import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { normalizePinDocument, togglePinnedSession } from './protocol.js'

export const PINS_ROUTE = '/dsh-session-navigator/pins'
export const PIN_ROUTE = '/dsh-session-navigator/pin'

export function defaultPinsPath() {
  return join(homedir(), '.dsh', 'session-navigator', 'pins.json')
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
