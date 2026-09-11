import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, handleAuthError } from "@/lib/api";
import { releaseExpiredReservations } from "@/lib/reservas";

const PAGE_SIZE = 10;
const STATUSES = ["PENDING", "PAID", "CANCELED"] as const;
type Status = (typeof STATUSES)[number];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await releaseExpiredReservations();

    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get("status");
    const status: Status = STATUSES.includes(statusParam as Status)
      ? (statusParam as Status)
      : "PENDING";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

    // Uma reserva PENDING só entra na fila de análise do admin depois que o
    // comprador clica em "Já paguei" (buyerConfirmedAt preenchido). Antes
    // disso é só um Pix gerado que ninguém confirmou — não deveria aparecer
    // aqui.
    const where =
      status === "PENDING"
        ? { status, buyerConfirmedAt: { not: null } }
        : { status };

    const [reservations, total, counts, pendingConfirmedCount, paidAgg] = await Promise.all([
      prisma.reservation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.reservation.count({ where }),
      prisma.reservation.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.reservation.count({
        where: { status: "PENDING", buyerConfirmedAt: { not: null } },
      }),
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
    countsByStatus.PENDING = pendingConfirmedCount;

    return NextResponse.json({
      reservations: reservations.map((r) => ({
        ...r,
        numbers: r.requestedNumbers.map((number) => ({ number })),
      })),
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
