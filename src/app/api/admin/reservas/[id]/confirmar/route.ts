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
    if (reservation.status !== "PENDING") {
      return jsonError(409, "Só é possível confirmar reservas pendentes.");
    }

    await prisma.$transaction([
      prisma.numberSlot.updateMany({
        where: { reservationId: id },
        data: { status: "PAID" },
      }),
      prisma.reservation.update({
        where: { id },
        data: { status: "PAID", confirmedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleAuthError(err) ?? jsonError(500, "Erro inesperado.");
  }
}
