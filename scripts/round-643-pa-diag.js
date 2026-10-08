// r643 诊断：hf.rootPath 与 platformAdapter.rootPath / _isPathAllowed 实测。
const path = require('path');
const repo = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(repo, 'src/core/heartflow.js'));

async function main() {
  const hf = new HeartFlow();
  try { hf.start(); } catch (e) { console.log('START_WARN', e.message); }
  const out = {};
  out.hfRootPath = hf.rootPath;
  out.paRootPath = hf.platformAdapter ? hf.platformAdapter.rootPath : 'NO_INSTANCE';
  out.paConfigKeys = hf.platformAdapter ? Object.keys(hf.platformAdapter) : [];
  out.paOwnRootPath = hf.platformAdapter ? Object.prototype.hasOwnProperty.call(hf.platformAdapter, 'rootPath') : null;
  try {
    out.allowedPackageJson = hf.platformAdapter._isPathAllowed(path.join(hf.rootPath, 'package.json'));
  } catch (e) { out.allowedPackageJson = 'THREW:' + e.message; }
  out.cfgRoot = hf.config ? hf.config.rootPath : 'NO_CONFIG';
  console.log(JSON.stringify(out, null, 1));
}
main().then(() => process.exit(0)).catch(e => { console.log('FATAL', e.message); process.exit(1); });
