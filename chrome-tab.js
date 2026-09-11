import { spawn } from 'node:child_process'
import { platform } from 'node:os'
import { normalizeSessionId, parseTurn } from './protocol.js'

export const CHROME_TAB_ROUTE = '/dsh-session-navigator/chrome-tab'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export function isLoopbackAddress(address) {
  return address === '127.0.0.1'
    || address === '::1'
    || address === '::ffff:127.0.0.1'
}

export function escapeAppleScriptString(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Only same-origin DSH deep links may be opened. This endpoint shells out, so
 * the URL must stay on loopback, path `/`, and query keys session/turn only.
 */
export function isAllowedChromeTabUrl(raw) {
  if (typeof raw !== 'string' || raw.length > 2048) return false
  let url
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (url.username || url.password) return false
  if (url.hash) return false
  if (!LOOPBACK_HOSTS.has(url.hostname)) return false
  if (url.pathname !== '/' && url.pathname !== '') return false
  for (const key of url.searchParams.keys()) {
    if (key !== 'session' && key !== 'turn') return false
  }
  const sessionId = normalizeSessionId(url.searchParams.get('session') || '')
  if (!sessionId) return false
  const turnRaw = url.searchParams.get('turn')
  if (turnRaw !== null && parseTurn(turnRaw) === null) return false
  return true
}

export function buildChromeTabScript(url) {
  const escaped = escapeAppleScriptString(url)
  return [
    'tell application id "com.google.Chrome"',
    '  if (count of windows) is 0 then make new window',
    '  tell window 1',
    `    make new tab with properties {URL:"${escaped}"}`,
    '  end tell',
    '  activate',
    'end tell',
  ].join('\n')
}

/**
 * Open a DSH deep-link as a real Google Chrome tab, never the Chrome App
 * shortcut registered for http://localhost:3080/ ("mac工作台").
 * Must not wait for osascript: the click comes from a Chrome tab, and
 * waiting on AppleScript while that tab's fetch is in-flight can deadlock.
 */
export function openGoogleChromeTab(url) {
  if (!isAllowedChromeTabUrl(url)) {
    const error = new Error('url not allowed')
    error.code = 'url-not-allowed'
    throw error
  }
  if (platform() !== 'darwin') {
    const error = new Error('chrome tab open is only implemented on macOS')
    error.code = 'unsupported-platform'
    throw error
  }
  const child = spawn('osascript', ['-e', buildChromeTabScript(url)], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
  if (typeof child.pid !== 'number' || child.pid <= 0) {
    throw new Error('failed to spawn osascript')
  }
  return { ok: true, via: 'chrome-applescript', scheduled: true, helperPid: child.pid }
}
