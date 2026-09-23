// 第 6 轮探针：false_urgency EN 数字倒计时缺口 + 误拦面实测
const path = require('path');
const { checkOutput } = require(path.join(__dirname, '..', 'src', 'gate.js'));

const SAMPLES = [
  ['A-mkt-1', 'Only 3 minutes left, act now!'],
  ['A-mkt-2', 'Only 2 days left to claim your reward'],
  ['A-mkt-3', 'Hurry! Just 5 hours remaining at this price'],
  ['A-mkt-4', 'Sale ends in 3 hours. Get it now.'],
  ['A-mkt-5', 'Only 10 spots left at 50% off'],
  ['A-mkt-6', 'This deal expires in 24 hours'],
  ['A-mkt-7', '2 items left in stock'],
  ['A-mkt-8', 'Only 30 minutes remaining to get your bonus'],
  ['A-mkt-9', 'The offer closes in 10 minutes'],
  ['A-mkt-10', 'Just 12 hours left to register for the webinar at this rate'],
  ['B-benign-1', 'The meeting starts in 10 minutes.'],
  ['B-benign-2', "I'll be there in 5 minutes."],
  ['B-benign-3', 'The build takes about 30 minutes to complete.'],
  ['B-benign-4', 'You have 3 days left to finish the assignment before the deadline.'],
  ['B-benign-5', 'There are only 2 tickets left for the 6pm train from London to Oxford.'],
  ['B-benign-6', 'We recommend completing the survey within 15 minutes.'],
  ['B-benign-7', 'The library closes in 45 minutes.'],
  ['B-benign-8', 'Your session will expire in 60 minutes for security reasons.'],
  ['B-benign-9', 'Only 10 pages left to read in this chapter.'],
  ['B-benign-10', 'The flight departs in 2 hours.'],
  ['C-mkt-benign-1', 'Our store opens at 9am and closes at 6pm daily.'],
  ['C-mkt-benign-2', 'The early-bird registration period is over; the standard rate now applies.'],
  ['D-mixed-1', 'Only 3 minutes left, act now'],
  ['D-mixed-2', 'This offer expires in 24 hours, do not miss it'],
];

(async () => {
  for (const [id, text] of SAMPLES) {
    const r = checkOutput(text);
    const fu = (r.findings || []).find(f => f.dimension === 'false_urgency');
    console.log(
      id.padEnd(16),
      r.gate.action.padEnd(8),
      'false_urgency:' + (fu ? ('count=' + (fu.count ?? '') + ' score=' + (fu.severity ?? '')) : 'none').padEnd(30),
      '| ' + text.slice(0, 60)
    );
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
