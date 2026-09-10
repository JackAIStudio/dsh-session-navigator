import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  cleanSessionIdQuery,
  clipboardOffsetToDetect,
  collectIdHitsFromList,
  decodeSessionReferenceUri,
  encodeSessionReferenceUri,
  extractTurnFromText,
  findPlainSessionMentions,
  formatCapsuleLabel,
  formatSessionReferenceMention,
  isBlankPopupHref,
  isInWindowSessionRowClick,
  isSessionActionsMenuText,
  isSessionIdQuery,
  isWorkspaceSessionSearchMeta,
  mergeIdHits,
  normalizeSessionId,
  officialSearchRowSelector,
  parseNavFromUrl,
  parseSessionReferenceMentions,
  parseTurn,
  popupNeedsUrlAssign,
  sessionWindowName,
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

describe('session id search intent isolation', () => {
  it('isolates common query words from triggering id hits', () => {
    assert.equal(isSessionIdQuery('ce'), false)
    assert.equal(isSessionIdQuery('剪辑'), false)
    assert.equal(isSessionIdQuery('test'), false)
    assert.equal(isSessionIdQuery(''), false)
  })
  it('identifies explicit session prefixes and hash directives', () => {
    assert.equal(isSessionIdQuery('session-3403'), true)
    assert.equal(isSessionIdQuery('#56c'), true)
    assert.equal(isSessionIdQuery('@id:56c'), true)
    assert.equal(isSessionIdQuery('id:56c6db0b'), true)
    assert.equal(isSessionIdQuery('56c6db0b'), true)
    assert.equal(cleanSessionIdQuery('#56c'), '56c')
  })
})

describe('id hits', () => {
  it('matches short prefixes when marked as id query', () => {
    const hits = collectIdHitsFromList([SHORT, ID], '#56c')
    assert.deepEqual(hits.map((item) => item.sessionId), [SHORT])
  })
  it('does not produce id hits for common word searches', () => {
    const hits = collectIdHitsFromList([SHORT, ID], 'ce')
    assert.deepEqual(hits, [])
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
  it('extracts correct turn even when line starts with full date timestamp (never mistakenly returns 2026)', () => {
    const text = '2026-09-07 08:30 · 🧭 查看会话: 我们这个 点击阅读。首页的这 · 第 1 轮'
    assert.equal(extractTurnFromText(text), 1)
  })
  it('distinguishes discussion round count from target jump turn', () => {
    const text = '### 2. 官网落地页重构与宣发转化文案打磨（38 轮深度讨论）\n- 🧭 查看会话：我们这个 · 第 1 轮'
    assert.equal(extractTurnFromText(text), 1)
  })
  it('handles item prefixes properly', () => {
    const text = '1. 智能剪辑工具宣发感悟与朋友圈文案 - 第 3 轮'
    assert.equal(extractTurnFromText(text), 3)
  })
  it('parses english turn formats', () => {
    assert.equal(extractTurnFromText('Turn 12: fix deep links'), 12)
    assert.equal(extractTurnFromText('session-xxx (turn 4)'), 4)
    assert.equal(extractTurnFromText('turn: 5'), 5)
  })
  it('returns null for dates or general numbers without turn indicator', () => {
    assert.equal(extractTurnFromText('2026-09-07 17:33'), null)
    assert.equal(extractTurnFromText('长达 38 轮的深度讨论'), null)
    assert.equal(parseTurn('2026-09-07'), null)
    assert.equal(parseTurn('1. 标题'), null)
    assert.equal(parseTurn(' 12 '), 12)
    assert.equal(parseTurn(12), 12)
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

describe('session mention codec', () => {
  it('round-trips a session id through the official dsh-session URI', () => {
    const uri = encodeSessionReferenceUri(ID)
    assert.equal(uri.startsWith('dsh-session:'), true)
    assert.equal(decodeSessionReferenceUri(uri), ID)
  })
  it('matches Node base64url of JSON.stringify(sessionId)', () => {
    const payload = Buffer.from(JSON.stringify(ID), 'utf8').toString('base64url')
    assert.equal(encodeSessionReferenceUri(ID), `dsh-session:${payload}`)
  })
  it('formats a Markdown mention that the official parser would accept', () => {
    const mention = formatSessionReferenceMention(ID, '分析艾特会话数量限制')
    assert.equal(mention.startsWith('@[分析艾特会话数量限制](dsh-session:'), true)
    const parsed = parseSessionReferenceMentions(`请看 ${mention} 和这段`)
    assert.equal(parsed.length, 1)
    assert.equal(parsed[0].sessionId, ID)
    assert.equal(parsed[0].label, '分析艾特会话数量限制')
  })
  it('escapes brackets in labels and unescapes on parse', () => {
    const mention = formatSessionReferenceMention(ID, 'a]b\\c')
    assert.equal(mention.includes('@[a\\]b\\\\c]('), true)
    assert.equal(parseSessionReferenceMentions(mention)[0].label, 'a]b\\c')
  })
  it('accepts a bare canonical URI as a mention', () => {
    const uri = encodeSessionReferenceUri(ID)
    const parsed = parseSessionReferenceMentions(`see ${uri}`)
    assert.equal(parsed[0].sessionId, ID)
    assert.equal(parsed[0].label, ID)
  })
  it('rejects a non-canonical URI', () => {
    assert.equal(decodeSessionReferenceUri('dsh-session:abc'), null)
  })
})

describe('plain mention detection', () => {
  it('maps clipboard offsets around an existing chip', () => {
    const occ = [{ offset: 5, length: 10 }]
    assert.equal(clipboardOffsetToDetect(occ, 0), 0)
    assert.equal(clipboardOffsetToDetect(occ, 5), 5)
    assert.equal(clipboardOffsetToDetect(occ, 9), 6)
    assert.equal(clipboardOffsetToDetect(occ, 15), 6)
    assert.equal(clipboardOffsetToDetect(occ, 16), 7)
  })
  it('keeps mentions that are already chips out of the hydrate list', () => {
    const mention = formatSessionReferenceMention(ID, '标题')
    const draft = `前 ${mention} 后 ${mention}`
    const first = parseSessionReferenceMentions(draft)[0]
    const plains = findPlainSessionMentions(draft, [{ offset: first.index, length: first.match.length }])
    assert.equal(plains.length, 1)
    assert.equal(plains[0].index > first.index, true)
  })
  it('recognizes the official session row menu copy', () => {
    assert.equal(isSessionActionsMenuText('重命名分叉会话归档会话'), true)
    assert.equal(isSessionActionsMenuText('RenameFork sessionArchive session'), true)
    assert.equal(isSessionActionsMenuText('重命名删除工作区'), false)
  })
})

describe('popup window targeting', () => {
  it('names a stable window per session so re-clicks reuse it', () => {
    assert.equal(sessionWindowName(ID), `dsh-session-${ID}`)
    assert.equal(sessionWindowName(`见 ${ID.toUpperCase()}`), `dsh-session-${ID}`)
    assert.equal(sessionWindowName('not-a-session'), 'dsh-session')
  })
  it('treats about:blank and empty href as a broken nested popup', () => {
    assert.equal(isBlankPopupHref('about:blank'), true)
    assert.equal(isBlankPopupHref('about:blank#blocked'), true)
    assert.equal(isBlankPopupHref(''), true)
    assert.equal(isBlankPopupHref(null), true)
    assert.equal(isBlankPopupHref(`http://localhost:3080/?session=${ID}`), false)
  })
  it('assigns a URL when the popup is blank or showing another session', () => {
    assert.equal(popupNeedsUrlAssign('about:blank', ID), true)
    assert.equal(popupNeedsUrlAssign(`http://localhost:3080/?session=${ID}`, ID), false)
    assert.equal(popupNeedsUrlAssign(`http://localhost:3080/?session=${ID}&turn=1`, ID, 3), true)
    assert.equal(popupNeedsUrlAssign(`http://localhost:3080/?session=${SHORT}`, ID), true)
  })
  it('keeps plain sidebar/search row clicks in-window', () => {
    assert.equal(isInWindowSessionRowClick({ inTreeItem: true }), true)
    assert.equal(isInWindowSessionRowClick({ inTreeItem: true, modifiedClick: true }), false)
    assert.equal(isInWindowSessionRowClick({ inTreeItem: true, inNewWindowControl: true }), false)
    assert.equal(isInWindowSessionRowClick({ inTreeItem: false }), false)
  })
})
