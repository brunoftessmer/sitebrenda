# Chá de Casa Nova da Brenda — Requisitos do Site

> Documento gerado a partir de entrevista de levantamento de requisitos (29/08/2026).
> Objetivo: site para venda de "números da sorte" (rifa de contribuição) para o chá de casa nova da Brenda, que se mudou recentemente.

## 1. Visão Geral

Site web responsivo (mobile-first, já que a maioria dos convidados vai acessar pelo celular) onde convidados se cadastram, fazem login, escolhem números de 1 a 100 (R$ 25,00 cada) para "presentear" a Brenda, e pagam via Pix usando um QR code exibido na tela. O controle de confirmação de pagamento é manual, feito pela Brenda (admin), sem integração automática com meios de pagamento — mantendo o sistema simples.

## 2. Perfis de Usuário

- **Convidado (usuário comum)**: cadastra-se, faz login, compra números.
- **Admin (Brenda)**: usuário único, criado manualmente (via banco de dados/config, sem tela de criação de admin no site). Gerencia reservas e números.

## 3. Cadastro e Login

- Cadastro requer: **nome** e **telefone/WhatsApp**.
- Login é feito com **telefone + senha** (senha definida no momento do cadastro).
- Não há e-mail nem verificação por SMS/OTP — mantém o fluxo simples.
- Telefone deve ser único no sistema (não permite dois cadastros com o mesmo número).

## 4. Compra de Números

- Números disponíveis: **1 a 100**, cada um custando **R$ 25,00**.
- Usuário pode selecionar **múltiplos números numa mesma sessão de compra** (carrinho), vendo o total antes de confirmar (ex: 3 números = R$ 75,00).
- Ao **confirmar a compra**, os números escolhidos ficam **imediatamente indisponíveis** para outros usuários — não há timer de expiração de reserva. O sistema confia que quem confirmou vai pagar.
- Após confirmar, o sistema exibe um **QR code Pix dinâmico** com o valor exato do carrinho (chave Pix da Brenda cadastrada no sistema, payload gerado com o valor total).
- Não há verificação automática de pagamento — a confirmação de que o Pix foi de fato recebido é manual, feita pela Brenda no painel admin.

## 5. Cancelamento / Liberação de Números

- O **próprio usuário pode cancelar** uma compra que ainda não foi confirmada como paga pelo admin, liberando o(s) número(s) de volta para disponibilidade.
- O **admin também pode liberar manualmente** qualquer número (ex: quando o pagamento não foi feito e o prazo "informal" passou, ou por qualquer outro motivo).

## 6. Painel Admin

- Lista de todas as reservas/compras, com status (pendente / confirmado / cancelado), nome e telefone do comprador, números escolhidos e valor.
- Ações disponíveis:
  - **Confirmar pagamento** de uma reserva (marca como paga).
  - **Liberar número(s)** de volta para disponível (reverter reserva, pagante ou não).
- Visão geral do grid de 1 a 100 com status visual de cada número (disponível / reservado-pendente / pago).

## 7. Página Inicial / Institucional

- Foto e mensagem pessoal da Brenda sobre o chá de casa nova.
- Grid/lista dos números de 1 a 100 com status (disponível, indisponível).
- Chamada para ação: cadastro/login para poder comprar.

> Data, horário, endereço do evento e lista de presentes específicos **não** entram nesta primeira versão — foco no fluxo de compra dos números.

## 8. Requisitos Não Funcionais

- **Responsivo / mobile-first**: prioridade total para boa experiência em celular, já que é o principal canal de acesso dos convidados.
- Simplicidade de hospedagem e manutenção — stack livre a critério técnico, priorizando baixo custo/gratuito.
- Sem integração com gateway de pagamento nesta versão (fica como possível evolução futura — ex: cartão de crédito).

## 9. Fora de Escopo (v1)

- Confirmação automática de pagamento (webhook Pix, gateway, etc.).
- Reserva com expiração automática por tempo.
- Múltiplos admins / fluxo de promoção de usuário a admin.
- Pagamento por cartão de crédito ou outros meios além do Pix.
- Seção de data/local do evento e lista de presentes.

## 10. Possíveis Evoluções Futuras

- Integração com meio de pagamento que confirme automaticamente o Pix recebido.
- Suporte a cartão de crédito.
- Múltiplos administradores.
- Seção de detalhes do evento (data, endereço) e lista de presentes complementar.
