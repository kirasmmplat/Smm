import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { registerWebhook, getBotInfo } from "@/lib/telegram";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "NEXTAUTH_URL غير محدد" }, { status: 400 });
  }

  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const [webhookResult, botInfo] = await Promise.all([
    registerWebhook(webhookUrl),
    getBotInfo(),
  ]);

  return NextResponse.json({
    webhook: webhookResult,
    bot: botInfo.result ?? null,
    webhookUrl,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const botInfo = await getBotInfo();
  return NextResponse.json({ bot: botInfo.result ?? null });
}
