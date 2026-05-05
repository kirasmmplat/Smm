import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "crypto_enabled",
          "crypto_address_btc",
          "crypto_address_eth",
          "crypto_address_usdt",
          "usdt_trc20_address",
          "usdt_bep20_address",
          "usdt_erc20_address",
          "min_deposit",
        ],
      },
    },
  });
  const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));

  if (s.crypto_enabled !== "true") {
    return NextResponse.json({ enabled: false });
  }

  // Support both old keys (crypto_address_*) and new keys (usdt_*_address)
  const usdtTrc20 = s.usdt_trc20_address || s.crypto_address_usdt || null;
  const usdtBep20 = s.usdt_bep20_address || null;
  const usdtErc20 = s.usdt_erc20_address || null;
  const btc = s.crypto_address_btc || null;

  return NextResponse.json({
    enabled: true,
    minDeposit: parseFloat(s.min_deposit ?? "5"),
    addresses: {
      "USDT-TRC20": usdtTrc20,
      "USDT-BEP20": usdtBep20,
      "USDT-ERC20": usdtErc20,
      ...(btc ? { BTC: btc } : {}),
    },
  });
}
