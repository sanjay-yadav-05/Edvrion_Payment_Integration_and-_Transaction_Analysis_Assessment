const clients = new Map(); // key: school_id, value: Set of res objects

export function publishSseForUser(req, res, { school_id }) {
    // setup SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
    });
    res.write('\n');

    const set = clients.get(school_id) || new Set();
    set.add(res);
    clients.set(school_id, set);

    req.on('close', () => {
        set.delete(res);
        if (set.size === 0) clients.delete(school_id);
    });
}

export async function notifySseUpdate(payload) {
    const schoolId = payload.school_id;
    if (!schoolId) return;
    const set = clients.get(schoolId);
    if (!set) return;
    const data = JSON.stringify(payload);
    for (const res of set) {
        try {
            res.write(`event: payment.updated\n`);
            res.write(`data: ${data}\n\n`);
        } catch (e) {
            // ignore broken connections
        }
    }
}

export function sseKeepAlive(server) {
    const keepAliveMs = parseInt(process.env.SSE_KEEP_ALIVE_MS || '15000', 10);
    setInterval(() => {
        for (const [schoolId, set] of clients.entries()) {
            for (const res of set) {
                try {
                    res.write(`:\n\n`); // comment ping to keep connection alive
                } catch (e) { }
            }
        }
    }, keepAliveMs);
}
