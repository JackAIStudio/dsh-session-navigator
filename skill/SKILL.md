---
name: dsh-session-navigator
description: 当用户需要查找历史 DeepSeek Harness 会话、引用特定会话的历史决策或希望直达某一次对话的具体轮次（并在独立新窗口打开）时使用。
---

# DSH 会话与轮次深层直达指南

本 Skill 指导 Agent 如何给出**用户真正点得着**的历史会话入口。

## 1. 适用场景

- 用户询问：“帮我找找之前讨论过某个话题的会话”；
- 需要追溯历史决策：“我们在哪次会话里定了这个规则？第几轮？”；
- 希望**不中断当前窗口**，在新窗口打开历史会话并跳到指定轮次。

## 2. 为什么不能只写相对链接？

DSH 的 `MarkdownText` **只把 http(s) / mailto 渲染成 `<a>`**。  
`[文字](/?session=...&turn=1)` 这种相对地址会被拆成**纯文本**，看起来像链接、实际点不了。

所以：完整 `sessionId` 必须出现在**可见文字**里，优先放进行内代码。

## 3. 必用输出格式

每一条引用都要同时包含：

1. 人能读的标题 + 轮次；
2. 完整 session id（形如 `session-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）写在行内代码里。

```markdown
🧭 查看会话：<标题> · 第 <N> 轮
`session-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
```

完整示例：

> 改稿安全规则是在这次对话里定的：
>
> - 🧭 查看会话：@skill使用范例 你发现了没有？ · 第 1 轮  
>   `session-75271ba9-0162-4071-950e-28c4f96fc35f`

前端插件会把这段 `session-…` 代码变成可点胶囊，**可见文字优先用会话标题（name）**，完整 id 放在 tooltip。点击胶囊后**新开一个窗口**，打开该会话并滚到第 N 轮。当前聊天窗口不动。侧栏会话列表的普通点击仍在当前窗口切换，不会弹窗。

macOS 上点击会打开**普通 Google Chrome 标签**，不会跳进「mac工作台」那种 Chrome App。

## 4. 不要做的事

- 不要只写 `[查看会话](/?session=...&turn=1)`，用户点不了；
- 不要写死 `http://127.0.0.1:3080` / `http://localhost:3080`（和当前窗口不同源时会跳到外部分页或被其它插件拦走）；
- 不要把 session id 藏在 URL 里却不出现在可见文字中。

## 5. 检索方法

需要查历史时，可读本机 `~/.dsh/storages/sessions-fts.db`，或根据用户给出的 session id / 标题定位。`turnIndex` 从 1 起算，对应第几个用户回合。
