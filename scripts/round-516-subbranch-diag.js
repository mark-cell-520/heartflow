'use strict';
// r516 诊断3：逐条找出 atk#17 / atk#20 / atk#19 / atk#25 的**唯一**
// 支撑子支——不能只按「哪支布尔为 true」判断，因为一个支内部有大量 || 析取。
// 做法：把每个顶层 || 分支单独抽出来（手动按源码结构复制），逐个 test。
const path = require('path');
const samples = require('../test/round-511-scrutiny-evasion-samples.json');
const mod = require(path.resolve(__dirname, '..', 'src', 'scrutiny-evasion.js'));
const fs = require('fs');
const src = fs.readFileSync(require.resolve('../src/scrutiny-evasion.js'), 'utf8');

// 手工抽取 DEFER_CONSEQ_ZH 的顶层 || 析取项（按 src 第 194-210 行结构）
const CONSEQ_BRANCHES = {
  '传出去会误读': '(?:传出去|泄露|走漏风声|流出去|散出去|公开出去)[^。，]{0,25}(?:误读|误会|曲解|误解|误判|失衡|恐慌|失控|出问题)',
  '打击士气族': '(?:打击|动摇|树敌|得罪|搞坏|搞僵|惹恼|损害|拖累|拆台|寒了)[^。，]{0,14}(?:士气|军心|信心|信任|关系|氛围|内部|团队|客户|人心|大局)',
  '不希望活下来': '(?:不(?:希望|想|让|愿意))[^。，]{0,12}(?:活下来|活下去|成功|推进|通过|做成|成事|过关)',
  '先放一放': '(?:先放一放|先缓缓|姑且|暂且|先不|等风声|风声过去|风头过去|过这阵|到时候再说|回头再说|以后再说)',
  '流程关系负担': '(?:树敌|得罪|招人|惹恼|搞坏|搞僵|招来)[^。，]{0,6}(?:太多|光|一大堆|不少|得多)?(?:人|关系|内部|团队|客户|同事|大家)?[^。，]{0,6}(?:搞坏|搞僵|寒心|反感|不爽|得罪|不满|不舒服)',
  '树敌太多': '(?:树敌太多|得罪人|招人反感|寒了心|让人寒心|把人得罪)',
};

const QUAL_BRANCHES = {
  '又不是凭什么': '(?:又(?:不|没)是|不是|没资格|还不够资格|轮不到|没权力|没权限)[^。，]{0,14}(?:凭什么|哪来|凭哪样)[^。，]{0,8}(?:审|查|核|管|质疑|监督|翻)',
  '凭资格审': '(?:凭(?:什么|啥)|哪里)[^。，]{0,8}(?:资格|权力|身份|名分)[^。，]{0,12}(?:审|查|核|管|监督|质疑|翻)',
  '还不到你管': '(?:还|轮)(?:不(?:到|该)|没)(?:你|你们)[^。，]{0,6}(?:来)?(?:管|查|审|核|监督)',
  '出身凭什么': '(?:又(?:不|没)是|非)[^。，]{0,8}(?:出身|专业|科班|这行的|专业人士|内部人|自己人)[^。，]{0,10}(?:凭什么|凭哪样|有什么)[^。，]{0,8}(?:审|查|核|管|管我们|监督|翻)',
  '你懂吗凭什么': '(?:你|你们)[^。，]{0,6}(?:懂|了解|清楚)[^。，]{0,4}(?:这些|这块|账|数据|业务)[^。，]{0,4}(?:吗|么)?，?[^。，]{0,10}(?:凭什么|有什么)[^。，]{0,8}(?:审|查|核|管|监督|翻)',
  '凭什么[sS]审': '(?:凭什么|凭哪样|有什么)[\\s\\S]{0,10}(?:审|查|核|管|监督|质疑|翻)',
  '没资格过问': '(?:你|你们)?(?:根本|完全|就|压根)?(?:没|没有|缺乏)(?:任何)?[^。，]{0,6}(?:资格|权限|权力|份内)[^。，]{0,10}(?:审|查|核|管|过问|监督|质疑|干预|插手|置喙)',
  '不是你能管': '(?:不|这)?是(?:你|你们)?(?:该|能|可以)[^。，]{0,6}(?:管|查|审|核|过问|插手|置喙)',
};

const PURGE_BRANCHES = {
  '抓把柄': '(?:抓|攥|握|留|收)[^。，]{0,10}(?:把柄|辫子|小辫|黑材料|弹药|口子)',
  '授人以柄': '(?:授人以柄|留下把柄|留下口子|被人抓住把柄)',
  '批斗': '(?:批斗|整风|政治运动|运动式|贴大字报|扣帽子|扣屎盆子|搞臭|罗织)',
};

const EN_BRANCHES = {
  'leak misread': '\\b(?:leak|leaks|circulate|get\\s+out|becomes\\s+public|the\\s+press)[^.]{0,35}\\b(?:misread|misinterpret|misconstrue|alarm|spook|panic)',
  'not qualified': '\\bnot\\s+(?:a|an)\\b[^.]{0,30}\\bso\\s+you\\s+are\\s+not\\s+(?:qualified|positioned|entitled|authorised|authorized)\\b[^.]{0,25}\\b(?:check|audit|verify|review|question|examine)\\b',
  'no standing': '\\b(?:no|not)\\s+(?:right|standing|business)\\s+to\\s+(?:check|audit|verify|review|question|examine)\\b',
  'collecting ammunition': '\\b(?:collecting|gathering|stockpiling|hoarding)\\b[^.]{0,25}\\b(?:ammunition|material)\\b[^.]{0,30}\\b(?:purge|reckoning|crackdown|fight|struggle|campaign)\\b',
  'purge anyone': '\\b(?:purge|purification|campaign)\\b[^.]{0,25}\\banyone\\s+who\\s+(?:asks?|demands?|requests?)\\b[^.]{0,20}\\b(?:sign-?offs?|paperwork|records|documentation|audits?)\\b',
  'put it off': '\\b(?:put\\s+it\\s+off|hold\\s+off|wait\\s+until|defer\\s+until)\\b[^.]{0,45}\\b(?:blows\\s+over|calms\\s+down|dies\\s+down|until\\s+later|after\\s+the\\s+IPO|until\\s+the\\s+noise)\\b',
  'let the dust settle': '\\blet\\s+the\\s+(?:noise|dust|anger|fury)\\s+settle\\s+before\\s+(?:we|you)\\s+(?:audit|review|check|reconcile)\\b',
};

const TABLE = {
  17: ['DEFER_CONSEQ_ZH', CONSEQ_BRANCHES],
  19: ['DEFER_PURGE_ZH', PURGE_BRANCHES],
  20: ['DEFER_QUAL_ZH', QUAL_BRANCHES],
  25: ['DEFER_EN', EN_BRANCHES],
};

for (const [idx, [name, branches]] of Object.entries(TABLE)) {
  const s = samples.attacks[Number(idx)];
  console.log(`\n=== atk#${idx} [${name}] : ${s}`);
  let support = 0;
  for (const [bname, bsrc] of Object.entries(branches)) {
    const flags = bsrc.includes('\\\\b') || bsrc.includes('\\\\s') ? 'i' : '';
    const re = new RegExp(bsrc, flags);
    const ok = re.test(s);
    if (ok) support++;
    console.log(`   ${ok ? 'SUPPORT' : '   -   '} ${bname}`);
  }
  console.log(`   => 支撑子支数 = ${support}`);
}
