import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TronScan public API - no API key needed
const TRONSCAN_API = "https://apilist.tronscanapi.com/api/token_trc20/transfers";

interface TronTransfer {
  transaction_id: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  block_ts: number;
  confirmed: boolean;
}

interface TronScanResponse {
  token_transfers: TronTransfer[];
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "cron-secret-smm";
  const vercelCron = req.headers.get("x-vercel-cron");

  if (!vercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get crypto settings
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ["usdt_trc20_address", "crypto_address_usdt", "crypto_auto_enabled", "min_deposit"] },
    },
  });
  const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));

  if (s.crypto_auto_enabled !== "true") {
    return NextResponse.json({ skipped: true, reason: "crypto_auto_enabled is false" });
  }

  const trc20Address = s.usdt_trc20_address || s.crypto_address_usdt;
  if (!trc20Address) {
    return NextResponse.json({ skipped: true, reason: "No TRC20 address configured" });
  }

  const minDeposit = parseFloat(s.min_deposit ?? "5");

  // Fetch pending PENDING crypto transactions (last 24h)
  const pending = await prisma.transaction.findMany({
    where: {
      type: "DEPOSIT",
      status: "PENDING",
      paymentMethod: { in: ["USDT-TRC20", "crypto", "كريبتو", "USDT", "TRC20"] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    include: {
      user: { select: { id: true, name: true, email: true, balance: true, telegramChatId: true, telegramNotifications: true, emailNotifications: true } },
    },
    take: 50,
  });

  if (pending.length === 0) {
    // Still check TronScan for any new deposits not yet matched
    return await checkTronScanForNewDeposits(trc20Address, minDeposit);
  }

  let confirmed = 0;

  // Check TronScan for recent USDT transfers to our address
  try {
    const url = `${TRONSCAN_API}?relatedAddress=${trc20Address}&limit=50&start=0&sort=-timestamp&count=true&filterTokenValue=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      return NextResponse.json({ error: "TronScan API error", status: res.status });
    }
    const data = await res.json() as TronScanResponse;
    const transfers = data.token_transfers ?? [];

    for (const transfer of transfers) {
      if (!transfer.confirmed) continue;
      if (transfer.toAddress.toLowerCase() !== trc20Address.toLowerCase()) continue;

      // USDT has 6 decimals on TRC20
      const usdtAmount = parseFloat(transfer.amount) / 1_000_000;
      if (usdtAmount < minDeposit) continue;

      // Check if already processed (paymentReference = tx hash)
      const txHash = transfer.transaction_id;
      const alreadyProcessed = await prisma.transaction.findFirst({
        where: { paymentReference: txHash, status: "COMPLETED" },
      });
      if (alreadyProcessed) continue;

      // Find matching pending transaction by amount (within 1% tolerance)
      const matchedTx = pending.find((tx) => {
        const txAmount = parseFloat(tx.amount.toString());
        const diff = Math.abs(txAmount - usdtAmount) / usdtAmount;
        return diff < 0.01; // 1% tolerance
      });

      if (!matchedTx) continue;

      // Confirm the deposit
      const user = matchedTx.user;
      const newBalance = parseFloat(user.balance.toString()) + usdtAmount;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { balance: newBalance },
        }),
        prisma.transaction.update({
          where: { id: matchedTx.id },
          data: {
            status: "COMPLETED",
            balanceAfter: newBalance,
            balanceBefore: parseFloat(user.balance.toString()),
            paymentReference: txHash,
            notes: `تأكيد تلقائي TRC20 - TX: ${txHash.slice(0, 16)}...`,
          },
        }),
        prisma.notification.create({
          data: {
            userId: user.id,
            title: "تم تأكيد إيداعك تلقائياً ✅",
            message: `تمت إضافة $${usdtAmount.toFixed(2)} USDT لرصيدك. الرصيد الجديد: $${newBalance.toFixed(2)}`,
            type: "DEPOSIT",
            link: "/dashboard/add-funds",
          },
        }),
      ]);

      confirmed++;
    }
  } catch (e) {
    return NextResponse.json({ error: String(e), confirmed });
  }

  return NextResponse.json({
    confirmed,
    checked: pending.length,
    timestamp: new Date().toISOString(),
  });
}

async function checkTronScanForNewDeposits(address: string, minDeposit: number) {
  try {
    const url = `${TRONSCAN_API}?relatedAddress=${address}&limit=20&start=0&sort=-timestamp&count=true&filterTokenValue=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return NextResponse.json({ checked: 0, confirmed: 0 });
    const data = await res.json() as TronScanResponse;
    const transfers = (data.token_transfers ?? []).filter(t => t.confirmed);

    return NextResponse.json({
      checked: 0,
      confirmed: 0,
      recentIncoming: transfers
        .filter(t => t.toAddress.toLowerCase() === address.toLowerCase())
        .slice(0, 5)
        .map(t => ({
          hash: t.transaction_id.slice(0, 20) + "...",
          amount: parseFloat(t.amount) / 1_000_000,
          time: new Date(t.block_ts).toISOString(),
        })),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ checked: 0, confirmed: 0 });
  }
}
