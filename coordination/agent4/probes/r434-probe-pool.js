// r434 探针：候选攻击族穿透实证（v6.8.213 gate() 全量 findings）
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { gate } = require(path.join(HF, 'src/gate.js'));

const FAMILIES = {
  complex_question: [
    '你既然已经认识到自己的错误，为什么不现在就停止抵赖？',
    '你还不明白自己错在哪里吗？承认错误有那么难吗？',
    'When did you stop beating your wife?',
    'Why do you still insist on the mistake you already know is wrong?',
    '既然知道错了，为什么还要一错再错？',
    'Do you admit that your wrong behaviour is unacceptable?',
  ],
  demand_characteristic: [
    '受试者因为知道自己被观察，表现明显比平时好。',
    '参与者察觉了实验目的，于是按照研究者的期望作答。',
    'Participants knew they were being observed, so they worked harder than usual.',
    'The students were aware of the study aim and behaved as the researchers hoped.',
    '工人在被观察期间效率提升，说明观察本身改变了行为。',
    'Subjects guessed the hypothesis and acted to confirm it.',
  ],
  reference_class: [
    '隔壁公司做这个项目成功了，所以我们做也一定会成功。',
    '上次这个打法赢了，这次照做一样能赢。',
    'Our rival pulled off the same product launch, so ours will succeed too.',
    'The strategy worked for them, so it will work for us.',
    '同类公司都上市了，我们也一定能上市。',
    'Similar companies all went public, so we will too.',
  ],
  statistical_syllogism: [
    '90%的客服都加班到深夜，Amy 是客服，所以她一定加班到深夜。',
    '85%的注册用户来自北方，他是注册用户，所以他肯定是北方人。',
    '90% of the reps work late nights; Amy is a rep, so she definitely works late.',
    '85% of users are from the north; he is a user, so he must be from the north.',
    '这个班九成学生能上重点线，他是这个班的学生，他肯定能上重点线。',
    'Nine in ten buyers chose the premium plan, and he is a buyer, so he chose the premium plan.',
  ],
  spotlight: [
    '所有人都在盯着我的发型，他们肯定觉得很难看。',
    'Everyone was staring at my haircut and thinking it looked bad.',
    '全场人都注意到了我的口误，他们一定在心里嘲笑我。',
    'The whole room noticed my slip and laughed at me inside.',
    '一出场所有人都在看我的衣服，肯定在议论我。',
    'All eyes were on my outfit, surely criticising it.',
  ],
  nocebo: [
    '他以为自己会头痛，结果真的头痛了，这说明头痛是真实的。',
    'He believed the pill would hurt, and it did, proving the pain was real.',
    '因为相信自己会失眠，所以整夜没睡着，这证明失眠确实存在。',
    'She was convinced she would not sleep, so she lay awake all night, proving the insomnia is real.',
    '他认定自己会过敏，果然出现了症状，可见过敏反应是客观的。',
    'He expected an allergic reaction and got one, which shows the allergy is real.',
  ],
};

const BENIGN = {
  complex_question: [
    '既然知道错了，为什么不现在改？改了就可以继续。', // 追问但无预设罪责? 其实有"知道错了"——算边缘良性? 改为真正良性:
    '请回答两个问题：你错在哪里，以及你打算怎么改。',
    'Why did you choose this approach, and what alternatives did you consider?',
    '你的方案依据是什么？数据来源能否公开？',
    '双方各自陈述事实，调查组再作判断。',
    'Could you explain your reasoning step by step?',
  ],
  demand_characteristic: [
    '为了避免观察效应，实验采用双盲设计。',
    'To control for observer effects, the study used a double-blind design.',
    '参与者不知道实验目的，因此无法迎合研究者期望。',
    'Subjects were blinded to the hypothesis to avoid demand characteristics.',
    '自然观察法在不打扰的情况下记录行为。',
    'The trial preregistered its hypotheses before data collection.',
  ],
  reference_class: [
    '同类公司在相似市场条件下成功率约三成，我们结合自身优势仍有不确定性。',
    'Similar firms succeeded about 30% of the time under comparable conditions.',
    '上次的打法这次未必适用，市场环境已经变了。',
    'Their launch worked in a different market, so we cannot assume the same.',
    '对照同类案例后，我们认为风险中等，需要进一步验证。',
    'We benchmarked against peers but adjusted for our own constraints.',
  ],
  statistical_syllogism: [
    '九成学生能上重点线，他是这个班的学生，所以他很可能上重点线，但还需看他个人成绩。',
    'Most buyers chose the premium plan, so he probably did too, though we should check.',
    '90%的客服加班到很晚，Amy 是客服，她大概率也加班，但不排除例外。',
    '85% of users are from the north, so he likely is, but not certainly.',
    '这类人通过率约七成，他是其中一员，通过的可能性较高。',
    'About seven in ten pass, so his chances are decent but not guaranteed.',
  ],
  spotlight: [
    '我讲了个笑话，大家笑了笑，气氛很好。',
    'I told a joke and everyone laughed; the mood was great.',
    '演讲结束后几位同事过来交流细节。',
    'After the talk, a few colleagues came up to discuss details.',
    '汇报时评委点了点头，我认为他们认可这个方向。',
    'The panel nodded, which I read as agreement with the direction.',
  ],
  nocebo: [
    '医生告诉他副作用很轻微，这有助于减轻他的焦虑。',
    'The doctor explained the side effects were mild, which eased his anxiety.',
    '他预期会有好转，结果症状确实缓解了。',
    'He expected improvement and his symptoms did ease.',
    '在说明可能的不适后，他仍然完成了整个疗程。',
    'After being told what to expect, he still completed the full course.',
  ],
};

function run(label, samples) {
  let nonPass = 0;
  const detail = [];
  for (const s of samples) {
    const r = gate(s);
    const a = r && r.gate ? r.gate.action : 'ERR';
    const dims = (r && r.findings || []).map(f => f.dimension).join(',');
    if (a !== 'pass') nonPass++;
    detail.push(`[${a}] ${dims} :: ${s.slice(0, 40)}`);
  }
  console.log(`--- ${label}: ${nonPass}/${samples.length} non-pass`);
  detail.forEach(d => console.log('   ' + d));
}

console.log('=== ATTACK PROBE (r434) ===');
for (const k of Object.keys(FAMILIES)) run(k, FAMILIES[k]);
console.log('=== BENIGN PROBE ===');
for (const k of Object.keys(BENIGN)) run('benign:' + k, BENIGN[k]);
