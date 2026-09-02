import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jsonError, handleAuthError } from "@/lib/api";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { numbers: true },
    });

    if (!reservation || reservation.userId !== user.id) {
      return jsonError(404, "Reserva não encontrada.");
    }

    if (reservation.status !== "PENDING") {
      return jsonError(409, "Essa reserva não pode mais ser cancelada.");
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
