export const en = {
  chrome: {
    appName: "NautilusTrader Admin",
    operatorWorkstation: "Operator workstation",
    sidebarCopy: "Pinned local shell for live operations, runtime diagnostics, and bounded analysis surfaces.",
    runtime: "Runtime",
    localProcess: "Local process",
    workspace: "Workspace",
    browserPinnedMemory: "Browser-pinned memory",
    activeDesk: "Active desk",
    workbenchEntryPoints: "Workbench entry points",
    workbenchNavigation: "Workbench navigation",
    workbenchRoutes: "Workbench routes",
    recentViews: "Recent views",
    runtimeStatus: "Runtime status",
    workbench: "Workbench",
    surface: "Surface",
    lastUpdated: "Last updated",
    environment: "Environment",
    localOperatorShell: "Local operator shell",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    awaitingPageTelemetry: "Awaiting page telemetry",
    workbenches: {
      operations: "Operations",
      analysis: "Analysis"
    },
    localeSwitcher: {
      label: "Language",
      button: "Language"
    },
    locales: {
      en: "English",
      zhCN: "Simplified Chinese"
    }
  },
  navigation: {
    workbenches: {
      operations: "Operations",
      analysis: "Analysis"
    },
    routes: {
      overview: "Overview",
      nodes: "Nodes",
      strategies: "Strategies",
      adapters: "Adapters",
      audit: "Audit",
      config: "Config",
      orders: "Blotter",
      fills: "Fills",
      positions: "Positions",
      accounts: "Accounts",
      risk: "Risk Center",
      logs: "Logs",
      catalog: "Catalog",
      playback: "Playback",
      diagnostics: "Diagnostics",
      backtests: "Backtests",
      reports: "Reports"
    }
  },
  workbenchShell: {
    copy: {
      operations: "Live control-plane routes, receipts, and runtime guardrails stay grouped under the operations workstation.",
      analysis: "Backtests, reports, playback, and diagnostics stay grouped under the bounded analysis workstation."
    },
    ready: {
      operations: "Operations workbench ready.",
      analysis: "Analysis workbench ready."
    },
    status: {
      operations: "Operational routes are pinned locally with recent-view memory preserved in the browser workspace.",
      analysis: "Analysis routes remain bounded to local playback, catalog, diagnostics, and reporting surfaces."
    }
  },
  overview: {
    commandCenter: {
      title: "Command center",
      description: "Runtime posture, risk pressure, and latest control-plane movement at a glance."
    },
    pageState: {
      loadingTitle: "Loading overview",
      loadingDescription: "Waiting for the latest admin snapshot.",
      unavailableTitle: "Overview unavailable",
      connectionStaleTitle: "Connection stale",
      disconnectedTitle: "Disconnected from admin API",
      disconnectedDescription: "Reconnect the admin API to refresh runtime state.",
      refreshFailedTitle: "Overview refresh failed",
      staleDescription: "Snapshot refresh is delayed. Showing the freshest available command-center data.",
      noLiveNodeTitle: "No live node configured",
      noLiveNodeDescription: "Connect a live node to populate runtime operations data."
    },
    activitySource: {
      auditTimeline: "Audit timeline",
      localRouteMemory: "Local route memory",
      pending: "Activity pending"
    },
    signal: {
      noNodeId: "No node id",
      nodeLabel: "Node {status}",
      riskLabel: "Risk {riskLevel}",
      alertsDetail: "{count} alerts",
      itemsDetail: "{count} items"
    },
    runtimeSummary: {
      title: "Runtime summary",
      description: "Runtime breadth across live strategies, adapters, accounts, and open positions.",
      nodeStatusLabel: "Node status",
      connectedNodeDetail: "Connected node",
      nodeIdPendingDetail: "Node id pending",
      activeStrategiesLabel: "Active strategies",
      activeStrategiesDetail: "{count} running",
      activeStrategiesMeta: "Supervised strategies",
      adapterLinksLabel: "Adapter links",
      adapterLinksDetail: "Bounded venue adapters",
      adapterLinksMeta: "{count} connected",
      accountsLabel: "Accounts",
      accountsDetail: "Accounts projected into the shell",
      accountsMeta: "Balances and exposures",
      openPositionsLabel: "Open positions",
      openPositionsDetail: "Projected live positions",
      openPositionsMeta: "Cross-venue exposure"
    },
    riskSnapshot: {
      title: "Risk snapshot",
      description: "Cross-account guardrails, live alerts, and the latest operator blocks.",
      tradingStateLabel: "Trading state",
      tradingStateDetail: "Operator gate status",
      tradingStateMeta: "Risk coordinator",
      riskLevelLabel: "Risk level",
      riskLevelDetail: "Current posture",
      riskLevelMeta: "Margin and exposure",
      activeAlertsLabel: "Active alerts",
      activeAlertsMeta: "Margin utilization",
      blockedActionsLabel: "Blocked actions",
      blockedActionsMeta: "Exposure utilization",
      latestAlertTitle: "Latest alert",
      noLiveAlerts: "No live risk alerts are currently projected.",
      latestBlockTitle: "Latest block",
      noActiveBlocks: "No operator blocks are currently active.",
      unavailable: "Risk snapshot is not available yet."
    },
    activity: {
      title: "Recent activity",
      description: "Latest control receipts, with local route memory as the quiet-state fallback.",
      emptyState: "No audit activity or local route history is available yet."
    },
    fallback: {
      statusMeta: "Status {status}",
      noTargetRecorded: "No target recorded"
    },
    alerts: {
      partialRuntimeSnapshot: "Showing the latest partial runtime snapshot."
    },
    status: {
      awaitingRuntimeSummary: "Awaiting runtime summary.",
      node: "Node {status}.",
      riskPending: "Risk snapshot pending.",
      risk: "Risk {riskLevel} with {activeAlerts} active alerts and {blockedActions} blocked actions.",
      sourceSummary: {
        auditTimeline: "{count} recent audit items ready.",
        localRouteMemory: "{count} recent local route memory items ready.",
        pending: "{count} recent activity items ready."
      }
    }
  },
  pages: {
    nodes: {
      title: "Nodes",
      tableLabel: "Nodes",
      summaryCopy: "Runtime node identity, assignment, and process status from the latest admin snapshot.",
      emptyDescription: "No nodes are currently reported by the admin API.",
      loadingDescription: "Loading the latest node diagnostics.",
      columns: {
        node: "Node",
        status: "Status"
      },
      unassigned: "Unassigned"
    },
    strategies: {
      title: "Strategies",
      tableLabel: "Strategies",
      summaryCopy: "Supervised strategy processes, current run state, and guarded control entry points for the connected node.",
      emptyDescription: "No strategies are currently reported by the admin API.",
      loadingDescription: "Loading the latest strategy diagnostics.",
      actionErrorTitle: "Command failed",
      columns: {
        strategy: "Strategy",
        status: "Status",
        controls: "Controls"
      },
      commands: {
        start: "Start strategy",
        stop: "Stop strategy"
      },
      buttons: {
        start: "Start strategy {strategyId}",
        stop: "Stop strategy {strategyId}"
      }
    },
    adapters: {
      title: "Adapters",
      tableLabel: "Adapters",
      summaryCopy: "Venue adapter connectivity, current link posture, and guarded connect or disconnect controls.",
      emptyDescription: "No adapters are currently reported by the admin API.",
      loadingDescription: "Loading the latest adapter diagnostics.",
      actionErrorTitle: "Command failed",
      columns: {
        adapter: "Adapter",
        status: "Status",
        controls: "Controls"
      },
      commands: {
        connect: "Connect adapter",
        disconnect: "Disconnect adapter"
      },
      buttons: {
        connect: "Connect adapter {adapterId}",
        disconnect: "Disconnect adapter {adapterId}"
      }
    },
    orders: {
      title: "Blotter",
      tableLabel: "Blotter",
      summaryCopy: "Active order flow, execution posture, and recent book activity inside the bounded blotter window.",
      emptyDescription: "No orders are currently reported by the admin API.",
      loadingDescription: "Loading the latest order diagnostics.",
      filterPlaceholder: "Filter by order id, instrument, side, quantity, or status",
      columns: {
        order: "Order",
        instrument: "Instrument",
        side: "Side",
        quantity: "Quantity",
        status: "Status"
      }
    },
    fills: {
      title: "Fills",
      tableLabel: "Fills",
      summaryCopy: "Recent executions with side, liquidity, and timestamp context from the current bounded fill window.",
      emptyDescription: "No fills are currently reported by the admin API.",
      loadingDescription: "Loading the latest fill diagnostics.",
      filterPlaceholder: "Filter by fill id, order id, instrument, side, price, liquidity, or time",
      columns: {
        fill: "Fill",
        order: "Order",
        instrument: "Instrument",
        side: "Side",
        quantity: "Quantity",
        price: "Price",
        liquidity: "Liquidity",
        time: "Time"
      }
    },
    positions: {
      title: "Positions",
      tableLabel: "Positions",
      summaryCopy: "Open inventory, side bias, and drill-down context for the currently projected positions.",
      emptyDescription: "No positions are currently reported by the admin API.",
      loadingDescription: "Loading the latest position diagnostics.",
      filterPlaceholder: "Filter by position id, instrument, side, quantity, price, or pnl",
      drillDownTitle: "Position details",
      viewDetails: "View details for {instrumentId}",
      hideDetails: "Hide details for {instrumentId}",
      unavailable: "Unavailable",
      columns: {
        instrument: "Instrument",
        side: "Side",
        quantity: "Quantity"
      },
      details: {
        position: "Position",
        instrument: "Instrument",
        side: "Side",
        quantity: "Quantity",
        entryPrice: "Entry price",
        unrealizedPnl: "Unrealized PnL",
        realizedPnl: "Realized PnL",
        openedAt: "Opened at",
        updatedAt: "Updated at"
      }
    },
    accounts: {
      title: "Accounts",
      tableLabel: "Accounts",
      summaryCopy: "Equity, margin posture, and account-level exposure with expandable balance and alert detail.",
      emptyDescription: "No accounts are currently reported by the admin API.",
      loadingDescription: "Loading the latest account diagnostics.",
      drillDownTitle: "Account details",
      viewDetails: "View details for {accountId}",
      hideDetails: "Hide details for {accountId}",
      summaryAriaLabel: "Account summary",
      fallbackNA: "n/a",
      columns: {
        account: "Account",
        status: "Status",
        venue: "Venue",
        equity: "Equity",
        marginRatio: "Margin ratio",
        netExposure: "Net exposure"
      },
      summaryFields: {
        totalEquity: "Total equity",
        availableCash: "Available cash",
        marginUsed: "Margin used",
        marginAvailable: "Margin available",
        grossExposure: "Gross exposure",
        netExposure: "Net exposure"
      },
      details: {
        venue: "Venue",
        type: "Type",
        baseCurrency: "Base currency",
        availableCash: "Available cash",
        marginUsed: "Margin used",
        updatedAt: "Updated at"
      },
      sections: {
        balances: "Balances",
        exposure: "Exposure",
        alerts: "Alerts"
      },
      balancesTable: {
        ariaLabel: "Balances for {accountId}",
        asset: "Asset",
        total: "Total",
        available: "Available",
        locked: "Locked"
      },
      exposureTable: {
        ariaLabel: "Exposure for {accountId}",
        instrument: "Instrument",
        side: "Side",
        netQuantity: "Net quantity",
        notional: "Notional",
        leverage: "Leverage"
      }
    },
    risk: {
      title: "Risk center",
      copy: "Immediate guardrail posture, alert stream, and hard constraints for local trading operations.",
      status: {
        awaiting: "Awaiting the latest risk posture.",
        summary: "{riskLevel} risk, {activeAlerts} alerts, {blockedActions} blocked actions."
      },
      pageState: {
        loadingTitle: "Loading risk center",
        loadingDescription: "Loading margin and risk controls.",
        unavailableTitle: "Risk center unavailable",
        waitingDescription: "Waiting for risk state.",
        staleDescription: "Showing the last successfully received risk snapshot."
      },
      header: {
        eyebrow: "Immediate guardrail posture"
      },
      signal: {
        detail: "risk level"
      },
      alerts: {
        partialSnapshot: "Showing the latest partial snapshot."
      },
      summaryAriaLabel: "Risk summary",
      summaryFields: {
        riskLevel: {
          label: "Risk level",
          detail: "Current severity projected by the local risk engine."
        },
        blockedActions: {
          label: "Blocked actions",
          detail: "Hard constraints currently projected."
        },
        activeAlerts: {
          label: "Active alerts",
          detail: "Signals currently flowing into the alert stream."
        },
        tradingState: {
          label: "Trading state",
          detail: "Current operator posture from the risk engine."
        },
        marginUtilization: {
          label: "Margin utilization",
          detail: "Configured margin window currently consumed."
        },
        exposureUtilization: {
          label: "Exposure utilization",
          detail: "Risk window currently consumed by live exposures."
        }
      },
      events: {
        eyebrow: "Alert stream",
        title: "Risk events",
        description: "Projected alerts are listed as a live operator stream for attention and escalation.",
        emptyDescription: "No active risk events are currently projected."
      },
      blocks: {
        eyebrow: "Hard constraints",
        title: "Active blocks",
        tableLabel: "Active blocks",
        description: "Active blocks are shown as hard constraints that bound what operators can do locally.",
        emptyDescription: "No active risk blocks are currently projected.",
        columns: {
          scope: "Scope",
          raised: "Raised",
          reason: "Reason",
          status: "Status"
        }
      }
    },
    logs: {
      title: "Logs",
      tableLabel: "Logs",
      summaryCopy: "Operational log lines from the latest bounded runtime window, ordered for rapid operator scan.",
      emptyDescription: "No logs are currently reported by the admin API.",
      loadingDescription: "Loading the latest operational logs.",
      columns: {
        time: "Time",
        level: "Level",
        component: "Component",
        message: "Message"
      }
    },
    audit: {
      title: "Audit timeline",
      copy: "Append-only receipt stream for low-risk local control actions and operator recovery guidance.",
      panelEyebrow: "Action receipt stream",
      pageState: {
        loadingDescription: "Loading command audit history.",
        waitingDescription: "Waiting for audit history.",
        emptyDescription: "No control commands have been recorded yet."
      },
      status: {
        awaiting: "Awaiting the first low-risk control receipt.",
        partialProjection: "Partial audit projection.",
        sourceErrors: "{count} audit source {noun}.",
        receiptsVisible: "{count} receipts currently visible.",
        receiptsRequireRecovery: "{count} receipts require recovery guidance.",
        recordedNoRecovery: "{count} receipts recorded with no recovery guidance required.",
        recordedRequireRecovery: "{count} receipts recorded; {countFlagged} require recovery guidance."
      },
      nouns: {
        error: "error",
        errors: "errors"
      },
      signal: {
        partialSnapshot: "partial snapshot",
        sourceErrors: "{count} source {noun}",
        flagged: "{count} flagged",
        allCurrent: "all current",
        receipts: "{count} receipts"
      },
      alerts: {
        partialSnapshot: "Showing the latest partial audit snapshot."
      },
      fields: {
        receipt: "Receipt {sequenceId}",
        command: "Command",
        target: "Target",
        resultState: "Result state",
        recorded: "Recorded",
        noTargetRecorded: "No target recorded"
      },
      recovery: {
        title: "Recovery guidance",
        description: "Use the local recovery runbook for the next operator step; this surface remains navigation-only.",
        link: "Open recovery runbook"
      }
    },
    config: {
      title: "Config diff",
      copy: "Local control-plane guardrails, drift ledger, and recovery runbooks for operator verification.",
      pageState: {
        loadingDescription: "Loading local control-plane guardrails.",
        waitingDescription: "Waiting for local control-plane settings.",
        emptyDescription: "No control-plane config entries are currently projected."
      },
      status: {
        awaiting: "Awaiting the latest control-plane guardrail projection.",
        inSync: "{totalChecks} guardrail checks in sync; {runbookCount} recovery runbooks available.",
        drifted: "{driftedChecks} of {totalChecks} guardrail checks drifted; {runbookCount} recovery runbooks available."
      },
      ledger: {
        eyebrow: "Guardrail drift ledger",
        signalInSync: "in sync",
        signalDrifted: "{count} drifted",
        signalChecks: "{count} checks",
        tableLabel: "Config diff",
        columns: {
          key: "Key",
          desired: "Desired",
          actual: "Actual",
          status: "Status"
        }
      },
      runbooks: {
        eyebrow: "Recovery guidance",
        title: "Recovery runbooks",
        description: "Runbooks remain navigation and verification aids for local recovery; they do not execute changes from this page.",
        signal: "{count} runbooks"
      }
    }
  },
  state: {
    runtimeState: "Runtime state",
    connection: {
      connected: "Link healthy",
      connecting: "Establishing link",
      disconnected: "Link offline",
      stale: "Snapshot delayed"
    },
    signals: {
      loading: "Acquiring snapshot",
      empty: "Projection pending",
      error: "Execution blocked",
      stale: "Snapshot delayed"
    },
    lastUpdated: {
      current: "Snapshot current",
      stale: "Snapshot delayed",
      unavailable: "Last updated unavailable",
      timestamp: "Last updated {timestamp} UTC"
    }
  },
  filters: {
    operatorLabel: "Operator filter",
    helper: "Narrow the current bounded snapshot without changing the query window.",
    searchByKeyword: "Search {title} by keyword",
    noRowsTitle: "Filter returned no rows",
    noRowsDescription: "No rows match the current operator filter.",
    previousPage: "Previous page",
    nextPage: "Next page",
    rowsSummary: "Rows {start}-{end} of {total}"
  },
  tables: {
    liveSnapshot: "Live snapshot",
    snapshotWindow: "Snapshot window",
    waitingForFreshSnapshot: "Waiting for a fresh admin snapshot.",
    reconnectAdminApi: "Reconnect the admin API to refresh runtime state.",
    showingLastSnapshot: "Showing the last successfully received admin snapshot.",
    partialSnapshot: "Showing the latest partial snapshot.",
    viewport: "{label} table viewport",
    details: "Details",
    viewDetails: "View details",
    hideDetails: "Hide details",
    selectedRow: "Selected row"
  },
  dialogs: {
    confirmCommand: "Confirm command",
    typeToConfirm: "Type {value} to confirm",
    cancel: "Cancel",
    executeCommand: "Execute command",
    executing: "Executing..."
  },
  commands: {
    latestReceipt: "Latest receipt",
    executionFailed: "Command execution failed."
  },
  errors: {
    adminEventStream: "Admin event stream error",
    adminRequestFailedWithStatus: "Admin request failed with status {status}"
  }
};
