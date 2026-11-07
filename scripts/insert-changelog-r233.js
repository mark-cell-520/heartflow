// r233 README Version history 条目插入（长文本含反引号，独立脚本处理）
const fs = require('fs');
const FILE = 'README.md';
let t = fs.readFileSync(FILE, 'utf8');

const entry = [
  '| 6.8.148 | 2026-11-07 | **第222维度 prosecutors_fallacy（检察官谬误 / prosecutor\'s fallacy）上线（r233）** — 新文件 src/prosecutors-fallacy.js。缺口实证：scripts/round-233/probe-gap-r233.js 探针实测，7 条攻击句中 5 条穿过硬闸门且**无一维命中**（grep src/ 对 prosecutor / 检察官 / 误报率 / false positive rate 零命中），存量 base_rate_neglect(169) 只管「忽略基础比例」的泛化陈述，不认「P(匹配|无辜) 偷换成 P(无辜|匹配)」这一**概率主语转移**结构本身。判据为**两腿共现 + 邻近窗（缺一不判）**：腿① RARE_MATCH 小概率匹配陈述（百万分之一/千万分之一/十亿分之一/百亿分之一/万亿分之一/百分之X.X/万分之X/p值小于X/one in a million / one in ten billion / once per billion，含裸名词形态——r161 教训：去后缀「百万分之一」仍命中）；腿② GUILT_INFERENCE 个体有罪/嫌疑结论（就是他/不是他还能是谁/他几乎肯定有罪/他是有罪的/嫌疑人几乎肯定/他就是凶手/he is almost certainly guilty / the suspect must be the culprit）。两腿同现且间隔 ≤80 字（EN ≤200 字符）即判。四重豁免全部负例注入承重：① 正确判别/证伪（不能作为认定他有罪的依据/仍需结合其他证据/孤证不足以定罪/does not establish guilt）；② 元话语教学（检察官谬误是课堂经典案例/Prosecutor\'s fallacy is a classic logical fallacy）；③ 结论腿对冲（他可能有罪，但还需核实）；④ 真疑问句（这能否证明他有罪？）——反问标记「难道」**不豁免**，与 r216 collider_bias 口径一致。r233 实现期两项修复已固化：① EXEMPT_CORRECT_ZH 首版窗宽 {0,10} 过窄，实测漏「不能作为认定他有罪的依据」（插入式长宾语），改两段式 + 24 字插入窗；② 真疑问句豁免最初被反问标记反向吞掉，拆分为「无反问标记才豁免」。index.js 九处接线（require/计算点/allDims/dimMap/补登记×2/VERIFY_DIMS/exports；变量名 prf，grep 实测零冲突）。外部来源：三层搜索 HN Algolia "prosecutor\'s fallacy" 命中多篇法庭科学科普故事、GitHub API 无高星纯规则实现，判据为心虫自有纯规则实现，侦察落盘 /tmp/hf-scout-r233.txt。维度数 221→222，VERIFY 178→179。验证：单测 7/7 组全绿（攻击 13/13 含中英/裸名词/带修饰/倒装/长句、良性 11/11 含边缘良性与正确多因陈述、腿①腿②删除均不命中、豁免表删除后良性转命中即承重、6 条豁免陷阱翻转、相邻维度良性不被代拦）、gate 层变体矩阵攻击 7/7 非 pass 且 findings 全含 prosecutors_fallacy、良性 4/4 无本维误伤、verify 16/16、guard 20/20（222 键）、doc 24/24、双向召回 52/52 误拦 302/326 不升。已知边界：① 两腿顺序只做前向（先小概率匹配、后有罪结论），倒装形「他有罪，因为匹配概率只有百万分之一」语义同族本轮保守不收；② 跨句长距离形不收；③ 存量维度 statistical_misleading / reasoning_coherence 会代拦部分本族边缘长句，非本维度引入。 |',
  '',
].join('\n');

const anchor = '| 6.8.146 | 2026-11-07 |';
const idx = t.indexOf(anchor);
if (idx < 0) { console.log('ANCHOR NOT FOUND'); process.exit(1); }
t = t.slice(0, idx) + entry + t.slice(idx);
fs.writeFileSync(FILE, t);
console.log('README Version history 插入 6.8.148 条目成功');
