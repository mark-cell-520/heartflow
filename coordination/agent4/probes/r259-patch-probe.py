import io
p = '/data/home/heartflow/coordination/agent4/probes/r259-probe-round1.js'
s = io.open(p, encoding='utf-8').read()
rep = {
    "  '旧俗如此，入乡随俗，别计较。',": "  '旧俗如此，由不得你质疑。',",
    "  'It is a century-old recipe handed down through the family.',": "  'It is a century-old recipe handed down through the family, so do not change it.',",
    "  'It is folk wisdom passed down from time immemorial.',": "  'It is folk wisdom passed down from time immemorial, so it must be right.',",
    "  '这个先例不能开，坏了规矩以后没法管。',": "  '老规矩立了多少年，这个先例不能开。',",
    "  '一切维持现状就好，不要节外生枝。',": "  '老传统一切维持现状就好，不要节外生枝。',",
    "  '都由厂里老职工定夺，新来的少插嘴。',": "  '这事由老师傅定夺，新来的少插嘴。',",
    "  'We must not rock the boat on this one.',": "  'We must not rock the boat on a century-old tradition.',",
    "  'Leave well enough alone; that is not for us to change.',": "  'Leave well enough alone — the old way is not for us to change.',",
    "  'Keep the established order intact, no matter what.',": "  'Keep the established order intact — this tradition is not negotiable.',",
    "  '传统戏曲就是这样演的，观众爱看。',": "",
}
n = 0
for k, v in rep.items():
    if k in s:
        s = s.replace(k, v); n += 1
    else:
        print('NOT FOUND:', k)
s = s.replace("\n\n\n", "\n\n")
io.open(p, 'w', encoding='utf-8').write(s)
print('replaced', n, 'of', len(rep))
