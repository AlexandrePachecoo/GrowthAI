import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
  connectMeta,
  metaCallback,
  metaStatus,
  listAdAccounts,
  listPages,
  selectAdAccount,
  disconnect,
  publish,
} from './meta.controller';

const router = Router();

// Rotas protegidas por JWT
router.get('/connect', authMiddleware, connectMeta);
router.get('/status', authMiddleware, metaStatus);
router.get('/ad-accounts', authMiddleware, listAdAccounts);
router.get('/pages', authMiddleware, listPages);
router.post('/ad-account', authMiddleware, selectAdAccount);
router.delete('/disconnect', authMiddleware, disconnect);

// Callback público (chamado pelo Meta via redirect)
router.get('/callback', metaCallback);

// Publicação de anúncio
router.post('/publish', authMiddleware, publish);

export default router;
