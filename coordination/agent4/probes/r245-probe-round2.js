/*
 * r245-probe-round2.js — 峰终定律 peak-end rule 定向加固探针
 * 目的：确认 round1 的 8/8 穿透 + 0/8 误拦不是句型碰巧，而是结构稳健。
 *  A 组：更难攻击变体（更多框架名词/评价词/修饰/倒装/英文）
 *  B 组：高密度疑难良性（含邻接维度触发词：confidence/hasty/anecdote/outcome）
 *  C 组：邻接领地锁（真 hasty_generalization / outcome_bias / anecdote_as_proof /
 *        正当且考量了时长的完整体验评价——这些不应算 peak-end 的活，但也必须不误伤）
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const attack = [
  // 评价词/框架名词扩展 + 修饰 + 倒装
  '开头混乱、中途平淡，可收官那一刻堪称完美，整场演出我认为非常成功',
  '尽管前面两个小时都在赶路，最后看到日出的那一秒，这趟就值了',
  '手术过程别提多受罪，缝完针那一刻轻松了，整体我就给它好评',
  '培训前半段枯燥得很，结业时发了张证书，整个过程瞬间觉得有意义',
  '这部电影高光全在最后一幕，前面再拖我也愿意给高分',
  '开会又长又闷，好在散会前领导表扬了我，这场会开得还算舒心',
  '这顿饭除了最后那道甜点惊艳，前面寡淡无味，但整体体验我给满分',
  '旅行一路上舟车劳顿，就登顶那几分钟震撼，回忆里整趟都发光',
  'The conference dragged for hours, but the closing keynote was brilliant, so the whole event was a success.',
  'The recovery was brutal, yet the moment they removed the cast felt great, so overall it went well.',
  'Most of the vacation was stressful, but the final sunset made the entire trip unforgettable.',
  'The first three quarters were dismal, but the last-minute goal made the whole game worth watching.',
];

const benign = [
  // 概念教学
  '峰终定律说明人容易只凭最高潮和结尾给一段体验定性，从而忽略它的长短',
  '卡恩曼提出的峰终定律，是体验评价里持续时间被忽视的经典案例',
  'The peak-end rule shows people judge experiences by their peak and end, neglecting duration.',
  // 正确/均衡评价（考量了时长与整体）
  '虽然结尾很惊艳，但整个过程拖沓，综合时长和节奏我只能给中等',
  '不能只因为收尾漂亮就忽略中间数小时的乏味，整体评价要打折扣',
  '最后的高光值得记住，但也不该抹杀前面大部分时间的平淡',
  '尽管结局圆满，前半段的煎熬同样真实，我会把整体评为中上而非完美',
  'The finale was strong, but the slow middle means the whole thing is merely average.',
  'A single climactic moment cannot carry a review that ignores the rest of the runtime.',
  // 邻接维度正当用法（hasty / anecdote / outcome / confidence）
  '他逢人就夸那家店，不过是基于一次经历就下结论，证据并不充分',
  '因为项目结果好，就断定当初的决策必然正确，这是典型的结果偏差',
  '一次成功不能证明方法可靠，样本太小不足以下普遍结论',
  '他语气十分笃定，仿佛毫无悬念，这种过度自信需要警惕',
  'Judging the decision solely by its good outcome ignores how risky it actually was.',
  'One pleasant visit is not enough evidence to call the restaurant consistently excellent.',
  'I am absolutely certain this is the only correct approach and there is no doubt at all.',
];

const neighborLock = [
  // 这些是别的维度的领地，应保持 pass 或由别的维度处理，绝不是 peak-end 该拦的正当句
  '我们统计了全年每一天的满意度，按时间加权得到整体体验分',
  '评价课程要综合课前课中课后全周期，而不是只看结课那一刻',
  '完整的用户旅程包含每一个触点，结尾的顺畅不能替代全程的顺畅',
  'We averaged satisfaction across every session, not just the first and last.',
];

function actOf(r){ return (r && r.gate && r.gate.action) || (r && r.action) || '?'; }
function dimsOf(r){ return ((r && r.findings) || []).map(f => f.dimension); }

function run(label, arr, wantPass) {
  let ok = 0, bad = [];
  for (const t of arr) {
    const r = hf.gate(t); const a = actOf(r);
    const isPass = (a === 'pass');
    if (isPass === wantPass) ok++;
    else bad.push(`${a}:[${dimsOf(r).join(',')}] ${t.slice(0,30)}`);
  }
  console.log(`${label}: ${ok}/${arr.length} ${wantPass?'穿透(pass)':'误拦(!=pass)'}`);
  if (bad.length) { console.log('   反例:'); bad.forEach(b => console.log('     ' + b)); }
  return ok;
}

console.log('=== r245 probe round2 · 峰终定律定向加固 ===');
run('A 攻击变体(应全穿透)', attack, true);
run('B 疑难良性(应全 pass)', benign, true);
run('C 邻接领地正当句(应全 pass)', neighborLock, true);
