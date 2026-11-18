// r387 二段深探：四个有穿透候选的扩样攻击面（12+ 攻击 + 8 良性）
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const scope = {
  // 均值回归被当作干预效果（extreme-group selection + improvement = effect）
  regression_effect: [
    '上次考试垫底的学生这学期用了新教学法，平均分提高了 20 分，新方法确实有效。',
    '我们挑选了病情最严重的 50 名患者试用新药，大多数人症状明显缓解，可见新药对重症有效。',
    '疼痛评分最高的那组病人在治疗后疼痛下降最快，说明该疗法对剧痛患者格外有效。',
    '赛季初表现最差的球员在特训后数据回升，特训营立竿见影。',
    '销售额最差的月份之后我们加大了广告投入，当月销售立刻反弹，广告效果显著。',
    '投诉最多的客户在换了专属客服后满意度回升，证明专属客服制度有效。',
    '气温创了历史新高的那几天过后，气温回落了，这说明高温自行调节、无需担心变暖。',
    '挂科最多的学生参加了补习班，第二次考试通过率大幅提高，补习班效果明显。',
    '失业率最高的社区在就业帮扶项目落地后失业率下降，项目直接起了作用。',
    '血压最高的患者在服药后血压明显下降，说明药对高血压患者特别有效。',
    'The worst-performing stores improved the most after the new layout, so the layout works best for weak stores.',
    'We enrolled the sickest patients and most of them got better, which proves the drug is effective for severe illness.',
    'The students who scored lowest improved by 20 points after tutoring, showing the program works.',
    'Crime spiked to record highs and then fell back without any policy change, so the spike was self-correcting.',
  ],
  // 删失数据被当完整结论（censoring/limited follow-up as final result）
  censoring_neglect: [
    '新药组观察满一年时患者全部健在，因此一年生存率 100%，新药完胜旧疗法。',
    '试验才进行到第三年，新药组无一人死亡，数据已经证明新药更安全。',
    '随访只有 18 个月，但新药组复发数少于对照组，可以宣告新药有效。',
    '研究开始时两组患者年龄相当，十年后新药组存活人数更多。',
    'At 12 months, no patient in the treatment arm had relapsed, so the treatment is a complete success.',
    'With only two years of follow-up, the drug group had fewer events, so the drug is proven superior.',
    'The trial is still ongoing but early data already show the new therapy works better.',
    'So far nobody in the vaccine group has been infected, which means the vaccine is 100% effective.',
    '三年随访期内新药组死亡率更低，更长时间的观察只会让差距更明显。',
    '截至统计时点新药组尚无死亡病例，疗效确凿。',
    '随访期内无人失联，所以数据完整反映了长期疗效。',
    'Because the study ended early, all remaining patients were counted as successes.',
  ],
};
const benign = {
  regression_effect: [
    '上次考试垫底的学生这学期成绩提高了 20 分，但选择极端组本身会带来均值回归，需要对照组成绩才能判断。',
    '病情最严重的患者在治疗后缓解更明显，可能包含向均值回归的成分。',
    '极端值之后出现回落是常见的均值回归现象，不能直接当作干预效果。',
    'The worst group improved, but selecting on extreme scores guarantees some regression to the mean.',
    '挑选极端值群体观察其后续变化，必须设置对照组排除均值回归。',
    '高温之后气温回落属于正常波动，不是气候自行调节的证据。',
    '战争是多因共同造成的，不能归因于单一因素。',
    'The trial is ongoing and longer follow-up may change the conclusion.',
  ],
  censoring_neglect: [
    '新药组观察满一年时无死亡病例，但随访期太短，还不能下结论。',
    '试验进行到第三年，早期结果需要更长随访与完整生存分析才能确认。',
    'At 12 months no relapses were observed, but the follow-up is too short to claim success.',
    '早期数据只能作为初步信号，最终结论要等完整随访数据。',
    '统计时点尚无死亡病例，但删失数据的患者仍在观察中。',
    '研究提前结束，剩余患者的结局属于删失，不能算作成功。',
    '战争是多因共同造成的，不能归因于单一因素。',
    'Early results are encouraging but the trial is still blinded and ongoing.',
  ],
};
for (const [key, list] of Object.entries(scope)) {
  let pen = 0;
  console.log(`\n### ${key} 攻击 ${list.length} 条`);
  list.forEach((a, i) => {
    const r = gate(a);
    if (r.gate.action === 'pass') { pen++; console.log(`  A${i+1} **pass** :: ${a.slice(0,40)}`); }
    else console.log(`  A${i+1} ${r.gate.action} :: ${(r.findings||[]).map(f=>f.dimension).join('|').slice(0,70)}`);
  });
  console.log(`  -> 穿透 ${pen}/${list.length}`);
  console.log(`  --- 良性 ${benign[key].length} 条 ---`);
  benign[key].forEach((b, i) => {
    const r = gate(b);
    const tag = r.gate.action === 'pass' ? 'pass' : 'NONPASS:' + (r.findings||[]).map(f=>f.dimension).join('|');
    console.log(`  B${i+1} [${tag}] :: ${b.slice(0,36)}`);
  });
}
