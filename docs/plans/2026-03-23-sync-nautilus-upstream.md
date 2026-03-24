# Sync NautilusTrader Upstream Snapshot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `nautechsystems/nautilus_trader` 的最新 `master` 源码快照导入当前 `D:\NautilusTrader` 仓库，并保持本仓库继续作为独立项目推进。

**Architecture:** 采用“源码叠加 + 治理保留”方式执行。上游源码以无 `.git` 的文件快照导入当前根目录；现有 `memory/`、`ops/`、`governance/`、`workspace/`、`prompts/`、`AGENTS.md` 与治理 workflow 保留，并补充新的 truth-doc 映射以覆盖真实生产代码路径。

**Tech Stack:** PowerShell、Git、GitHub 源码压缩包、Markdown truth docs、YAML policy files

---

## Task 1: 获取上游源码快照

**Files:**

- Create: `D:\nautilus_upstream_master_20260323.zip`
- Create: `D:\nautilus_upstream_master_20260323\`

**Step 1: 下载上游 `master` 压缩包**

Run: `Invoke-WebRequest -Uri 'https://codeload.github.com/nautechsystems/nautilus_trader/zip/refs/heads/master' -OutFile 'D:\nautilus_upstream_master_20260323.zip'`
Expected: 下载成功，得到本地 zip 文件

**Step 2: 解压源码快照**

Run: `Expand-Archive -LiteralPath 'D:\nautilus_upstream_master_20260323.zip' -DestinationPath 'D:\nautilus_upstream_master_20260323' -Force`
Expected: 解压出 `nautilus_trader-master/`

## Task 2: 复制源码并保留治理骨架

**Files:**

- Modify: `D:\NautilusTrader\*`
- Preserve: `D:\NautilusTrader\AGENTS.md`
- Preserve: `D:\NautilusTrader\memory\**`
- Preserve: `D:\NautilusTrader\ops\**`
- Preserve: `D:\NautilusTrader\governance\**`
- Preserve: `D:\NautilusTrader\workspace\**`
- Preserve: `D:\NautilusTrader\prompts\**`

**Step 1: 拷贝上游非 Git 文件到当前仓库**

Run: PowerShell / `Copy-Item` 或 `robocopy`
Expected: `crates/`、`nautilus_trader/`、`python/`、`schema/` 等源码目录出现在仓库根目录

**Step 2: 单独合并 `.github/`**

Run: 仅复制 `actions/`、`workflows/`、`ISSUE_TEMPLATE/` 与辅助文件，跳过上游 `pull_request_template.md`
Expected: 保留本仓库治理 gate，同时引入上游 CI 配置

**Step 3: 合并 `.gitignore`**

Run: 以上游 `.gitignore` 为基线，补回当前仓库的 `worktrees/` 与 `Thumbs.db` 规则
Expected: 既适配上游源码，也不丢本仓库本地工作树忽略规则

## Task 3: 重绑定 truth docs 与运行记忆

**Files:**

- Modify: `D:\NautilusTrader\docs\system-truth\architecture.md`
- Modify: `D:\NautilusTrader\docs\system-truth\module-boundaries.md`
- Modify: `D:\NautilusTrader\docs\system-truth\api-contracts.md`
- Modify: `D:\NautilusTrader\docs\system-truth\data-model.md`
- Modify: `D:\NautilusTrader\docs\system-truth\runtime-flows.md`
- Modify: `D:\NautilusTrader\docs\system-truth\integrations.md`
- Modify: `D:\NautilusTrader\ops\doc-truth-map.yaml`
- Modify: `D:\NautilusTrader\memory\active-context.md`
- Modify: `D:\NautilusTrader\memory\product-context.md`
- Modify: `D:\NautilusTrader\memory\repo-map.md`

**Step 1: 更新 truth docs**

Run: 编辑 Markdown 文档
Expected: 真值文档不再描述“仅治理骨架”，而是描述真实的 NautilusTrader 代码结构

**Step 2: 为新增生产路径补齐 truth 映射**

Run: 编辑 `ops/doc-truth-map.yaml`
Expected: `crates/**`、`nautilus_trader/**`、`python/**`、`schema/**` 等路径具备真值约束

**Step 3: 更新 memory 状态**

Run: 编辑 `memory/*.md`
Expected: 当前仓库状态改为“已接入上游源码，后续在此基础上开发管理 UI”

## Task 4: 验收

**Files:**

- Verify: `D:\NautilusTrader\.git`

**Step 1: 检查 Git 工作区**

Run: `git status --short`
Expected: 看到当前仓库中的新增/修改文件，但不存在新的嵌套 `.git`

**Step 2: 检查远端**

Run: `git remote -v`
Expected: 仅保留当前项目自己的 `origin`，没有上游 `nautechsystems` remote

**Step 3: 记录验收结论**

Run: 在最终说明中给出导入来源、保留的治理文件和未完成项
Expected: 用户可直接基于本仓库继续二次开发
