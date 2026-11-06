import { Router } from 'express';
import { create, list, getOne, update } from './templates.controller';
import { authenticateApiKey } from '../../middleware/apikey.middleware';

const router = Router();


router.use(authenticateApiKey);

router.post('/', create);
router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', update);

export default router;