-- Marca quando o comprador clica em "Já paguei", pra reserva não expirar
-- sozinha enquanto o admin ainda não checou o pagamento.
ALTER TABLE "Reservation" ADD COLUMN "buyerConfirmedAt" TIMESTAMP(3);
