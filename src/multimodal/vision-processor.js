/**
 * 视觉处理器 (Vision Processor) v1.0.0
 *
 * 图像处理基础能力
 */

const fs = require('fs');
const path = require('path');

class VisionProcessor {
  constructor(options = {}) {
    this.supportedFormats = options.supportedFormats || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.cachePath = options.cachePath || path.join(__dirname, '../../data/vision-cache');
    this._ensureCachePath();
  }

  /**
   * 确保缓存目录存在
   */
  _ensureCachePath() {
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
    }
  }

  /**
   * 检查是否支持该格式
   */
  isSupported(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return this.supportedFormats.includes(ext);
  }

  /**
   * 处理图像
   */
  async process(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' };
    }

    if (!this.isSupported(filePath)) {
      return { success: false, error: `不支持的格式: ${path.extname(filePath)}` };
    }

    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      return { success: false, error: '文件过大' };
    }

    const result = {
      success: true,
      filePath,
      fileName: path.basename(filePath),
      format: path.extname(filePath).toLowerCase().slice(1),
      size: stats.size,
      metadata: {
        width: null,
        height: null,
        colorSpace: null,
        hasAlpha: null
      }
    };

    // 如果是简单图像，返回基本信息
    // 完整分析由 ImageAnalyzer 提供
    return result;
  }

  /**
   * 处理 base64 图像
   */
  async processBase64(base64String, options = {}) {
    try {
      // 提取 MIME 类型和数据
      const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return { success: false, error: '无效的 base64 格式' };
      }

      const mimeType = matches[1];
      const data = matches[2];

      // 解码并保存到临时文件
      const buffer = Buffer.from(data, 'base64');
      const ext = this._getExtFromMime(mimeType);
      const tempPath = path.join(this.cachePath, `temp-${Date.now()}.${ext}`);

      fs.writeFileSync(tempPath, buffer);

      // 处理临时文件
      const result = await this.process(tempPath, options);
      result.mimeType = mimeType;

      // 清理临时文件
      fs.unlinkSync(tempPath);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 从 MIME 类型获取扩展名
   */
  _getExtFromMime(mimeType) {
    const mimeToExt = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp'
    };
    return mimeToExt[mimeType] || 'png';
  }

  /**
   * 保存处理结果到缓存
   */
  cacheResult(id, data) {
    const cacheFile = path.join(this.cachePath, `${id}.json`);
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取缓存结果
   */
  getCachedResult(id) {
    const cacheFile = path.join(this.cachePath, `${id}.json`);
    if (!fs.existsSync(cacheFile)) {
      return null;
    }
    try {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    } catch (error) {
      return null;
    }
  }

  /**
   * 清理缓存
   */
  clearCache(maxAgeMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    try {
      const files = fs.readdirSync(this.cachePath);
      for (const file of files) {
        const filePath = path.join(this.cachePath, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
    } catch (error) {
      // 忽略清理错误
    }

    return cleaned;
  }

  /**
   * 获取处理器信息
   */
  getInfo() {
    return {
      supportedFormats: this.supportedFormats,
      maxFileSize: this.maxFileSize,
      cachePath: this.cachePath
    };
  }
}

module.exports = { VisionProcessor };
