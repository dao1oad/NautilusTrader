import type { AdaptersSnapshot, NodesSnapshot, OverviewSnapshot, StrategiesSnapshot } from "../types/admin";


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


export async function getNodesSnapshot(): Promise<NodesSnapshot> {
  const response = await fetch("/api/admin/nodes");
  return parseJson<NodesSnapshot>(response);
}


export async function getStrategiesSnapshot(): Promise<StrategiesSnapshot> {
  const response = await fetch("/api/admin/strategies");
  return parseJson<StrategiesSnapshot>(response);
}


export async function getAdaptersSnapshot(): Promise<AdaptersSnapshot> {
  const response = await fetch("/api/admin/adapters");
  return parseJson<AdaptersSnapshot>(response);
}
