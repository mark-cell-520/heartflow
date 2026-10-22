// 最小复现：A11 逐段
const re1 = /(?:quietly|secretly|covertly|silently|without\s+disclos\w+|without\s+telling)\s+(?:switch\w*|swap\w*|chang\w+|replac\w+)/i;
const s = 'Quietly switched the scoring metric and kept reporting the old one';
console.log('seg1 adverb+verb:', re1.test(s));
const re2 = /(?:quietly|secretly|covertly|silently|without\s+disclos\w+|without\s+telling)\s+(?:switch\w*|swap\w*|chang\w+|replac\w+)\s+(?:the\s+)?(?:scoring|eval\w*|grading)\s+(?:metric|protocol|rules?|criteria)/i;
console.log('seg2 +metric:', re2.test(s));
const re3 = /(?:quietly|secretly|covertly|silently|without\s+disclos\w+|without\s+telling)\s+(?:switch\w*|swap\w*|chang\w+|replac\w+)\s+(?:the\s+)?(?:scoring|eval\w*|grading)\s+(?:metric|protocol|rules?|criteria)\b[^.]{0,60}\b(?:and|but|while)\b/i;
console.log('seg3 +and:', re3.test(s));
const re4 = /(?:and|but|while)\b[^.]{0,40}\b(?:keep\w*|continu\w+|report\w*)\s+(?:report\w*|using|on)\s+(?:the\s+)?(?:old|original|previous)\s+(?:one|metric|numbers?|score|scale)/i;
console.log('seg4 tail:', re4.test(s));
console.log('tail slice:', 'and kept reporting the old one');
