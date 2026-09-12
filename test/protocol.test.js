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
  formatCapsuleTooltip,
  isRedundantSessionLeadIn,
  formatSessionReferenceMention,
  isBlankPopupHref,
  isInWindowSessionRowClick,
  isSessionActionsButton,
  isSessionActionsMenuText,
  isSessionIdQuery,
  nextSessionMentionHydration,
  parseExclusiveSessionMention,
  sessionCopyMenuLabels,
  sessionMenuItemHost,
  isWorkspaceSessionSearchMeta,
  mergeIdHits,
  normalizeSessionId,
  officialSearchRowSelector,
  parseNavFromUrl,
  parseSessionReferenceMentions,
  parseTurn,
  popupNeedsUrlAssign,
  sessionWindowName,
  INTERNAL_NAV_ATTR,
  isInternalNavElement,
  isOfficialNewSessionElement,
  CURRENT_SELECTION_KEY,
  sessionDeepLinkHref,
  nextSelectionWrite,
  DEEP_LINK_ACTION,
  nextDeepLinkAction,
} from '../protocol.js'
import {
  buildChromeTabScript,
  escapeAppleScriptString,
  isAllowedChromeTabUrl,
  isLoopbackAddress,
} from '../chrome-tab.js'

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
  it('shows only the session title on the chip face', () => {
    assert.equal(formatCapsuleLabel('插件：会话查找', ID, 2), '插件：会话查找')
    assert.equal(formatCapsuleLabel('', ID, null), ID)
    assert.equal(formatCapsuleLabel(ID, ID, 3), ID)
  })
  it('puts turn and id into the tooltip', () => {
    assert.equal(
      formatCapsuleTooltip('插件：会话查找', ID, 2),
      `插件：会话查找\n第 2 轮\n${ID}\n在新窗口打开`,
    )
    assert.equal(formatCapsuleTooltip('', ID, null), `${ID}\n在新窗口打开`)
  })
  it('treats the skill lead-in line as redundant once the chip has the title', () => {
    assert.equal(
      isRedundantSessionLeadIn('🧭 查看会话：插件：会话查找 · 第 2 轮', {
        title: '插件：会话查找',
        sessionId: ID,
        turn: 2,
      }),
      true,
    )
    assert.equal(
      isRedundantSessionLeadIn('查看会话: 插件：会话查找 · 第 1 轮 ↗', {
        title: '插件：会话查找',
        sessionId: ID,
        turn: 1,
      }),
      true,
    )
    assert.equal(
      isRedundantSessionLeadIn('改稿规则是在这次对话里定的：查看会话：插件：会话查找', {
        title: '插件：会话查找',
        sessionId: ID,
      }),
      false,
    )
    assert.equal(
      isRedundantSessionLeadIn('🧭 查看会话：插件：会话查找 · 第 2 轮', {
        title: '',
        sessionId: ID,
        turn: 2,
      }),
      false,
    )
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
  it('recognizes the official session ⋯ button, not the workspace one', () => {
    const sessionBtn = { getAttribute: () => '会话“WorkBuddy 接入海外大模型剪辑”的操作' }
    const enBtn = { getAttribute: () => 'Session actions for Demo' }
    const workspaceBtn = { getAttribute: () => '工作区“插件”的操作' }
    assert.equal(isSessionActionsButton(sessionBtn), true)
    assert.equal(isSessionActionsButton(enBtn), true)
    assert.equal(isSessionActionsButton(workspaceBtn), false)
    assert.equal(isSessionActionsButton(null), false)
  })
  it('inserts cloned items into the viewport, not onto role=menu', () => {
    const menu = { parentElement: null }
    const viewport = { parentElement: menu }
    const wrap = { parentElement: viewport }
    const item = { parentElement: wrap }
    assert.deepEqual(sessionMenuItemHost(item), { host: viewport, before: wrap })
    assert.equal(sessionMenuItemHost(null), null)
  })
})

describe('session copy / paste chip', () => {
  it('returns zh and en labels for the two ⋯ actions', () => {
    assert.equal(sessionCopyMenuLabels('zh').id, '复制会话 ID')
    assert.equal(sessionCopyMenuLabels('zh').mention, '复制会话引用')
    assert.equal(sessionCopyMenuLabels('en-US').id, 'Copy session ID')
    assert.equal(sessionCopyMenuLabels('en').mention, 'Copy session mention')
  })
  it('accepts a clipboard that is exactly one mention', () => {
    const mention = formatSessionReferenceMention(ID, '成片 v4.1')
    assert.equal(parseExclusiveSessionMention(`  ${mention}  `).sessionId, ID)
    assert.equal(parseExclusiveSessionMention(`请看 ${mention}`), null)
    assert.equal(parseExclusiveSessionMention(ID), null)
  })
  it('plans insertReference over the first plain mention', () => {
    const mention = formatSessionReferenceMention(ID, '成片 v4.1')
    const draft = `看 ${mention} 好`
    const plan = nextSessionMentionHydration({
      phase: 'plain',
      draft,
      occurrences: [],
      draftRev: 4,
    })
    assert.equal(plan.sessionId, ID)
    assert.equal(plan.mention, mention)
    assert.equal(plan.start, draft.indexOf(mention))
    assert.equal(plan.end, draft.indexOf(mention) + mention.length)
    assert.equal(plan.draftRev, 4)
  })
  it('skips mentions that are already chips and refuses busy phases', () => {
    const mention = formatSessionReferenceMention(ID, '标题')
    const covered = nextSessionMentionHydration({
      phase: 'plain',
      draft: mention,
      occurrences: [{ offset: 0, length: mention.length }],
      draftRev: 1,
    })
    assert.equal(covered, null)
    assert.equal(nextSessionMentionHydration({
      phase: 'submitting',
      draft: mention,
      occurrences: [],
      draftRev: 1,
    }), null)
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
  it('identifies internal navigation probe to prevent click recursion', () => {
    assert.equal(INTERNAL_NAV_ATTR, 'data-dsh-nav-internal')
    const fakeEl = {
      getAttribute: (name) => (name === INTERNAL_NAV_ATTR ? 'true' : null),
      hasAttribute: (name) => name === INTERNAL_NAV_ATTR,
    }
    assert.equal(isInternalNavElement(fakeEl), true)
    const normalEl = {
      getAttribute: () => null,
      hasAttribute: () => false,
    }
    assert.equal(isInternalNavElement(normalEl), false)
  })
  it('guards official new session button against click router takeover', () => {
    const newSessionEl = {
      closest: (sel) => sel.includes('新建会话') || sel.includes('hHd-Xa_newSession'),
    }
    assert.equal(isOfficialNewSessionElement(newSessionEl), true)
    const ordinaryEl = {
      closest: () => null,
    }
    assert.equal(isOfficialNewSessionElement(ordinaryEl), false)
  })
})

describe('native deep-link anchors', () => {
  it('builds a relative href that keeps the current origin', () => {
    assert.equal(sessionDeepLinkHref(ID), `/?session=${ID}`)
    assert.equal(sessionDeepLinkHref(ID, 3), `/?session=${ID}&turn=3`)
    assert.equal(sessionDeepLinkHref('nope'), null)
    assert.equal(sessionDeepLinkHref(ID, 0), `/?session=${ID}`)
  })
})

describe('persisted current-session priming', () => {
  it('uses the official shared key', () => {
    assert.equal(CURRENT_SELECTION_KEY, 'dsh.sessions.current')
  })
  it('writes the target when the stored session differs or is unusable', () => {
    assert.equal(nextSelectionWrite(null, ID), JSON.stringify({ sessionId: ID }))
    assert.equal(nextSelectionWrite('{}', ID), JSON.stringify({ sessionId: ID }))
    assert.equal(nextSelectionWrite('not json', ID), JSON.stringify({ sessionId: ID }))
    assert.equal(nextSelectionWrite(JSON.stringify({ sessionId: SHORT }), ID), JSON.stringify({ sessionId: ID }))
  })
  it('does not rewrite when the target is already stored', () => {
    assert.equal(nextSelectionWrite(JSON.stringify({ sessionId: ID }), ID), null)
    assert.equal(nextSelectionWrite(JSON.stringify({ sessionId: ID }), 'garbage'), null)
  })
})

describe('deep link action policy', () => {
  const base = { target: ID, startedAt: 0, settleMs: 20_000, maxWaitMs: 900_000 }

  it('never gives up while the session list is still on its way', () => {
    // 回归：老实现 8 秒就放弃，而本机 400+ 会话时列表可能几分钟才到。
    assert.equal(nextDeepLinkAction({ ...base, current: SHORT, listed: false, now: 8_000 }), DEEP_LINK_ACTION.WAIT)
    assert.equal(nextDeepLinkAction({ ...base, current: SHORT, listed: false, now: 360_000 }), DEEP_LINK_ACTION.WAIT)
    assert.equal(nextDeepLinkAction({ ...base, current: undefined, listed: false, now: 100 }), DEEP_LINK_ACTION.WAIT)
  })

  it('selects the target as soon as it is listed', () => {
    assert.equal(
      nextDeepLinkAction({ ...base, current: undefined, listed: true, now: 100 }),
      DEEP_LINK_ACTION.OPEN,
    )
    assert.equal(
      nextDeepLinkAction({ ...base, current: SHORT, listed: true, listReadyAt: 100, now: 5_000 }),
      DEEP_LINK_ACTION.OPEN,
    )
  })

  it('stops once the target is current', () => {
    assert.equal(nextDeepLinkAction({ ...base, current: ID, listed: true, now: 10 }), DEEP_LINK_ACTION.DONE)
  })

  it('yields to a user choice only after the settle window', () => {
    assert.equal(
      nextDeepLinkAction({ ...base, current: SHORT, listed: true, listReadyAt: 0, now: 60_000 }),
      DEEP_LINK_ACTION.YIELD,
    )
    // 列表已就绪但官方还停在空状态：仍然要抢回来
    assert.equal(
      nextDeepLinkAction({ ...base, current: undefined, listed: true, listReadyAt: 0, now: 60_000 }),
      DEEP_LINK_ACTION.OPEN,
    )
    // 结算窗口内即使已有别的 current 也继续抢（压过官方启动导航）
    assert.equal(
      nextDeepLinkAction({ ...base, current: SHORT, listed: true, listReadyAt: 59_000, now: 60_000 }),
      DEEP_LINK_ACTION.OPEN,
    )
  })

  it('times out only past the budget', () => {
    assert.equal(
      nextDeepLinkAction({ ...base, current: SHORT, listed: false, now: 900_001 }),
      DEEP_LINK_ACTION.TIMEOUT,
    )
  })
})

describe('chrome tab open guard', () => {
  it('accepts only loopback DSH session deep links', () => {
    assert.equal(isAllowedChromeTabUrl(`http://localhost:3080/?session=${ID}`), true)
    assert.equal(isAllowedChromeTabUrl(`http://127.0.0.1:3080/?session=${ID}&turn=3`), true)
    assert.equal(isAllowedChromeTabUrl(`http://localhost:3080/?session=${ID}&evil=1`), false)
    assert.equal(isAllowedChromeTabUrl('http://example.com/?session=' + ID), false)
    assert.equal(isAllowedChromeTabUrl('http://localhost:3080/settings'), false)
    assert.equal(isAllowedChromeTabUrl('javascript:alert(1)'), false)
  })

  it('escapes AppleScript strings and targets real Chrome', () => {
    assert.equal(escapeAppleScriptString('http://x/"y'), 'http://x/\\"y')
    const script = buildChromeTabScript(`http://127.0.0.1:3080/?session=${ID}`)
    assert.equal(script.includes('com.google.Chrome'), true)
    assert.equal(script.includes('mac工作台'), false)
    assert.equal(script.includes(`URL:"http://127.0.0.1:3080/?session=${ID}"`), true)
  })

  it('treats ipv4 and ipv6 loopback as local', () => {
    assert.equal(isLoopbackAddress('127.0.0.1'), true)
    assert.equal(isLoopbackAddress('::1'), true)
    assert.equal(isLoopbackAddress('::ffff:127.0.0.1'), true)
    assert.equal(isLoopbackAddress('192.168.1.2'), false)
  })
})
