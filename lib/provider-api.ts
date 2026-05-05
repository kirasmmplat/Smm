/**
 * SMM Provider API client
 * Handles order submission and status polling against any SMM panel API.
 */

export interface ProviderAddResult {
  success: true;
  providerOrderId: string;
}

export interface ProviderError {
  success: false;
  error: string;
}

export type ProviderResult = ProviderAddResult | ProviderError;

export interface StatusInfo {
  status: string;
  start_count?: string | number;
  remains?: string | number;
  charge?: string | number;
}

/** Submit a new order to the SMM provider and return its remote order ID. */
export async function submitOrderToProvider({
  apiUrl,
  apiKey,
  providerServiceId,
  link,
  quantity,
}: {
  apiUrl: string;
  apiKey: string;
  providerServiceId: string;
  link: string;
  quantity: number;
}): Promise<ProviderResult> {
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: apiKey,
        action: "add",
        service: providerServiceId,
        link,
        quantity,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json() as { order?: number | string; error?: string };

    if (data.error) {
      return { success: false, error: String(data.error) };
    }

    if (!data.order) {
      return { success: false, error: "لم يُرجع المزود معرّف الطلب" };
    }

    return { success: true, providerOrderId: String(data.order) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "خطأ في الاتصال بالمزود" };
  }
}

/** Check statuses of multiple orders from a provider (bulk). */
export async function checkOrderStatuses({
  apiUrl,
  apiKey,
  orderIds,
}: {
  apiUrl: string;
  apiKey: string;
  orderIds: string[];
}): Promise<Record<string, StatusInfo>> {
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey, action: "status", orders: orderIds.join(",") }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return {};
    return await res.json() as Record<string, StatusInfo>;
  } catch {
    return {};
  }
}

/** Map raw provider status string to our internal status enum. */
export function mapProviderStatus(raw: string): string | null {
  const s = raw.toLowerCase().trim();
  if (s === "completed") return "COMPLETED";
  if (s === "in progress" || s === "inprogress") return "IN_PROGRESS";
  if (s === "processing") return "PROCESSING";
  if (s === "partial") return "PARTIAL";
  if (s === "canceled" || s === "cancelled") return "CANCELED";
  if (s === "failed") return "FAILED";
  return null;
}
