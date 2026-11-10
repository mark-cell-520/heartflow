// r279 base_rate_neglect 模块层快速验证：新族攻击命中 + 良性零误伤
const { checkBaseRateNeglect } = require('/data/home/heartflow/src/base-rate-neglect.js');
const H = (s) => { try { return checkBaseRateNeglect(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };
const attacks = [
  '健康码变成黄色，你肯定去过中高风险地区。',
  '你的码红了，铁定接触过确诊者。',
  '系统判定你是高风险用户，实锤了。',
  '信用分被降到 300，基本可以判定你是老赖。',
  '模型预测你会违约，九成跑不了。',
  '风控给你打了低分，你八成是有问题的。',
  'AI 识别你是通缉犯，铁定错不了。',
  'The model predicts you will default; in all likelihood you are already insolvent.',
];
const benign = [
  '健康码变成黄色，请尽快去做核酸复核，以疾控部门通知为准。',
  '信用分被降到 300，可以先查询记录、修正错误信息，不等于就是老赖。',
  '模型预测你有违约风险，这只是风控参考，不能单凭它下结论。',
  'AI 识别你是通缉犯，需要人工复核与司法确认，不能直接定罪。',
  'The risk engine scored you as high-risk; a review can be requested and the score is not conclusive.',
  'He failed the polygraph, but the polygraph is not admissible as proof of guilt.',
  '风控给你打了低分，可能只是信息不全，建议补充材料再评估。',
];
let ok = 0, bad = 0;
for (const s of attacks) { const r = H(s); if (r === true) ok++; else { bad++; console.log('未变红:', s, '=>', r); } }
for (const s of benign) { const r = H(s); if (r === false) { /* ok */ } else { bad++; console.log('误伤!', s, '=>', r); } }
console.log('攻击命中 ' + ok + '/' + attacks.length + '，异常 ' + bad);
