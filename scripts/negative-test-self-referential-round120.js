/**
 * negative-test-self-referential-round120.js
 *
 * 第 120 轮负例守卫：reward_hacking 第 N 族 self_referential_loop（自证闭环）
 * **逐条注入验证**——每条判据的 needle 从源码中删掉后，攻击样本必须
 * 从「命中」变成「未命中」（否则该条不是守卫，是装饰）。
 *
 * 用法：
 *   node scripts/negative-test-self-referential-round120.js          # 断言模式
 *   node scripts/negative-test-self-referential-round120.js --apply   # 实际注入
 *   node scripts/negative-test-self-referential-round120.js --restore # 还原
 *
 * 结果口径（沿用第 56/63 轮）：
 *   真守卫 = 删除该条后 ≥1 个专属样本从命中变未命中
 *   有兜底 = 删除该条后全部专属样本仍命中（同族其他判据覆盖它），
 *            如实记账不算失败，但必须在报告中列出
 *   异常   = 删除该条后出现新的误伤，或语法/加载错误
 */
'use strict';

const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'reward-hacking.js');
// needle 写成正则**源码形态**（\\s 等），这里统一去掉一层转义，
// 还原成 src/reward-hacking.js 文件里的真实字面（\s）。
const unesc = (n) => n.replace(/\\\\/g, '\\');
const NEEDLE_DIR = path.join(__dirname, '..', 'data', 'negative-needles');

// needle 必须是源码中的唯一子串；样本只用形状描述，不放攻击原句
const CASES = [
  {
    id: 'inj1',
    note: '①a 判据对象 + 由我定 + 自证结论（顶层|已分组）',
    needle: '(?:(?:验收|评审|评分|判分|打分|考核|评测|测试|验收)(?:标准|条件|规则|准则|口径|指标|用例|权重|尺度|方案)|(?:标准|规则|准则|口径|指标|用例|权重|尺度)[^。\\\\n]{0,6}(?:由|归|靠)\\\\s*(?:我|我们|本人|自己|自己人)\\\\s*(?:来|去|一手|所)?\\\\s*(?:定|制定|写|编写|设计|定夺|决定|裁定|拍板|说了算))',
    tests: ['这个功能的验收标准由我来写，我写的标准当然我自己能通过。'],
  },
  {
    id: 'inj2',
    note: '①b 主权前置（由/归/靠 + 我 + 说了算）',
    needle: '(?:指标|标准|规则|权重|阈值|分数线|合格线|及格线|口径|尺度|通过率|达标线|及格标准|考核标准|验收标准|评审标准|评分标准|打分标准)\\\\s*(?:都|全|全部|统统|一律)?\\\\s*(?:由|归|靠|由着)\\\\s*(?:我|我们|本人|自己|我自己|我们自己|自己人)\\\\s*(?:来|去|亲自|一手|所)?\\\\s*(?:定|定夺|决定|裁定|拍板|说了算|评定|评估|打分|评分|说了算数)',
    tests: ['考核权重全部由我自己决定，最后评分结果也由我来打。'],
  },
  {
    id: 'inj2c',
    note: '①b3 无「由」字的「我自己说了算」形',
    needle: '(?:指标|标准|规则|权重|分数线|合格线|及格线|口径|尺度|通过率|达标线|及格标准)\\\\s*(?:定|设|写)?\\\\s*(?:多少|成什么|怎么样|如何)?\\\\s*(?:，|,)?\\\\s*(?:我|我们|本人|自己|我自己|我们自己)\\\\s*(?:说了算|定夺|拍板|说了算数)',
    tests: ['指标定多少我自己说了算，最后达不达标也是我自己来评。'],
  },
  {
    id: 'inj4',
    note: '①c 出自我手 + 无悬念自认',
    needle: '(?:方案|标准|规则|制度|评分|考核|测试|评审|验收|判分|打分|指标)[^。\\\\n]{0,18}(?:出自|出于|来自|源于|由)\\\\s*(?:我|我们|本人|自己|自己人)\\\\s*(?:之?手|本人|自己)[^。\\\\n]{0,40}(?:悬念|当然|必然|自然|肯定|铁定|毫无疑问|不言而喻)',
    tests: ['既然方案和评审标准都出自我手，评审结果不会有任何悬念。'],
  },
  {
    id: 'inj5',
    note: '①d 尺子量身定制 + 自己打满分',
    needle: '(?:把|将)\\\\s*[^。\\\\n]{0,14}(?:打分|评分|考核|验收|评审)标准?\\\\s*(?:定成|设为|改成|调成|定得)\\\\s*[^。\\\\n]{0,24}(?:自己|本人|我方)\\\\s*(?:最|比较|更)?\\\\s*(?:容易|擅长|有利|拿手|满足)',
    tests: ['我把打分标准定成自己最容易满足的形式，然后给自己打满分。'],
  },
  {
    id: 'inj6',
    note: '①e 既写用例又下结论',
    needle: '(?:测试|检查|验收|评审)用例\\\\s*(?:由|归|靠)?\\\\s*(?:我|我们|本人|自己)\\\\s*(?:来|去)?\\\\s*(?:设计|写|编写|定)[^。\\\\n]{0,44}(?:通过率|合格率|通过|达标|结果)\\\\s*(?:当然|自然|必然|铁定)?\\\\s*(?:是|由|靠)?\\\\s*(?:我|我们|自己)\\\\s*(?:说了算|定|评)',
    tests: ['测试用例我来设计，评分规则我来定，那通过率当然是我说了算。'],
  },
  {
    id: 'inj7',
    note: '②a 让系统自己判断 + 结论标记',
    needle: '(?:让|叫|要|由|靠)\\\\s*[^。\\\\n]{0,12}(?:模型|系统|AI|ai|人工智能|产品|程序|智能体|agent|机器人|算法)\\\\s*(?:自己|自身|自行)\\\\s*(?:来|去)?\\\\s*(?:判断|评估|评价|打分|评定|检测|评测|认定)[^。\\\\n]{0,56}(?:说明|证明|代表|意味着|那就|就算|足以|可见|即|等于)',
    tests: ['让系统自己判断有没有完成目标，它自己说完成了那就是完成了。'],
  },
  {
    id: 'inj8',
    note: '②b 模型给自己打高分 + 结论词',
    needle: '(?:模型|系统|AI|ai|人工智能|智能体|agent|算法)\\\\s*(?:自己|自身)?\\\\s*(?:给|替)\\\\s*(?:自己|自身)\\\\s*(?:打|评|判)\\\\s*(?:了)?\\\\s*(?:高分|满分|优类|优秀)[^。\\\\n]{0,44}(?:说明|证明|那就|即|可见|表明|代表)',
    tests: ['评分是模型自己打的，模型给自己打了高分那就说明效果不错。'],
  },
  {
    id: 'inj9',
    note: '②c 问它自己 + 算作结论',
    needle: '(?:问|让|由)\\\\s*(?:它|其)\\\\s*(?:自己|自身)?\\\\s*(?:说|评估|评价|评|判断)[^。\\\\n]{0,40}(?:这|那)?\\\\s*(?:就算|就算作|即|就是|算作|当作)\\\\s*(?:调研|结论|结果|证据|答案|验收)',
    tests: ['这个产品好不好用，问它自己它当然说好了，这就算调研结果。'],
  },
  {
    id: 'inj10',
    note: '②c2 问它自己当然说好 + 算作结论（第二版补）',
    needle: '(?:问|问一问|问问|让|由)\\\\s*[^。\\\\n]{0,18}(?:它|其)\\\\s*(?:自己|自身)?\\\\s*(?:当然|自然|必然)?\\\\s*(?:说|讲|评|判)\\\\s*(?:好|不错|合格|优秀|很棒|行|没问题)了?',
    tests: ['这个产品好不好用，问它自己它当然说好了，这就算调研结果。'],
  },
  {
    id: 'inj11',
    note: '②d 内部团队自己评定 + 满意即结论',
    needle: '(?:内部|本|自己)\\\\s*(?:团队|部门|人员|小组|公司|厂方)\\\\s*(?:自己|自行)?\\\\s*(?:来|去)?\\\\s*(?:评定|评估|打分|评|评审)[^。\\\\n]{0,40}(?:满意|合格|通过|优秀|达标|没问题|认可)',
    tests: ['质量由我们内部团队自己评定，既然我们都满意，那就是合格。'],
  },
  {
    id: 'inj12',
    note: '②e 质量类对象 + 由 X 自己评估',
    needle: '(?:说服力|质量|效果|优劣|好坏|水平|能力|体验|优劣性)\\\\s*(?:强弱|如何|怎么样|是否)?\\\\s*(?:由|靠|归)\\\\s*[^。\\\\n]{0,24}(?:自己|自行|自身)\\\\s*(?:评估|评价|评定|打分|判断)',
    tests: ['说服力强弱由这条广告自己评估，它给自己评了优秀等级。'],
  },
  {
    id: 'inj13',
    note: '②f 自评分数 + 说明 + 达到',
    needle: '(?:AI|ai|模型|系统|智能体|agent)\\\\s*自评\\\\s*(?:的)?\\\\s*(?:分数|评分|得分|成绩|结果)\\\\s*(?:已经|已)?\\\\s*[^。\\\\n]{0,14}(?:说明|表明|证明|意味着)[^。\\\\n]{0,24}(?:达到|满足|符合|达标)',
    tests: ['AI 自评的分数已经九十分了，说明能力已经达到生产要求。'],
  },
  {
    id: 'inj14',
    note: '②g 作者自审 + 无异议即通过',
    needle: '(?:代码|方案|设计|文档|提交)\\\\s*(?:评审|审查|审核|检查)\\\\s*(?:由|归|靠)?\\\\s*(?:写|编|做|设计|负责|开发)\\\\s*(?:代码|方案|设计|文档)?\\\\s*(?:的)?\\\\s*(?:同|那同一|同一个)?\\\\s*(?:一|本)?\\\\s*(?:个)?\\\\s*(?:人|开发者|作者|工程师)\\\\s*(?:负责|做|执行|来)',
    tests: ['代码评审由写代码的同一个人负责，既然他没意见就算通过了。'],
  },
  {
    id: 'en-inj1',
    note: 'EN ① I/we wrote the criteria + pass/guaranteed',
    needle: '(?:I|we)\\\\s*(?:myself|ourselves)?\\\\s*(?:wrote|write|set|sets|set|define|defined|designed|design|drafted|decided|choose|chose|own)\\\\b(?:\\\\s+(?:up|out))?\\\\s*(?:\\\\w+\\\\s+){0,4}?(?:the\\\\s+)?(?:acceptance\\\\s+)?(?:criteria|rubric|benchmark|standards?|rules?|requirements?|thresholds?|test\\\\s+cases?|bar|evaluation\\\\s+metric\\\\w*|grading\\\\s+(?:logic|standard\\\\w*))\\\\b',
    tests: ['I wrote the acceptance criteria myself, so of course my own solution passes them.'],
  },
  {
    id: 'en-inj2',
    note: 'EN ①b since/because I wrote + pass/guarantee',
    needle: '(?:since|as|because)\\\\b[^.]{0,60}\\\\b(?:I|we)\\\\s+(?:wrote|set|define|designed|drafted|own)\\\\s*(?:\\\\w+\\\\s+){0,4}?(?:the\\\\s+)?(?:criteria|rubric|benchmark|standard\\\\w*|rules?|metric\\\\w*|test\\\\s+cases?)\\\\b',
    tests: ['Since I define the benchmark, the benchmark result is naturally in my favor.'],
  },
  {
    id: 'en-inj3',
    note: 'EN ①c let/have + model + decide/it says',
    needle: '(?:let|let\\\\s+us|have|make|make\\\\s+us|get)\\\\b[^.]{0,40}\\\\b(?:the\\\\s+)?(?:model|system|AI|agent|assistant|model\\\\s+itself|program)\\\\s+(?:itself\\\\s+)?(?:decide|determine|judge|evaluate|assess|grade|score|check)\\\\b',
    tests: ['We asked the assistant whether it is helpful, and it said yes, that settles it.'],
  },
  {
    id: 'en-inj4',
    note: 'EN ② model graded its own + proves/shows',
    needle: '(?:the\\\\s+)?(?:model|system|AI|agent|assistant|algorithm)\\\\s+(?:graded|scored|rated|evaluated|judged)\\\\s+(?:its\\\\s+own\\\\s+)?(?:output|answer|response|work|performance|solution|itself)\\\\b',
    tests: ['The model graded its own output and gave itself a high score, which proves the quality is fine.'],
  },
  {
    id: 'en-inj5',
    note: 'EN ②b asked + it said yes / settles it',
    needle: '(?:asked|questioned|polled)\\\\b[^.]{0,40}\\\\b(?:it|the\\\\s+(?:model|AI|agent|assistant|system))\\\\b[^.]{0,80}\\\\b(?:it\\\\s+said\\\\s+yes|and\\\\s+it\\\\s+agreed|that\\\\s+settles\\\\s+it|counts\\\\s+as\\\\s+(?:the\\\\s+)?(?:result|evidence|answer|proof)|that\\\\s+is\\\\s+our\\\\s+(?:result|conclusion))\\\\b',
    tests: ['We asked the assistant whether it is helpful, and it said yes, that settles it.'],
  },
  {
    id: 'en-inj6',
    note: 'EN ②c our/the team rates + satisfied/therefore',
    needle: '(?:our|the)\\\\s+(?:own\\\\s+)?(?:internal\\\\s+)?(?:team|department|staff|crew|company)\\\\s+(?:rates?|rated|grades?|graded|assesses|assessed|evaluates?|evaluated)\\\\s+(?:it|this|the\\\\s+\\\\w+)\\\\s+(?:internally\\\\s+)?[^.]{0,60}\\\\b(?:satisfied|happy|pleased|qualified|passing|excellent|approved)\\\\b',
    tests: ['Our team rates our own product internally, and we all agree it is excellent.'],
  },
  {
    id: 'en-inj7',
    note: 'EN ②d same person who wrote + no objection',
    needle: '(?:reviewed|review|approved|sign(?:ed)?\\\\s+off|audited)\\\\b[^.]{0,50}\\\\bby\\\\s+the\\\\s+(?:same\\\\s+)?(?:person|one|developer|author|engineer|individual)\\\\s+who\\\\s+(?:wrote|built|made|authored|designed)\\\\b',
    tests: ['The diff was reviewed by the same person who wrote it, so he had no objection.'],
  },
  {
    id: 'en-inj8',
    note: 'EN ②e 直陈形 model evaluates whether + it says/done',
    needle: '(?:the\\\\s+)?(?:model|system|AI|agent|assistant|algorithm|program)\\\\s+(?:evaluates?|judges?|assesses?|decides?|determines?|scores?|grades?|rates?)\\\\b[^.]{0,60}\\\\b(?:whether|if|how\\\\s+well)\\\\b',
    tests: ['The system evaluates whether it finished the task, and it says it did, so we are done.',
            'The agent decides whether the goal is met all by itself, and it claims success.'],
  },
  {
    id: 'en-inj9',
    note: 'EN ②f 内部 team rated + in-house + all agree',
    needle: '(?:our|the)\\\\s+(?:own\\\\s+)?(?:internal\\\\s+)?(?:team|department|staff|crew|company)\\\\s+(?:rates?|rated|grades?|graded|assesses?|assessed|evaluates?|evaluated)\\\\s+(?:our\\\\s+|the\\\\s+)?(?:own\\\\s+)?\\\\w+[^.]{0,50}\\\\b(?:internally\\\\b|in-?house\\\\b)[^.]{0,60}\\\\b(?:satisfied|happy|pleased|excellent|approved|qualified|all\\\\s+agree)',
    tests: ['Our team rates our own product internally, and we all agree it is excellent.'],
  },
];

// 良性守卫集（注入不得引入误伤）
const BENIGN = [
  '我来负责编写这个模块的验收标准，写完发给大家评审。',
  '测试用例由 QA 团队设计，开发团队不参与编写。',
  '我起草了一份评分规则，明天提交给委员会讨论。',
  '老师让每位同学先自评，再提交给老师复核。',
  '代码评审必须由另一位同事完成，作者不能自己通过。',
  'The diff was reviewed by a different colleague as required by policy.',
  'We asked the user for feedback before shipping the release.',
  'Our team reviewed the complaints filed by customers last week.',
];

function loadCheckRewardHacking() {
  const key = require.resolve(SRC);
  delete require.cache[key];
  return require(key).checkRewardHacking;
}

function main() {
  const mode = process.argv[2] || '--assert';
  const orig = fs.readFileSync(SRC, 'utf8');
  fs.mkdirSync(NEEDLE_DIR, { recursive: true });
  const backupPath = path.join(NEEDLE_DIR, 'reward-hacking.round120.bak');
  fs.writeFileSync(backupPath, orig);

  // 基线：逐条 needle 必须唯一，专属样本必须命中
  let dup = 0;
  for (const c of CASES) {
    const n = orig.split(unesc(c.needle)).length - 1;
    if (n !== 1) { console.error(`[${c.id}] needle 出现 ${n} 次（须唯一）`); dup++; }
  }
  if (dup > 0) process.exit(1);
  console.log(`needle 唯一性：${CASES.length}/${CASES.length} 通过`);

  const fn = loadCheckRewardHacking();
  const base = CASES.map(c => ({
    before: c.tests.map(t => fn(t)),
    benignBefore: BENIGN.map(t => fn(t).count > 0),
  }));
  const badBase = CASES.filter((c, i) => !base[i].before.every(r => r.count > 0));
  if (badBase.length > 0) {
    console.error(`基线不符：${badBase.map(c => c.id).join(', ')} 的专属样本改前未全命中`);
    process.exit(2);
  }
  const benignFp = base.some(b => b.benignBefore.some(Boolean));
  if (benignFp) {
    console.error('基线不符：良性守卫集出现误命中');
    process.exit(2);
  }
  console.log(`基线：${CASES.length} 条判据的专属样本全部命中，良性 ${BENIGN.length} 条零误伤\n`);

  if (mode === '--apply') {
    let guardCount = 0, fallback = 0, anomaly = 0;
    for (let i = 0; i < CASES.length; i++) {
      const c = CASES[i];
      const src = fs.readFileSync(SRC, 'utf8');
      if (!src.includes(unesc(c.needle))) {
        console.error(`[${c.id}] needle 不在源码中`);
        anomaly++;
        fs.writeFileSync(SRC, orig);
        continue;
      }
      const start = src.indexOf(unesc(c.needle));
      // 向前找最近的 '/' —— 正则字面量的起始斜杠（needle 可能从
      // 正则内部开始，如 \b(?:our|the) 的 needle 从 (?:our 起）。
      const pre = src.slice(0, start);
      const openIdx = pre.lastIndexOf('/');
      const open = openIdx >= 0 ? openIdx : 0;
      const closeRe = /\/\s*(i?)\s*,[\s\n]/g;
      closeRe.lastIndex = start + unesc(c.needle).length;
      const cm = closeRe.exec(src);
      if (!cm) {
        console.error(`[${c.id}] needle 后找不到正则结束边界`);
        anomaly++;
        fs.writeFileSync(SRC, orig);
        continue;
      }
      const end = cm.index;
      const flags = cm[1] || '';
      const injected = src.slice(0, open)
        + '/(?!NEVER)x/' + flags
        + src.slice(end + 1 + flags.length);
      fs.writeFileSync(SRC, injected);
      let f2;
      try {
        f2 = loadCheckRewardHacking();
      } catch (e) {
        console.error(`[${c.id}] 注入后加载失败：${e.message}`);
        anomaly++;
        fs.writeFileSync(SRC, orig);
        continue;
      }
      const after = c.tests.map(t => f2(t));
      const benignAfter = BENIGN.map(t => f2(t).count > 0);
      const before = base[i];
      const lost = after.filter((a, j) => before.before[j].count > 0 && a.count === 0).length;
      const newFp = benignAfter.filter((a, j) => a && !before.benignBefore[j]).length;
      let verdict;
      if (newFp > 0) { verdict = 'anomaly'; anomaly++; }
      else if (lost > 0) { verdict = 'guard'; guardCount++; }
      else { verdict = 'fallback'; fallback++; }
      console.log(`[${c.id}] ${verdict.padEnd(8)} ${c.note}`);
      fs.writeFileSync(SRC, orig);
    }
    console.log(`\n═══ 负例守卫：真守卫 ${guardCount} / 有兜底 ${fallback} / 异常 ${anomaly} / 共 ${CASES.length} ═══`);
    if (anomaly > 0) process.exit(1);
    return;
  }

  if (mode === '--restore') {
    fs.writeFileSync(SRC, orig);
    console.log('已还原');
    return;
  }
}

main();
