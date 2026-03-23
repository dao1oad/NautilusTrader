# Product Context

## Purpose

- 维护一个独立的 `NautilusTrader` 衍生仓库。
- 在导入上游源码的基础上，为后续管理 UI 二次开发提供代码基座与治理门禁。

## Project Name

- NautilusTrader

## Current Repository State

- 当前仓库来自项目启动模板，并已导入 `nautechsystems/nautilus_trader` 的 `master` 源码快照。
- 当前已具备治理、memory、truth-doc、脚本、GitHub workflow 与 NautilusTrader 的核心代码目录。
- bootstrap 治理基线已合并到 `main`，仓库已进入可直接承接真实项目 issue 的状态。
- 当前主要业务代码目录为 `crates/`、`nautilus_trader/`、`python/`、`schema/`、`examples/`。
- GitHub 远端已创建：`dao1oad/NautilusTrader`（public）。
- 远端 `main` 分支保护和 required checks 已启用。

## Target Project Type

- 开发项目优先
- 当前阶段以在真实源码基座上规划并实现管理 UI 为先
- truth-doc 已开始覆盖实际生产代码路径

## Non-Goals

- 不把 `memory/` 当作系统静态真值
- 不在没有真实代码布局时虚构业务模块边界
- 不保留与上游仓库的 Git 关联

## Active Constraint

- 当前已接入上游源码，但尚未确定管理 UI 的技术选型、目录落点和与现有引擎的集成边界。
