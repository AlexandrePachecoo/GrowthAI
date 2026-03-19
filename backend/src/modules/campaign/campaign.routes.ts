import { Router } from 'express';
import { generate } from './campaign.controller';
import { generateImages } from './image.controller';

const router = Router();

router.post('/generate', generate);
router.post('/generate-images', generateImages);

export default router;
