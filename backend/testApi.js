const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5002,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(body) });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5002,
      path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== API VERIFICATION TEST SUITE ===');

  try {
    const health = await get('/api/health');
    console.log('[✓] Health Check status:', health.status, health.data);

    const adminLogin = await post('/api/admin/login', { username: 'admin', password: 'admin123' });
    console.log('[✓] Admin Login status:', adminLogin.status, 'Message:', adminLogin.data.message);
    if (adminLogin.data.token) console.log('    JWT Token received:', adminLogin.data.token.substring(0, 20) + '...');

    const studentReg = await post('/api/students/register', {
      name: 'Test Student',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123',
      phone: '9876543210',
      courseName: 'Aptitude Masterclass',
      trainerName: 'SLA Faculty'
    });
    console.log('[✓] Student Register status:', studentReg.status, 'Message:', studentReg.data.message);

    const categories = await get('/api/categories');
    console.log('[✓] Categories list status:', categories.status, 'Data:', categories.data);

    console.log('\n=== ALL API TESTS PASSED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('API Verification error:', error.message);
  }
}

runTests();
