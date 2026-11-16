#!/usr/bin/env node
'use strict';
/* r362 FP 嫌疑组合复查：新族 × 非分组域共现是否误命中 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const wr = require(path.join(ROOT, 'src', 'will-rogers-phenomenon.js'));
const hf = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t) => wr.detectWillRogersPhenomenon(t).hit === true;

const SUSPECTS = [
  // ACROSS_EN × 非指标名词（应收紧后不命中）
  'Re-sorting the inbox improved response times across the board.',
  'After the regroup, throughput rose across the board.',
  'Reclassifying the tickets sped up processing across the board.',
  // ACROSS_EN 攻击形仍须命中
  'Regrouping the classes lifted scores across the board.',
  'Re-stratifying the wards raised survival rates across the board.',
  // FORALL_EN 非分组域
  'After the re-sort of the files, load times rose for everyone.',
  // ALL_EN 非分组域
  'The cabinet reshuffle improved morale for everyone.',
  'After the re-sort, everyone in the office felt better about the new layout.',
  // BOTHOBJ_EN 非分组域（无腿①）
  'The new tutorial improved both groups of volunteers in the study.',
  // REDRAWN_EN 非分组域
  'The battle lines were redrawn after the debate.',
  'Once the map was redrawn, both routes looked shorter.',
  // BETWEEN_EN 非分组域
  'The mediator moved some concessions between the parties, and both sides fared better.',
  // RECLASS2_ZH 非分组域
  '调整了一下分层之后，两个文件夹的加载速度都快了。',
  '重新分了层，两栋楼的出租率都上升了。',
  // IDIOM 扩词非分组域
  '重新分组之后，两组的病例数屡创新高。',
];

let fp = 0;
for (const s of SUSPECTS) {
  const h = hit(s);
  const g = hf.check(s);
  if (h) fp++;
  console.log((h ? 'HIT ' : 'miss') + ' gate=' + g.action + ' | ' + s.slice(0, 58));
}
console.log('嫌疑组合模块命中 = ' + fp + '/' + SUSPECTS.length);
