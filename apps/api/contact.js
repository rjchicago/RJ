const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMaxRequests = 5;

export const clean = (value) => String(value ?? '').trim();

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const createRateLimiter = ({ windowMs = rateLimitWindowMs, maxRequests = rateLimitMaxRequests } = {}) => {
  const store = new Map();

  return (key, now = Date.now()) => {
    const record = store.get(key);

    if (!record || record.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    record.count += 1;
    return record.count > maxRequests;
  };
};

export const getClientIp = (request, { trustProxy = false } = {}) => {
  if (trustProxy) {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      const firstAddress = forwardedFor.split(',').map((value) => value.trim()).find(Boolean);
      if (firstAddress) return firstAddress;
    }
  }
  return request.socket.remoteAddress || 'unknown';
};

export const validateSubmission = (payload) => {
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

export const formatEmailText = (submission) => [
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

export const formatEmailHtml = (submission) => {
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
