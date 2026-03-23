# Product Context

## Purpose

- 为 `NautilusTrader` 仓库建立可执行、可治理、可记忆的启动基线。
- 在业务代码尚未接入前，先固化治理、memory、truth-doc 和 GitHub gate。

## Project Name

- NautilusTrader

## Current Repository State

- 当前仓库来自项目启动模板拷贝。
- 已具备治理、memory、truth-doc、脚本、GitHub workflow 和 smoke test 骨架。
- bootstrap 治理基线已合并到 `main`，仓库已进入可直接承接真实项目 issue 的状态。
- 当前未发现 `src/`、`app/`、`lib/`、`services/` 等业务代码目录。
- GitHub 远端已创建：`dao1oad/NautilusTrader`（public）。
- 远端 `main` 分支保护和 required checks 已启用。

## Target Project Type

- 开发项目优先
- 当前阶段以仓库治理与执行编排为先
- 后续可在业务代码接入后扩展 truth-doc 绑定

## Non-Goals

- 不把 `memory/` 当作系统静态真值
- 不在没有真实代码布局时虚构业务模块边界
- 不做完整项目管理平台

## Active Constraint

- 业务代码尚未接入，当前 truth-doc 仍主要覆盖治理控制面。
