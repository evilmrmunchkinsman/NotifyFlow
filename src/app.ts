import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import workspaceRoutes from './modules/workspaces/workspaces.routes'; // <-- ADD THIS

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes); // <-- ADD THIS

export default app;