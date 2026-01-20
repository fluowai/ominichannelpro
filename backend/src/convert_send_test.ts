
import fs from 'fs';
try {
  const content = fs.readFileSync('test_send_param_out.txt', 'utf16le');
  fs.writeFileSync('test_send_param_out_utf8.txt', content, 'utf8');
  console.log('Converted');
} catch (e) {
  console.log('Err:', e.message);
}
