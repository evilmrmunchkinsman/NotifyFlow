import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import workspaceRoutes from './modules/workspaces/workspaces.routes';
import templateRoutes from './modules/templates/templates.routes'; 
import notificationRoutes from './modules/notifications/notifications.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/templates', templateRoutes); 
app.use('/api/notifications', notificationRoutes);

export default app;