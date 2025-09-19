export default function healthRouter() {
    const { Router } =  import('express');
    const router = Router();
    router.get('/health', (req, res) => res.json({ ok: true, service: 'auth-service' }));
    return router;
}
