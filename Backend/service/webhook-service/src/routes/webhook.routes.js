import { Router } from 'express';
import { handleWebhook } from '../controllers/webhook.controller.js';

const router = Router();

// Provider will POST here. Keep public, but Kong should protect via IP whitelist or signature plugin
router.post('', handleWebhook);

export default router;
