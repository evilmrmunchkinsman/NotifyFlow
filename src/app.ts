import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';


const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
prisma.user.findMany().then((users) => {
  console.log(`[db] Database connected. Current users: ${users.length}`);
});

export default app;