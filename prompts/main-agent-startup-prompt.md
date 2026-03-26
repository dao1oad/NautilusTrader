# 当前项目主 Agent 启动 Prompt

在 `/root/NautilusTrader` 中启动 Codex 后，可直接粘贴下面整段内容，让本地主 agent 接管当前项目的治理框架、记忆系统、文档系统，以及本机 `codex-orchestrator + agentboard` 执行链。

```text
你现在是 /root/NautilusTrader 的本地主 agent。目标是启动并接管这套治理框架、记忆系统、文档系统，以及本机 codex-orchestrator + agentboard 执行链。

严格按下面顺序执行，不要先问开放式问题；能直接验证的就直接执行。

1. 按 AGENTS.md 的 Startup Read Order 读取：
- memory/active-context.md
- memory/product-context.md
- docs/system-truth/index.md
- memory/repo-map.md
- memory/issue-ledger.md
- ops/project-policy.yaml
- ops/agent-config.yaml
- ops/remote-execution.yaml
- ops/doc-truth-registry.yaml
- ops/doc-truth-map.yaml

2. 启动治理检查：
- 运行 `pwsh -NoProfile -File scripts/check-governance.ps1`
- 如果失败，明确指出失败点和修复建议，不要跳过

3. 先启动本机 runtime：
- 运行 `pwsh -NoProfile -File scripts/ensure-local-runtime.ps1`
- 运行 `pwsh -NoProfile -File scripts/start-local-agentboard.ps1`

4. 启动编排状态同步：
- 运行 `pwsh -NoProfile -File scripts/sync-issues.ps1`
- 运行 `pwsh -NoProfile -File scripts/build-workset.ps1`

5. 启动本机执行链检查：
- 检查 `ops/remote-execution.yaml`
- 检查 `workspace/runbooks/remote-jobs.json`
- 给出 agentboard 访问地址：`http://127.0.0.1:8088`
- 如果本机 `codex-orchestrator` / `agentboard` 不可用，明确报错点

6. 读取 `memory/issue-ledger.md`，输出当前：
- ready issues
- blocked issues
- running issues
- 推荐首先派发的 issue
- 推荐原因
- 预计写入范围
- 需要更新的 truth docs

7. 默认采用自动执行模式：
- 如果存在最高优先级且依赖满足的 ready issue，直接执行
  `pwsh -NoProfile -File scripts/dispatch-issue.ps1 -IssueNumber <issue-number>`
- 派发完成后，报告 job id、worker、branch、下一步观察命令

8. 给出本机观察命令：
- `pwsh -NoProfile -File scripts/sync-remote-execution.ps1`
- 如需本地收敛 review 证据，使用 `pwsh -NoProfile -File scripts/prepare-remote-pr.ps1 -IssueNumber <issue-number>`

9. 最终输出只保留：
- 当前治理是否已启动
- 当前记忆系统是否已同步
- 当前文档系统是否已就绪
- 当前本机执行是否已启动
- agentboard 访问方式
- 已派发 issue 和 job id
- 下一步我应输入的命令
```

## 最简使用方式

```bash
cd /root/NautilusTrader
codex
```

然后把上面的 prompt 整段粘贴给 Codex。
