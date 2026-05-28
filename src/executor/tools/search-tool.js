/**
 * 搜索工具 v1.0.0
 *
 * 代码搜索：按内容搜索、按文件名搜索、按模式搜索
 */

const fs = require('fs').promises;
const path = require('path');

class SearchTool {
  constructor() {
    this.name = 'search';
    this.description = '代码搜索：按内容、文件名、模式搜索';
    this.danger = 0;  // 只读操作，零危险

    this.args = {
      type: {
        type: 'string',
        required: true,
        description: '搜索类型: content|filename|regex|glob'
      },
      query: {
        type: 'string',
        required: false,
        description: '搜索内容'
      },
      path: {
        type: 'string',
        required: false,
        description: '搜索路径（默认当前目录）'
      },
      options: {
        type: 'object',
        required: false,
        description: '搜索选项'
      }
    };

    // 搜索选项默认值
    this.defaultOptions = {
      maxResults: 50,         // 最大结果数
      caseSensitive: false,    // 大小写敏感
      includeHidden: false,    // 包含隐藏文件
      extensions: [],         // 文件扩展名过滤
      excludeDirs: ['node_modules', '.git', '__pycache__', 'dist', 'build']  // 排除目录
    };
  }

  /**
   * 执行搜索
   */
  async execute(args, context) {
    const {
      type,
      query,
      path: searchPath = context.rootPath,
      options = {}
    } = args;

    // 合并选项
    const opts = { ...this.defaultOptions, ...options };

    try {
      switch (type) {
        case 'content':
          if (!query) {
            return { success: false, error: 'content 搜索需要 query 参数' };
          }
          return await this._searchContent(searchPath, query, opts);

        case 'filename':
          if (!query) {
            return { success: false, error: 'filename 搜索需要 query 参数' };
          }
          return await this._searchFilename(searchPath, query, opts);

        case 'regex':
          if (!query) {
            return { success: false, error: 'regex 搜索需要 query 参数' };
          }
          return await this._searchRegex(searchPath, query, opts);

        case 'glob':
          if (!query) {
            return { success: false, error: 'glob 搜索需要 query 参数' };
          }
          return await this._searchGlob(searchPath, query, opts);

        default:
          return {
            success: false,
            error: `未知搜索类型: ${type}`,
            validTypes: ['content', 'filename', 'regex', 'glob']
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        searchPath,
        type
      };
    }
  }

  /**
   * 按内容搜索
   */
  async _searchContent(rootPath, query, options) {
    const results = [];
    const queryLower = options.caseSensitive ? query : query.toLowerCase();

    await this._walkDir(rootPath, async (filePath, stat) => {
      if (results.length >= options.maxResults) return;

      // 跳过排除的目录
      const dir = path.dirname(filePath);
      for (const exclude of options.excludeDirs) {
        if (dir.includes(exclude)) return;
      }

      // 检查扩展名
      if (options.extensions.length > 0) {
        const ext = path.extname(filePath).slice(1);
        if (!options.extensions.includes(ext)) return;
      }

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = options.caseSensitive ? lines[i] : lines[i].toLowerCase();
          if (line.includes(queryLower)) {
            results.push({
              file: filePath,
              line: i + 1,
              content: lines[i].trim(),
              match: lines[i]
            });

            if (results.length >= options.maxResults) break;
          }
        }
      } catch {
        // 跳过无法读取的文件
      }
    }, options);

    return {
      success: true,
      type: 'content',
      query,
      results,
      count: results.length
    };
  }

  /**
   * 按文件名搜索
   */
  async _searchFilename(rootPath, query, options) {
    const results = [];
    const queryLower = options.caseSensitive ? query : query.toLowerCase();

    await this._walkDir(rootPath, async (filePath, stat) => {
      if (results.length >= options.maxResults) return;

      const filename = path.basename(filePath);
      const filenameToCheck = options.caseSensitive ? filename : filename.toLowerCase();

      if (filenameToCheck.includes(queryLower)) {
        results.push({
          file: filePath,
          name: filename,
          type: stat.isDirectory() ? 'directory' : 'file',
          size: stat.size
        });
      }
    }, options);

    return {
      success: true,
      type: 'filename',
      query,
      results,
      count: results.length
    };
  }

  /**
   * 正则搜索
   */
  async _searchRegex(rootPath, regexPattern, options) {
    let regex;
    try {
      regex = new RegExp(regexPattern, options.caseSensitive ? '' : 'i');
    } catch (e) {
      return {
        success: false,
        error: `无效的正则表达式: ${e.message}`
      };
    }

    const results = [];

    await this._walkDir(rootPath, async (filePath) => {
      if (results.length >= options.maxResults) return;

      const dir = path.dirname(filePath);
      for (const exclude of options.excludeDirs) {
        if (dir.includes(exclude)) return;
      }

      if (options.extensions.length > 0) {
        const ext = path.extname(filePath).slice(1);
        if (!options.extensions.includes(ext)) return;
      }

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            results.push({
              file: filePath,
              line: i + 1,
              content: lines[i].trim(),
              match: lines[i].match(regex)?.[0]
            });

            if (results.length >= options.maxResults) break;
          }
        }
      } catch {
        // 跳过无法读取的文件
      }
    }, options);

    return {
      success: true,
      type: 'regex',
      pattern: regexPattern,
      results,
      count: results.length
    };
  }

  /**
   * Glob 模式搜索
   */
  async _searchGlob(rootPath, pattern, options) {
    const results = [];
    const minimatch = this._minimatch(pattern);

    await this._walkDir(rootPath, async (filePath, stat) => {
      if (results.length >= options.maxResults) return;

      const relativePath = path.relative(rootPath, filePath);

      if (minimatch(relativePath) || minimatch(path.basename(filePath))) {
        results.push({
          file: filePath,
          relative: relativePath,
          type: stat.isDirectory() ? 'directory' : 'file',
          size: stat.size
        });
      }
    }, options);

    return {
      success: true,
      type: 'glob',
      pattern,
      results,
      count: results.length
    };
  }

  /**
   * 遍历目录
   */
  async _walkDir(dirPath, callback, options) {
    let entries;

    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // 跳过隐藏文件（除非明确要求）
      if (!options.includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      // 跳过排除的目录
      if (entry.isDirectory() && options.excludeDirs.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this._walkDir(fullPath, callback, options);
      } else {
        const stat = await fs.stat(fullPath);
        await callback(fullPath, stat);
      }
    }
  }

  /**
   * 简单的 minimatch 实现（支持 * 和 **）
   */
  _minimatch(str, pattern) {
    const parts = pattern.split('**');
    let regexStr = '';

    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        regexStr += '.*';
      }
      const part = parts[i];
      if (part) {
        const subParts = part.split('*');
        for (let j = 0; j < subParts.length; j++) {
          if (j > 0) {
            regexStr += '[^/]*';
          }
          if (subParts[j]) {
            regexStr += subParts[j].replace(/[.+?^${}()|[\]\\]/g, '\\$&');
          }
        }
      }
    }

    try {
      const regex = new RegExp(`^${regexStr}$`);
      return regex.test(str);
    } catch {
      return false;
    }
  }
}

module.exports = { SearchTool };
