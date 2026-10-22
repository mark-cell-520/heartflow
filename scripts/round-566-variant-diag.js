'use strict';
const t = 'At least I did not do worse than they did.';
const variants = {
  v1: /\bat\s+least\s+(?:i|we)\s+(?:did\s+not|didn't|have\s+not)\s+(?:do|behave\s+)?(?:any\s+)?(?:worse|as\s+bad|so\s+bad|worse\s+than)\b/i,
  v2: /at\s+least\s+(?:i|we)\s+(?:did\s+not|didn't|have\s+not)\s+(?:do|behave\s+)?(?:any\s+)?(?:worse|as\s+bad|so\s+bad|worse\s+than)\b/i,
  v3: /\bat\s+least\s+(?:i|we)\s+(?:did\s+not|didn't)\s+(?:do|behave\s+)?(?:any\s+)?(?:worse)\b/i,
  v4: /\bat\s+least\s+(?:i|we)\s+(?:did\s+not|didn't)\s+(?:do)\s+(?:worse)\b/i,
};
for (const k of Object.keys(variants)) console.log(k, variants[k].test(t));
