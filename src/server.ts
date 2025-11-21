import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import prisma from "./lib/prisma";

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", (req, res) => res.send({ ok: true }));

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // optional: verifica se IdSequence existe, se não inicializa
  try {
    const seq = await prisma.idSequence.findUnique({ where: { name: "user_id" } });
    if (!seq) {
      await prisma.idSequence.create({ data: { name: "user_id", last_id: -1 } });
      console.log("IdSequence inicializada com last_id = -1");
    }
  } catch (e) {
    console.error("Erro ao checar/inicializar IdSequence:", e);
  }
});
