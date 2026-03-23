import type { OverviewSnapshot } from "../types/admin";


async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Admin request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}


export async function getHealthStatus(): Promise<{ status: string }> {
  const response = await fetch("/api/admin/health");
  return parseJson<{ status: string }>(response);
}


export async function getOverviewSnapshot(): Promise<OverviewSnapshot> {
  const response = await fetch("/api/admin/overview");
  return parseJson<OverviewSnapshot>(response);
}
