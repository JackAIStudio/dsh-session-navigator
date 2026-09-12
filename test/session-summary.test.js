import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { isSessionId, readSessionSummary } from '../session-summary.js'

const SESSION_ID = 'session-0105c416-62ee-43a0-9035-239b253688e0'

let cacheDir

function writeRecord(id, record) {
  writeFileSync(join(cacheDir, `${id}.json`), JSON.stringify({ version: 5, record }))
}

before(() => {
  cacheDir = mkdtempSync(join(tmpdir(), 'dsh-nav-summary-'))
})

after(() => {
  rmSync(cacheDir, { recursive: true, force: true })
})

describe('session id guard', () => {
  it('accepts only the canonical prefixed uuid', () => {
    assert.equal(isSessionId(SESSION_ID), true)
    assert.equal(isSessionId('session-0105C416-62EE-43A0-9035-239B253688E0'), false)
    assert.equal(isSessionId('0105c416-62ee-43a0-9035-239b253688e0'), false)
    assert.equal(isSessionId(`${SESSION_ID}/../../secret`), false)
    assert.equal(isSessionId('../../etc/passwd'), false)
    assert.equal(isSessionId(''), false)
    assert.equal(isSessionId(undefined), false)
  })
})

describe('readSessionSummary', () => {
  it('projects one cached session into a list summary', async () => {
    writeRecord(SESSION_ID, {
      identity: { createdAt: 1789107558760, cwd: '/tmp/dsh-workspace/demo-project' },
      rows: {
        title: { ver: 1, seq: 962, val: 'DeepSeek联网搜索机制视频构思' },
        sessionListMetadata: { ver: 1, seq: 962, val: { blank: false, lastPromptAt: 1789111935983 } },
      },
    })

    const summary = await readSessionSummary(SESSION_ID, cacheDir)

    assert.deepEqual(summary, {
      sessionId: SESSION_ID,
      updatedAt: 1789111935983,
      running: false,
      blank: false,
      cwd: '/tmp/dsh-workspace/demo-project',
      projections: { asOfSeq: 962, values: { title: 'DeepSeek联网搜索机制视频构思' } },
    })
  })

  it('falls back to createdAt when the session never took a prompt', async () => {
    const id = 'session-11111111-1111-1111-1111-111111111111'
    writeRecord(id, {
      identity: { createdAt: 1700000000000, cwd: '/tmp/x' },
      rows: { sessionListMetadata: { ver: 1, seq: 3, val: { blank: true, lastPromptAt: null } } },
    })

    const summary = await readSessionSummary(id, cacheDir)

    assert.equal(summary.updatedAt, 1700000000000)
    assert.equal(summary.blank, true)
    assert.equal(summary.projections, undefined)
  })

  it('carries the title even when the metadata row is absent', async () => {
    const id = 'session-22222222-2222-2222-2222-222222222222'
    writeRecord(id, {
      identity: { createdAt: 1700000000000, cwd: '/tmp/y' },
      rows: { title: { ver: 1, seq: 41, val: 'Only a title' } },
    })

    const summary = await readSessionSummary(id, cacheDir)

    assert.equal(summary.blank, false)
    assert.deepEqual(summary.projections, { asOfSeq: 41, values: { title: 'Only a title' } })
  })

  it('ignores an empty title instead of seeding a blank row', async () => {
    const id = 'session-33333333-3333-3333-3333-333333333333'
    writeRecord(id, {
      identity: { createdAt: 1700000000000, cwd: '/tmp/z' },
      rows: { title: { ver: 1, seq: 5, val: '' } },
    })

    const summary = await readSessionSummary(id, cacheDir)

    assert.equal(summary.projections, undefined)
  })

  it('returns null rather than throwing on unusable input', async () => {
    assert.equal(await readSessionSummary(SESSION_ID, null), null)
    assert.equal(await readSessionSummary('../../etc/passwd', cacheDir), null)
    assert.equal(await readSessionSummary('session-44444444-4444-4444-4444-444444444444', cacheDir), null)

    const brokenId = 'session-55555555-5555-5555-5555-555555555555'
    writeFileSync(join(cacheDir, `${brokenId}.json`), '{ not json')
    assert.equal(await readSessionSummary(brokenId, cacheDir), null)

    const headlessId = 'session-66666666-6666-6666-6666-666666666666'
    writeRecord(headlessId, { rows: {} })
    assert.equal(await readSessionSummary(headlessId, cacheDir), null)
  })
})
