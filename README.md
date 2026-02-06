# change-log-agent

> **Turn messy git commits into polished project documentation with a single command.**

`change-log-agent` is a CLI tool built on an **agent-based workflow**. Rather than simply copying text, it drives your local **Claude Code** instance to transform raw git commit history into well-structured, human-readable documentation (README, CHANGELOG, etc.).

---

## Highlights

- **Zero API Cost** — Uses your existing Claude Pro/Team subscription. No extra API token charges.
- **Agent-Based Workflow** — Dynamically generates a Mission Spec and lets the AI decide how to best organize your documentation.
- **Surgical Precision** — Uses HTML comment markers (`<!-- log-agent-start -->` / `<!-- log-agent-end -->`) to scope changes. Only the marked section is modified; the rest of your file stays untouched.
- **Incremental Sync** — Automatically detects the last update date from the marked section, fetching only new commits to avoid redundant processing.
- **Context-Aware** — Filters out trivial commits (typos, formatting) and intelligently summarizes changes based on project context.

---

## How It Works

1. **Detect** — Scans the target file for marker tags and identifies the last sync date.
2. **Extract** — Fetches new commits from git history since the last sync.
3. **Plan** — Generates a Mission Spec describing how the AI should update the document.
4. **Execute** — Invokes `claude -p` to apply precise edits to the target file.

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Claude Code** installed and authenticated:

  ```bash
  npm install -g @anthropic-ai/claude-code
  claude login
  ```

### Install

```bash
npm install -g change-log-agent
```

### Prepare Your Target File

If `CHANGELOG.md` doesn't exist, `log-agent sync` will offer to create it for you automatically. You can also create it manually with markers:

```markdown
# Changelog

<!-- log-agent-start -->
<!-- log-agent-end -->
```

### Run

```bash
# Basic usage — auto-detects date, updates CHANGELOG.md
log-agent sync

# Specify a start date
log-agent sync --since 2026-02-01

# Target a different file
log-agent sync --target docs/HISTORY.md

# Preview mode — prints Mission Spec without executing
log-agent sync --dry-run

# Skip interactive prompts (for CI/CD)
log-agent sync --yes
```

Or run without installing:

```bash
npx change-log-agent sync
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--since <date>` | Only include commits after this date | Auto-detected from markers |
| `--target <file>` | File to update | `CHANGELOG.md` |
| `--dry-run` | Preview the Mission Spec without executing | `false` |
| `--yes` | Skip interactive confirmation (for CI/CD) | `false` |

---

## Project Structure

| File | Responsibility |
|------|----------------|
| `src/index.ts` | CLI entry point and orchestration |
| `src/core/git.ts` | Git commands and commit log extraction |
| `src/core/template.ts` | Mission Spec generation |
| `src/core/bridge.ts` | Claude Code bridge (`claude -p` invocation) |
| `src/core/marker.ts` | Marker detection and date extraction |
| `src/utils/prompt.ts` | Interactive confirmation prompt |

---

## Contributing

```bash
git clone https://github.com/ericcai0814/change-log-agent.git
cd change-log-agent
npm install
npm run build
npm test
```

Issues and pull requests are welcome!

---

## License

MIT — see [LICENSE](LICENSE) for details.
