import { Router } from 'express';
import { handleResendWebhook } from './tracking.controller';

const router = Router();


router.post('/resend', handleResendWebhook);

export default router;