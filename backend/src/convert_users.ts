
import fs from 'fs';
try {
  const content = fs.readFileSync('users_full_list.json', 'utf16le');
  fs.writeFileSync('users_full_list_utf8.json', content, 'utf8');
  console.log('Converted');
} catch (e) {
  console.log('Err:', e.message);
}
