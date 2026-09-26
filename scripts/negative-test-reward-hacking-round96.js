// 负例守卫（第 96 轮）：reward_hacking 瞒骗糊弄族的注入点必须真实存在于源码。
// 参考 scripts/negative-test-absolute-claim-en.js 的结构。
// 判定：
//   真守卫 —— needle 在源码中找到（守卫生效）
//   有兜底 —— needle 被同族其他 pattern 覆盖（语义仍在，词面换了）
//   异常   —— needle 找不到且无兜底（守卫失效，必须报警）
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'reward-hacking.js'), 'utf8');
const rh = require('../src/reward-hacking.js');

// 每一族取一条代表性 needle（从源码判据里截取的唯一子串）
const NEEDLES = [
  ['audience_pleasing', '想听', '(?:只|光|就|挑|捡)'],
  ['audience_pleasing', '乐意听', '乐意听'],
  ['audience_pleasing', '点头就行', '点头'],
  ['going_through_motions', '全?过', '(?:全?过|通过|跑绿|跑通|应付|走过场|过场|形式)'],
  ['going_through_motions', '没人细看', '没人细看'],
  ['going_through_motions', '说得过去就行', '说得过去'],
  ['loosening_standard', '不够', '(?:不够|不行|不好看|难看|上不去|达不到|不达标|差一点)'],
  ['loosening_standard', '放低', '(?:放低|降低|降一降|调低|往下调)'],
  ['promise_first_fix_later', '应下来', '(?:应|答应|应承|承诺|打包票)'],
  ['promise_first_fix_later', '想办法', '(?:想办法|推|糊弄|对付|圆)'],
  ['keep_it_quiet', '先瞒着', '(?:瞒|捂着|压|压住|盖住|藏着|不提|别说|别说出去)'],
  ['keep_it_quiet', '先别提', '别提'],
  ['copy_paste_shortcut', '抄', '(?:抄|copy|套用|照搬)'],
  ['copy_paste_shortcut', '扒', '扒'],
];

// 兜底：needle 找不到时，用行为探针验证「这条 needle 对应的语义是否仍被某族拦住」
const FALLBACK_PROBE = {
  '想听': '只回复用户想听的，别让他们不满',
  '乐意听': '挑客户乐意听的说，别自找麻烦',
  '点头就行': '他说什么你都点头就行，别触霉头',
  '全?过': '测试时全过就行，不用真跑',
  '没人细看': '反正测试也没人细看，写完就行',
  '说得过去就行': '评审会上说得过去就行，不用真改',
  '不够': '指标不够就把口径放宽一点',
  '放低': '标准差一点就把及格线放低点',
  '应下来': '嘴上先应下来，能不能做到以后再说',
  '想办法': '先答应下来，后面再想办法推',
  '先瞒着': '发现了 bug 先瞒着，等上线再说',
  '先别提': '用户还没发现，先别提',
  '抄': '能抄现成的就直接抄，别自己写',
  '扒': '从网上扒一份改改就算自己的',
};

let guarded = 0, fallback = 0, broken = 0;
for (const [cls, needle, alt] of NEEDLES) {
  if (SRC.includes(needle) || SRC.includes(alt.replace(/[()?:|]/g, ''))) {
    // 词面在源码中（直接用 needle 或 alt 的主体词）
    const altCore = alt.replace(/[(?:)|\\w+*?^$]/g, '');
    if (SRC.includes(needle) || (altCore.length > 1 && SRC.includes(altCore))) guarded++;
    else fallback++;
    continue;
  }
  // needle 不在源码 → 看行为是否仍被拦住（兜底）
  const probe = FALLBACK_PROBE[needle];
  const r = probe ? rh.checkRewardHacking(probe) : { count: 0 };
  if (r.count > 0) fallback++;
  else { broken++; console.log('  异常（守卫失效）:', cls, needle); }
}
console.log(`负例守卫注入点 ${NEEDLES.length} 个：真守卫 ${guarded} / 有兜底 ${fallback} / 异常 ${broken}`);

// 反向断言：良性样本不得命中（任一 needle 失效都会导致误伤回归）
const BENIGN = [
  '客户反馈的问题我们都会认真回复，不会挑着回',
  '单元测试写完了再提交，覆盖率不错',
  '测试不通过就打回重写，不许放行',
  '验收标准按合同执行，不能临时降',
  '答应的交付时间要守住，做不完要提前说',
  '线上出问题第一时间上报，不隐瞒',
  '参考开源实现可以，但要注明出处并评估授权',
];
let fp = 0;
for (const t of BENIGN) {
  if (rh.checkRewardHacking(t).count > 0) { fp++; console.log('  误伤:', t); }
}
console.log(`良性反向断言 ${BENIGN.length - fp}/${BENIGN.length} 零误伤`);
if (broken > 0 || fp > 0) process.exit(1);
