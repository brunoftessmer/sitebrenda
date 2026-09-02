import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jsonError, handleAuthError } from "@/lib/api";
import { buildPixQrCodeDataUrl } from "@/lib/pix";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { numbers: { select: { number: true } } },
    });

    if (!reservation || (reservation.userId !== user.id && !user.isAdmin)) {
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
        numbers: reservation.numbers.map((n) => n.number),
      },
      pix,
    });
  } catch (err) {
    return handleAuthError(err) ?? jsonError(500, "Erro inesperado.");
  }
}
