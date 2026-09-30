const { HeartFlow } = require('../../src/core/heartflow.js');
const path = require('path');
const hf = new HeartFlow({ dataDir: path.join(__dirname, '..', '..', 'data'), silent: true });
hf.start();
setTimeout(() => { console.log('ROUTES=' + HeartFlow.ALLOWED_ROUTES.size); process.exit(0); }, 4000);
