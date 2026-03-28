import { getOverviewSnapshot } from "../shared/api/admin-client";
import { setActiveLocale } from "../shared/i18n/locale";


test("localizes non-OK fetch wrapper errors when the response only exposes status", async () => {
  setActiveLocale("zh-CN");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 503
    })
  );

  await expect(getOverviewSnapshot()).rejects.toThrow("管理端请求失败，状态码 503");
});


test("preserves raw backend messages when the response body already provides one", async () => {
  setActiveLocale("zh-CN");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        message: "Backend exploded"
      })
    })
  );

  await expect(getOverviewSnapshot()).rejects.toThrow("Backend exploded");
});
