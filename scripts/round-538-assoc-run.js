// r538: 实测 AssociativeEngine 修复后能否实例化 + 五层管线能否真跑
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ae = require(path.join(ROOT, 'src/archive/associative-engine.js'));
console.log('导出面:', Object.keys(ae));

(async () => {
  const Ctor = ae.AssociativeEngine || ae.default || (typeof ae === 'function' ? ae : null);
  if (!Ctor) { console.log('❌ 找不到 AssociativeEngine 构造器', typeof ae); return; }
  try {
    const eng = new Ctor(ROOT);
    console.log('✅ 实例化成功');
    console.log('  lexicalAssociator =', !!eng.lexicalAssociator, eng.lexicalAssociator?.constructor?.name);
    console.log('  chunkDetector     =', !!eng.chunkDetector, eng.chunkDetector?.constructor?.name);
    console.log('  narrativeRetriever=', !!eng.narrativeRetriever, eng.narrativeRetriever?.constructor?.name);
    console.log('  semanticConverger =', !!eng.semanticConverger, eng.semanticConverger?.constructor?.name);
    console.log('  wordByWordGenerator=', !!eng.wordByWordGenerator, eng.wordByWordGenerator?.constructor?.name);

    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(eng)).filter(m => m !== 'constructor');
    console.log('  原型方法数 =', methods.length);
    console.log('  ', methods.slice(0, 20).join(', '));

    // 找一个主入口
    const main = eng.process ? 'process' : (eng.understand ? 'understand' : (eng.run ? 'run' : null));
    console.log('  主入口候选 =', main || '(未自动识别)');
    if (main) {
      try {
        const t0 = Date.now();
        const out = await eng[main]('我今天很累，想休息一下');
        console.log('  ✅ ' + main + '() 跑通，耗时 ' + (Date.now() - t0) + 'ms');
        console.log('     返回键 =', out && typeof out === 'object' ? Object.keys(out).slice(0, 12).join(',') : typeof out);
        console.log('     status =', out?.status, '| successfulProcessed =', eng.successfulProcessed);
      } catch (e) {
        console.log('  ⚠️ ' + main + '() 抛错:', e.message);
      }
    }
  } catch (e) {
    console.log('❌ 实例化失败:', e.message);
  }
})();
