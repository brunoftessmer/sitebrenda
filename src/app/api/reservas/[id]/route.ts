import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { buildPixQrCodeDataUrl } from "@/lib/pix";
import { releaseExpiredReservations } from "@/lib/reservas";

// O id da reserva funciona como um link privado (é imprevisível): quem tem o
// link consegue ver o status e o Pix, sem precisar de login.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await releaseExpiredReservations();

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return jsonError(404, "Reserva não encontrada.");
    }

    let pix: { payload: string; qrCodeDataUrl: string } | null = null;

    if (reservation.status === "PENDING") {
      const pixKey = process.env.PIX_KEY;
      if (!pixKey) {
        return jsonError(500, "Chave Pix não configurada no servidor.");
      }
      const { payload, dataUrl } = await buildPixQrCodeDataUrl({
        pixKey,
        merchantName: process.env.PIX_MERCHANT_NAME ?? "Brenda",
        merchantCity: process.env.PIX_MERCHANT_CITY ?? "SAO PAULO",
        amountCents: reservation.totalCents,
        txId: reservation.id,
        description: "Cha de casa nova",
      });
      pix = { payload, qrCodeDataUrl: dataUrl };
    }

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        status: reservation.status,
        totalCents: reservation.totalCents,
        createdAt: reservation.createdAt,
        buyerConfirmedAt: reservation.buyerConfirmedAt,
        numbers: reservation.requestedNumbers,
      },
      pix,
    });
  } catch (err) {
    console.error(err);
    return jsonError(500, "Erro inesperado.");
  }
}
