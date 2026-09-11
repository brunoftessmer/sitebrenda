import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { releaseExpiredReservations } from "@/lib/reservas";

// Chamado quando o comprador clica em "Já paguei" na tela do Pix. É AQUI que
// os números pedidos ficam de fato reservados (NumberSlot -> RESERVED),
// travando-os para outras pessoas — não na criação da reserva. Isso não
// confirma o pagamento de verdade (isso continua sendo só o admin quem faz),
// só garante a prioridade do comprador enquanto o admin checa.
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

    // Clique duplicado: já reservado, nada a fazer.
    if (reservation.buyerConfirmedAt) {
      return NextResponse.json({ ok: true });
    }

    await prisma.$transaction(async (tx) => {
      const slots = await tx.numberSlot.findMany({
        where: { number: { in: reservation.requestedNumbers } },
      });

      const unavailable = slots.filter((s) => s.status !== "AVAILABLE");
      if (unavailable.length > 0) {
        throw new Error(
          `INDISPONIVEL:${unavailable.map((s) => s.number).join(",")}`
        );
      }

      const result = await tx.numberSlot.updateMany({
        where: { number: { in: reservation.requestedNumbers }, status: "AVAILABLE" },
        data: { status: "RESERVED", reservationId: id },
      });

      // Alguém confirmou pagamento para um desses números entre a leitura e
      // a escrita acima (concorrência). Aborta a transação inteira — o
      // rollback desfaz o updateMany, ninguém fica com reserva parcial.
      if (result.count !== reservation.requestedNumbers.length) {
        throw new Error("INDISPONIVEL:concorrencia");
      }

      await tx.reservation.update({
        where: { id },
        data: { buyerConfirmedAt: new Date() },
      });
    }, { maxWait: 10000, timeout: 15000 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("INDISPONIVEL:")) {
      const nums = err.message.split(":")[1];
      const detail =
        nums === "concorrencia"
          ? ""
          : ` (${nums})`;
      return jsonError(
        409,
        `Um ou mais números dessa reserva${detail} não estão mais disponíveis — alguém confirmou o pagamento antes de você. Cancele esta reserva e escolha outros números.`
      );
    }

    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2028"
    ) {
      return jsonError(
        503,
        "Muita gente confirmando pagamento ao mesmo tempo. Aguarde alguns segundos e tente de novo."
      );
    }

    console.error(err);
    return jsonError(500, "Erro inesperado.");
  }
}
