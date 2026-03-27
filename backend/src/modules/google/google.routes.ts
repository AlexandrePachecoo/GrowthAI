import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
  connectGoogle,
  googleCallback,
  googleStatus,
  listCustomers,
  selectCustomer,
  disconnect,
  publish,
} from './google.controller';

const router = Router();

// Rotas protegidas por JWT
router.get('/connect', authMiddleware, connectGoogle);
router.get('/status', authMiddleware, googleStatus);
router.get('/customers', authMiddleware, listCustomers);
router.post('/customer', authMiddleware, selectCustomer);
router.delete('/disconnect', authMiddleware, disconnect);
router.post('/publish', authMiddleware, publish);

// Callback público (chamado pelo Google via redirect)
router.get('/callback', googleCallback);

export default router;
