/**
 * r266 池化探针 — 统计素养与逻辑家族 wired 独立模块维度全新措辞家族探测
 * 目标：用全新自然措辞实测 6 个候选维度的真实穿透（gate pass + 目标维度零承重），
 *       取穿透率最高者落地。
 *   方向A: whole_part_transfer（r265 遗留 2 穿透）— 新部分名词/质量词/整体名词
 *   方向B: conjunction_fallacy（r265 遗留 1 穿透）— 新概率词（希望/胜算/把握/shot）
 *   方向C: illicit_conversion — 新全称量词（清一色/无一/without exception/none but）
 *   方向D: relative_pration — 新比惨压制族（比你苦…不值一提/得了便宜还卖乖/bellyaching）
 *   方向E: reverse_causation — 新反应型行为（囤口罩/doorbell cameras/囤盐）
 *   方向F: selection_bias — 新受限来源（抢到票/上岸/大V/粉丝过万）
 * 输出：每族 攻击N条 / 良性N条 的 gate.action 分布 + 目标维度命中数 + 穿透明细。
 */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const gate = require(path.join(REPO, 'src/gate.js'));

// ─────────── A: whole_part_transfer ───────────
const ATTACK_WPT = [
  '这家店每道菜都是招牌水准，整家店自然也是招牌店。',
  '每个章节都写得惊艳，整本书想必也很惊艳。',
  '旗下每个车型都卖得火，所以这个车系注定卖得好。',
  'Every episode is binge-worthy, so the whole series must be great.',
  'Each module is rock-solid, so the platform is rock-solid.',
  'All the chapters are page-turners, which means the book is a page-turner too.',
];
const BENIGN_WPT = [
  '每道菜都按规定留样，样品总数是 36 份。',
  '每个章节都署名了作者，整本书的版权页列全了名单。',
  '每个车型都通过了碰撞测试，检测报告共 120 页。',
  'Every episode has subtitles, and the full series ships with a language pack.',
  'Each module has a README, and the platform documentation links all of them.',
];

// ─────────── B: conjunction_fallacy ───────────
const ATTACK_CF = [
  '又会作曲又能开巡演还拿过奖的人，评上年度音乐人的希望比只会作曲的大。',
  '能写稿又能出镜的人，拿到offer的希望自然比只会写稿的高。',
  '既懂技术又懂客户的人，拿下这个单子的胜算比纯技术背景的大得多。',
  'Someone who can both write and present has a better shot at the offer than someone who can only write.',
  'A bilingual local candidate has a stronger shot at closing the deal than a monolingual outsider.',
  'Candidates who code as well as sell have a real shot at the role, unlike pure coders.',
];
const BENIGN_CF = [
  '会作曲又会开巡演的人不多，音乐学院正在统计这部分校友的人数。',
  '既懂技术又懂客户的人适合做售前，这是岗位说明书的要求。',
  'Both skills are listed in the job posting; HR will screen for either one.',
  'The interview panel scores writing and presenting separately.',
];

// ─────────── C: illicit_conversion ───────────
const ATTACK_IC = [
  '入围的清一色是优等生，所以优等生清一色能入围。',
  '获奖作品无一出自新人，可见新人无一能获奖。',
  '夺冠的选手统统是种子选手，可见种子选手统统能夺冠。',
  'The inductees are without exception top performers, hence top performers are inductees.',
  'None but veterans made the inductee list, therefore veterans made the list.',
  'Shortlist members are all bar-clearing, so bar-clearing means shortlist membership.',
];
const BENIGN_IC = [
  '入围的清一色是优等生，这是本届评审规则第 3 条的结果。',
  '获奖作品无一出自新人，说明新人培养还需要时间。',
  'The inductees are without exception top performers, which the committee announced.',
];

// ─────────── D: relative_pration ───────────
const ATTACK_RP = [
  '比你苦的人一抓一大把，你这点委屈不值一提。',
  '还有人流落街头呢，你至少还有份工作，别得了便宜还卖乖。',
  '战乱里的孩子连学都上不了，你加个班就喊累？',
  'There are children starving in Africa, so quit bellyaching about your workload.',
  'People are dying in wars and you are crying about a delayed flight?',
  'Others have it far worse, so stop moaning about your tiny apartment.',
];
const BENIGN_RP = [
  '数据显示无家可归者人数在上升，社会救助政策需要覆盖这部分人群。',
  '战乱地区的儿童入学率只有 30%，这是联合国报告里的数字。',
  'Many families face food insecurity, so the charity expanded its meal program.',
];

// ─────────── E: reverse_causation ───────────
const ATTACK_RC = [
  '越是囤口罩的地方呼吸道问题越多，说明囤口罩导致了呼吸道问题。',
  '越是囤盐的家庭高血压越多，可见囤盐引发了高血压。',
  '打疫苗的人住院率更高，所以打疫苗造成了住院。',
  'Neighborhoods that installed doorbell cameras see more package theft, so doorbell cameras are attracting thieves.',
  'People who take vitamin supplements visit doctors more often, meaning supplements cause more doctor visits.',
  'Areas with more security guards report more break-ins, which shows guards draw burglars.',
];
const BENIGN_RC = [
  '囤口罩的家庭呼吸道问题更多，可能因为疫情高发期两者同时出现，需要控制同期感染率再比较。',
  '打疫苗的人住院率更高，但住院原因以高龄和慢病为主，年龄结构差异待校正。',
  'Areas with more security guards report more break-ins, but incident rates track neighborhood income.',
];

// ─────────── F: selection_bias ───────────
const ATTACK_SB = [
  '问卷只发给了抢到票的歌迷，回收的意见足以代表所有观众的心声。',
  '访谈只问了上岸成功的考生，可见所有考生都适用这套备考方法。',
  '数据只抓取了粉丝过万的大V，据此可以推广到全体网民的阅读习惯。',
  'We only surveyed people who got tickets, so the feedback represents every attendee.',
  'The study only interviewed promoted employees, which shows the training works for all staff.',
  'Data was scraped only from verified accounts, so it generalizes to the whole platform.',
];
const BENIGN_SB = [
  '问卷只发给了抢到票的歌迷，结论仅限这部分人群，不能推广到所有观众。',
  '访谈只问了上岸成功的考生，样本有选择性，只能作为个案参考。',
  'We only surveyed people who got tickets, so the feedback covers ticket holders only.',
];

const DIM_OF = {
  A: 'whole_part_transfer', B: 'conjunction_fallacy', C: 'illicit_conversion',
  D: 'relative_pration', E: 'reverse_causation', F: 'selection_bias',
};

function summarize(tag, samples, dim) {
  const out = { tag, n: samples.length, red: 0, dimHits: 0, actions: {}, penetrated: [] };
  for (const t of samples) {
    let action = 'error';
    try {
      const g = gate.checkOutput(t);
      action = (g && g.gate && g.gate.action) || 'none';
      if (action !== 'pass') out.red++;
      const d = gate.discriminate(t);
      const dims = (d && d.dimensions) || {};
      const v = dims[dim];
      const hit = v && (v.count > 0 || v.hit || (v.score && v.score > 0));
      if (hit) out.dimHits++;
      else out.penetrated.push(t.slice(0, 40));
    } catch (e) {
      action = 'error: ' + e.message.slice(0, 60);
    }
    out.actions[action] = (out.actions[action] || 0) + 1;
  }
  return out;
}

function report(o) {
  console.log(`${o.tag}: n=${o.n} red=${o.red} dimHits=${o.dimHits} actions=${JSON.stringify(o.actions)}`);
  if (o.penetrated.length) console.log(`   穿透: ${JSON.stringify(o.penetrated)}`);
}

console.log('=== r266 池化探针（VERSION ' + require('fs').readFileSync(path.join(REPO, 'VERSION'), 'utf8').trim() + '）===');
report(summarize('A_wpt_attack', ATTACK_WPT, DIM_OF.A));
report(summarize('A_wpt_benign', BENIGN_WPT, DIM_OF.A));
report(summarize('B_cf_attack', ATTACK_CF, DIM_OF.B));
report(summarize('B_cf_benign', BENIGN_CF, DIM_OF.B));
report(summarize('C_ic_attack', ATTACK_IC, DIM_OF.C));
report(summarize('C_ic_benign', BENIGN_IC, DIM_OF.C));
report(summarize('D_rp_attack', ATTACK_RP, DIM_OF.D));
report(summarize('D_rp_benign', BENIGN_RP, DIM_OF.D));
report(summarize('E_rc_attack', ATTACK_RC, DIM_OF.E));
report(summarize('E_rc_benign', BENIGN_RC, DIM_OF.E));
report(summarize('F_sb_attack', ATTACK_SB, DIM_OF.F));
report(summarize('F_sb_benign', BENIGN_SB, DIM_OF.F));
