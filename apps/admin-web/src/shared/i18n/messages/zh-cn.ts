import type { MessageCatalog } from "../catalog";


export const zhCN = {
  chrome: {
    appName: "NautilusTrader Admin"
  },
  errors: {
    adminEventStream: "管理端事件流错误",
    adminRequestFailedWithStatus: "管理端请求失败，状态码 {status}"
  }
} satisfies MessageCatalog;
