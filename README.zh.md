# 🧭 dsh-session-navigator

> DeepSeek Harness 跨会话深层直达与多窗口导航  
> 增强**左上角官方「搜索会话」**（不是 Codex Timeline 搜索），并让聊天里的 session id 能在新窗口打开指定会话 / 轮次。

---

## 解决的痛点

1. 官方侧栏搜索只匹配标题和工作区名，输入 `56c6db` 这种 Session ID 会显示「无匹配会话」；
2. 点开历史会话会冲掉当前窗口；
3. 长会话里要自己数「第几轮」。

---

## 核心行为

### 1. 只增强左上角官方搜索框

目标输入框的文案是 **「搜索会话…」** / **Search sessions...**，在会话列表上方。

- **不**劫持右侧 Codex Timeline 的历史搜索；
- **不**在对话区再插一块「精准 ID / 内容匹配」浮层。

做法：输入时立刻用内存会话列表匹配 ID（不等全文检索），在官方结果区顶部显示「会话标题 + ↗」。点标题在当前窗口打开；点 **↗**（`<a target="_blank">`）新窗口打开。

### 2. 聊天里的会话直达

DSH Markdown 不会把 `/?session=` 相对链接渲染成可点 `<a>`。配套 Skill 要求把完整 session id 写在行内代码里；插件把它画成胶囊，**可见文字是会话标题**，id 放在 tooltip。点击后新窗口打开并滚动到 `[data-chat-turn]`。

同页的 http(s) 会话链接会改写为当前源相对地址，避免 Better Sidebar 当成外部网页拦走。

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
