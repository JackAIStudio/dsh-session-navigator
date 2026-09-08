import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  collectIdHitsFromList,
  extractTurnFromText,
  formatCapsuleLabel,
  isWorkspaceSessionSearchMeta,
  mergeIdHits,
  normalizeSessionId,
  officialSearchRowSelector,
  parseNavFromUrl,
  parseTurn,
} from '../protocol.js'

const ID = 'session-75271ba9-0162-4071-950e-28c4f96fc35f'
const SHORT = 'session-56c6db0b-f8ae-4bbb-ba69-2b081720537c'

describe('normalizeSessionId', () => {
  it('extracts a lowercase session uuid', () => {
    assert.equal(normalizeSessionId(`见 ${ID.toUpperCase()} ↗`), ID)
  })
  it('rejects truncated ids', () => {
    assert.equal(normalizeSessionId('session-56c6db'), null)
  })
})

describe('parseNavFromUrl', () => {
  it('parses relative query links that Markdown would unwrap', () => {
    assert.deepEqual(parseNavFromUrl(`/?session=${ID}&turn=3`), { sessionId: ID, turn: 3 })
  })
  it('parses absolute localhost and 127.0.0.1 the same way', () => {
    assert.equal(parseNavFromUrl(`http://localhost:3080/?session=${ID}`).sessionId, ID)
    assert.equal(parseNavFromUrl(`http://127.0.0.1:3080/?session=${ID}&turn=1`).turn, 1)
  })
  it('parses hash fallbacks', () => {
    assert.deepEqual(parseNavFromUrl(`http://localhost:3080/#dsh-nav=${ID}&turn=2`), {
      sessionId: ID,
      turn: 2,
    })
  })
  it('ignores unrelated urls', () => {
    assert.equal(parseNavFromUrl('https://github.com/foo'), null)
    assert.equal(parseNavFromUrl('/settings'), null)
  })
})

describe('workspace session search targeting', () => {
  it('accepts only the official sidebar search copy', () => {
    assert.equal(isWorkspaceSessionSearchMeta('搜索会话…', ''), true)
    assert.equal(isWorkspaceSessionSearchMeta('Search sessions...', ''), true)
    assert.equal(isWorkspaceSessionSearchMeta('', '搜索会话'), true)
  })
  it('rejects Codex Timeline and other search boxes', () => {
    assert.equal(isWorkspaceSessionSearchMeta('Search the whole history, or choose a recent turn.', ''), false)
    assert.equal(isWorkspaceSessionSearchMeta('搜索全部历史，或选择最近一轮。', ''), false)
    assert.equal(isWorkspaceSessionSearchMeta('搜索', ''), false)
  })
})

describe('id hits', () => {
  it('matches short prefixes like 56c against full ids', () => {
    const hits = collectIdHitsFromList([SHORT, ID], '56c')
    assert.deepEqual(hits.map((item) => item.sessionId), [SHORT])
  })
  it('merges id hits in front of content hits without duplicates', () => {
    const merged = mergeIdHits(
      [{ sessionId: ID, snippet: 'content' }, { sessionId: SHORT, snippet: 'other' }],
      [{ sessionId: SHORT, snippet: `ID ${SHORT}` }],
    )
    assert.equal(merged[0].sessionId, SHORT)
    assert.equal(merged.length, 2)
  })
})

describe('turn parsing', () => {
  it('reads 第 N 轮 from surrounding prose', () => {
    assert.equal(extractTurnFromText('查看会话：示例 · 第 12 轮 ↗'), 12)
    assert.equal(parseTurn('0'), null)
  })
})

describe('capsule label', () => {
  it('prefers the session title over the raw id', () => {
    assert.equal(formatCapsuleLabel('插件：会话查找', ID, 2), '插件：会话查找 · 第 2 轮')
    assert.equal(formatCapsuleLabel('', ID, null), ID)
  })
})

describe('official search row selector', () => {
  it('qualifies both language trees instead of using a dangling comma', () => {
    const sel = officialSearchRowSelector()
    assert.equal(sel.includes('[aria-label="搜索结果"] > button[role="treeitem"]'), true)
    assert.equal(sel.includes('[aria-label="Search results"] > button[role="treeitem"]'), true)
    assert.equal(sel.includes('[aria-label="搜索结果"], [role="tree"]'), false)
  })
})
