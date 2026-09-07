# 🧭 dsh-session-navigator

> **DeepSeek Harness 跨会话深层直达与多窗口导航插件**  
> 支持从 AI 消息链接/卡片直达指定历史会话与轮次（新窗口打开并自动滚动高亮），同时增强侧边栏搜索框支持 Session ID 穿透匹配与一键弹出新窗口。

---

## 💡 解决的痛点

在多会话、长工作流中，创作者经常需要回顾历史会话或某个具体决策：
1. **找不到历史会话**：左侧搜索框输入 Session ID（如 `56c6db`）直接显示“无匹配会话”，因为官方仅比对了标题；
2. **当前聊天易被切走**：每次点击历史会话，当前聊天窗口就被冲掉，查完还得费劲切回来；
3. **在横线堆里“数楼梯”**：即使切进会长会话，要在几十条 Codex Timeline 短横线里手动数“第几轮是那个决策”，极度耗时费神。

---

## ✨ 核心特性

### 1. 🔍 侧边栏搜索框增强（Search Plus）
- **Session ID 穿透匹配**：在左上角搜索框输入会话 ID（前缀或完整 ID），直接精准召回；
- **一键新窗口打开 `[ ↗ ]`**：搜索结果每一项右侧悬停展示独立窗口按钮，点击直接弹出新独立窗口，当前窗口保持聊天不中断。

### 2. 🧭 会话与轮次深层直达（Deep Link & Turn Anchor）
- **交互胶囊按钮**：AI 在回复中引用历史会话时输出带参链接，前端自动美化为带 🧭 图标的直达胶囊；
- **点击绝不冲窗口**：拦截所有内部会话链接，自动调用系统弹窗在新独立窗口中呈现；
- **自动滚动与呼吸光晕**：新窗口载入后，自动平滑滚动定位到指定的第 N 轮，并辅以高亮脉冲动画。

### 3. 🤖 配套 Skill 指南（`dsh-session-navigator`）
- 自动指导 Agent 在回复用户时生成标准格式的深层链接：
  ```markdown
  [查看会话：@skill使用范例 · 第 1 轮 ↗](http://127.0.0.1:3080/?session=session-75271ba9-0162-4071&turn=1)
  ```

---

## 📦 安装与配置

### 方式一：装机清单（dsh-setup）
已登记至 JackAIStudio 装机清单 `catalog.yaml`：
```yaml
plugins:
  own:
    - name: dsh-session-navigator
      spec: "github:JackAIStudio/dsh-session-navigator"
      develop: "link:$HOME/Documents/dshspace/plugins/dsh-session-navigator"
      priority: core
```

### 方式二：本地链接安装
在 `$DSH_HOME/profiles/web` 下加入本地 link：
```bash
pnpm --dir ~/.dsh/profiles/web add link:~/Documents/dshspace/plugins/dsh-session-navigator
```

在 `cordis.patch.yml` 中追加：
```yaml
- insert:
    - id: dsh-session-navigator
      name: dsh-session-navigator
```

---

## 📄 开源许可

MIT License © 2026 [JackAIStudio](https://github.com/JackAIStudio)
