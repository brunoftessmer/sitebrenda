# Chá de Casa Nova da Brenda

Site para venda de "números da sorte" (R$ 25 cada, de 1 a 100) para o chá de casa nova da Brenda. Ver [REQUISITOS.md](./REQUISITOS.md) para o levantamento completo de requisitos.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Prisma (SQLite em dev) + autenticação própria (telefone + senha, sessão em JWT via cookie httpOnly) + geração de QR code Pix (BR Code/EMV) sem gateway de pagamento.

## Como rodar localmente

1. Instale as dependências (já feito neste scaffold):
   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha os valores (já existe um `.env` de exemplo com dados fictícios para desenvolvimento):
   ```bash
   cp .env.example .env
   ```
   - `AUTH_SECRET`: gere um valor aleatório, ex. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `ADMIN_PHONE` / `ADMIN_PASSWORD`: credenciais do usuário admin único (Brenda), criado pelo seed.
   - `PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY`: dados reais da chave Pix da Brenda para gerar o QR code.

3. Crie o banco (SQLite local) e rode as migrations + seed (cria os 100 números e o usuário admin):
   ```bash
   npm run db:migrate
   ```
   Para rodar o seed manualmente depois: `npm run db:seed`.

4. Suba o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000

## Scripts úteis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` / `npm run start` — build e servidor de produção
- `npm run db:migrate` — cria/atualiza o schema do banco (Prisma Migrate) e roda o seed
- `npm run db:seed` — popula os números 1-100 e o admin (idempotente)
- `npm run db:studio` — abre o Prisma Studio para inspecionar o banco

## Estrutura do projeto

```
prisma/
  schema.prisma      # modelos: User, Reservation, NumberSlot
  seed.ts             # cria os números 1-100 e o admin único
src/
  app/
    page.tsx          # home: mensagem da Brenda + grid de números
    cadastro/          # tela de cadastro (nome + telefone + senha)
    login/              # tela de login
    reserva/[id]/       # tela com o QR code Pix + cancelar reserva
    minhas-compras/     # histórico de reservas do usuário logado
    admin/               # painel admin (protegido por middleware)
    api/
      auth/{cadastro,login,logout,me}
      numeros/           # GET status dos 100 números (público)
      reservas/          # POST cria reserva (carrinho) / GET lista as do usuário
      reservas/[id]/       # GET detalhe + cancelar/
      admin/reservas/       # GET lista tudo (admin) + [id]/confirmar, [id]/liberar
  components/
    Header.tsx, NumberGrid.tsx
  lib/
    db.ts (Prisma client), auth.ts (senha + sessão), jwt.ts (JWT puro p/ middleware),
    pix.ts (payload EMV Pix + QR code), api.ts (helpers de erro)
  middleware.ts        # protege /admin e /minhas-compras
```

## Regras de negócio implementadas

- Cadastro com nome + telefone (único) + senha; login por telefone + senha.
- Grid de números 1 a 100 (R$ 25 cada), seleção múltipla (carrinho).
- Ao confirmar a compra, os números ficam **imediatamente indisponíveis** (sem timer de expiração) e é gerado um QR code Pix dinâmico com o valor total do carrinho.
- Sem confirmação automática de pagamento: a Brenda confirma manualmente pelo painel admin.
- O próprio usuário pode cancelar uma reserva pendente (libera os números). O admin também pode liberar qualquer reserva (pendente ou já paga).
- Admin único, criado via variáveis de ambiente + `npm run db:seed` (sem tela de criação de admin no site).

## Antes de colocar no ar (produção)

- **Banco de dados**: SQLite é só para desenvolvimento local — o filesystem de funções serverless (ex. Vercel) não é persistente. Para produção, troque o `provider` em `prisma/schema.prisma` para `postgresql` e use um banco gerenciado (Neon, Supabase, etc.), atualizando `DATABASE_URL`.
- **Foto da Brenda**: coloque uma imagem em `public/brenda.jpg` (a home já está preparada para exibi-la).
- **Chave Pix**: confirme os dados em `PIX_KEY` / `PIX_MERCHANT_NAME` / `PIX_MERCHANT_CITY` e teste escaneando o QR code gerado antes de divulgar o site.
- **AUTH_SECRET**: gere um segredo forte e exclusivo de produção (não reaproveite o do `.env` de exemplo).
