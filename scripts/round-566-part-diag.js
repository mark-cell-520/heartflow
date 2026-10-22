'use strict';
const t = 'At least I did not do worse than they did.';
const parts = [
  /\bat\s+least\s+/i,
  /\bat\s+least\s+(?:i|we)/i,
  /\bat\s+least\s+(?:i|we)\s+(?:did\s+not)\b/i,
  /\bat\s+least\s+(?:i|we)\s+(?:did\s+not)\s+do\b/i,
  /\bat\s+least\s+(?:i|we)\s+(?:did\s+not)\s+(?:do)\s+(?:worse)\b/i,
  /\bat\s+least\s+(?:i|we)\s+(?:did\s+not)\s+(?:do)\s+(?:worse)\s+than\b/i,
  /\bat\s+least\s+(?:i|we)\s+(?:did\s+not)\s+(?:do)\s+(?:worse)\s+than\s+they\b/i,
];
parts.forEach((p, i) => console.log(i, p.test(t)));
