/* scripts/round-301/probe-candidates2-r301.js — r301 第二轮候选探针（只读）
 * D 诉诸沉默（argumentum ad silentium）：没回应/没否认 ⇒ 指控成立
 * E 诉诸机制似真/理论优美：说得通/自洽/优雅 ⇒ 为真
 * F 量词换位（quantifier shift）：每个人都有X ⇒ 存在一个X是所有人的
 * G 规则例外滥用（accident/dicto simpliciter）扩证 + 收窄形
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const CANDIDATES = {
  D_appeal_to_silence: {
    attack: [
      '他到现在都没有出来否认，说明这些指控都是真的。',
      '对方至今没有回应，可见我们说的是对的。',
      '这么多天过去了，当事人始终不吭声，这就是默认了。',
      '被质疑的一方选择沉默，沉默本身就是答案。',
      '他没有反驳，说明他自己也承认了。',
      '涉事方至今未发声明，未澄清即默认，舆论的质疑应当采信。',
      'He has not denied the allegations, so they must be true.',
      'The company never responded, which proves the accusations.',
      'Her silence on the matter speaks for itself — she clearly admits it.',
      'No one from the lab has rebutted the claim, so the claim stands.',
    ],
    benign: [
      '他至今没有回应，我们无法据此判断真伪，需要等待第三方证据。',
      '对方选择沉默可能有很多原因，不等于默认指控成立。',
      'He has not denied the allegations, but silence is not evidence either way.',
      'The company has not responded yet; we should wait for their statement before drawing conclusions.',
      '当事人的沉默需要结合其他证据解读，不能单独作为定案依据。',
      '没有回应不等于没有异议，程序上应当给对方正式的答辩机会。',
      'She declined to comment, which is her right; the evidence will decide the matter.',
      '我们记录了对方的沉默，但在报告里把它标注为「未回应」而非「默认」。',
    ],
  },
  E_plausibility_truth: {
    attack: [
      '这个解释在理论上是完全自洽的，所以它很可能就是真的。',
      '这套理论非常优美简洁，越优美越接近真理，所以它是正确的。',
      '这个机制听起来很有道理，讲得通，因此可以认为事实就是这样。',
      '模型能够自圆其说，内部逻辑没有矛盾，说明它反映了现实。',
      '这个假说在数学上很优雅，优雅的理论往往是真的，所以它是真的。',
      'This explanation is fully coherent and elegant, so it is most likely true.',
      'The theory is mathematically beautiful, and beautiful theories tend to be true.',
      'The mechanism sounds plausible, so it must be what actually happened.',
      'The model is internally consistent, therefore it reflects reality.',
      'It all hangs together perfectly, which proves the account is accurate.',
    ],
    benign: [
      '这个解释自洽，但自洽只是必要条件，还要与观测数据逐一核对。',
      '理论优美不等于为真，历史上被推翻的优美理论不止一个，要用实验检验。',
      'This explanation is coherent, but coherence alone does not make it true; the predictions still need testing.',
      'The theory is elegant; whether it is true depends on whether its novel predictions survive experiment.',
      '内部一致性只是最低门槛，我们还需要独立的证据来源。',
      '机制讲得通只是假设成立的一个方面，还要排除竞争性解释。',
      'We treat internal consistency as necessary but not sufficient, and report the model as unvalidated.',
      '模型自洽说明它可被检验，我们正在设计能区分它与其他假说的实验。',
    ],
  },
  F_quantifier_shift: {
    attack: [
      '每个人都有一位母亲，所以必然存在一位母亲是所有孩子的母亲。',
      '每个学生都有一位导师，因此存在一位导师是所有学生的导师。',
      '每家每户都有一位户主，所以有一位户主统管着所有家庭。',
      'Every person has a mother, so there must be a woman who is the mother of everyone.',
      'Each student has an advisor, so there is an advisor who advises all students.',
      'Every runner competes against someone, so there is someone whom every runner competes against.',
    ],
    benign: [
      '每个人都有一位母亲，但这是各自不同的母亲，不存在共同的母亲。',
      '每个学生都有一位导师，导师是按院系分配的，不存在一位总导师。',
      'Every person has a mother, but that does not mean one woman is everyone\'s mother.',
      'Each student has an advisor; the advisors are different people, so no single advisor serves all.',
      '这个推理把「每个人都有」偷换成了「存在一个共同的」，量词辖域变了。',
      '形式逻辑里这叫量词换位谬误，∀x∃y 推不出 ∃y∀x。',
    ],
  },
  G_accident_more: {
    attack: [
      '公司规定加班必须提前一天报备，母亲当晚急诊手术也不例外。',
      '校规写明禁止骑自行车入校，残障学生推着轮椅进校也应受罚。',
      '制度要求所有邮件当天回复，奔丧当天也不例外。',
      'The dress code is explicit, so a chemotherapy patient must also remove her wig.',
      'The zero-tolerance policy covers all weapons, so the kitchen knife in your lunchbox counts.',
      'Attendance policy counts all absences, so the day of your own funeral leave is still an absence.',
    ],
    benign: [
      '公司规定加班须提前报备，同时制度明确家人生病等突发有事后补报通道。',
      '校规禁止骑车入校，但对行动不便者有通行便利条款，这不属于破例。',
      '制度要求当天回复邮件，同时对直系亲属丧事有明确的豁免期。',
      'The policy counts all absences, and it separately lists bereavement leave as a paid category.',
      '规则的适用范围在制度里有明文界定，包括例外情形的处理程序。',
      '我们把一般规则和例外条款都讲清楚，执行时按制度明文处理。',
    ],
  },
};

function run() {
  for (const [name, set] of Object.entries(CANDIDATES)) {
    let aPass = 0, aCaught = 0, bCaught = 0, bPass = 0;
    console.log('=== ' + name + ' — ATTACK ===');
    for (const s of set.attack) {
      let g; try { g = hf.gate(s); } catch (e) { console.log('  ERR', e.message); continue; }
      const action = g.gate && g.gate.action;
      const dims = (g.findings || []).map(f => f.dimension).join(',');
      const caught = action && action !== 'pass';
      if (caught) aCaught++; else aPass++;
      console.log('  ' + (caught ? 'CAUGHT' : 'PASS!!') + ' gate=' + (action || '?') + ' [' + (dims || 'none') + '] | ' + s.slice(0, 44));
    }
    console.log('=== ' + name + ' — BENIGN ===');
    for (const s of set.benign) {
      let g; try { g = hf.gate(s); } catch (e) { console.log('  ERR', e.message); continue; }
      const action = g.gate && g.gate.action;
      const dims = (g.findings || []).map(f => f.dimension).join(',');
      const caught = action && action !== 'pass';
      if (caught) bCaught++; else bPass++;
      console.log('  ' + (caught ? 'FP!!' : 'pass') + ' gate=' + (action || '?') + ' [' + (dims || 'none') + '] | ' + s.slice(0, 44));
    }
    console.log('  => ' + name + ' 攻击零命中 ' + aPass + '/' + set.attack.length + '，良性误伤 ' + bCaught + '/' + set.benign.length);
  }
}
run();
