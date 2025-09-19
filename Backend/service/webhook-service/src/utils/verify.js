import crypto from 'crypto';

export function verifyHmacSignature(rawBodyBuffer, signatureHeader, secret) {
    if (!signatureHeader || !secret) return false;
    // provider may send signature like: sha256=hex
    // Accept plain hex or prefixed
    const expected = crypto.createHmac('sha256', secret).update(rawBodyBuffer).digest('hex');
    // compare safely
    const provided = signatureHeader.includes('=') ? signatureHeader.split('=')[1] : signatureHeader;
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
}
