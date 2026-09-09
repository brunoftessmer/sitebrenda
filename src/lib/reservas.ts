import { prisma } from "./db";

// Quanto tempo um número fica travado sem ninguém confirmar pagamento antes
// de voltar sozinho a ficar disponível. Uma vez que o comprador clica em
// "Já paguei" (buyerConfirmedAt preenchido), a reserva para de expirar e
// fica esperando o admin decidir.
const HOLD_MINUTES = Number(process.env.RESERVATION_HOLD_MINUTES ?? 180);

export async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - HOLD_MINUTES * 60 * 1000);

  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      buyerConfirmedAt: null,
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });

  if (expired.length === 0) return;

  const ids = expired.map((r) => r.id);

  await prisma.$transaction([
    prisma.numberSlot.updateMany({
      where: { reservationId: { in: ids } },
      data: { status: "AVAILABLE", reservationId: null },
    }),
    prisma.reservation.updateMany({
      where: { id: { in: ids } },
      data: { status: "CANCELED" },
    }),
  ]);
}
