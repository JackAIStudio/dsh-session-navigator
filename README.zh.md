# 🧭 dsh-session-navigator

> DeepSeek Harness 跨会话深层直达、多窗口导航，以及把会话复制成可粘贴的 `@` 引用  
> 增强**左上角官方「搜索会话」**（不是 Codex Timeline 搜索），让聊天里的 session id 能在新窗口打开指定会话 / 轮次，并在侧栏会话 `⋯` 菜单提供「复制会话引用」。

---

## 解决的痛点

1. 官方侧栏搜索只匹配标题和工作区名，输入 `56c6db` 这种 Session ID 会显示「无匹配会话」；
2. 点开历史会话会冲掉当前窗口；
3. 长会话里要自己数「第几轮」；
4. `@` 引用另一个会话时必须在输入框里搜标题，侧栏 `⋯` 菜单没有复制入口。

---

## 核心行为

### 1. 只增强左上角官方搜索框

目标输入框的文案是 **「搜索会话…」** / **Search sessions...**，在会话列表上方。

- **不**劫持右侧 Codex Timeline 的历史搜索；
- **不**在对话区再插一块「精准 ID / 内容匹配」浮层。

做法：输入时立刻用内存会话列表匹配 ID（不等全文检索），在官方结果区顶部显示「会话标题 + ↗」。点标题在当前窗口打开；点 **↗** 新窗口打开。

侧栏会话列表的**普通点击**不会弹窗，交给官方在当前窗口切换。只有聊天里的会话胶囊、搜索结果 **↗**、以及 **Cmd/Ctrl + 点击** 才会开新窗口。同一个 session 会复用已打开的命名窗口，避免连点连弹。

Chrome 应用模式（例如「mac工作台」`--app`）里，从已经被 `window.open` 打开的窗口再 `window.open('_blank')` 经常得到空白页。插件会用命名窗口 + 空白时强制导航；打不开就在当前窗口切会话，不再丢第三个空白窗。

### 2. 聊天里的会话直达

DSH Markdown 不会把 `/?session=` 相对链接渲染成可点 `<a>`。配套 Skill 要求把完整 session id 写在行内代码里；插件把它画成胶囊，**可见文字是会话标题**，id 放在 tooltip。点击后新窗口打开并滚动到 `[data-chat-turn]`。

同页的 http(s) 会话链接会改写为当前源相对地址，避免 Better Sidebar 当成外部网页拦走。

### 3. 复制会话引用

侧栏会话行的 `⋯` 菜单增加 **复制会话引用**。复制的是官方规范 mention：

```text
@[会话标题](dsh-session:<base64url>)
```

粘贴到另一个会话的输入框后，插件会把它还原成官方会话 chip（气泡图标 + 标题）。即便没变成 chip，发送时宿主仍会按 `dsh-session:` URI 注入被引用会话的快照。一条消息最多 3 个不同会话，这是官方 `dsh-session-reference` 的硬上限。

---

## 安装

开发机：

```bash
pnpm --dir ~/.dsh/profiles/web add link:~/Documents/dshspace/plugins/dsh-session-navigator
```

改完 host / client 后需要重启一次 `dsh web`（不要在对话里代劳杀进程）。

Skill：

```bash
ln -sfn "$HOME/Documents/dshspace/plugins/dsh-session-navigator/skill" "$HOME/.agents/skills/dsh-session-navigator"
```

---

## 开源许可

MIT License © 2026 [JackAIStudio](https://github.com/JackAIStudio)
