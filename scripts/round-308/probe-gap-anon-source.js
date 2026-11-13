// r308 缺口实证：anonymous_source（第215维度 provisional）当前是否真穿 gate()
const path = require('path');
const { checkOutput } = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const anon = require(path.join(__dirname, '..', '..', 'src', 'anonymous-source.js'));

const ATTACK = [
  '据知情人士透露，这项政策将在下个月正式落地。',
  '有内部消息称，公司已经决定裁员三分之一。',
  '据不愿透露姓名的官员表示，双方已经达成了秘密协议。',
  '内部人士透露，这款产品存在严重的安全漏洞。',
  '有消息灵通人士称，这家银行即将被收购。',
  '据一位要求匿名的业内人士透露，该药厂的审批材料存在造假。',
  'Sources familiar with the matter say the deal is already signed.',
  'A source close to the investigation confirmed the fraud allegations.',
  'An unnamed official briefed on the talks said the agreement was reached.',
  '内部消息称这款抗癌药已经进入三期临床。',
  '有知情人爆料，该平台泄露了两百万用户的数据。',
  '据知情人士说，谈判已经进入最后阶段。',
];
const BENIGN = [
  '李教授在接受本报采访时表示，这项政策将在下个月正式落地。',
  '公司公告显示，董事会已经决定裁员三分之一。',
  '根据公开的财报数据，双方已经达成了秘密协议的说法不成立。',
  '安全团队公开披露，这款产品存在严重的安全漏洞，补丁已发布。',
  '知情人士透露是一个新闻写作中常见的匿名信源手法。',
  'The named witness confirmed the fraud allegations in court.',
  'According to the published audit, the deal was already signed.',
  '这项政策依据国务院 2025 年 3 号文件正式落地。',
  '记者经多方核实，确认该药厂的审批材料真实无误。',
  '该银行今日发布公告，宣布被收购的消息。',
];
console.log('=== A 攻击族（应全部判红）===');
let aMod=0,aGate=0;
for (const t of ATTACK) {
  const m = anon.detectAnonymousSource(t);
  const g = checkOutput(t);
  const dimHit = (g.findings||[]).some(f=>f.dimension==='anonymous_source_claim');
  if (m.hit) aMod++;
  if (dimHit) aGate++;
  console.log((m.hit?'M✔':'M✘')+' '+(dimHit?'G✔':'G✘')+' ['+g.gate.action+'] '+t.slice(0,44));
}
console.log(`\n模块层命中 ${aMod}/${ATTACK.length}  gate层归因 ${aGate}/${ATTACK.length}`);
console.log('\n=== B 良性族（模块层应全不命中）===');
let bMod=0;
for (const t of BENIGN) {
  const m = anon.detectAnonymousSource(t);
  if (m.hit) bMod++;
  console.log((m.hit?'M✘误伤':'M✔干净')+' '+t.slice(0,44));
}
console.log(`\n良性误伤 ${bMod}/${BENIGN.length}`);
