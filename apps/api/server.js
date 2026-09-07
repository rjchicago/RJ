import http from 'node:http';
import {
  createRateLimiter,
  formatEmailHtml,
  formatEmailText,
  getClientIp,
  validateSubmission,
} from './contact.js';

const PORT = Number(process.env.PORT || 3001);
const MAX_BODY_BYTES = 16 * 1024;
const RESEND_API_URL = 'https://api.resend.com/emails';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'rjchicago.llc@gmail.com';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'RJChicago <onboarding@resend.dev>';

const trustProxy = process.env.TRUST_PROXY === 'true';
const isRateLimited = createRateLimiter();

const jsonResponse = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
};

const handleConfig = (response) => jsonResponse(response, 200, {
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || process.env.VITE_TURNSTILE_SITE_KEY || '',
  turnstileRequired: Boolean(process.env.TURNSTILE_SECRET_KEY),
});

const readRequestBody = (request) => new Promise((resolve, reject) => {
  let body = '';

  request.on('data', (chunk) => {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      reject(new Error('Payload too large'));
      request.destroy();
    }
  });

  request.on('end', () => {
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch {
      reject(new Error('Invalid JSON'));
    }
  });

  request.on('error', reject);
});

const verifyTurnstile = async ({ token, ip }) => {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return { success: true };
  }

  if (!token) {
    return { success: false };
  }

  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    return { success: false };
  }

  return response.json();
};

const sendEmail = async (submission) => {
  const required = ['RESEND_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const subjectType = submission.inquiryType || 'Contact';
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      reply_to: submission.email,
      subject: `RJChicago inquiry: ${subjectType}`,
      text: formatEmailText(submission),
      html: formatEmailHtml(submission),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${body}`);
  }
};

const handleContact = async (request, response) => {
  const ip = getClientIp(request, { trustProxy });

  if (isRateLimited(ip)) {
    return jsonResponse(response, 429, { error: 'Please wait before sending another message.' });
  }

  let payload;
  try {
    payload = await readRequestBody(request);
  } catch {
    return jsonResponse(response, 400, { error: 'Invalid request.' });
  }

  const { submission, errors } = validateSubmission(payload);
  if (errors.length > 0) {
    return jsonResponse(response, 400, { error: 'Please check the form and try again.', details: errors });
  }

  try {
    const captcha = await verifyTurnstile({ token: submission.captchaToken, ip });
    if (!captcha.success) {
      return jsonResponse(response, 400, { error: 'Captcha verification failed.' });
    }

    await sendEmail(submission);
    return jsonResponse(response, 200, { ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(response, 500, { error: 'Unable to send your message right now.' });
  }
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/health') {
    return jsonResponse(response, 200, { ok: true });
  }

  if (request.method === 'GET' && url.pathname === '/api/config') {
    return handleConfig(response);
  }

  if (request.method === 'POST' && url.pathname === '/api/contact') {
    return handleContact(request, response);
  }

  if (request.method === 'OPTIONS' && url.pathname === '/api/contact') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': request.headers.origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return response.end();
  }

  return jsonResponse(response, 404, { error: 'Not found.' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Contact API listening on ${PORT}`);
});
