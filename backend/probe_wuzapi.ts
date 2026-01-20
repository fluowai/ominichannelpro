
import axios from 'axios';
import fs from 'fs';

// Read settings
let config: any = {};
try {
  const content = fs.readFileSync('wuzapi_settings.json', 'utf8');
  config = JSON.parse(content).value;
} catch (e) {
  process.exit(1);
}

const baseUrl = config.apiUrl;
const token = config.userToken;
const testSession = 'probe_test_session';
const logFile = 'probe.log';

function log(msg: string) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

fs.writeFileSync(logFile, ''); // Clear log

const variations = ['', '/api', '/v1', '/instance'];
const endpoints = [
  { method: 'post', path: '/session/start' },
  { method: 'post', path: '/session/status' },
  { method: 'get', path: '/session/list' },
  { method: 'get', path: '/status' },
  { method: 'post', path: '/{session}/start-session' }
];

async function probe() {
  log(`Base URL Configured: ${baseUrl}`);
  
  for (const prefix of variations) {
    let root = baseUrl;
    // Basic sanitization
    if (root.endsWith('/')) root = root.slice(0, -1);
    
    // Add prefix if not already present (simplified logic)
    if (prefix && !root.endsWith(prefix)) {
        root += prefix;
    }

    log(`\n--- Testing Root: ${root} ---`);

    for (const ep of endpoints) {
      const url = root + ep.path.replace('{session}', testSession);
      try {
        log(`Trying ${ep.method.toUpperCase()} ${url}...`);
        const response = await axios({
          method: ep.method,
          url: url,
          headers: { 'token': token },
          timeout: 5000,
          validateStatus: () => true 
        });

        log(`   -> Status: ${response.status}`);
        if (response.data) {
           log(`   -> Body: ${JSON.stringify(response.data).slice(0, 200)}`); // Start of body
        }
      } catch (error: any) {
        log(`   -> Network Error: ${error.message}`);
      }
    }
  }
}

probe();
