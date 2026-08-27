
const { checkOutbound } = require('./src/gate-outbound.js');
setTimeout(() => {
  const r = checkOutbound({ text: 'hello world' });
  console.log('checkOutbound(hello):', JSON.stringify(r, null, 2));
  process.exit(0);
}, 2000);
