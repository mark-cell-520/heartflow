/**
 * 文件工具 v1.0.0
 *
 * 文件操作：读、写、复制、移动、删除
 *
 * 安全考虑：
 * - 不能删除系统关键目录
 * - 写入有路径限制
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class FileTool {
  constructor() {
    this.name = 'file';
    this.description = '文件操作：读、写、复制、移动、删除';
    this.danger = 7;  // 较高危险等级（涉及文件系统修改）

    this.args = {
      action: {
        type: 'string',
        required: true,
        description: '操作类型: read|write|delete|copy|move|list|exists|info'
      },
      path: {
        type: 'string',
        required: true,
        description: '文件路径'
      },
      content: {
        type: 'string',
        required: false,
        description: '写入内容（write操作时需要）'
      },
      encoding: {
        type: 'string',
        required: false,
        default: 'utf-8',
        description: '文件编码'
      },
      dest: {
        type: 'string',
        required: false,
        description: '目标路径（copy|move操作时需要）'
      }
    };

    // 禁止操作的路径
    this.forbiddenPaths = [
      '/System',
      '/Library',
      '/usr/bin',
      '/usr/sbin',
      '/bin',
      '/sbin',
      '/private/etc',
      '/private/var'
    ];
  }

  /**
   * 执行文件操作
   */
  async execute(args, context) {
    const { action, path: filePath, content, encoding = 'utf-8', dest } = args;

    // 安全检查
    const safetyCheck = this._checkSafety(filePath, action);
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: safetyCheck.reason,
        path: filePath
      };
    }

    // 解析绝对路径
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(context.rootPath, filePath);

    try {
      switch (action) {
        case 'read':
          return await this._read(absolutePath, encoding);
        case 'write':
          return await this._write(absolutePath, content);
        case 'delete':
          return await this._delete(absolutePath);
        case 'copy':
          if (!dest) {
            return { success: false, error: 'copy 操作需要 dest 参数' };
          }
          return await this._copy(absolutePath, dest);
        case 'move':
          if (!dest) {
            return { success: false, error: 'move 操作需要 dest 参数' };
          }
          return await this._move(absolutePath, dest);
        case 'list':
          return await this._list(absolutePath);
        case 'exists':
          return await this._exists(absolutePath);
        case 'info':
          return await this._info(absolutePath);
        default:
          return {
            success: false,
            error: `未知操作: ${action}`,
            validActions: ['read', 'write', 'delete', 'copy', 'move', 'list', 'exists', 'info']
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: absolutePath,
        action
      };
    }
  }

  /**
   * 读取文件
   */
  async _read(filePath, encoding) {
    const stat = await fs.stat(filePath);

    // 限制文件大小（1MB）
    if (stat.size > 1024 * 1024) {
      return {
        success: false,
        error: '文件太大（超过1MB），无法读取'
      };
    }

    const content = await fs.readFile(filePath, encoding);
    return {
      success: true,
      path: filePath,
      content,
      size: stat.size,
      lines: content.split('\n').length
    };
  }

  /**
   * 写入文件
   */
  async _write(filePath, content) {
    // 确保目录存在
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(filePath, content, 'utf-8');

    const stat = await fs.stat(filePath);
    return {
      success: true,
      path: filePath,
      bytesWritten: stat.size
    };
  }

  /**
   * 删除文件
   */
  async _delete(filePath) {
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await fs.rm(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }

    return {
      success: true,
      path: filePath,
      deleted: true
    };
  }

  /**
   * 复制文件
   */
  async _copy(srcPath, destPath) {
    const absoluteDest = path.isAbsolute(destPath)
      ? destPath
      : path.join(context.rootPath || process.cwd(), destPath);

    const destDir = path.dirname(absoluteDest);
    await fs.mkdir(destDir, { recursive: true });

    const stat = await fs.stat(srcPath);

    if (stat.isDirectory()) {
      await this._copyDirectory(srcPath, absoluteDest);
    } else {
      await fs.copyFile(srcPath, absoluteDest);
    }

    return {
      success: true,
      from: srcPath,
      to: absoluteDest
    };
  }

  /**
   * 移动文件
   */
  async _move(srcPath, destPath) {
    const absoluteDest = path.isAbsolute(destPath)
      ? destPath
      : path.join(context.rootPath || process.cwd(), destPath);

    const destDir = path.dirname(absoluteDest);
    await fs.mkdir(destDir, { recursive: true });

    await fs.rename(srcPath, absoluteDest);

    return {
      success: true,
      from: srcPath,
      to: absoluteDest
    };
  }

  /**
   * 列出目录
   */
  async _list(filePath) {
    const entries = await fs.readdir(filePath, { withFileTypes: true });

    const items = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(filePath, entry.name);
      const stat = await fs.stat(fullPath);

      return {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        modified: stat.mtime.toISOString()
      };
    }));

    return {
      success: true,
      path: filePath,
      items,
      count: items.length
    };
  }

  /**
   * 检查是否存在
   */
  async _exists(filePath) {
    try {
      await fs.access(filePath);
      return { success: true, exists: true, path: filePath };
    } catch {
      return { success: true, exists: false, path: filePath };
    }
  }

  /**
   * 获取文件信息
   */
  async _info(filePath) {
    const stat = await fs.stat(filePath);

    return {
      success: true,
      path: filePath,
      type: stat.isDirectory() ? 'directory' : 'file',
      size: stat.size,
      created: stat.birthtime.toISOString(),
      modified: stat.mtime.toISOString(),
      permissions: stat.mode.toString(8).slice(-3)
    };
  }

  /**
   * 安全检查
   */
  _checkSafety(filePath, action) {
    // 对于存在性检查和读取，放行
    if (action === 'exists' || action === 'info' || action === 'list') {
      return { safe: true };
    }

    // 其他操作检查禁止路径
    for (const forbidden of this.forbiddenPaths) {
      if (filePath.startsWith(forbidden)) {
        return {
          safe: false,
          reason: `禁止操作系统关键目录: ${forbidden}`
        };
      }
    }

    // 检查是否是心虫自己的目录（保护）
    if (filePath.includes('.hermes/skills') || filePath.includes('mark-heartflow-skill')) {
      if (action === 'delete') {
        return {
          safe: false,
          reason: '禁止删除心虫自身文件'
        };
      }
    }

    return { safe: true };
  }

  /**
   * 复制目录（递归）
   */
  async _copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this._copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

module.exports = { FileTool };
