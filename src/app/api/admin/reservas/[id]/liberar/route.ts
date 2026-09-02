import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, handleAuthError } from "@/lib/api";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return jsonError(404, "Reserva não encontrada.");
    }
    if (reservation.status === "CANCELED") {
      return jsonError(409, "Essa reserva já está cancelada.");
    }

    await prisma.$transaction([
      prisma.numberSlot.updateMany({
        where: { reservationId: id },
        data: { status: "AVAILABLE", reservationId: null },
      }),
      prisma.reservation.update({
        where: { id },
        data: { status: "CANCELED" },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleAuthError(err) ?? jsonError(500, "Erro inesperado.");
  }
}
