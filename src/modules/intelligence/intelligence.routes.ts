import { Router } from 'express';
import { analyzeWorkspace } from './intelligence.controller';
import { authenticate } from '../../middleware/auth.middleware'; // User JWT

const router = Router();


router.use(authenticate);

router.get('/analyze/:workspaceId', analyzeWorkspace);

export default router;