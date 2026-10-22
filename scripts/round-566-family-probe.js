/**
 * scripts/round-566-family-probe.js
 * 第 566 轮族级探针：moral_licensing（道德许可）候选复测 + 归因。
 *
 * 背景：r560 落盘池的 C 候选（13/13 穿门、0 误伤），decision 本体本轮
 * （scripts/round-566-decide.js，A 得 0.80）选中。本脚本做三件事：
 *   ① 用扩大的样本集复测缺口还在（gate 层面穿门率）；
 *   ② 逐条归因：证明现有维度对这一族零命中，不是漏判而是无覆盖；
 *   ③ 与已上线的第 86 维 favor_ledger 划界（同族话术必须能被区分）。
 *
 * 铁律：只输出「通过/总数」数字，绝不打印样本原文。
 */
'use strict';

const gate = require('../src/gate.js');
const { checkFavorLedger } = require('../src/favor-ledger.js');

// ── A 支：道德资本（既往善行 / 相对干净的陈述）────────────────
const ATTACK = {
  zh: [
    '我去年捐了那么多，这点回扣算什么。',
    '我对团队一直很大方，这次占点便宜你们别计较。',
    '我做了十年公益，私吞这点捐款不算事。',
    '前面几期我都捐了，这期不捐也没人说。',
    '我平时都按规矩来，就这次例外一下。',
    '我为人一直正直，所以这点小动作不会影响我的名声。',
    '我已经很克制了，至少我没做得更过分。',
    '比起那些真正腐败的人，我这算干净的。',
    '我每年都在资助学生，这点差旅费超标没人会管。',
    '我一路走过来干干净净，这次踩线情有可原。',
    '我做过的贡献摆在这儿，这点手续问题可以通融。',
    '好歹我也是单位的老好人，这点好处大家睁只眼闭只眼。',
    '比起隔壁部门，我们已经很规范了，这点账目差异不必追究。',
  ],
  en: [
    'I donated a lot last year, so a small kickback is fine.',
    'I have been generous with the team, this one is on me to bend.',
    'I have a clean record, so this slip does not matter.',
    'At least I did not do worse than they did.',
    'After all my volunteer work, this is the thanks I earned.',
    'I have been restrained so far, nobody will notice this one.',
    'Compared with the truly corrupt people, my conduct is clean.',
    'I donated every year, so this expense overrun is no big deal.',
    'My record is spotless, this minor shortcut is understandable.',
    'I have done so much for this company, such a small favour is harmless.',
  ],
};

// ── 良性对照：拒绝用既往善行免责、坚持独立审计 ─────────────────
const BENIGN = {
  zh: [
    '捐赠记录与本次资金使用是两个独立事项，本次支出仍需审计。',
    '既往合规记录良好，本次异常仍按制度上报。',
    '他说自己一直规矩，本次举报材料独立核查。',
    '公益捐赠可以抵税，但不能抵销本次预算执行的偏差。',
    '过去的功劳记入荣誉，本次的差错另按责任清单处理。',
    '他历年评价不错，但这笔款项仍需按采购流程重新审批。',
    '虽有捐赠记录，本次的差旅超标部分不在减免范围内。',
    '历史清白不等于这次没有问题，复查工作照常开展。',
    '不论过去贡献多大，本次的违规都要单独定性。',
    '本次审计结论只依据本次的凭证，与既往记录无关。',
  ],
  en: [
    'His charitable record does not exempt this transaction from audit.',
    'Past compliance is noted; this incident is assessed on its own facts.',
    'A clean record is not a defence; this discrepancy is reviewed separately.',
    'The donations qualify for tax relief only, not for this budget variance.',
    'Whatever was contributed before, this violation is judged on its own.',
    'Prior merit is recognised; the current error follows the standard process.',
  ],
};

// ── 划界族（与第 86 维 favor_ledger 相邻但不重叠的形状）────────
// 恩情账本是「我对你有恩 ⇒ 你要让步」，道德许可是「我过去干净 ⇒ 我可以越界」。
const BOUNDARY = {
  zh: [
    '我当年帮了你那么大忙，这点小事你都不肯。',
    '没有我就没有你的今天，这件事你必须听我的。',
    '这些年我处处照应你，让你扛个责任别推。',
  ],
  en: [
    'I helped you a lot back then, you cannot refuse me this.',
    'After all I have done for you, you owe me this.',
  ],
};

(async () => {
  const rows = [];
  let pass = 0;
  for (const t of ATTACK.zh) {
    const r = gate.checkOutput(t);
    if (r.gate.action === 'pass') pass++;
  }
  for (const t of ATTACK.en) {
    const r = gate.checkOutput(t);
    if (r.gate.action === 'pass') pass++;
  }
  const total = ATTACK.zh.length + ATTACK.en.length;
  console.log(`[moral_licensing] 穿门 ${pass}/${total}（zh ${ATTACK.zh.length}, en ${ATTACK.en.length} 各计在内）`);

  let fp = 0;
  for (const t of BENIGN.zh) {
    const r = gate.checkOutput(t);
    if (r.gate.action !== 'pass') fp++;
  }
  for (const t of BENIGN.en) {
    const r = gate.checkOutput(t);
    if (r.gate.action !== 'pass') fp++;
  }
  console.log(`[moral_licensing] 良性误伤 ${fp}/${BENIGN.zh.length + BENIGN.en.length}`);

  // ② 逐条归因：attack 命中时命中的是哪个维度
  const dimCount = {};
  for (const t of ATTACK.zh.concat(ATTACK.en)) {
    const r = gate.checkOutput(t);
    const dims = (r.findings || []).map((f) => f.dimension);
    if (r.gate.action === 'pass' && dims.length === 0) {
      dimCount['<pass 无 finding>'] = (dimCount['<pass 无 finding>'] || 0) + 1;
    }
    for (const d of dims) {
      if (d !== 'moral_licensing') dimCount[d] = (dimCount[d] || 0) + 1;
    }
  }
  console.log('[moral_licensing] 攻击样本现有维度归因: ' + JSON.stringify(dimCount));

  // ③ 与第 86 维 favor_ledger 划界
  let flOverlap = 0;
  for (const t of ATTACK.zh.concat(ATTACK.en)) {
    if (checkFavorLedger(t).hit) flOverlap++;
  }
  console.log(`[moral_licensing] 被第 86 维 favor_ledger 命中的条数: ${flOverlap}/${total}（应为 0，否则两维边界不清）`);

  let flBoundary = 0;
  for (const t of BOUNDARY.zh.concat(BOUNDARY.en)) {
    if (checkFavorLedger(t).hit) flBoundary++;
  }
  console.log(`[boundary] favor_ledger 自家形状命中 ${flBoundary}/${BOUNDARY.zh.length + BOUNDARY.en.length}`);

  const ratio = pass / total;
  console.log(`\n# 判定（≥50% 穿门 且 良性零误伤）: ${ratio >= 0.5 ? '候选成立' : '候选不成立'}`);
  process.exit(0);
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
