# aurora-api-backend (render-ready)

## Como usar

1. Copie o conteúdo deste repositório para o GitHub ou envie diretamente ao Render.
2. No Render, ao criar um novo Web Service, defina **Root Directory** como `.` (porque este repo é só o backend).
3. Configure as variáveis de ambiente:
   - `DATABASE_URL` (string do Postgres)
   - `PORT` (opcional)
4. Build command (render): `npm install && npm run build && npx prisma generate`
5. Start command (render): `node dist/server.js`

## Scripts
- `npm run dev` - desenvolvimento local com ts-node-dev
- `npm run build` - compila TypeScript para `dist/`
- `npm start` - executa `node dist/server.js`

## Docker
Há um Dockerfile incluído se preferir deploy via container.

## Notas
- As migrations do Prisma podem ser aplicadas com `npx prisma migrate deploy`.
- Certifique-se de que a tabela `IdSequence` esteja inicializada (o servidor tenta criar se não existir).
