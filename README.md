# Chá de Casa Nova da Brenda

Site para venda de "números da sorte" (R$ 25 cada, de 1 a 100) para o chá de casa nova da Brenda. O [REQUISITOS.md](./REQUISITOS.md) guarda o levantamento original de requisitos. Quando ele divergir deste README, vale o que está aqui.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL (Neon) + login próprio do admin (telefone + senha, sessão em JWT via cookie httpOnly) + geração de QR code Pix (BR Code/EMV) sem gateway de pagamento.

## Como rodar localmente

Use sempre um banco de desenvolvimento próprio. Nunca aponte o ambiente local para o banco de produção, que guarda os dados dos participantes.

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie um banco Postgres de desenvolvimento. No Neon, crie uma branch própria e copie a conexão direta (host sem `-pooler`).

3. Copie `.env.example` para `.env` e preencha os valores:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: conexão do banco de desenvolvimento.
   - `AUTH_SECRET`: gere um valor aleatório, ex. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `ADMIN_NAME` / `ADMIN_PHONE` / `ADMIN_PASSWORD`: dados do admin de teste, criado pelo seed.
   - `PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY`: dados de teste para gerar o QR code.

   Use o arquivo `.env`, porque o Prisma não lê o `.env.local`. Se existir um `.env.local`, o Next.js dá prioridade a ele e pode conectar em outro banco.

4. Crie as tabelas e rode o seed (cria os 100 números e o admin):
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Suba o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000. O painel fica em `/admin`, com login em `/login`.

## Scripts úteis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` / `npm run start` — build e servidor de produção
- `npm run lint` — verificação com ESLint
- `npm run db:migrate` — cria/atualiza o schema do banco (Prisma Migrate)
- `npm run db:seed` — popula os números 1-100 e o admin (idempotente)
- `npm run db:studio` — abre o Prisma Studio para inspecionar o banco

## Estrutura do projeto

```
prisma/
  schema.prisma      # modelos: User, Reservation, NumberSlot
  migrations/        # histórico do schema (PostgreSQL)
  seed.ts            # cria os números 1-100 e o admin único
src/
  app/
    page.tsx         # home: mensagem da Brenda + grid de números
    login/           # login do admin
    reserva/[id]/    # tela com o QR code Pix, "Já paguei" e cancelar
    minhas-compras/  # reservas feitas neste navegador (sem login)
    admin/           # painel admin (protegido pelo proxy)
    api/
      auth/{login,logout,me}
      numeros/       # GET status dos 100 números (público)
      reservas/      # POST cria pedido de Pix / GET consulta por ids
      reservas/[id]/ # GET detalhe + cancelar/ + confirmar-pagamento/
      admin/reservas/ # GET lista tudo (admin) + [id]/confirmar, [id]/liberar
  components/
    BrendaPhoto.tsx, Header.tsx, NumberGrid.tsx
  hooks/
    useSession.ts
  lib/
    db.ts (Prisma client), auth.ts (senha + sessão), jwt.ts (JWT puro p/ proxy),
    pix.ts (payload EMV Pix + QR code), reservas.ts (expiração), api.ts (helpers de erro)
  proxy.ts           # protege /admin
```

## Regras de negócio implementadas

- Quem compra não tem conta: informa nome e telefone na hora da reserva. Só o admin faz login.
- Grid de números 1 a 100 (R$ 25 cada), com seleção múltipla.
- Ao confirmar a seleção, é gerado um QR code Pix com o valor total. Nesse momento os números ainda não ficam travados.
- Os números só ficam reservados quando o comprador clica em **Já paguei**. Se duas pessoas pedirem o mesmo número, fica com ele quem clicar primeiro.
- Pedido sem "Já paguei" expira após 180 minutos (`RESERVATION_HOLD_MINUTES`).
- Sem confirmação automática de pagamento: o admin confirma manualmente pelo painel.
- O comprador pode cancelar uma reserva pendente, o que libera os números. O admin pode liberar qualquer reserva, pendente ou paga.
- Admin único, criado via variáveis de ambiente + `npm run db:seed` (sem tela de criação de admin no site).

## Como publicar

O projeto está na Vercel, conectado a este repositório: cada push na `main` gera um deploy de produção em https://site-brenda-six.vercel.app.

- Faça as mudanças em uma branch e abra um pull request para a `main`.
- As variáveis de produção ficam na Vercel e o banco de produção fica no Neon. Nada disso vai para o repositório.
- O `npm run build` não aplica migrations. Mudanças em `prisma/schema.prisma` precisam ser combinadas com o dono do projeto antes do merge.
- Na conta Hobby da Vercel, só o dono da conta dispara deploys. Se um push de outra pessoa for bloqueado, o dono precisa fazer o merge.

## Antes de divulgar

- **Chave Pix**: confirme os dados em `PIX_KEY` / `PIX_MERCHANT_NAME` / `PIX_MERCHANT_CITY` na Vercel e teste escaneando o QR code gerado.
- **AUTH_SECRET**: use um segredo forte e exclusivo de produção, sem reaproveitar o de desenvolvimento.
