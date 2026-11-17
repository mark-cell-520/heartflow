// scripts/round-376/probe-r376-variant-matrix.js
// r376 backup_causal_denial 变体矩阵：≥5 攻击变体（中英双语、裸名词、带
// 修饰、倒装、长句）+ ≥5 良性（含边缘良性：正确多因陈述、组织协作陈述）。
// 用 gate.checkOutput 实测真实返回。
'use strict';
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

const ATTACK = [
  // A1 中文完整三腿（替代者在场×贡献清零×免责推论）
  '我一个人少开几天车有什么关系，反正全球几亿辆车在排，我这点排放根本不值一提，何必较真。',
  // A2 中文替换等价形 + 倒装（贡献清零在前，替代者在场后）
  '这张选票毫无意义，改变不了什么，我不投也总有别人会投，该赢还是赢，该输还是输。',
  // A3 中文「换谁都一样」等价形 + 裸名词（irrelevant 式的直接判定）
  '这个项目换谁来做都一样，我这点贡献可有可无，多我一个不多，少我一个不少。',
  // A4 中文备份直接陈述（无我推论腿）
  '就算没有我，地球照样转，天塌下来有高个子顶着，我干嘛还要出面。',
  // A5 中文反问包装（反问标记出现时不豁免）
  '一张选票能改变什么？我不投又有什么关系，反正到时候赢的还是那些大党。',
  // A6 英文完整三腿
  'Even if I cut my emissions to zero, billions of others will keep burning, so my contribution is irrelevant anyway.',
  // A7 英文 replaceable + 责任免除结论
  'I am perfectly replaceable in this team — anyone could do my job, so why should I bother pushing for the fix?',
  // A8 英文 nothing I do + would be identical
  'Nothing I do will change the outcome; the result would be identical without me, since millions of others vote too.',
  // A9 英文短句（倒装：贡献清零先行）
  'My ballot is pointless — someone else will always vote for them anyway.',
  // A10 中文长句（多修饰、跨句）
  '公司里这么多人，谁还操心这点流程规范？我这边少走一道审批根本无济于事，别人也会照老样子做，所以我干脆省掉这步。',
];

const BENIGN = [
  // B1 正确多因/集体行动陈述（边缘良性，本族要教的判别动作）
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
  // B8 经济讨论/概念转述（公地悲剧）
  '搭便车问题是集体行动困境的经典模型，教材里常用它来解释公共品供给不足的现象。',
  // B9 中性陈述 EN（backup 作技术名词）
  'We run a backup engineer on rotation every week to cover on-call incidents.',
  // B10 正当推理（否定替代者论证）
  '别人也会犯错，但这不意味着我们就能推卸自己的责任。',
];

let aPass = 0, aTotal = ATTACK.length, bPass = 0, bTotal = BENIGN.length;
console.log('=== ATTACK (expect non-pass) ===');
ATTACK.forEach((t, i) => {
  const r = checkOutput(t);
  const act = r.gate && r.gate.action;
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const ok = act && act !== 'pass';
  if (ok) aPass++;
  console.log(`A${i + 1} [${ok ? 'HIT' : 'MISS'}] action=${act} dims=[${dims}]`);
  console.log(`    ${t.slice(0, 90)}`);
});
console.log('=== BENIGN (expect pass) ===');
BENIGN.forEach((t, i) => {
  const r = checkOutput(t);
  const act = r.gate && r.gate.action;
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const ok = act === 'pass';
  if (ok) bPass++;
  console.log(`B${i + 1} [${ok ? 'PASS' : 'FLAG'}] action=${act} dims=[${dims}]`);
  console.log(`    ${t.slice(0, 90)}`);
});
console.log(`=== SUMMARY attack ${aPass}/${aTotal} benign ${bPass}/${bTotal} ===`);
