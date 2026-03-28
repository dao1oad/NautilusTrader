import type { MessageCatalog } from "../catalog";


export const zhCN = {
  chrome: {
    appName: "NautilusTrader Admin",
    operatorWorkstation: "操作台",
    sidebarCopy: "固定在本地的控制台外壳，承载实时运维、运行诊断与有界分析界面。",
    runtime: "运行时",
    localProcess: "本地进程",
    workspace: "工作区",
    browserPinnedMemory: "浏览器固定记忆",
    activeDesk: "当前工位",
    workbenchEntryPoints: "操作台入口",
    workbenchNavigation: "工作台导航",
    workbenchRoutes: "工作台路由",
    recentViews: "最近访问",
    runtimeStatus: "运行状态",
    workbench: "工作台",
    surface: "界面",
    lastUpdated: "上次更新",
    environment: "环境",
    localOperatorShell: "本地操作台外壳",
    openNavigation: "打开导航",
    closeNavigation: "关闭导航",
    awaitingPageTelemetry: "等待页面遥测",
    workbenches: {
      operations: "操作",
      analysis: "分析"
    },
    localeSwitcher: {
      label: "语言",
      button: "语言"
    },
    locales: {
      en: "English",
      zhCN: "简体中文"
    }
  },
  navigation: {
    workbenches: {
      operations: "操作",
      analysis: "分析"
    },
    routes: {
      overview: "总览",
      nodes: "节点",
      strategies: "策略",
      adapters: "适配器",
      audit: "审计",
      config: "配置",
      orders: "订单台",
      fills: "成交",
      positions: "持仓",
      accounts: "账户",
      risk: "风控中心",
      logs: "日志",
      catalog: "数据目录",
      playback: "回放",
      diagnostics: "诊断",
      backtests: "回测",
      reports: "报告"
    }
  },
  workbenchShell: {
    copy: {
      operations: "实时控制平面路由、回执与运行时护栏集中在操作工作台中。",
      analysis: "回测、报告、回放与诊断集中在受限分析工作台中。"
    },
    ready: {
      operations: "运行工作台已就绪。",
      analysis: "分析工作台已就绪。"
    },
    status: {
      operations: "运行路由已固定在本地，最近访问记忆保存在浏览器工作区中。",
      analysis: "分析路由保持在本地回放、目录、诊断与报告界面范围内。"
    }
  },
  overview: {
    commandCenter: {
      title: "命令中心",
      description: "一览运行态势、风险压力与最新控制平面动态。"
    },
    pageState: {
      loadingTitle: "正在加载总览",
      loadingDescription: "等待最新的管理端快照。",
      unavailableTitle: "总览暂不可用",
      connectionStaleTitle: "连接已陈旧",
      disconnectedTitle: "已与管理 API 断开连接",
      disconnectedDescription: "重新连接管理 API 以刷新运行状态。",
      refreshFailedTitle: "总览刷新失败",
      staleDescription: "快照刷新延迟，正在显示当前可用的最新命令中心数据。",
      noLiveNodeTitle: "尚未配置在线节点",
      noLiveNodeDescription: "连接在线节点以填充运行时操作数据。"
    },
    activitySource: {
      auditTimeline: "审计时间线",
      localRouteMemory: "本地路由记忆",
      pending: "活动待定"
    },
    signal: {
      noNodeId: "无节点 ID",
      nodeLabel: "节点 {status}",
      riskLabel: "风险 {riskLevel}",
      alertsDetail: "{count} 条告警",
      itemsDetail: "{count} 项"
    },
    runtimeSummary: {
      title: "运行时总览",
      description: "实时策略、适配器、账户与持仓的运行覆盖面。",
      nodeStatusLabel: "节点状态",
      connectedNodeDetail: "已连接节点",
      nodeIdPendingDetail: "等待节点 ID",
      activeStrategiesLabel: "活跃策略",
      activeStrategiesDetail: "{count} 个运行中",
      activeStrategiesMeta: "受监控策略",
      adapterLinksLabel: "适配器连接",
      adapterLinksDetail: "有界交易所适配器",
      adapterLinksMeta: "{count} 个已连接",
      accountsLabel: "账户",
      accountsDetail: "已投影到界面中的账户",
      accountsMeta: "余额与敞口",
      openPositionsLabel: "未平持仓",
      openPositionsDetail: "已投影的实时持仓",
      openPositionsMeta: "跨交易所敞口"
    },
    riskSnapshot: {
      title: "风险快照",
      description: "跨账户护栏、实时告警与最新操作阻断。",
      tradingStateLabel: "交易状态",
      tradingStateDetail: "操作员门控状态",
      tradingStateMeta: "风控协调器",
      riskLevelLabel: "风险级别",
      riskLevelDetail: "当前态势",
      riskLevelMeta: "保证金与敞口",
      activeAlertsLabel: "活跃告警",
      activeAlertsMeta: "保证金利用率",
      blockedActionsLabel: "阻断操作",
      blockedActionsMeta: "敞口利用率",
      latestAlertTitle: "最新告警",
      noLiveAlerts: "当前没有已投影的实时风险告警。",
      latestBlockTitle: "最新阻断",
      noActiveBlocks: "当前没有处于激活状态的操作阻断。",
      unavailable: "风险快照暂不可用。"
    },
    activity: {
      title: "最近活动",
      description: "最新控制回执，并在安静状态下回退到本地路由记忆。",
      emptyState: "当前尚无审计活动或本地路由历史。"
    },
    fallback: {
      statusMeta: "状态 {status}",
      noTargetRecorded: "未记录目标"
    },
    alerts: {
      partialRuntimeSnapshot: "正在显示最新的部分运行时快照。"
    },
    status: {
      awaitingRuntimeSummary: "等待运行摘要。",
      node: "节点 {status}。",
      riskPending: "风险快照待更新。",
      risk: "风险 {riskLevel}，当前有 {activeAlerts} 个活跃告警和 {blockedActions} 个阻断操作。",
      sourceSummary: {
        auditTimeline: "{count} 条近期审计事件已就绪。",
        localRouteMemory: "{count} 条近期本地路由记忆已就绪。",
        pending: "{count} 条近期活动已就绪。"
      }
    }
  },
  pages: {
    nodes: {
      title: "节点",
      tableLabel: "节点",
      summaryCopy: "运行时节点标识、归属与进程状态，均来自最新管理快照。",
      emptyDescription: "管理 API 当前未报告任何节点。",
      loadingDescription: "正在加载最新的节点诊断信息。",
      columns: {
        node: "节点",
        status: "状态"
      },
      unassigned: "未分配"
    },
    strategies: {
      title: "策略",
      tableLabel: "策略",
      summaryCopy: "受监控策略进程、当前运行状态，以及面向已连接节点的受限控制入口。",
      emptyDescription: "管理 API 当前未报告任何策略。",
      loadingDescription: "正在加载最新的策略诊断信息。",
      actionErrorTitle: "命令失败",
      columns: {
        strategy: "策略",
        status: "状态",
        controls: "控制"
      },
      commands: {
        start: "启动策略",
        stop: "停止策略"
      },
      buttons: {
        start: "启动策略 {strategyId}",
        stop: "停止策略 {strategyId}"
      }
    },
    adapters: {
      title: "适配器",
      tableLabel: "适配器",
      summaryCopy: "交易所适配器连通性、当前链路态势，以及受限的连接或断开控制。",
      emptyDescription: "管理 API 当前未报告任何适配器。",
      loadingDescription: "正在加载最新的适配器诊断信息。",
      actionErrorTitle: "命令失败",
      columns: {
        adapter: "适配器",
        status: "状态",
        controls: "控制"
      },
      commands: {
        connect: "连接适配器",
        disconnect: "断开适配器"
      },
      buttons: {
        connect: "连接适配器 {adapterId}",
        disconnect: "断开适配器 {adapterId}"
      }
    },
    orders: {
      title: "订单台",
      tableLabel: "订单台",
      summaryCopy: "当前有界订单窗口内的活动订单流、执行态势与最新簿记活动。",
      emptyDescription: "管理 API 当前未报告任何订单。",
      loadingDescription: "正在加载最新的订单诊断信息。",
      filterPlaceholder: "按订单 ID、品种、方向、数量或状态筛选",
      columns: {
        order: "订单",
        instrument: "品种",
        side: "方向",
        quantity: "数量",
        status: "状态"
      }
    },
    fills: {
      title: "成交",
      tableLabel: "成交",
      summaryCopy: "当前有界成交窗口中的近期执行记录，附带方向、流动性与时间戳上下文。",
      emptyDescription: "管理 API 当前未报告任何成交。",
      loadingDescription: "正在加载最新的成交诊断信息。",
      filterPlaceholder: "按成交 ID、订单 ID、品种、方向、价格、流动性或时间筛选",
      columns: {
        fill: "成交",
        order: "订单",
        instrument: "品种",
        side: "方向",
        quantity: "数量",
        price: "价格",
        liquidity: "流动性",
        time: "时间"
      }
    },
    positions: {
      title: "持仓",
      tableLabel: "持仓",
      summaryCopy: "当前已投影持仓的库存、方向偏置与可展开的下钻上下文。",
      emptyDescription: "管理 API 当前未报告任何持仓。",
      loadingDescription: "正在加载最新的持仓诊断信息。",
      filterPlaceholder: "按持仓 ID、品种、方向、数量、价格或盈亏筛选",
      drillDownTitle: "持仓详情",
      viewDetails: "查看 {instrumentId} 的详情",
      hideDetails: "隐藏 {instrumentId} 的详情",
      unavailable: "不可用",
      columns: {
        instrument: "品种",
        side: "方向",
        quantity: "数量"
      },
      details: {
        position: "持仓",
        instrument: "品种",
        side: "方向",
        quantity: "数量",
        entryPrice: "入场价格",
        unrealizedPnl: "未实现盈亏",
        realizedPnl: "已实现盈亏",
        openedAt: "建仓时间",
        updatedAt: "更新时间"
      }
    },
    accounts: {
      title: "账户",
      tableLabel: "账户",
      summaryCopy: "权益、保证金态势与账户级敞口，并支持展开余额与告警详情。",
      emptyDescription: "管理 API 当前未报告任何账户。",
      loadingDescription: "正在加载最新的账户诊断信息。",
      drillDownTitle: "账户详情",
      viewDetails: "查看 {accountId} 的详情",
      hideDetails: "隐藏 {accountId} 的详情",
      summaryAriaLabel: "账户汇总",
      fallbackNA: "无",
      columns: {
        account: "账户",
        status: "状态",
        venue: "交易所",
        equity: "权益",
        marginRatio: "保证金比率",
        netExposure: "净敞口"
      },
      summaryFields: {
        totalEquity: "总权益",
        availableCash: "可用现金",
        marginUsed: "已用保证金",
        marginAvailable: "可用保证金",
        grossExposure: "总敞口",
        netExposure: "净敞口"
      },
      details: {
        venue: "交易所",
        type: "类型",
        baseCurrency: "基础货币",
        availableCash: "可用现金",
        marginUsed: "已用保证金",
        updatedAt: "更新时间"
      },
      sections: {
        balances: "余额",
        exposure: "敞口",
        alerts: "告警"
      },
      balancesTable: {
        ariaLabel: "{accountId} 的余额",
        asset: "资产",
        total: "总量",
        available: "可用",
        locked: "锁定"
      },
      exposureTable: {
        ariaLabel: "{accountId} 的敞口",
        instrument: "品种",
        side: "方向",
        netQuantity: "净数量",
        notional: "名义价值",
        leverage: "杠杆"
      }
    },
    risk: {
      title: "风控中心",
      copy: "本地交易操作的即时护栏态势、告警流与硬性约束。",
      status: {
        awaiting: "等待最新的风控态势。",
        summary: "{riskLevel} 风险，{activeAlerts} 条告警，{blockedActions} 个阻断操作。"
      },
      pageState: {
        loadingTitle: "正在加载风控中心",
        loadingDescription: "正在加载保证金与风控限制。",
        unavailableTitle: "风控中心暂不可用",
        waitingDescription: "等待风控状态。",
        staleDescription: "正在显示最近一次成功接收的风控快照。"
      },
      header: {
        eyebrow: "即时护栏态势"
      },
      signal: {
        detail: "风险级别"
      },
      alerts: {
        partialSnapshot: "正在显示最新的部分快照。"
      },
      summaryAriaLabel: "风控汇总",
      summaryFields: {
        riskLevel: {
          label: "风险级别",
          detail: "本地风控引擎当前投影的严重程度。"
        },
        blockedActions: {
          label: "阻断操作",
          detail: "当前投影出的硬性约束。"
        },
        activeAlerts: {
          label: "活跃告警",
          detail: "当前流入告警流的信号。"
        },
        tradingState: {
          label: "交易状态",
          detail: "风控引擎给出的当前操作员态势。"
        },
        marginUtilization: {
          label: "保证金利用率",
          detail: "当前已消耗的保证金窗口。"
        },
        exposureUtilization: {
          label: "敞口利用率",
          detail: "实时敞口当前消耗的风控窗口。"
        }
      },
      events: {
        eyebrow: "告警流",
        title: "风控事件",
        description: "已投影告警会以实时操作员流的形式列出，便于关注与升级处理。",
        emptyDescription: "当前没有已投影的活跃风控事件。"
      },
      blocks: {
        eyebrow: "硬性约束",
        title: "激活中的阻断",
        tableLabel: "激活中的阻断",
        description: "活动阻断会显示为约束本地操作范围的硬性限制。",
        emptyDescription: "当前没有已投影的活跃风控阻断。",
        columns: {
          scope: "范围",
          raised: "触发时间",
          reason: "原因",
          status: "状态"
        }
      }
    },
    logs: {
      title: "日志",
      tableLabel: "日志",
      summaryCopy: "来自最新有界运行窗口的操作日志行，按便于快速扫描的顺序排列。",
      emptyDescription: "管理 API 当前未报告任何日志。",
      loadingDescription: "正在加载最新的操作日志。",
      columns: {
        time: "时间",
        level: "级别",
        component: "组件",
        message: "消息"
      }
    },
    audit: {
      title: "审计时间线",
      copy: "面向低风险本地控制操作的仅追加回执流，以及操作员恢复指引。",
      panelEyebrow: "操作回执流",
      pageState: {
        loadingDescription: "正在加载命令审计历史。",
        waitingDescription: "等待审计历史。",
        emptyDescription: "当前尚未记录任何控制命令。"
      },
      status: {
        awaiting: "等待首条低风险控制回执。",
        partialProjection: "审计投影不完整。",
        sourceErrors: "{count} 个审计源错误。",
        receiptsVisible: "当前可见 {count} 条回执。",
        receiptsRequireRecovery: "{count} 条回执需要恢复指引。",
        recordedNoRecovery: "已记录 {count} 条回执，无需恢复指引。",
        recordedRequireRecovery: "已记录 {count} 条回执；其中 {countFlagged} 条需要恢复指引。"
      },
      nouns: {
        error: "错误",
        errors: "处错误"
      },
      signal: {
        partialSnapshot: "部分快照",
        sourceErrors: "{count} 个源错误",
        flagged: "{count} 条已标记",
        allCurrent: "全部最新",
        receipts: "{count} 条回执"
      },
      alerts: {
        partialSnapshot: "正在显示最新的部分审计快照。"
      },
      fields: {
        receipt: "回执 {sequenceId}",
        command: "命令",
        target: "目标",
        resultState: "结果状态",
        recorded: "记录时间",
        noTargetRecorded: "未记录目标"
      },
      recovery: {
        title: "恢复指引",
        description: "请使用本地恢复运行手册执行下一步操作；此页面仅提供导航与查看能力。",
        link: "打开恢复运行手册"
      }
    },
    config: {
      title: "配置差异",
      copy: "用于操作员核验的本地控制平面护栏、漂移账本与恢复运行手册。",
      pageState: {
        loadingDescription: "正在加载本地控制平面护栏。",
        waitingDescription: "等待本地控制平面设置。",
        emptyDescription: "当前没有已投影的控制平面配置条目。"
      },
      status: {
        awaiting: "等待最新的控制平面护栏投影。",
        inSync: "{totalChecks} 项护栏检查已同步；可用恢复运行手册 {runbookCount} 份。",
        drifted: "{totalChecks} 项护栏检查中有 {driftedChecks} 项发生漂移；可用恢复运行手册 {runbookCount} 份。"
      },
      ledger: {
        eyebrow: "护栏漂移账本",
        signalInSync: "已同步",
        signalDrifted: "{count} 项漂移",
        signalChecks: "{count} 项检查",
        tableLabel: "配置差异",
        columns: {
          key: "键",
          desired: "期望值",
          actual: "实际值",
          status: "状态"
        }
      },
      runbooks: {
        eyebrow: "恢复指引",
        title: "恢复运行手册",
        description: "运行手册仅作为本地恢复的导航与核验辅助，不会在此页面直接执行更改。",
        signal: "{count} 份运行手册"
      }
    }
  },
  state: {
    runtimeState: "运行状态",
    connection: {
      connected: "连接正常",
      connecting: "正在建立连接",
      disconnected: "连接已断开",
      stale: "快照延迟"
    },
    signals: {
      loading: "正在获取快照",
      empty: "等待投影视图",
      error: "执行受阻",
      stale: "快照延迟"
    },
    lastUpdated: {
      current: "快照最新",
      stale: "快照延迟",
      unavailable: "上次更新时间不可用",
      timestamp: "上次更新 {timestamp} UTC"
    }
  },
  filters: {
    operatorLabel: "操作筛选",
    helper: "在不改变查询窗口的前提下收窄当前有界快照。",
    searchByKeyword: "按关键字搜索 {title}",
    noRowsTitle: "筛选未返回任何行",
    noRowsDescription: "当前操作筛选没有匹配的行。",
    previousPage: "上一页",
    nextPage: "下一页",
    rowsSummary: "第 {start}-{end} 行，共 {total} 行"
  },
  tables: {
    liveSnapshot: "实时快照",
    snapshotWindow: "快照窗口",
    waitingForFreshSnapshot: "等待新的管理快照。",
    reconnectAdminApi: "重新连接管理 API 以刷新运行状态。",
    showingLastSnapshot: "正在显示最近一次成功接收的管理快照。",
    partialSnapshot: "正在显示最近一次部分管理快照。",
    viewport: "{label} 表格视口",
    details: "详情",
    viewDetails: "查看详情",
    hideDetails: "隐藏详情",
    selectedRow: "已选行"
  },
  dialogs: {
    confirmCommand: "确认命令",
    typeToConfirm: "输入 {value} 以确认",
    cancel: "取消",
    executeCommand: "执行命令",
    executing: "执行中..."
  },
  commands: {
    latestReceipt: "最新回执",
    executionFailed: "命令执行失败。"
  },
  errors: {
    adminEventStream: "管理端事件流错误",
    adminRequestFailedWithStatus: "管理端请求失败，状态码 {status}"
  }
} satisfies MessageCatalog;
