'use strict';
/** probe-r736-si-unit.js — 单测 checkSilenceImputation 确认真实命中状态 */
const path = require('path');
const HF = path.join(__dirname, '..', '..');
const { checkSilenceImputation } = require(path.join(HF, 'src', 'silence-imputation.js'));

const CASES = [
  // 疑似漏判
  '拒绝了采访，显然是心虚。',
  '她不反驳，就等于承认了。',
  '一直不回应，就是无声的抗议。',
  '他不接电话，显然是在逃避。',
  '面对指控拒不开口，这说明什么已经很明显了。',
  'She refused to comment on the allegations.',
  'The committee stonewalled the investigation.',
  // 已知命中锚点
  '你不说话就是默认了。',
  '他保持沉默，说明心里有鬼。',
  'Silence means consent.',
  'His silence speaks volumes about his guilt.',
  // 良性（应不判）
  '他没有回应这个指控。',
  '她选择了沉默以保全尊严。',
  '被告在整个审讯过程中保持沉默。',
];
for (const s of CASES) {
  const r = checkSilenceImputation(s);
  console.log(`${r.hit ? 'HIT ' : '----'} ${s}${r.hit ? '  detail=' + r.detail : ''}`);
}
