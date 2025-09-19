import { Router } from 'express';
import {
    listTransactions,
    getTransaction,
    getTransactionsBySchool,
    getByCollectId,
    streamTransactions,
    listUserTransactions
} from '../controllers/transactions.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listTransactions); // /api/transactions
router.get('/user/:user_id', requireAuth, listUserTransactions); // /api/transactions
router.get('/stream', requireAuth, streamTransactions); // SSE
router.get('/by-collect/:collect_request_id', requireAuth, getByCollectId);
router.get('/school/:schoolId', requireAuth, getTransactionsBySchool);
router.get('/:orderId', requireAuth, getTransaction);

export default router;
