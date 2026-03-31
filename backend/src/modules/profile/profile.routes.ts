import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { me, updateProfileName, changeEmail, changePassword } from './profile.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', me);
router.put('/name', updateProfileName);
router.post('/change-email', changeEmail);
router.post('/change-password', changePassword);

export default router;
