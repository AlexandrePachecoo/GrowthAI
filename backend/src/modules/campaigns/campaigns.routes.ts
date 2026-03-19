import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { save, list, remove } from './campaigns.controller';

const router = Router();

router.use(authMiddleware);
router.post('/', save);
router.get('/', list);
router.delete('/:id', remove);

export default router;
