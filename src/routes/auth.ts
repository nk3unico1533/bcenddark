import express from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";

const router = express.Router();

const SALT_ROUNDS = 10;
const MAX_ID = 1000000; // 0 .. 999999 (1_000_000 values)

/**
 * Gera e reserva o próximo user_id de forma transacional.
 * Usa a tabela IdSequence: atualiza last_id e retorna o novo valor.
 */
async function generateUserId() {
  // Rodamos em transação para evitar colisões:
  const res: any = await prisma.$transaction(async (tx) => {
    // Atualiza e retorna o novo last_id
    const updated = await tx.$queryRaw<
      Array<{ last_id: number }>
    >`UPDATE "IdSequence" SET last_id = (last_id + 1) % ${MAX_ID} WHERE name = 'user_id' RETURNING last_id;`;

    if (!updated || updated.length === 0) {
      throw new Error("Sequência de user_id não inicializada.");
    }
    return updated[0].last_id;
  });

  return res;
}

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "username e password são obrigatórios" });
    }

    // Verifica se username já existe
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return res.status(409).json({ ok: false, error: "username já existe" });
    }

    // Gera hash da senha
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    // Gera user_id transacionalmente e cria usuário dentro da mesma lógica
    // Aqui fazemos duas operações separadas: gerar id (já faz update na tabela),
    // e em seguida inserir o usuário. A geração do id já reservou o número.
    const user_id = await generateUserId();

    const user = await prisma.user.create({
      data: {
        user_id,
        username,
        password: hashed
      },
      select: {
        id: true,
        user_id: true,
        username: true,
        createdAt: true
      }
    });

    return res.json({ ok: true, user });
  } catch (err: any) {
    console.error("register error:", err);
    return res.status(500).json({ ok: false, error: "erro interno" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "username e password são obrigatórios" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ ok: false, error: "credenciais inválidas" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ ok: false, error: "credenciais inválidas" });

    // Retorna dados públicos (sem password)
    return res.json({
      ok: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ ok: false, error: "erro interno" });
  }
});

export default router;
