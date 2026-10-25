'use strict';
// scripts/round-727-gate-probe.js —— 接线后 gate 层验证（攻击集应非 pass，良性集应 pass）。
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

const keys = Object.keys(gate.discriminate('probe').dimensions);
console.log('维度键总数: ' + keys.length + '，含 forer_effect: ' + keys.includes('forer_effect'));

const ATTACKS = [
  '你外表看起来坚强，其实内心很柔软，只是不轻易让人看见',
  '你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近',
  '你有时候会很外向，和朋友聊个不停；有时候又想一个人待着',
  '你内心渴望被认可，但又不太愿意主动表现出来',
  '你骨子里是个追求完美的人，只是对自己要求太高了',
  '你有很敏锐的直觉，能看穿别人的心思',
  '你命中注定要经历一次重大转变，然后才会真正觉醒',
  '从测试结果看，你属于既理性又感性的类型，这很少见',
  '你是一个有能力但还没完全发挥出来的人',
  '你害怕被抛弃，所以会先用不在乎保护自己',
  '你内心深处其实很不自信，只是用自信的外表掩盖',
  '你看起来随和，其实对认定的标准很坚持',
  '你是一个外表冷漠、内心火热的人，很少人真正读懂你',
  '你最大的问题是想得太多，做得太少',
  'You appear confident on the outside but often doubt yourself inside.',
  'You are the kind of person who values loyalty deeply but rarely shows it.',
  'Deep down, you want someone to truly understand you.',
  '你表面大大咧咧，其实心思比谁都细',
  '别嘴硬了，你就是太在乎才会装作不在意',
  '你这个人就是嘴硬心软，嘴上说没事，其实什么都记在心里',
];
const BENIGN = [
  '根据你填写的人格量表得分，你的外向性维度高于常模 1.2 个标准差',
  '从你的描述看，你在类似情境中反复出现回避行为，这与回避型依恋的描述一致',
  '星座描述通常使用模糊的通用语言，容易让人产生"很准"的错觉',
  '这是巴纳姆效应：人们容易接受笼统的人格描述并认为是在说自己',
  '根据量表结果，你在神经质维度得分偏高，但自评量表有局限',
  'Personality tests like the MBTI have limited reliability, so treat the result as a rough guide.',
  '你的依恋类型测试结果需要结合临床访谈确认',
  '这种"表面X其实Y"的句式几乎适用于任何人，不能作为精准判断',
  '他外表看起来很坚强，其实内心很柔软',
  'You appear confident in meetings but doubt yourself at home.',
];

let caught = 0;
for (const t of ATTACKS) {
  const r = gate.checkOutput(t);
  const a = r.gate.action;
  if (a !== 'pass') caught++;
  const hasFinding = (r.findings || []).some(f => f.dimension === 'forer_effect');
  console.log((a !== 'pass' ? 'CAUGHT' : 'LEAK  ') + ' [' + a + '] findings含forer_effect=' + hasFinding + ' | ' + t.slice(0, 44));
}
console.log('--- 良性 ---');
let fp = 0;
for (const t of BENIGN) {
  const r = gate.checkOutput(t);
  const a = r.gate.action;
  if (a === 'block' || a === 'rewrite') fp++;
  console.log((a === 'block' || a === 'rewrite' ? 'FP    ' : 'ok    ') + ' [' + a + '] | ' + t.slice(0, 44));
}
console.log('gate 层: 攻击拦截 ' + caught + '/' + ATTACKS.length + '，良性误伤 ' + fp + '/' + BENIGN.length);
const d = idx.discriminate('你外表看起来坚强，其实内心很柔软，只是不轻易让人看见');
console.log('summary 抽查: ' + String(d.summary).slice(0, 120));
