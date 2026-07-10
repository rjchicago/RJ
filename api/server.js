import http from 'node:http';

const PORT = Number(process.env.PORT || 3001);
const MAX_BODY_BYTES = 16 * 1024;
const RESEND_API_URL = 'https://api.resend.com/emails';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'rjchicago.llc@gmail.com';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'RJChicago <onboarding@resend.dev>';

const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMaxRequests = 5;
const rateLimitStore = new Map();

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

const clean = (value) => String(value ?? '').trim();

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getClientIp = (request) => {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.socket.remoteAddress || 'unknown';
};

const isRateLimited = (ip) => {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }

  record.count += 1;
  return record.count > rateLimitMaxRequests;
};

const validateSubmission = (payload) => {
  const submission = {
    name: clean(payload.name),
    email: clean(payload.email),
    organization: clean(payload.organization),
    inquiryType: clean(payload.inquiryType),
    timeframe: clean(payload.timeframe),
    audience: clean(payload.audience),
    message: clean(payload.message),
    source: clean(payload.source),
    captchaToken: clean(payload.captchaToken),
    website: clean(payload.website),
  };

  const errors = [];

  if (submission.website) errors.push('Invalid submission.');
  if (submission.name.length < 2 || submission.name.length > 120) errors.push('Name is required.');
  if (!isEmail(submission.email) || submission.email.length > 180) errors.push('A valid email is required.');
  if (submission.message.length < 20 || submission.message.length > 3000) errors.push('Message must be between 20 and 3000 characters.');
  if (submission.organization.length > 160) errors.push('Organization is too long.');
  if (submission.timeframe.length > 120) errors.push('Timeframe is too long.');
  if (submission.audience.length > 120) errors.push('Audience is too long.');
  if (submission.source.length > 180) errors.push('Source is too long.');

  return { submission, errors };
};

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

const formatEmailText = (submission) => [
  `Name: ${submission.name}`,
  `Email: ${submission.email}`,
  `Organization: ${submission.organization || 'Not provided'}`,
  `Inquiry type: ${submission.inquiryType || 'Not provided'}`,
  `Timeframe: ${submission.timeframe || 'Not provided'}`,
  `Audience: ${submission.audience || 'Not provided'}`,
  `Source: ${submission.source || 'Not provided'}`,
  '',
  submission.message,
].join('\n');

const formatEmailHtml = (submission) => {
  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const rows = [
    ['Name', submission.name],
    ['Email', submission.email],
    ['Organization', submission.organization || 'Not provided'],
    ['Inquiry type', submission.inquiryType || 'Not provided'],
    ['Timeframe', submission.timeframe || 'Not provided'],
    ['Audience', submission.audience || 'Not provided'],
    ['Source', submission.source || 'Not provided'],
  ];

  return `
    <h1>New RJChicago inquiry</h1>
    <table cellpadding="6" cellspacing="0">
      ${rows.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('')}
    </table>
    <h2>Message</h2>
    <p>${escapeHtml(submission.message).replaceAll('\n', '<br>')}</p>
  `;
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
  const ip = getClientIp(request);

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
