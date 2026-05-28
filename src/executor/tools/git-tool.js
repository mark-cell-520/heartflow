/**
 * Git 工具 v1.0.0
 *
 * Git 操作：clone, commit, push, pull, branch, status, log 等
 */

const { spawn } = require('child_process');
const path = require('path');

class GitTool {
  constructor() {
    this.name = 'git';
    this.description = 'Git 版本控制操作';
    this.danger = 3;  // 中低危险等级

    this.args = {
      action: {
        type: 'string',
        required: true,
        description: 'Git 操作: clone|status|add|commit|push|pull|branch|checkout|merge|log|diff|init'
      },
      repo: {
        type: 'string',
        required: false,
        description: '仓库地址（clone 时需要）'
      },
      path: {
        type: 'string',
        required: false,
        description: '本地路径'
      },
      message: {
        type: 'string',
        required: false,
        description: '提交消息（commit 时需要）'
      },
      files: {
        type: 'string',
        required: false,
        description: '操作的文件（多个用空格分隔）'
      },
      branch: {
        type: 'string',
        required: false,
        description: '分支名'
      },
      options: {
        type: 'object',
        required: false,
        description: '额外选项'
      }
    };
  }

  /**
   * 执行 Git 操作
   */
  async execute(args, context) {
    const { action, ...rest } = args;

    const actionHandlers = {
      clone: () => this._clone(rest, context),
      status: () => this._status(rest, context),
      add: () => this._add(rest, context),
      commit: () => this._commit(rest, context),
      push: () => this._push(rest, context),
      pull: () => this._pull(rest, context),
      branch: () => this._branch(rest, context),
      checkout: () => this._checkout(rest, context),
      merge: () => this._merge(rest, context),
      log: () => this._log(rest, context),
      diff: () => this._diff(rest, context),
      init: () => this._init(rest, context),
      remote: () => this._remote(rest, context)
    };

    if (!actionHandlers[action]) {
      return {
        success: false,
        error: `未知的 Git 操作: ${action}`,
        validActions: Object.keys(actionHandlers)
      };
    }

    return await actionHandlers[action]();
  }

  /**
   * 执行 Git 命令
   */
  _runGit(args, context) {
    return new Promise((resolve) => {
      const {
        command,
        cwd = context.rootPath,
        timeout = 30000
      } = args;

      const parts = command.split(' ');
      const cmd = parts[0];
      const args_list = parts.slice(1);

      const child = spawn(cmd, args_list, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          success: false,
          error: 'Git 命令执行超时',
          command
        });
      }, timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({
          success: code === 0,
          exitCode: code,
          command,
          stdout,
          stderr,
          timestamp: new Date().toISOString()
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: error.message,
          command
        });
      });
    });
  }

  /**
   * Clone
   */
  async _clone(args, context) {
    if (!args.repo) {
      return { success: false, error: 'clone 需要 repo 参数' };
    }

    const targetPath = args.path || path.basename(args.repo, '.git');

    return this._runGit({
      command: `git clone ${args.repo} ${targetPath}`,
      cwd: path.dirname(path.join(context.rootPath, targetPath)) || context.rootPath
    }, context);
  }

  /**
   * Status
   */
  async _status(args, context) {
    return this._runGit({
      command: 'git status --porcelain',
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Add
   */
  async _add(args, context) {
    const files = args.files || '.';
    return this._runGit({
      command: `git add ${files}`,
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Commit
   */
  async _commit(args, context) {
    if (!args.message) {
      return { success: false, error: 'commit 需要 message 参数' };
    }

    return this._runGit({
      command: `git commit -m "${args.message}"`,
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Push
   */
  async _push(args, context) {
    const branch = args.branch ? `origin ${args.branch}` : '';
    return this._runGit({
      command: `git push ${branch}`,
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Pull
   */
  async _pull(args, context) {
    return this._runGit({
      command: 'git pull',
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Branch
   */
  async _branch(args, context) {
    let cmd = 'git branch';
    if (args.branch) {
      if (args.options?.delete) {
        cmd += ` -d ${args.branch}`;
      } else {
        cmd += ` ${args.branch}`;
      }
    } else {
      cmd += ' -a';
    }

    return this._runGit({
      command: cmd,
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Checkout
   */
  async _checkout(args, context) {
    if (!args.branch) {
      return { success: false, error: 'checkout 需要 branch 参数' };
    }

    return this._runGit({
      command: `git checkout ${args.branch}`,
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Merge
   */
  async _merge(args, context) {
    if (!args.branch) {
      return { success: false, error: 'merge 需要 branch 参数' };
    }

    return this._runGit({
      command: `git merge ${args.branch}`,
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Log
   */
  async _log(args, context) {
    const limit = args.options?.limit || 10;
    return this._runGit({
      command: `git log --oneline -${limit}`,
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Diff
   */
  async _diff(args, context) {
    const target = args.files || '';
    return this._runGit({
      command: `git diff ${target}`,
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Init
   */
  async _init(args, context) {
    return this._runGit({
      command: 'git init',
      cwd: args.path || context.rootPath
    }, context);
  }

  /**
   * Remote
   */
  async _remote(args, context) {
    if (args.options?.add) {
      return this._runGit({
        command: `git remote add ${args.options.add} ${args.repo}`,
        cwd: args.path || context.rootPath
      }, context);
    }

    return this._runGit({
      command: 'git remote -v',
      cwd: args.path || context.rootPath
    }, context);
  }
}

module.exports = { GitTool };
