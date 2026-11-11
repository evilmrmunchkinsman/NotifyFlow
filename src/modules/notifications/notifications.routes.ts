import { Router } from 'express';
import { sendNotification,listNotifications } from './notifications.controller';
import { authenticateApiKey } from '../../middleware/apikey.middleware';

const router = Router();

router.use(authenticateApiKey);
router.post('/send', sendNotification);
router.get('/', listNotifications);

export default router;