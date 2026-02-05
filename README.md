# 🤖 log-agent

> **"讓 AI 成為你的專案文件官：一鍵同步 Git Commit 到高品質開發文件。"**

`log-agent` 是一款基於 **Agentic Workflow** 設計的 CLI 工具。它不只是簡單的文字搬運工，而是透過驅動你本地的 **Claude Code** 實例，將混亂的 Git Commit 歷史轉化為結構清晰、具備「人味」的專案文件（如 README 或 CHANGELOG）。

---

## ✨ 核心亮點

- **💰 零 API 成本**：直接利用你現有的 Claude Pro/Team 訂閱，無需支付額外 API Tokens 費用。
- **🧠 代理人架構 (Agentic Workflow)**：CLI 會動態生成任務規範（Mission Spec），指揮 AI 自主決定如何最佳化文件內容。
- **🎯 Surgical 級精準修改**：透過 HTML 註釋標記（`<!-- log-agent-start -->` / `<!-- log-agent-end -->`）定位，確保 AI 只修改授權區塊，絕不破壞你的原始文件排版。
- **⚙️ 語境感知 (Context-Aware)**：自動過濾碎屑 Commit（如 typo、formatting），並根據專案背景（如：官網重構）進行智能歸納。

---

## 🛠️ 運作原理

1. **萃取 (Extract)**：CLI 自動掃描 Git 歷史，鎖定自上次版本以來的變更。
2. **策劃 (Plan)**：根據專案現狀動態生成一份暫時的 `.claudemd.tmp` 任務規範。
3. **執行 (Execute)**：啟動 `claude-code` 擔任「執行官」，依照規範對目標檔案進行智能手術。
4. **清理 (Cleanup)**：任務完成後自動銷毀暫存檔，不留痕跡。

---

## 🚀 快速開始

### 1. 前置要求

- 已安裝 **Node.js** (v18+)
- 已安裝並登入 **Claude Code**：

  ```bash
  npm install -g @anthropic-ai/claude-code
  claude login
  ```

### 2. 安裝與開發

```bash
# 克隆專案
git clone https://github.com/your-username/log-agent.git
cd log-agent

# 安裝依賴
npm install

# 編譯
npm run build
```

### 3. 初始化目標文件

在你的 `README.md` 或 `CHANGELOG.md` 中加入以下標記：

```markdown
## 📝 更新日誌

<!-- log-agent-start -->
<!-- log-agent-end -->
```

### 4. 執行同步

```bash
# 使用本地開發版本測試
npx ts-node src/index.ts sync
```

---

## 📂 專案結構

- `src/core/git.ts`：負責處理 Git 指令與 Log 提取。
- `src/core/template.ts`：動態任務規範 (Mission Spec) 生成器。
- `src/index.ts`：CLI 入口與流程調度中心。

---

## 🤝 貢獻與開發

本專案目前專注於與 `claude-code` 的深度整合。如果你有任何關於 Prompt 優化或跨平台相容性的建議，歡迎提交 Issue 或 Pull Request！

---

License

MIT License - see LICENSE file for details
