import { Router } from 'express';
import { sendNotification } from './notifications.controller';
import { authenticateApiKey } from '../../middleware/apikey.middleware';

const router = Router();

router.use(authenticateApiKey);
router.post('/send', sendNotification);

export default router;