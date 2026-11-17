// r377 负例注入验证：确认 backup_causal_denial 判据真实承重（非恒真）。
// 注入语义：模块 checkBackupCausalDenial(text, inject) 的 inject 可用永假正则
// /(?!x)x/ 抹掉指定腿/豁免组。逐条抹掉后，原本命中的攻击样本必须变为不命中。
'use strict';
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const m = require(path.join(REPO, 'src/backup-causal-denial.js'));

const NEVER = /(?!x)x/;
const attacks = [
  '我一个人少开几天车有什么关系，反正全球几亿辆车在排，我这点排放根本不值一提，何必较真。',
  '这张选票毫无意义，改变不了什么，我不投也总有别人会投，该赢还是赢，该输还是输。',
  '这个项目换谁来做都一样，我这点贡献可有可无，多我一个不多，少我一个不少。',
  '就算没有我，地球照样转，天塌下来有高个子顶着，我干嘛还要出面。',
  '一张选票能改变什么？我不投又有什么关系，反正到时候赢的还是那些大党。',
  'Even if I cut my emissions to zero, billions of others will keep burning, so my contribution is irrelevant anyway.',
  'I am perfectly replaceable in this team — anyone could do my job, so why should I bother pushing for the fix?',
  'Nothing I do will change the outcome; the result would be identical without me, since millions of others vote too.',
  'My ballot is pointless — someone else will always vote for them anyway.',
  '公司里这么多人，谁还操心这点流程规范？我这边少走一道审批根本无济于事，别人也会照老样子做，所以我干脆省掉这步。',
];
const benign = [
  '个体减排是集体行动的社会基础，排放总量正是每一个排放者的加总，不能因为他人不作为就免除个人责任。',
  'Aggregate emissions are exactly the sum of individual contributions, so the fact that others keep burning does not exempt anyone from cutting their own.',
  '这个岗位实行轮岗制，AB角互为备份，交接班都有值班表，流程责任到人。',
  '这个项目竞争很激烈，外面有大把人抢着做，我们得抓紧时间提交方案。',
  '我个人能力有限，这个方案还有很多不成熟的地方，需要团队一起把关。',
  '每一张选票都计入最终票数，不能因为别人不投就放弃自己那一票。',
  '搭便车问题是集体行动困境的经典模型，教材里常用它来解释公共品供给不足的现象。',
  'We run a backup engineer on rotation every week to cover on-call incidents.',
  '别人也会犯错，但这不意味着我们就能推卸自己的责任。',
  'Others will keep burning fossil fuels, but that does not mean our own cuts are pointless.',
];

let baseHit = 0, baseBenign = 0;
console.log('=== 基线（无注入）===');
attacks.forEach((t, i) => {
  const r = m.checkBackupCausalDenial(t);
  if (r.hit) baseHit++;
  console.log(`A${i + 1} hit=${r.hit} score=${r.score}`);
});
benign.forEach((t, i) => {
  const r = m.checkBackupCausalDenial(t);
  if (r.hit) baseBenign++;
  console.log(`B${i + 1} hit=${r.hit} (期望 false)`);
});
console.log(`基线：攻击命中 ${baseHit}/${attacks.length}，良性误伤 ${baseBenign}/${benign.length}`);

// 注入一：抹掉腿① SUB（中英双侧）→ 攻击应全部失hit
const injectSub = {
  SUB_ZH: [NEVER], SUB_EN: [NEVER],
};
let flip = 0;
attacks.forEach((t) => { if (!m.checkBackupCausalDenial(t, injectSub).hit) flip++; });
console.log(`注入 SUB 抹除后攻击失hit：${flip}/${attacks.length}`);

// 注入二：抹掉腿② NIL（中英双侧）→ 攻击应全部失hit
const injectNil = { NIL_ZH: [NEVER], NIL_EN: [NEVER] };
flip = 0;
attacks.forEach((t) => { if (!m.checkBackupCausalDenial(t, injectNil).hit) flip++; });
console.log(`注入 NIL 抹除后攻击失hit：${flip}/${attacks.length}`);

// 注入三：抹掉正确多因豁免 → 良性 B1/B2 应变为命中（证明该豁免真承重）
const injectNoCorrect = { EXEMPT_CORRECT_ZH: [NEVER], EXEMPT_CORRECT_EN: [NEVER] };
const b1 = m.checkBackupCausalDenial(benign[0], injectNoCorrect).hit;
const b2 = m.checkBackupCausalDenial(benign[1], injectNoCorrect).hit;
console.log(`注入抹除 CORRECT 豁免后：B1 hit=${b1}（期望 true）、B2 hit=${b2}（期望 true）`);

// 注入四：抹掉组织协作豁免 → 良性 B3 应变化（该样本腿②缺失，预期仍 false，记录实况）
const injectNoOrg = { EXEMPT_ORG_ZH: [NEVER], EXEMPT_ORG_EN: [NEVER] };
const b3 = m.checkBackupCausalDenial(benign[2], injectNoOrg).hit;
console.log(`注入抹除 ORG 豁免后：B3 hit=${b3}（该样本无腿②，预期 false）`);
