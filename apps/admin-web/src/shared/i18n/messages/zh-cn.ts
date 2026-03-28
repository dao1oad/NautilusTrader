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
    activitySource: {
      auditTimeline: "审计时间线",
      localRouteMemory: "本地路由记忆",
      pending: "活动待定"
    }
  },
  errors: {
    adminEventStream: "管理端事件流错误",
    adminRequestFailedWithStatus: "管理端请求失败，状态码 {status}"
  }
} satisfies MessageCatalog;
