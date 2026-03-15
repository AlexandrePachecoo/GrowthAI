import { Router } from 'express';
import { generate } from './campaign.controller';

const router = Router();

router.post('/generate', generate);

export default router;
