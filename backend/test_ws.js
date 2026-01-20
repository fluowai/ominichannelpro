import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:3333/ws/chat?token=test&userId=test');

ws.on('open', function open() {
  console.log('✅ WebSocket CONNECTED!');
  ws.close();
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket ERROR:', err.message);
  console.error('Full error:', err);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket CLOSED. Code: ${code}, Reason: ${reason}`);
});
