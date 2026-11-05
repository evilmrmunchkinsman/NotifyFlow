import { Router } from 'express';
import { createNewWorkspace, listWorkspaces, generateApiKey } from './workspaces.controller';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();


router.use(authenticate); 

router.post('/', createNewWorkspace);
router.get('/', listWorkspaces);
router.post('/:workspaceId/keys', generateApiKey);

export default router;