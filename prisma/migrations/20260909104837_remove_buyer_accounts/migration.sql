-- Compradores deixam de ter conta: a Reservation passa a guardar o nome e
-- telefone informados na hora da reserva, em vez de referenciar um User.
-- Os dados existentes são migrados a partir do User vinculado antes da coluna
-- userId ser removida.

-- 1) Novas colunas, ainda opcionais
ALTER TABLE "Reservation" ADD COLUMN "buyerName" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "buyerPhone" TEXT;

-- 2) Backfill a partir do User atualmente vinculado a cada reserva
UPDATE "Reservation" r
SET "buyerName" = u."name",
    "buyerPhone" = u."phone"
FROM "User" u
WHERE r."userId" = u."id";

-- 3) Agora que todo mundo tem valor, tornar obrigatório
ALTER TABLE "Reservation" ALTER COLUMN "buyerName" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "buyerPhone" SET NOT NULL;

-- 4) Remover o vínculo com User
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_userId_fkey";
ALTER TABLE "Reservation" DROP COLUMN "userId";
