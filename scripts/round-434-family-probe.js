// r434 探针：复测 lang-coverage-audit 报的「仅英文」族是否真缺口
// 只报数字，不贴样本原文
'use strict';
const path = require('path');
const fs = require('fs');
const SRC = path.resolve(__dirname, '..', 'src', 'index.js');
const hf = require(SRC);

// 每个族给多句同形状样本（从 test/ 取形状不改写）
const FAM = {
  emotional_manipulation_guilt_ledger: {
    fn: 'checkEmotionalManipulation',
    zh: [
      '我为你付出了这么多，你这么做对得起我吗',
      '我为你放弃了整个事业，你就这样回报我',
      '全家人都围着你转，你怎么忍心让我们失望',
      '我省吃俭用供你读书，你现在居然怪我',
      '我为你受了这么多委屈，你连一句道歉都没有',
    ],
    en: [
      'After everything I sacrificed for you, this is how you repay me',
      'I gave up my career for you and you treat me like this',
      'I have done so much for you, you owe me an apology',
    ],
  },
  victim_blaming_conditional_regret: {
    fn: 'checkVictimBlaming',
    zh: [
      '如果你当时小心一点，这一切就不会发生在你身上',
      '你早听我的就不会出这种事',
      '谁让你当初选这条路，吃亏也是自找的',
      '你要是强硬一点，别人也不敢欺负你',
      '如果你当初多个心眼，根本不会被骗',
    ],
    en: [
      'If you had been more careful, this would not have happened to you',
      'You should have listened to me, then none of this would have happened',
      'If you were stronger nobody would dare bully you',
    ],
  },
  presupposition_premature_admission: {
    fn: 'checkPresupposition',
    zh: [
      '你是否承认自己之前的判断完全是错的',
      '你什么时候才肯承认你一直在骗人',
      '你还不打算为你造成的损害认错吗',
      '你打算何时承认这个方案从一开始就不成立',
      '你终于愿意承认自己判断失误了吗',
    ],
    en: [
      'Why wont you admit your mistake',
      'When will you finally admit you have been lying',
      'How long do you plan to deny the damage you caused',
    ],
  },
  empty_answer_circular_restate: {
    fn: 'checkEmptyAnswer',
    zh: [
      '系统慢是因为系统响应速度低',
      '失败的原因是它没有成功',
      '延迟高是因为延迟太大',
    ],
    en: [
      'The migration failed because the migration did not succeed',
      'It is slow because the process runs slowly',
      'The build broke because the build failed',
    ],
  },
};

for (const [name, spec] of Object.entries(FAM)) {
  const fn = hf[spec.fn];
  if (typeof fn !== 'function') { console.log(`${name}: NO-FN ${spec.fn}`); continue; }
  const hitOf = (s) => {
    try {
      const r = fn(s);
      if (r == null) return false;
      const c = typeof r.count === 'number' ? r.count : (Array.isArray(r.findings) ? r.findings.length : 0);
      return c > 0;
    } catch (e) { return false; }
  };
  const zhHit = spec.zh.filter(hitOf).length;
  const enHit = spec.en.filter(hitOf).length;
  console.log(`${name}: ZH ${zhHit}/${spec.zh.length}  EN ${enHit}/${spec.en.length}`);
}
