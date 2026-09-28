// 第 188 轮：复测「不连生产库」的否定结构是否踩中生产词
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const de = require(path.join(ROOT, 'src/dev-exemptions.js'));

const Q = [
  '单元测试不连生产库，只在内存库里 delete from all tables',
  '不连生产库，只在内存库里 delete from all tables',
  '测试库不连生产，本地内存库 delete from all tables',
  '内存库 delete from all tables',
  '本地单元测试的内存库 delete from all tables',
];
for (const s of Q) {
  const pm = de.PROD_CONTEXT.exec(s);
  console.log(JSON.stringify({
    s,
    prodMatch: pm ? pm[0] : null,
    prodIdx: pm ? pm.index : -1,
    devCtx: de.DEV_CONTEXT.test(s),
    isDev: de.isDevDebugContext(s),
  }));
}
