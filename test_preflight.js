
const { preflightCheck, checkOutbound } = require('./src/safe-fetch.js');
(async () => {
  console.log('preflightCheck type:', typeof preflightCheck);
  const r = await preflightCheck('hello');
  console.log('preflight(hello):', JSON.stringify(r));
  const r2 = await preflightCheck('13812345678');
  console.log('preflight(phone):', JSON.stringify(r2));
  const r3 = await preflightCheck('合同金额 500万元');
  console.log('preflight(contract):', JSON.stringify(r3));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
