from rationality_engine import evaluate, decide, Constraint
# Test evaluate
result = evaluate('提高产品质量', '减少缺陷率', ['生产线速度必须不超过100单位/小时', '操作员培训必须达到80%合格率'])
print('Evaluate result:', result.status.value, 'neural_score:', result.neural_score)
# Test decide
options = [{'cost': 100, 'time': 10}, {'cost': 200, 'time': 5}]
constraints = [Constraint(**c) for c in [{'factor': 'cost', 'breakpoint': 150, 'operator': '<'}, {'factor': 'time', 'breakpoint': 8, 'operator': '<'}]]
dec = decide('最小化成本和时间', options, constraints)
print('Decide result:', dec.get('decision'))
if 'selected' in dec:
    print('Selected option:', dec['selected'])
print('All tests passed.')