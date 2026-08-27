
const { checkOutbound } = require('./src/gate-outbound.js');
console.log('checkOutbound type:', typeof checkOutbound);
setTimeout(() => {
  const r = checkOutbound({ text: '13812345678' });
  console.log('phone:', JSON.stringify(r));
  const r2 = checkOutbound({ text: 'hello' });
  console.log('hello:', JSON.stringify(r2));
  process.exit(0);
}, 2000);
