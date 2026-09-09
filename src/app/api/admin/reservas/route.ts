import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, handleAuthError } from "@/lib/api";

const PAGE_SIZE = 10;
const STATUSES = ["PENDING", "PAID", "CANCELED"] as const;
type Status = (typeof STATUSES)[number];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get("status");
    const status: Status = STATUSES.includes(statusParam as Status)
      ? (statusParam as Status)
      : "PENDING";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

    const [reservations, total, counts, paidAgg] = await Promise.all([
      prisma.reservation.findMany({
        where: { status },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { numbers: { select: { number: true } } },
      }),
      prisma.reservation.count({ where: { status } }),
      prisma.reservation.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.reservation.aggregate({
        where: { status: "PAID" },
        _sum: { totalCents: true },
      }),
    ]);

    const countsByStatus: Record<Status, number> = {
      PENDING: 0,
      PAID: 0,
      CANCELED: 0,
    };
    for (const c of counts) {
      countsByStatus[c.status as Status] = c._count._all;
    }

    return NextResponse.json({
      reservations,
      total,
      page,
      pageSize: PAGE_SIZE,
      counts: countsByStatus,
      totalConfirmedCents: paidAgg._sum.totalCents ?? 0,
    });
  } catch (err) {
    return handleAuthError(err) ?? jsonError(500, "Erro inesperado.");
  }
}
