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
    activitySource: {
      auditTimeline: "审计时间线",
      localRouteMemory: "本地路由记忆",
      pending: "活动待定"
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
