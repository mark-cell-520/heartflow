'use strict';
// r379 立项探针①：12 候选同池定拨（v6.8.191 pristine 基线）。
// 海外扫描（scout 文件 /tmp/hf-scout-1794927953.txt）：
//   HN Algolia 两个 query 均空返；S2 限流（keys: message,code）；
//   GitHub 5 仓库全为 LLM-based（whisper+ChatGPT / zero-shot fallacy classifier /
//   label variation），与纯规则引擎架构不兼容 → 空返，按既有形态自建。
// 本轮轮换方向（r373-r378 连续六轮 econ gate 扩族，本轮离开 econ 池）：
//   心理/决策偏误 + 统计推理 + 科学推理 + 逻辑谬误混合池。
// 测量口径（沿用 r372-r378）：
//   · 穿透 = 攻击句当前 gate.action === 'pass'（存量维度零覆盖 → 新族增量）
//   · 代拦 = 攻击句非 pass 且归因存量维度（记录是哪个 dim）
//   · 良性脏 = 良性句当前非 pass（存量维度误伤；区分是否本族增量）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function res(text) { return gcheck(text); }
function actionOf(text) { const r = res(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { return (res(text).findings || []).map(f => f.dimension); }

const POOL = {
  A_hedonic_adaptation: {
    zh: '享乐适应（忽视快感回弹）',
    attack: [
      '换辆更好的车，我这心里就能一直痛快下去，再也不会为车子的事烦了。',
      '只要搬进这套大房子，往后的日子每天都是幸福的，这种满足会一直持续。',
      'Once I buy this bigger house I will be happy every day from then on — the joy will never fade.',
      '升职加薪之后我就会彻底满足，这种成就感将伴随我一生不会消退。',
      '中了这笔大奖，我和家人往后余生都会一直这么快乐下去。',
    ],
    benign: [
      '搬进大房子当然会开心，但研究说人对物质改善的满足感通常几个月内就会回落到基线，所以我不指望它解决所有问题。',
      '涨薪带来的愉悦确实存在，同时也知道享乐适应会让它慢慢淡化，该做的规划还是得做。',
      '换新车会高兴一阵，但这种高兴不会一直持续，这点我心里有数。',
      'Buying the car will make me happy for a while, though hedonic adaptation means the feeling fades over time.',
    ],
  },
  B_empathy_gap: {
    zh: '共情鸿沟（冷状态替热状态决策）',
    attack: [
      '我现在不饿，所以现在点的外卖一定够一天吃，到时候饿了也不用加餐。',
      '我现在清醒得很，绝不会熬夜，凌晨困了自然就能去睡，不用担心。',
      'Right now I am not hungry, so the groceries I order now will be plenty for the whole week.',
      '我现在心情平静，不会冲动，所以现在签的这份合同就等于我以后所有状态下的选择。',
    ],
    benign: [
      '虽然现在不饿，但我知道饥饿状态下会想吃更多，所以多点了一些备用。',
      '现在情绪稳定时的判断不能代表冲动时的状态，签合同前我先冷静一晚。',
      '冷状态下的自控力评估会高估自己，所以我提前设置了限制来防患。',
      'Because I know I will be hungrier later, I am ordering extra food now.',
    ],
  },
  C_focusing_illusion: {
    zh: '聚焦幻觉（单一维度膨胀估价）',
    attack: [
      '买了这套房我的人生就圆满了，别的都不重要，只有房子能决定我幸不幸福。',
      '只要分数高，我整个人生就值了，成绩以外的一切都不值得考虑。',
      'Once I get that promotion my whole life will be complete; nothing else matters.',
      '这笔钱到手，我的人生全部问题都解决了，其他事一概不用想。',
    ],
    benign: [
      '房子固然重要，但生活质量还取决于健康、关系和日常安排，不能只盯着一项。',
      '分数重要，却不是人生的全部，把全部意义压在成绩上会失衡。',
      'Promotion matters, but wellbeing depends on many factors, not just this one thing.',
    ],
  },
  D_identifiable_victim: {
    zh: '可识别受害者效应（个例盖过统计基数）',
    attack: [
      '这个小姑娘的照片让我流泪了，所以她的情况比那一万个统计数据里的人更值得优先救。',
      '既然这个病人的故事这么惨，就该把所有资源都投给他一个人，整体死亡率高一点无所谓。',
      'One child\'s photo moved me to tears, so saving her matters more than the statistical lives of thousands.',
      '这位患者的遭遇让我心痛，医院就该把全部预算花在他一个人身上，别的人死亡率高点没什么。',
    ],
    benign: [
      '这个案例令人同情，但资源分配还要看整体成本效益，不能只被单个故事左右。',
      '个例能让人看见问题，决策时仍需回到统计基数上权衡。',
      'The story is moving, yet policy must weigh aggregate outcomes, not just one identifiable case.',
    ],
  },
  E_hot_hand_fallacy: {
    zh: '热手谬误（独立事件连胜外推）',
    attack: [
      '他连续投进五个球了，手感正旺，下一个肯定还会进，把球都给他。',
      '硬币已经连着出五次正面，下一把绝对是反面的机会来了，押反。',
      'He has made five shots in a row, he clearly has a hot hand, keep feeding him the ball.',
      '连开五把大了，下一把一定是小，趁热全押小。',
    ],
    benign: [
      '连续命中可能是状态好也可能是运气，独立投篮的命中率不会因为连胜而改变。',
      '硬币没有记忆，连续正面不会提高下一次出反面的概率。',
      'A streak in independent events does not change the underlying probability of the next trial.',
    ],
  },
  F_duration_neglect: {
    zh: '持续时间忽视（只看峰终忽略时长）',
    attack: [
      '手术疼了多久不重要，只要最后几分钟不疼，病人对整台手术的记忆就是好的。',
      '这次度假开头结尾很愉快，中间那两周难受完全不重要，总体体验算完美。',
      'Only the peak and the end matter; how long the pain lasted is irrelevant to how patients remember it.',
      '过程长短无所谓，结局好就算好经历，时长不影响人们对体验的评价。',
    ],
    benign: [
      '虽然峰终定律说记忆主要受峰值和终点影响，但疼痛持续时间本身仍有独立的影响，不能忽略。',
      '记忆评价有偏，但对长时程痛苦的评估仍应考虑总时长。',
      'Peak-end rule describes memory bias, yet duration of suffering remains independently relevant.',
    ],
  },
  G_regression_to_mean: {
    zh: '均值回归（把回归当干预效果）',
    attack: [
      '这些学生上次考得差，被批评一顿后这次成绩回升了，说明批评有效，以后要加大力度。',
      '这家店上月业绩最差，被约谈后这个月自动好转，证明约谈很管用。',
      'After the worst-performing students were punished, their scores improved — proof that punishment works.',
      '病人最难受的时候打了针，之后症状减轻，说明这一针就是特效药。',
    ],
    benign: [
      '成绩回升可能只是均值回归，极端值之后自然向平均靠拢，不能全归功于干预。',
      '症状在极值点后缓解是常见的回归现象，需要对照组才能判断疗效。',
      'Improvement after an extreme value may reflect regression to the mean rather than the treatment.',
    ],
  },
  H_general_knowledge_overclaim: {
    zh: '泛化知识过宣（单一结论推广为普遍规律）',
    attack: [
      '我邻居抽烟喝酒活到九十岁，所以烟酒根本无害，医学警告都是吓唬人。',
      '我二舅没上大学也当了老板，可见读书完全没用，赶紧退学创业。',
      'My uncle smoked and drank and lived to 90, so smoking is clearly harmless.',
      '隔壁老李天天熬夜身体倍儿棒，所以熬夜伤身纯属谣言。',
    ],
    benign: [
      '邻居长寿是个例，群体统计上烟酒仍显著增加疾病风险。',
      '个案不能否定流行病学证据，健康结论要看大样本研究。',
      'Anecdotes cannot overturn population-level risk estimates from large studies.',
    ],
  },
  I_base_rate_neglect: {
    zh: '基础比率忽视',
    attack: [
      '这个检测准确率九成，我测出来是阳性，那我几乎肯定得了这个病。',
      '测试灵敏度和特异度都百分之九十九，结果是阳性，肯定是感染了。',
      'The test is 99% accurate and I tested positive, so I almost certainly have the disease.',
      '筛査准确率那么高，阳性就是中招了，不用再想别的。',
    ],
    benign: [
      '阳性结果要结合疾病在人群中的基础比率才能算出真实患病概率。',
      '准确率高不等于后验概率高，低患病率下假阳性占比会很大。',
      'A positive result must be interpreted together with the base rate of the condition.',
    ],
  },
  J_confusion_of_necessary_sufficient: {
    zh: '必要/充分混淆',
    attack: [
      '努力就能成功，所以只要我努力了，成功是一定的。',
      '他有学士学位，那一定能找到好工作，学历就是充分条件。',
      'Hard work guarantees success; if you work hard you will certainly make it.',
      '进了这所学校就一定能出人头地，这是充分保证。',
    ],
    benign: [
      '努力是成功的必要条件但不是充分条件，还需要机遇和方法。',
      '学历是敲门砖，能否就业还取决于能力、经验和市场需求。',
      'Hard work is necessary but not sufficient for success.',
    ],
  },
  K_burden_of_proof_shift: {
    zh: '举证责任倒置',
    attack: [
      '你说不了它的存在就没有吗？你证明它不存在，证明不了就是存在。',
      '你说这个药没效果，你拿出证据来啊，拿不出来就说明它有效。',
      'Unless you can prove the claim is false, we must accept it as true.',
      '你证明不了这个理论错，那就必须照它执行，出了问题是你的责任。',
    ],
    benign: [
      '举证责任在提出主张的一方，不能要求对方证明不存在。',
      '没有证据证明无效不等于有效，这犯了诉诸无知的错误。',
      'The burden of proof rests on the claimant, not on those who doubt the claim.',
    ],
  },
  L_survivorship_bias_advice: {
    zh: '幸存者偏差（只看见成功样本）',
    attack: [
      '比尔盖茨扎克伯格都退学创业成功了，所以大学辍学才是成功正道。',
      '这些企业家都曾破产又翻身，所以破产不可怕，大胆举债就是了。',
      'Gates and Zuckerberg dropped out and succeeded, so dropping out is the path to success.',
      '大佬们都是赌出来的，赌一把all in就对了，输了的是少数。',
    ],
    benign: [
      '退学创业成功者只是幸存者，大量退学者失败的故事不会被看见。',
      '只观察成功样本会高估策略，评估要看全部样本包括失败者。',
      'Focusing only on successful survivors biases the estimate of any strategy.',
    ],
  },
};

let totalA = 0, hitA = 0, totalB = 0, dirtyB = 0;
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const a = c.attack.map(t => ({ t, action: actionOf(t), dims: dimsOf(t) }));
  const b = c.benign.map(t => ({ t, action: actionOf(t), dims: dimsOf(t) }));
  const aPass = a.filter(x => x.action === 'pass').length;
  const bDirty = b.filter(x => x.action !== 'pass').length;
  totalA += a.length; hitA += aPass; totalB += b.length; dirtyB += bDirty;
  rows.push({ key, zh: c.zh, aPass, aTotal: a.length, bDirty, bTotal: b.length,
    aBlockedDims: [...new Set(a.filter(x => x.action !== 'pass').flatMap(x => x.dims))],
    bDirtyDims: [...new Set(b.filter(x => x.action !== 'pass').flatMap(x => x.dims))] });
}
rows.sort((x, y) => (y.aPass / y.aTotal) - (x.aPass / x.aTotal) || (x.bDirty - y.bDirty));
for (const r of rows) {
  console.log(r.key.padEnd(34) + '穿透 ' + r.aPass + '/' + r.aTotal + '  良性脏 ' + r.bDirty + '/' + r.bTotal +
    (r.aBlockedDims.length ? '  代拦:' + r.aBlockedDims.join(',') : '') +
    (r.bDirtyDims.length ? '  良性伤:' + r.bDirtyDims.join(',') : ''));
}
console.log('---');
console.log('合计 穿透 ' + hitA + '/' + totalA + '  良性脏 ' + dirtyB + '/' + totalB);
