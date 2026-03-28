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
    activitySource: {
      auditTimeline: "Audit timeline",
      localRouteMemory: "Local route memory",
      pending: "Activity pending"
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
  errors: {
    adminEventStream: "Admin event stream error",
    adminRequestFailedWithStatus: "Admin request failed with status {status}"
  }
};
