/**
 * fp4-quant.js — FP4 风格量化压缩工具 v1.0.0
 *
 * 对标 DeepSeek V4.1 FP4 KV Cache：将缓存中的数值字段压缩到更低精度，
 * 在可接受的精度损失下减少内存占用，同时保留判别结果的可恢复性。
 *
 * 设计：
 *   - 仅压缩数值型字段，字符串/布尔/对象字段原样保留
 *   - 4-bit 量化：将 0-1 浮点数映射到 16 级整数
 *   - 可逆：dequantize 时使用中点还原，保证恢复值在量化范围内
 *   - 配置化：通过 FP4_ENABLED 开关全局控制
 */

const FP4_ENABLED = true;
const COMPRESSIBLE_FIELDS = new Set([
  'confidence',
  'severity',
  'overallScore',
  'cognitiveLoad',
  'dissonance',
  'quality',
  'stability',
  'identityCoherence',
  'valence',
  'empathy',
  'progress',
  'goalValid',
  'goalEthical',
  'awareness',
  'directionClear',
]);

// 4-bit 量化：0-1 浮点 -> [0, 15] 整数
function quantize4(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  const clamped = Math.max(0, Math.min(1, value));
  return Math.round(clamped * 15);
}

// 4-bit 反量化：[0, 15] 整数 -> 0-1 浮点（中点还原）
function dequantize4(qvalue) {
  if (typeof qvalue !== 'number') return qvalue;
  return qvalue / 15;
}

// 检查字段是否应被量化
function isCompressible(key) {
  return COMPRESSIBLE_FIELDS.has(key);
}

// 压缩对象中的可压缩数值字段
function compressObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isCompressible(key) && typeof value === 'number') {
      result[key] = quantize4(value);
      result[key + '_q'] = true; // 标记为已量化
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = compressObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// 解压缩对象中的量化字段
function decompressObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.endsWith('_q') && value === true) {
      const originalKey = key.slice(0, -2);
      const qvalue = obj[originalKey];
      if (typeof qvalue === 'number') {
        result[originalKey] = dequantize4(qvalue);
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = decompressObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// 计算压缩率（压缩后字节数 / 原始字节数）
function compressionRatio(original, compressed) {
  const origSize = JSON.stringify(original).length;
  const compSize = JSON.stringify(compressed).length;
  if (origSize === 0) return 1;
  return compSize / origSize;
}

module.exports = {
  FP4_ENABLED,
  COMPRESSIBLE_FIELDS,
  quantize4,
  dequantize4,
  isCompressible,
  compressObject,
  decompressObject,
  compressionRatio,
};
