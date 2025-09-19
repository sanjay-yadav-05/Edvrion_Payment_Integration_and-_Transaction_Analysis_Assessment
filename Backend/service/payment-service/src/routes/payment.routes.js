import { Router } from 'express';
import { createPayment, checkStatus } from '../controllers/payment.controller.js';
import requireAuth from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/create-payment', requireAuth, createPayment);
router.get('/check-status/:collect_request_id', checkStatus);
// router.get('/check-status/:collect_request_id', requireAuth, checkStatus);

// this is a testing route without jwt
// router.post('/create-payment', createPayment);
// router.get('/check-status/:collect_request_id', checkStatus);

export default router;
