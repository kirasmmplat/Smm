import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const settings = await prisma.setting.findMany({
    where: { key: { in: ["crypto_enabled", "crypto_address_btc", "crypto_address_eth", "crypto_address_usdt", "min_deposit"] } },
  });
  const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));

  if (s.crypto_enabled !== "true") {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled: true,
    minDeposit: parseFloat(s.min_deposit ?? "5"),
    addresses: {
      BTC: s.crypto_address_btc || null,
      ETH: s.crypto_address_eth || null,
      USDT: s.crypto_address_usdt || null,
    },
  });
}
