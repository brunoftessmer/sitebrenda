import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { buildPixQrCodeDataUrl } from "@/lib/pix";
import { releaseExpiredReservations } from "@/lib/reservas";

const PRICE_CENTS = 2500;

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos (DDD + número)."),
  numbers: z
    .array(z.number().int().min(1).max(100))
    .min(1, "Selecione ao menos um número.")
    .max(100)
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "Números repetidos na seleção.",
    }),
});

// Usado pela página "Minhas compras", que guarda os ids das reservas feitas
// neste navegador (não há login) e consulta o status delas aqui.
export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  const ids = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ reservations: [] });
  }

  const reservations = await prisma.reservation.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "desc" },
    include: { numbers: { select: { number: true } } },
  });

  return NextResponse.json({ reservations });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }
    const { name, phone, numbers } = parsed.data;

    await releaseExpiredReservations();

    const reservation = await prisma.$transaction(async (tx) => {
      const slots = await tx.numberSlot.findMany({
        where: { number: { in: numbers } },
      });

      const unavailable = slots.filter((s) => s.status !== "AVAILABLE");
      if (unavailable.length > 0) {
        throw new Error(
          `INDISPONIVEL:${unavailable.map((s) => s.number).join(",")}`
        );
      }

      const totalCents = numbers.length * PRICE_CENTS;

      const created = await tx.reservation.create({
        data: {
          buyerName: name,
          buyerPhone: phone,
          totalCents,
          status: "PENDING",
        },
      });

      await tx.numberSlot.updateMany({
        where: { number: { in: numbers } },
        data: { status: "RESERVED", reservationId: created.id },
      });

      return created;
    });

    const pixKey = process.env.PIX_KEY;
    const merchantName = process.env.PIX_MERCHANT_NAME ?? "Brenda";
    const merchantCity = process.env.PIX_MERCHANT_CITY ?? "SAO PAULO";

    if (!pixKey) {
      return jsonError(500, "Chave Pix não configurada no servidor.");
    }

    const { payload, dataUrl } = await buildPixQrCodeDataUrl({
      pixKey,
      merchantName,
      merchantCity,
      amountCents: reservation.totalCents,
      txId: reservation.id,
      description: "Cha de casa nova",
    });

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        totalCents: reservation.totalCents,
        status: reservation.status,
        numbers,
      },
      pix: { payload, qrCodeDataUrl: dataUrl },
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("INDISPONIVEL:")) {
      const nums = err.message.split(":")[1];
      return jsonError(
        409,
        `Os números ${nums} não estão mais disponíveis. Atualize a página e tente novamente.`
      );
    }

    console.error(err);
    return jsonError(500, "Erro inesperado ao criar reserva.");
  }
}
