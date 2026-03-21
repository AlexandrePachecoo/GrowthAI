import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { save, list, remove, addCreative } from './campaigns.controller';

const router = Router();

router.use(authMiddleware);
router.post('/', save);
router.get('/', list);
router.delete('/:id', remove);
router.post('/:id/creative', addCreative);

export default router;
