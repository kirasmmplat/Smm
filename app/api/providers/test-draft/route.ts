import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { url: string; apiKey: string };

  if (!body.url || !body.apiKey) {
    return NextResponse.json({ message: "URL ومفتاح API مطلوبان" }, { status: 400 });
  }

  try {
    const res = await fetch(body.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ key: body.apiKey, action: "balance" }).toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, message: `خطأ HTTP: ${res.status}` });
    }

    const data = await res.json() as { balance?: string; error?: string };

    if (data.error) {
      return NextResponse.json({ success: false, message: data.error });
    }

    return NextResponse.json({
      success: true,
      balance: data.balance ?? "0",
      message: "تم الاتصال بنجاح",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ في الاتصال";
    return NextResponse.json({ success: false, message: msg });
  }
}
