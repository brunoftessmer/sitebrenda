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

    await prisma.$transaction(async (tx) => {
      // O comprador pode ainda não ter clicado em "Já paguei" (números não
      // vinculados a este NumberSlot ainda). O admin pode confirmar mesmo
      // assim, desde que os números não tenham sido ganhos por outra reserva
      // enquanto isso.
      const slots = await tx.numberSlot.findMany({
        where: { number: { in: reservation.requestedNumbers } },
      });

      const takenByOther = slots.filter(
        (s) => s.status !== "AVAILABLE" && s.reservationId !== id
      );
      if (takenByOther.length > 0) {
        throw new Error(
          `INDISPONIVEL:${takenByOther.map((s) => s.number).join(",")}`
        );
      }

      await tx.numberSlot.updateMany({
        where: { number: { in: reservation.requestedNumbers } },
        data: { status: "PAID", reservationId: id },
      });

      await tx.reservation.update({
        where: { id },
        data: {
          status: "PAID",
          confirmedAt: new Date(),
          buyerConfirmedAt: reservation.buyerConfirmedAt ?? new Date(),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("INDISPONIVEL:")) {
      const nums = err.message.split(":")[1];
      return jsonError(
        409,
        `Os números ${nums} já foram reservados por outra pessoa nesse meio tempo.`
      );
    }
    return handleAuthError(err) ?? jsonError(500, "Erro inesperado.");
  }
}
