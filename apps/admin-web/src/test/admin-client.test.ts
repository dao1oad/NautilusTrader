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


test("rejects malformed 200 OK JSON instead of returning an undefined payload", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      }
    })
  );

  await expect(getOverviewSnapshot()).rejects.toThrow("Unexpected end of JSON input");
});


test("preserves raw plain-text backend error bodies before falling back to the localized wrapper", async () => {
  setActiveLocale("zh-CN");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => "Upstream proxy exploded\n"
    })
  );

  await expect(getOverviewSnapshot()).rejects.toThrow("Upstream proxy exploded");
});
