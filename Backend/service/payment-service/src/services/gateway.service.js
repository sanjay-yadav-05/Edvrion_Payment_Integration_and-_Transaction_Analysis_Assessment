import jwt from 'jsonwebtoken';
const { sign: _sign, verify, decode } = jwt;

import axios from 'axios';
const { post, get } = axios;


function createPgSign({ school_id, amount, callback_url }) {
  const payload = {
    school_id: String(school_id),
    amount: String(amount),
    callback_url
  };
  const secret = process.env.PG_SECRET;
  if (!secret) throw new Error('PG_SECRET not configured');
  return _sign(payload, secret, { algorithm: 'HS256' });
}

/**
 * Call provider to create collect request
 * Returns provider response (expected: { collect_request_id, Collect_request_url, sign })
 */
async function createCollectRequest({ school_id, amount, callback_url }) {
  const sign = createPgSign({ school_id, amount, callback_url });
  const body = { school_id, amount: String(amount), callback_url, sign };

  const apiKey = process.env.PG_API_KEY;
  if (!apiKey) throw new Error('PG_API_KEY not configured');

  const res = await post('https://dev-vanilla.edviron.com/erp/create-collect-request', body, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 15000
  });

  return res.data;
}

/**
 * Check collect request status on provider (optional helper)
 */
async function checkCollectRequest({ collect_request_id, school_id }) {
  const payload = { collect_request_id: String(collect_request_id), school_id: String(school_id) };
  const sign = _sign(payload, process.env.PG_SECRET, { algorithm: 'HS256' });
  const apiKey = process.env.PG_API_KEY;
  const url = `https://dev-vanilla.edviron.com/erp/collect-request/${collect_request_id}?school_id=${encodeURIComponent(school_id)}&sign=${encodeURIComponent(sign)}`;
  const res = await get(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 10000
  });
  return res.data;
}

export default { createPgSign, createCollectRequest, checkCollectRequest };
