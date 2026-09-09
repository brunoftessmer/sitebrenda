import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { releaseExpiredReservations } from "@/lib/reservas";

// Chamado quando o comprador clica em "Já paguei" na tela do Pix. Não marca
// a reserva como paga (isso continua sendo só o admin quem faz), apenas
// impede que ela expire sozinha antes do admin checar.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await releaseExpiredReservations();

    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return jsonError(
        404,
        "Reserva não encontrada. Se o número não foi confirmado a tempo, ele pode ter voltado a ficar disponível."
      );
    }
    if (reservation.status !== "PENDING") {
      return jsonError(409, "Essa reserva não está mais aguardando pagamento.");
    }

    await prisma.reservation.update({
      where: { id },
      data: { buyerConfirmedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonError(500, "Erro inesperado.");
  }
}
