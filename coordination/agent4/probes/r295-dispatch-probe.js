// r295 探针 2：引擎 think 路径真 dispatch（hook + think-pipeline 消费者）
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({});
  hf.start();
  console.log('1. 插件已加载:', typeof hf._econReasoningAnalyzer === 'function');
  console.log('2. hookBus 存在:', !!hf._hookBus);

  // 真实 runThinkPipeline：合成 result，走完整后置钩子 + 消费者
  const { runThinkPipeline } = require(path.join(ROOT, 'src/core/think-pipeline.js'));
  const attack = '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。';
  const result = { output: { conclusion: attack, warnings: [] }, confidence: 0.8, type: 'test' };
  await runThinkPipeline(result, '帮我看下这个谈判过程有没有问题', hf);
  console.log('3. _discrimination.econReasoning:', JSON.stringify(result._discrimination && result._discrimination.econReasoning ? {
    score: result._discrimination.econReasoning.score,
    totalHits: result._discrimination.econReasoning.totalHits,
    keys: result._discrimination.econReasoning.families.map(f => f.key),
  } : null));
  console.log('4. _confidencePenalty:', result._confidencePenalty);
  console.log('5. warnings:', JSON.stringify(result.output.warnings));

  // 良性结论：不得触发
  const clean = { output: { conclusion: '根据成本加成定价，这批货的出厂价是每件三十七块五，含原材料、人工和合理利润。', warnings: [] }, confidence: 0.8, type: 'test' };
  await runThinkPipeline(clean, '这个定价合理吗', hf);
  console.log('6. 良性 _discrimination.econReasoning:', clean._discrimination && clean._discrimination.econReasoning ? 'HIT(不该)' : 'null(正确)');
  console.log('7. 良性 _confidencePenalty:', clean._confidencePenalty);

  // HEAD 对照：把插件目录临时改名后同输入应零 dispatch（在探针外做，这里只报当前态）
  process.exit(0);
})().catch(e => { console.error('PROBE ERROR:', e.message); process.exit(1); });
