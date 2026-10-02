import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  detectInstanceKind,
  getPeerConfig,
  findSessionDirectory,
  transferSession,
  syncAttachments,
} from '../transfer.js'

test('detectInstanceKind and getPeerConfig', () => {
  const appHome = '/Users/test/Library/Application Support/jackdsh/dsh-data'
  assert.equal(detectInstanceKind(appHome), 'app')
  const appPeer = getPeerConfig(appHome)
  assert.equal(appPeer.currentKind, 'app')
  assert.equal(appPeer.targetPort, 3080)
  assert.equal(appPeer.targetLabel, '3080 Web 端')

  const cliHome = '/Users/test/.dsh'
  assert.equal(detectInstanceKind(cliHome), 'cli')
  const cliPeer = getPeerConfig(cliHome)
  assert.equal(cliPeer.currentKind, 'cli')
  assert.equal(cliPeer.targetPort, 3180)
  assert.equal(cliPeer.targetLabel, '3180 桌面端')
})

test('transferSession full lifecycle with attachments, directory files, and cross-workspace rename', async () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-transfer-test-'))
  const srcHome = join(root, 'source-dsh')
  const tgtHome = join(root, 'target-dsh')

  try {
    const sessionId = 'session-12345678-1234-1234-1234-123456789abc'
    const wsName = '--Users-test-workspace--'
    const srcSessionDir = join(srcHome, 'sessions', wsName, sessionId)
    mkdirSync(srcSessionDir, { recursive: true })

    // Create a mock attachment in request-images (file)
    const fakeHash = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const sub = fakeHash.slice(0, 2)
    const srcAttachDir = join(srcHome, 'attachments', 'v1', 'request-images', sub)
    mkdirSync(srcAttachDir, { recursive: true })
    writeFileSync(join(srcAttachDir, fakeHash), 'fake-png-content')

    // Create a mock attachment in files (directory containing file, matches DSH real behavior)
    const fakeFileHash = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    const subFile = fakeFileHash.slice(0, 2)
    const srcFilesDir = join(srcHome, 'attachments', 'v1', 'files', subFile, fakeFileHash)
    mkdirSync(srcFilesDir, { recursive: true })
    writeFileSync(join(srcFilesDir, 'sample.zip'), 'zip-binary-data')

    // Prepare session log with header and attachment hash
    const header = {
      type: 'session',
      version: 4,
      id: sessionId,
      createdAt: 1790000000000,
      cwd: '/Users/test/workspace',
      isSeeded: false,
      delegationDepth: 0,
      agentPreset: 'jack',
    }
    const event = {
      type: 'user/message',
      seq: 0,
      time: 1790000000010,
      data: {
        content: [
          { type: 'image', attachmentId: fakeHash },
          { type: 'file', attachment: { attachmentId: `sha256:${fakeFileHash}`, name: 'sample.zip' } },
        ],
      },
    }
    const logText = `${JSON.stringify(header)}\n${JSON.stringify(event)}\n`
    const compressed = execFileSync('zstd', ['-c'], { input: Buffer.from(logText, 'utf-8') })
    writeFileSync(join(srcSessionDir, 'session.v4.jsonl.zstd'), compressed)
    writeFileSync(join(srcSessionDir, 'session.lock'), '')

    // 1. First transfer (no conflict)
    // A port with no listener keeps the cross-instance notify out of the test:
    // no target is watching, so the caller still delivers in a browser tab.
    const idlePort = 59999
    const res1 = await transferSession({
      sourceDshHome: srcHome,
      targetDshHome: tgtHome,
      sessionId,
      targetPort: idlePort,
    })

    assert.equal(res1.ok, true)
    assert.equal(res1.sourceSessionId, sessionId)
    assert.equal(res1.targetSessionId, sessionId)
    assert.equal(res1.renamed, false)
    assert.equal(res1.targetPort, idlePort)
    assert.equal(res1.targetUrl, `http://127.0.0.1:${idlePort}/?session=${sessionId}`)
    assert.equal(res1.attachmentsCopied, 2)
    assert.equal(res1.notified, false)
    assert.equal(res1.watching, false)
    assert.equal(res1.deliverInBrowser, true)

    // Verify target file exists
    const tgtSessionDir = join(tgtHome, 'sessions', wsName, sessionId)
    assert.equal(existsSync(join(tgtSessionDir, 'session.v4.jsonl.zstd')), true)
    assert.equal(existsSync(join(tgtSessionDir, 'session.lock')), true)

    // Verify target session header has fresh createdAt for top-ordering
    const tgtDecompressed = execFileSync('zstd', ['-dc', join(tgtSessionDir, 'session.v4.jsonl.zstd')]).toString('utf-8')
    const tgtHeader = JSON.parse(tgtDecompressed.split('\n')[0])
    assert.equal(tgtHeader.id, sessionId)
    assert.ok(tgtHeader.createdAt > 1790000000000, 'target session header createdAt must be refreshed to Date.now()')

    // Verify target attachment (file) exists
    const tgtAttachFile = join(tgtHome, 'attachments', 'v1', 'request-images', sub, fakeHash)
    assert.equal(existsSync(tgtAttachFile), true)
    assert.equal(readFileSync(tgtAttachFile, 'utf-8'), 'fake-png-content')

    // Verify target attachment (directory) exists
    const tgtFilesDir = join(tgtHome, 'attachments', 'v1', 'files', subFile, fakeFileHash)
    assert.equal(existsSync(tgtFilesDir), true)
    assert.equal(readFileSync(join(tgtFilesDir, 'sample.zip'), 'utf-8'), 'zip-binary-data')

    // 2. Second transfer of the same session in the same workspace (updates in place without renaming)
    const res2 = await transferSession({
      sourceDshHome: srcHome,
      targetDshHome: tgtHome,
      sessionId,
      targetPort: idlePort,
    })

    assert.equal(res2.ok, true)
    assert.equal(res2.renamed, false)
    assert.equal(res2.targetSessionId, sessionId)
    assert.equal(res2.isDesktopTarget, false)
    assert.equal(res2.deliverInBrowser, true)
    assert.equal(res2.watching, false)

  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
