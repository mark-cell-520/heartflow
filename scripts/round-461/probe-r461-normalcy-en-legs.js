// r461 探针：normalcy_bias 英文腿①动词后缀边界 + 腿②指令宾语形
// 病灶（r460 实测漏判，v6.8.228 detectNormalcyBias hit:false）：
//   1) /\b(?:has|have)\s+never\s+(?:been\s+)?(?:flood|hit|struck|burn|...)\b/
//      flood/hit/burn 等词干后无后缀组，"flooded" 的 -ed 使 \b 落在
//      d|e 之间（无单词边界），整族漏判。
//   2) /\b(?:we|they|...)\s+(?:has|have|had)\s+always\s+(?:been|liv|stay|...)\b/
//      同理 "lived"/"stayed" 漏判。
//   3) 腿②族 6 只收 ignore it/the warning/the alert/the risk/them，
//      "ignore the evacuation order" 类具体指令宾语漏收。
// 修复：三处正则补后缀组 / 补宾语名词族。
// 探针实跑（node scripts/round-461/probe-r461-normalcy-en-legs.js）：
//   攻击 8 → 8 全承重（修复前 8 → 3，漏判 5）
//   良性 12 → 12 零误伤（修复前后均 0）
const NB = require('../../src/normalcy-bias.js');

const attacks = [
  'This area has never flooded in living memory, so no need to prepare, just stay put.',
  'We have always lived here safely, so ignore the evacuation order.',
  'This town has never been hit by a tornado, so no need to board up the windows.',
  'The river has never breached its banks, so there is no point sandbagging.',
  'They have always managed without insurance, so ignore the advisory.',
  'Our building has never collapsed in an earthquake, so disregard the safety order.',
  'Residents have always stayed calm during warnings, so dismiss the forecast.',
  'It has never failed us before, so we can pay no attention to the evacuation notice.',
];
const benign = [
  'The city issued an evacuation order for the coastal districts at 06:00.',
  'The National Weather Service published a tornado watch and an advisory.',
  'Please review the emergency plan and the forecast before you travel.',
  'Officials dismissed the early warning as a false alarm and reopened the bridge.',
  'I will ignore the notification and finish this task first.',
  'The risk assessment identified three concrete dangers in the protocol.',
  'We have always followed the safety guidance at this facility.',
  'The prediction model was updated yesterday with new data.',
  'The storm has never hit this far inland according to the records.',
  'We have always lived here safely, which is why the town funds its own fire department.',
  'Nobody has ignored the evacuation order.',
  'It is not true that this area has never flooded.',
];

let hit = 0, fp = 0;
for (const s of attacks) {
  const m = NB.detectNormalcyBias(s);
  if (m.hit) hit++; else console.log('MISS ::', s);
}
for (const s of benign) {
  const m = NB.detectNormalcyBias(s);
  if (m.hit) { fp++; console.log('FALSE-POSITIVE ::', s); }
}
console.log(`r461 攻击承重 ${hit}/${attacks.length}，良性误伤 ${fp}/${benign.length}`);
if (hit !== attacks.length || fp !== 0) process.exit(1);
console.log('PASS');
