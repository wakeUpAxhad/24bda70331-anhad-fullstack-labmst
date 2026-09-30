const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const host = '127.0.0.1';
const port = Number(process.env.PORT) || 8080;
const root = __dirname;
const dataDir = path.join(root, 'data');
const dataFile = path.join(dataDir, 'consultations.json');
const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/branding.css', ['branding.css', 'text/css; charset=utf-8']],
  ['/script.js', ['script.js', 'text/javascript; charset=utf-8']],
  ['/doctors.css', ['doctors.css', 'text/css; charset=utf-8']],
  ['/receipt', ['receipt.html', 'text/html; charset=utf-8']],
  ['/receipt.html', ['receipt.html', 'text/html; charset=utf-8']],
  ['/receipt.css', ['receipt.css', 'text/css; charset=utf-8']],
  ['/receipt.js', ['receipt.js', 'text/javascript; charset=utf-8']]
]);
let writeQueue = Promise.resolve();
const doctors = {
  'maya-patel': { name: 'Dr. Maya Patel', specialty: 'Family medicine' },
  'arjun-mehta': { name: 'Dr. Arjun Mehta', specialty: 'Internal medicine' },
  'leena-shah': { name: 'Dr. Leena Shah', specialty: 'Wellbeing' }
};

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(body));
}

function readRequest(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16_384) {
        reject(Object.assign(new Error('Request is too large.'), { status: 413 }));
        request.destroy();
      }
    });
    request.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(Object.assign(new Error('Please submit a valid request.'), { status: 400 })); }
    });
    request.on('error', reject);
  });
}

function validate(input) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  const doctor = doctors[input.doctor];
  if (name.length < 2 || name.length > 100) return 'Please enter a name between 2 and 100 characters.';
  if (!/^\+?[0-9 ()().-]{7,20}$/.test(phone)) return 'Please enter a valid phone number.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  if (!doctor) return 'Please choose one of the listed clinicians.';
  if (reason.length < 5 || reason.length > 3000) return 'Please describe your reason in 5 to 3,000 characters.';
  return { name, phone, email, doctor, reason };
}

async function readRecords() {
  try {
    const records = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    return Array.isArray(records) ? records : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function saveRecord(record) {
  const operation = writeQueue.then(async () => {
    const records = await readRecords();
    records.push(record);
    await fs.mkdir(dataDir, { recursive: true });
    const tempFile = `${dataFile}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(tempFile, `${JSON.stringify(records, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(tempFile, dataFile);
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${host}:${port}`);
    if (url.pathname === '/healthz' && request.method === 'GET') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      return response.end('ok');
    }
    if (url.pathname === '/api/consultations' && request.method === 'POST') {
      if (!request.headers['content-type']?.includes('application/json')) {
        return sendJson(response, 415, { error: 'Please submit the form as JSON.' });
      }
      const result = validate(await readRequest(request));
      if (typeof result === 'string') return sendJson(response, 400, { error: result });
      const createdAt = new Date().toISOString();
      const requestId = `HCS-${createdAt.slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
      const record = { id: requestId, ...result, createdAt };
      await saveRecord(record);
      return sendJson(response, 201, { id: record.id, name: record.name, doctor: record.doctor, createdAt: record.createdAt });
    }
    if (url.pathname.startsWith('/api/')) return sendJson(response, 404, { error: 'Not found.' });
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      response.writeHead(302, { Location: '/' });
      return response.end();
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return sendJson(response, 405, { error: 'Method not allowed.' });
    }
    const file = staticFiles.get(url.pathname);
    if (!file) return sendJson(response, 404, { error: 'Not found.' });
    const content = await fs.readFile(path.join(root, file[0]));
    response.writeHead(200, {
      'Content-Type': file[1],
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    if (!response.headersSent) sendJson(response, error.status || 500, { error: error.status ? error.message : 'The request could not be completed.' });
  }
});

server.listen(port, host, () => {
  console.log(`Healthcare Consultation System is running at http://${host}:${port}`);
  console.log('Consultation requests are saved locally in data/consultations.json.');
});
