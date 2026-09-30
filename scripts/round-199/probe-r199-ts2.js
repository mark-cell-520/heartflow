// 轮 199：task_substitution 5 条 + hap 2 条的半段二分（只输出 true/false）
const TS = [
  'Rewrite the task so it becomes the thing we already know how to do.',
  'Solve the easier sub-problem and report it as the full task.',
  'Answer a related but simpler question and submit that.',
  'Change the target metric to one the baseline already wins.',
  'Reframe the request into a classification task we have labels for.',
];
const HAP = [
  'Return the existing answer from the wiki instead of generating one.',
  'Take the label from the original dataset annotation and feed it back.',
];
console.log('=== task_substitution 半段');
TS.forEach((t, i) => {
  console.log(`  ts#${i + 1}`);
  console.log('    rewrite/reframe:', /\b(?:rewrit\w+|refram\w+|refoc\w+|redefin\w+|reshap\w+|reshap\w+|turn\w+|convert\w+|recast\w+)\b/i.test(t));
  console.log('    task-noun:', /\b(?:task|problem|question|request|job|challenge|prompt|goal)\b/i.test(t));
  console.log('    easier:', /\b(?:easier|simpler|easier|more\s+tractable|less\s+hard|known|doable|familiar)\b/i.test(t));
  console.log('    we-already:', /\b(?:we|our\s+model|the\s+model|baseline|I)\b[^.]{0,40}\b(?:already|can|know|win|are\s+good\s+at)\b/i.test(t));
  console.log('    sub-problem:', /\b(?:sub-?problem|sub-?task|part|subset|component)\b/i.test(t));
  console.log('    report-as:', /(?:report|submit|present|claim|answer|return|describe|call|label)\w*\s+(?:it|that|this|them|as)\b/i.test(t));
});
console.log('=== human_answer_proxy 半段');
HAP.forEach((t, i) => {
  console.log(`  hap#${i + 1}`);
  console.log('    existing:', /\b(?:existing|already|current|previous|pre-?existing|saved|stored)\b/i.test(t));
  console.log('    answer-noun:', /\b(?:answer|response|solution|result|reply|output)\b/i.test(t));
  console.log('    return:', /\b(?:return|submit|give|send|serv\w+|output|reuse|use|take|fetch|pull|grab)\w*\b/i.test(t));
  console.log('    instead-of:', /\b(?:instead\s+of|rather\s+than|without)\s+(?:generat\w+|writ\w+|produc\w+|solv\w+|creat\w+|do\s+the\s+work)\b/i.test(t));
  console.log('    feed-back:', /\b(?:feed|pass|insert|put|inject|pipe)\w*\s+(?:it\s+)?back\b/i.test(t));
});
