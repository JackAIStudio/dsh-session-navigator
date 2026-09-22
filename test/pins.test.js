import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import {
  compactRelativeTime,
  isSessionPinned,
  MAX_PINNED_SESSIONS,
  normalizePinDocument,
  sessionPinMenuLabels,
  togglePinnedSession,
} from '../protocol.js'
import { applyPinChange, defaultPinsPath, readPinsDocument, writePinsDocument } from '../pins.js'

const ID = 'session-75271ba9-0162-4071-950e-28c4f96fc35f'
const ID2 = 'session-56c6db0b-f8ae-4bbb-ba69-2b081720537c'

let dir

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'dsh-nav-pins-'))
})

after(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('normalizePinDocument', () => {
  it('accepts string ids, objects, and drops junk / duplicates', () => {
    const doc = normalizePinDocument({
      pins: [
        ID2,
        { sessionId: ID, pinnedAt: 9 },
        { sessionId: ID, pinnedAt: 1 },
        { sessionId: 'nope' },
        null,
        { __proto__: { sessionId: ID } },
      ],
    })
    assert.equal(doc.version, 1)
    assert.deepEqual(doc.pins.map((item) => item.sessionId), [ID2, ID])
    assert.equal(doc.pins[1].pinnedAt, 9)
  })
  it('caps the list', () => {
    const pins = Array.from({ length: MAX_PINNED_SESSIONS + 5 }, (_, i) => {
      const hex = i.toString(16).padStart(12, '0')
      return `session-00000000-0000-4000-8000-${hex}`
    })
    assert.equal(normalizePinDocument(pins).pins.length, MAX_PINNED_SESSIONS)
  })
})

describe('togglePinnedSession', () => {
  it('pins to the front and refreshes an existing pin', () => {
    const first = togglePinnedSession({ pins: [] }, ID, true, 10)
    assert.equal(first.ok, true)
    assert.equal(first.pinned, true)
    assert.deepEqual(first.document.pins, [{ sessionId: ID, pinnedAt: 10 }])
    const second = togglePinnedSession(first.document, ID2, true, 20)
    assert.deepEqual(second.document.pins.map((item) => item.sessionId), [ID2, ID])
    const again = togglePinnedSession(second.document, ID, true, 30)
    assert.deepEqual(again.document.pins.map((item) => item.sessionId), [ID, ID2])
    assert.equal(again.document.pins[0].pinnedAt, 30)
  })
  it('unpins and rejects invalid ids', () => {
    const pinned = togglePinnedSession({ pins: [ID, ID2] }, ID, true, 1)
    const gone = togglePinnedSession(pinned.document, ID, false, 2)
    assert.equal(isSessionPinned(gone.document, ID), false)
    assert.equal(isSessionPinned(gone.document, ID2), true)
    const bad = togglePinnedSession(gone.document, 'nope', true, 3)
    assert.equal(bad.ok, false)
  })
})

describe('pin labels and relative time', () => {
  it('returns zh/en verbs', () => {
    assert.equal(sessionPinMenuLabels('zh').pin, '置顶会话')
    assert.equal(sessionPinMenuLabels('zh').unpin, '取消置顶')
    assert.equal(sessionPinMenuLabels('en').pin, 'Pin session')
  })
  it('formats compact relative time', () => {
    const now = 1_700_000_000_000
    assert.equal(compactRelativeTime(now - 10_000, now, 'zh'), '刚刚')
    assert.equal(compactRelativeTime(now - 5 * 60_000, now, 'zh'), '5分钟')
    assert.equal(compactRelativeTime(now - 2 * 60 * 60_000, now, 'en'), '2h')
    assert.equal(compactRelativeTime(0, now, 'zh'), '')
  })
})

describe('pins file', () => {
  it('round-trips a document and applies a toggle', async () => {
    const file = join(dir, 'pins.json')
    await writePinsDocument(file, { pins: [ID2] })
    const loaded = await readPinsDocument(file)
    assert.equal(loaded.pins[0].sessionId, ID2)
    const changed = await applyPinChange(file, ID, true, 99)
    assert.equal(changed.ok, true)
    assert.deepEqual(changed.document.pins.map((item) => item.sessionId), [ID, ID2])
    const disk = JSON.parse(readFileSync(file, 'utf8'))
    assert.equal(disk.pins[0].sessionId, ID)
    const missing = await readPinsDocument(join(dir, 'no-such.json'))
    assert.deepEqual(missing.pins, [])
  })
})

describe('default pins path', () => {
  // Pins point at session ids, and session ids only exist in one profile, so
  // the file has to be resolved from the home this instance booted with.
  it('follows $DSH_HOME instead of always landing in ~/.dsh', () => {
    const previous = process.env.DSH_HOME
    process.env.DSH_HOME = dir
    try {
      assert.equal(defaultPinsPath(), join(dir, 'session-navigator', 'pins.json'))
      assert.equal(
        defaultPinsPath('/profile/explicit'),
        join('/profile/explicit', 'session-navigator', 'pins.json'),
      )
    } finally {
      if (previous === undefined) delete process.env.DSH_HOME
      else process.env.DSH_HOME = previous
    }
  })
})
