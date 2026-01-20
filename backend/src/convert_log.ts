
import fs from 'fs';
try {
  const content = fs.readFileSync('wuzapi_errors.log', 'utf8');
  fs.writeFileSync('wuzapi_errors_utf8.txt', content, 'utf8');
  console.log('Log converted to UTF-8');
} catch (e) {
  console.log('Error reading log');
}
