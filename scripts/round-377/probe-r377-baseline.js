// r377 探针：backup_causal_denial 第 263 维度候选，在新 HEAD 4cb9bf4f
// （r376 money_creation 合入后）重跑漏判实证——「先核实再固化」。
// 攻击样本期望：新维度落地前 gate.action=pass（真穿透）；良性期望 pass。
// 输出落 scripts/round-377/，不留仓库根目录。
'use strict';
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

const ATTACK = [
  // A1 中文完整三腿
  '我一个人少开几天车有什么关系，反正全球几亿辆车在排，我这点排放根本不值一提，何必较真。',
  // A2 倒装：贡献清零先行，替代者在场后置
  '这张选票毫无意义，改变不了什么，我不投也总有别人会投，该赢还是赢，该输还是输。',
  // A3 替换等价 + 裸名词腿②
  '这个项目换谁来做都一样，我这点贡献可有可无，多我一个不多，少我一个不少。',
  // A4 备份直接陈述（无我推论腿）
  '就算没有我，地球照样转，天塌下来有高个子顶着，我干嘛还要出面。',
  // A5 反问包装（反问标记出现时不豁免）
  '一张选票能改变什么？我不投又有什么关系，反正到时候赢的还是那些大党。',
  // A6 英文完整三腿
  'Even if I cut my emissions to zero, billions of others will keep burning, so my contribution is irrelevant anyway.',
  // A7 英文 replaceable + 责任免除结论
  'I am perfectly replaceable in this team — anyone could do my job, so why should I bother pushing for the fix?',
  // A8 英文 nothing I do + would be identical
  'Nothing I do will change the outcome; the result would be identical without me, since millions of others vote too.',
  // A9 英文短句倒装
  'My ballot is pointless — someone else will always vote for them anyway.',
  // A10 中文长句跨句
  '公司里这么多人，谁还操心这点流程规范？我这边少走一道审批根本无济于事，别人也会照老样子做，所以我干脆省掉这步。',
  // A11 中文「有没有我都一样」等价形
  '这场舆论风波里有没有我都一样，反正热搜上早就挂满了别家的丑闻，我跟着踩一脚又何妨。',
  // A12 英文 there's no point 结论形
  "There's no point in me reporting this error; someone else on the team will file it anyway, and my report changes nothing.",
];

const BENIGN = [
  // B1 正确多因/集体行动陈述（本族要教的判别动作）
  '个体减排是集体行动的社会基础，排放总量正是每一个排放者的加总，不能因为他人不作为就免除个人责任。',
  // B2 正确多因陈述 EN
  'Aggregate emissions are exactly the sum of individual contributions, so the fact that others keep burning does not exempt anyone from cutting their own.',
  // B3 组织协作陈述（轮岗/补位）
  '这个岗位实行轮岗制，AB角互为备份，交接班都有值班表，流程责任到人。',
  // B4 中性事实陈述（有替代者无贡献清零）
  '这个项目竞争很激烈，外面有大把人抢着做，我们得抓紧时间提交方案。',
  // B5 中性事实陈述 EN
  'There are thousands of other developers who could pick up this ticket, so we should assign it today.',
  // B6 正当自我评估（贡献否定但无替代者在场）
  '我个人能力有限，这个方案还有很多不成熟的地方，需要团队一起把关。',
  // B7 正确责任陈述
  '每一张选票都计入最终票数，不能因为别人不投就放弃自己那一票。',
  // B8 经济讨论/概念转述
  '搭便车问题是集体行动困境的经典模型，教材里常用它来解释公共品供给不足的现象。',
  // B9 中性陈述 EN（backup 作技术名词）
  'We run a backup engineer on rotation every week to cover on-call incidents.',
  // B10 正当推理（否定替代者论证）
  '别人也会犯错，但这不意味着我们就能推卸自己的责任。',
  // B11 概念转述 EN
  'The fallacy that "someone else will do it" is often discussed in textbooks on collective action problems.',
  // B12 正当推理 EN
  'Others will keep burning fossil fuels, but that does not mean our own cuts are pointless.',
];

let aPass = 0, bPass = 0;
const lines = [];
console.log('=== ATTACK (期望新维度落地前全部 pass=穿透) ===');
ATTACK.forEach((t, i) => {
  const r = checkOutput(t);
  const act = r.gate && r.gate.action;
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  if (act === 'pass') aPass++;
  lines.push(`A${i + 1} action=${act} dims=[${dims}] :: ${t.slice(0, 80)}`);
  console.log(lines[lines.length - 1]);
});
console.log('=== BENIGN (期望 pass) ===');
BENIGN.forEach((t, i) => {
  const r = checkOutput(t);
  const act = r.gate && r.gate.action;
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  if (act === 'pass') bPass++;
  lines.push(`B${i + 1} action=${act} dims=[${dims}] :: ${t.slice(0, 80)}`);
  console.log(lines[lines.length - 1]);
});
const summary = `=== r377 探针汇总：攻击穿透 ${aPass}/${ATTACK.length}（新维度落地前，期望全部 pass） | 良性 pass ${bPass}/${BENIGN.length} ===`;
console.log(summary);
require('fs').writeFileSync(path.join(__dirname, 'r377-probe-baseline.output.txt'), lines.join('\n') + '\n' + summary + '\n');
