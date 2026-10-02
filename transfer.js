import { homedir, platform } from 'node:os'
import { join, resolve } from 'node:path'
import {
  existsSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  statSync,
  cpSync,
  openSync,
  readSync,
  closeSync,
} from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { normalizeSessionId } from './protocol.js'
import { resolveDshHome } from './home-paths.js'

export const DEFAULT_CLI_PORT = 3080
export const DEFAULT_APP_PORT = 3180

export const DEFAULT_CLI_HOME = join(homedir(), '.dsh')
export const DEFAULT_APP_HOME = join(homedir(), 'Library/Application Support/jackdsh/dsh-data')

const ATTACHMENT_SUBDIRS = ['objects', 'request-images', 'files', 'file-objects']
const MAX_ZSTD_BUFFER = 50 * 1024 * 1024

/**
 * Detect whether a DSH home belongs to the desktop app or the CLI service.
 */
export function detectInstanceKind(dshHome) {
  const norm = resolve(dshHome)
  return norm.includes('jackdsh/dsh-data') ? 'app' : 'cli'
}

/**
 * Determine default peer information given the current DSH home.
 */
export function getPeerConfig(currentDshHome) {
  const kind = detectInstanceKind(currentDshHome)
  if (kind === 'app') {
    return {
      currentKind: 'app',
      currentPort: DEFAULT_APP_PORT,
      targetKind: 'cli',
      targetPort: DEFAULT_CLI_PORT,
      targetDshHome: DEFAULT_CLI_HOME,
      targetLabel: '3080 Web 端',
    }
  }
  return {
    currentKind: 'cli',
    currentPort: DEFAULT_CLI_PORT,
    targetKind: 'app',
    targetPort: DEFAULT_APP_PORT,
    targetDshHome: DEFAULT_APP_HOME,
    targetLabel: '3180 桌面端',
  }
}

/**
 * Locate a session directory inside a DSH home's sessions directory.
 */
export function findSessionDirectory(dshHome, sessionId) {
  const normId = normalizeSessionId(sessionId)
  if (!normId) return null

  const sessionsRoot = join(dshHome, 'sessions')
  if (!existsSync(sessionsRoot)) return null

  const workspaces = readdirSync(sessionsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  for (const ws of workspaces) {
    const sessionDir = join(sessionsRoot, ws, normId)
    if (existsSync(sessionDir)) {
      // Find session.v4.jsonl.zstd or session.v3.jsonl.zstd
      const v4File = join(sessionDir, 'session.v4.jsonl.zstd')
      const v3File = join(sessionDir, 'session.v3.jsonl.zstd')
      const targetFile = existsSync(v4File) ? v4File : existsSync(v3File) ? v3File : null
      if (targetFile) {
        return {
          workspaceName: ws,
          sessionDir,
          sessionFile: targetFile,
          version: targetFile.includes('.v4.') ? 4 : 3,
        }
      }
    }
  }
  return null
}

/**
 * Check if a session id already exists in any workspace of a target DSH home.
 */
export function targetHasSessionId(targetDshHome, sessionId) {
  return findSessionDirectory(targetDshHome, sessionId) !== null
}

/**
 * Sync attachments referenced by 64-hex hashes in session log text.
 */
export function syncAttachments(sourceDshHome, targetDshHome, logText) {
  const matches = new Set(logText.match(/[0-9a-f]{64}/gi) || [])
  if (matches.size === 0) return 0

  const srcBase = join(sourceDshHome, 'attachments', 'v1')
  const tgtBase = join(targetDshHome, 'attachments', 'v1')
  if (!existsSync(srcBase)) return 0

  let copied = 0
  for (const hash of matches) {
    const sub = hash.slice(0, 2)
    for (const folder of ATTACHMENT_SUBDIRS) {
      const srcFile = join(srcBase, folder, sub, hash)
      if (existsSync(srcFile)) {
        const tgtDir = join(tgtBase, folder, sub)
        mkdirSync(tgtDir, { recursive: true })
        const tgtFile = join(tgtDir, hash)
        try {
          const st = statSync(srcFile)
          if (st.isDirectory()) {
            cpSync(srcFile, tgtFile, { recursive: true, force: true })
            copied++
          } else if (!existsSync(tgtFile)) {
            copyFileSync(srcFile, tgtFile)
            copied++
          }
        } catch (err) {
          console.warn(`[dsh-session-navigator] syncAttachment warning for ${srcFile}:`, err)
        }
      }
    }
  }
  return copied
}

/**
 * Sync projection cache JSON so the target instance immediately knows the title and metadata.
 * Updates createdAt and lastPromptAt to transferTime so the session is ordered at the top.
 */
export function syncProjectionCache(sourceDshHome, targetDshHome, sourceSessionId, targetSessionId, transferTime = Date.now()) {
  const srcFile = join(sourceDshHome, 'storages', 'session_projcache', 'sessions', `${sourceSessionId}.json`)
  if (!existsSync(srcFile)) return false

  const tgtDir = join(targetDshHome, 'storages', 'session_projcache', 'sessions')
  mkdirSync(tgtDir, { recursive: true })
  const tgtFile = join(tgtDir, `${targetSessionId}.json`)

  let content = readFileSync(srcFile, 'utf-8')
  if (sourceSessionId !== targetSessionId) {
    content = content.replaceAll(sourceSessionId, targetSessionId)
  }
  try {
    const obj = JSON.parse(content)
    if (obj?.record?.identity) {
      obj.record.identity.createdAt = transferTime
    }
    if (obj?.record?.rows?.sessionListMetadata?.val) {
      obj.record.rows.sessionListMetadata.val.lastPromptAt = transferTime
    }
    content = JSON.stringify(obj, null, 2)
  } catch (err) {
    console.warn('[dsh-session-navigator] syncProjectionCache JSON parse warning:', err)
  }
  writeFileSync(tgtFile, content)
  return true
}

/**
 * Read the latest web launch token from an instance's stdout log file.
 */
export function getLaunchToken(dshHome) {
  const isApp = detectInstanceKind(dshHome) === 'app'
  const logFile = isApp
    ? join(dshHome, 'dsh-web.log')
    : join(dshHome, 'dsh-web-3080.log')
  if (!existsSync(logFile)) return null
  try {
    const stat = statSync(logFile)
    const readSize = Math.min(stat.size, 65536)
    const buffer = Buffer.alloc(readSize)
    const fd = openSync(logFile, 'r')
    readSync(fd, buffer, 0, readSize, Math.max(0, stat.size - readSize))
    closeSync(fd)
    const content = buffer.toString('utf-8')
    const matches = [...content.matchAll(/dsh web: https?:\/\/[^\s]+\?token=([A-Za-z0-9_-]+)/g)]
    if (matches.length === 0) return null
    return matches[matches.length - 1][1]
  } catch {
    return null
  }
}

/**
 * Notify a running target DSH instance about an incoming transferred session.
 * `activate` tells the target whether it should also switch its window to the
 * session: the desktop app must (it has no external deep link), while a web tab
 * only refreshes its list because the caller opens the session in its own tab.
 */
export async function notifyTargetInstance(targetPort, sessionId, cwd = '') {
  try {
    const res = await fetch(`http://127.0.0.1:${targetPort}/dsh-session-navigator/notify-incoming`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, cwd }),
      signal: AbortSignal.timeout(1500),
    })
    if (!res.ok) return { ok: false, watching: false, attached: false }
    const data = await res.json().catch(() => null)
    return { ok: true, watching: data?.watching === true, attached: data?.attached === true }
  } catch {
    return { ok: false, watching: false, attached: false }
  }
}

/**
 * Activate JackDSH macOS desktop application if target is JackDSH.
 */
export function activateJackDshApp() {
  if (platform() !== 'darwin') return false
  try {
    const child = spawn('osascript', ['-e', 'tell application "JackDSH" to activate'], {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    return true
  } catch {
    return false
  }
}

/**
 * Transfer a session from source DSH home to target DSH home.
 *
 * @param {object} options
 * @param {string} options.sourceDshHome - source instance data root
 * @param {string} [options.targetDshHome] - target instance data root (defaults to peer)
 * @param {string} options.sessionId - session UUID to transfer
 * @param {number} [options.targetPort] - port of the target web server
 * @returns {Promise<object>} { ok, sourceSessionId, targetSessionId, targetPort, targetUrl,
 *   isDesktopTarget, notified, watching, deliverInBrowser, workspace, attachmentsCopied }
 */
export async function transferSession({ sourceDshHome, targetDshHome, sessionId, targetPort }) {
  const normId = normalizeSessionId(sessionId)
  if (!normId) {
    throw new Error('invalid session id')
  }

  const srcHome = resolveDshHome(sourceDshHome)
  const peer = getPeerConfig(srcHome)
  const tgtHome = resolveDshHome(targetDshHome || peer.targetDshHome)
  const port = targetPort || peer.targetPort

  const transferTime = Date.now()

  const sessionLoc = findSessionDirectory(srcHome, normId)
  if (!sessionLoc) {
    throw new Error(`session "${normId}" not found in source home`)
  }

  // Decompress source session log
  const rawBytes = execFileSync('zstd', ['-dc', sessionLoc.sessionFile], {
    maxBuffer: MAX_ZSTD_BUFFER,
  })
  const rawText = rawBytes.toString('utf-8')
  const lines = rawText.split('\n')
  if (lines.length === 0 || !lines[0].trim()) {
    throw new Error('empty or corrupt session log')
  }

  // Parse header
  let header
  try {
    header = JSON.parse(lines[0])
  } catch (err) {
    throw new Error(`corrupt session header: ${err.message}`)
  }

  // Check if target already has this session ID in a DIFFERENT workspace to avoid duplicate id crash
  const existingLoc = findSessionDirectory(tgtHome, normId)
  const hasConflict = existingLoc !== null && existingLoc.workspaceName !== sessionLoc.workspaceName
  const finalSessionId = hasConflict ? `session-${randomUUID().toLowerCase()}` : normId

  // Prepare target directory
  const targetSessionDir = join(tgtHome, 'sessions', sessionLoc.workspaceName, finalSessionId)
  mkdirSync(targetSessionDir, { recursive: true })

  // Write session.lock
  const targetLockFile = join(targetSessionDir, 'session.lock')
  if (!existsSync(targetLockFile)) {
    writeFileSync(targetLockFile, '')
  }

  // Always write as session.v4.jsonl.zstd if header version is 4, or keep vN
  const targetFilename = header.version && header.version >= 4 ? 'session.v4.jsonl.zstd' : `session.v${header.version || 3}.jsonl.zstd`
  const targetLogFile = join(targetSessionDir, targetFilename)

  // Always rewrite Frame 1 (header) with transferTime so DSH calculates updatedAt as latest,
  // placing the session strictly at the TOP of the session list in target instance.
  const cleanLines = lines.map((l) => l.trim()).filter(Boolean)
  header.id = finalSessionId
  header.createdAt = transferTime
  cleanLines[0] = JSON.stringify(header)
  const headerPayload = Buffer.from(cleanLines[0] + '\n', 'utf-8')
  const bodyPayload = cleanLines.length > 1 ? Buffer.from(cleanLines.slice(1).join('\n') + '\n', 'utf-8') : Buffer.alloc(0)

  const headerFrame = execFileSync('zstd', ['-c'], {
    input: headerPayload,
    maxBuffer: MAX_ZSTD_BUFFER,
  })
  const bodyFrame = execFileSync('zstd', ['-c'], {
    input: bodyPayload,
    maxBuffer: MAX_ZSTD_BUFFER,
  })
  writeFileSync(targetLogFile, Buffer.concat([headerFrame, bodyFrame]))

  // Sync attachments
  const attachmentsCopied = syncAttachments(srcHome, tgtHome, rawText)

  // Sync projection cache with updated transferTime
  syncProjectionCache(srcHome, tgtHome, normId, finalSessionId, transferTime)

  const isDesktopTarget = tgtHome.includes('jackdsh/dsh-data')
  // 目标实例在线就通知一声：它会把会话注册进对应工作区，并在有窗口正监听时自己切过去。
  const notify = await notifyTargetInstance(port, finalSessionId, header.cwd || '')
  if (isDesktopTarget) {
    // 桌面端没有可用的外部深链入口，除通知外还要把 JackDSH 唤到前台。
    activateJackDshApp()
  }
  // 网页端没有窗口在监听时才需要调用方开标签页兜底；否则交给目标端自己切换，避免两个窗口重复。
  const deliverInBrowser = !isDesktopTarget && notify.watching !== true

  const targetToken = getLaunchToken(tgtHome)
  const targetUrl = targetToken
    ? `http://127.0.0.1:${port}/?token=${encodeURIComponent(targetToken)}#session=${encodeURIComponent(finalSessionId)}`
    : `http://127.0.0.1:${port}/?session=${encodeURIComponent(finalSessionId)}`

  return {
    ok: true,
    sourceSessionId: normId,
    targetSessionId: finalSessionId,
    renamed: hasConflict,
    targetPort: port,
    targetUrl,
    isDesktopTarget,
    notified: notify.ok,
    watching: notify.watching,
    deliverInBrowser,
    workspace: sessionLoc.workspaceName,
    attachmentsCopied,
  }
}
