/**
 * 任务路由 (Task Router) v1.0.0
 *
 * 分析输入并路由到合适的处理方式
 */

class TaskRouter {
  constructor() {
    this.patterns = {
      code: [
        /实现|创建|编写|开发|添加功能/i,
        /代码|函数|类|模块/i,
        /实现.*功能/i
      ],
      search: [
        /搜索|查找|寻找|查询/i,
        /在哪里|谁.*发现/i,
        /grep|find|search/i
      ],
      read: [
        /读取|查看|打开|显示/i,
        /文件|内容|代码/i
      ],
      write: [
        /写入|创建|新建|写文件/i,
        /保存|存储/i
      ],
      execute: [
        /运行|执行|启动/i,
        /命令|bash|terminal/i,
        /npm|yarn|node|python/i
      ],
      analysis: [
        /分析|研究|调查/i,
        /为什么|原因/i
      ],
      question: [
        /什么|怎么|如何|为什么/i,
        /\?/,
        /？/
      ]
    };

    this.intentPatterns = this._buildIntentPatterns();
  }

  /**
   * 构建意图模式
   */
  _buildIntentPatterns() {
    return {
      // 实现代码任务
      implement: {
        patterns: [
          /实现(一个|个)?(.*)功能/,
          /创建(一个|个)?(.*)组件/,
          /编写(一个|个)?(.*)函数/,
          /开发(一个|个)?(.*)模块/,
          /添加(一个|个)?(.*)特性/
        ],
        type: 'code',
        priority: 'high'
      },

      // 执行命令任务
      execute: {
        patterns: [
          /运行(.+)命令/,
          /执行(.+)/,
          /在(.+)目录/,
          /cd\s+(\S+)/
        ],
        type: 'execute',
        priority: 'high'
      },

      // 搜索任务
      search: {
        patterns: [
          /搜索(.+)代码/,
          /查找(.+)文件/,
          /在哪里(找到|找到)(.+)/,
          /搜索(.+)内容/
        ],
        type: 'search',
        priority: 'medium'
      },

      // 读取文件任务
      read: {
        patterns: [
          /读取(.+)文件/,
          /查看(.+)内容/,
          /打开(.+)/,
          /cat\s+(\S+)/
        ],
        type: 'read',
        priority: 'medium'
      },

      // 写文件任务
      write: {
        patterns: [
          /创建(.+)文件/,
          /写入(.+)到/,
          /新建(.+)文件/,
          /保存为(.+)/
        ],
        type: 'write',
        priority: 'high'
      },

      // 分析任务
      analyze: {
        patterns: [
          /分析(.+)代码/,
          /调查(.+)问题/,
          /检查(.+)错误/,
          /为什么(.+)失败/
        ],
        type: 'analysis',
        priority: 'medium'
      }
    };
  }

  /**
   * 路由任务
   */
  async route(input, context = {}) {
    const intent = this._detectIntent(input);
    const entities = this._extractEntities(input);

    return {
      original: input,
      intent,
      entities,
      context,
      timestamp: Date.now()
    };
  }

  /**
   * 检测意图
   */
  _detectIntent(input) {
    // 检查问题类
    if (this._matchesPatterns(input, this.patterns.question)) {
      return { type: 'question', confidence: 0.8 };
    }

    // 检查各类意图
    for (const [name, intent] of Object.entries(this.intentPatterns)) {
      for (const pattern of intent.patterns) {
        if (pattern.test(input)) {
          return {
            type: intent.type,
            confidence: 0.9,
            name
          };
        }
      }
    }

    // 检查通用模式
    for (const [type, patterns] of Object.entries(this.patterns)) {
      if (this._matchesPatterns(input, patterns)) {
        return { type, confidence: 0.6 };
      }
    }

    // 默认通用任务
    return { type: 'general', confidence: 0.5 };
  }

  /**
   * 匹配模式
   */
  _matchesPatterns(input, patterns) {
    return patterns.some(pattern => pattern.test(input));
  }

  /**
   * 提取实体
   */
  _extractEntities(input) {
    const entities = {
      paths: [],
      commands: [],
      keywords: []
    };

    // 提取文件路径
    const pathMatches = input.match(/[\/\w]+\.[\w]+/g);
    if (pathMatches) {
      entities.paths = [...new Set(pathMatches)];
    }

    // 提取命令
    const cmdPatterns = [
      /`(.*?)`/g,  // 反引号
      /\$\((.*?)\)/g,  // $()
      /bash\s+([^\s]+)/gi,
      /npm\s+([^\s]+)/gi,
      /yarn\s+([^\s]+)/gi,
      /git\s+([^\s]+)/gi
    ];

    for (const pattern of cmdPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        entities.commands.push(...matches.map(m => m.replace(/[`$()]/g, '')));
      }
    }

    // 提取关键词
    const stopWords = new Set(['的', '了', '是', '在', '和', '与', '或', '我', '你', '他', '她', '它', '这', '那', '一个', '一下']);
    const words = input.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    entities.keywords = [...new Set(words.slice(0, 5))];

    return entities;
  }

  /**
   * 获取任务类型
   */
  getTaskType(intent) {
    const typeMap = {
      code: 'implementation',
      execute: 'execution',
      search: 'investigation',
      read: 'reading',
      write: 'writing',
      analysis: 'analysis',
      question: 'question'
    };
    return typeMap[intent.type] || 'general';
  }

  /**
   * 估算任务复杂度
   */
  estimateComplexity(intent, entities) {
    let complexity = 'simple';

    // 多文件操作 = 复杂
    if (entities.paths?.length > 3) {
      complexity = 'complex';
    }

    // 多步骤命令 = 中等
    if (entities.commands?.length > 2) {
      complexity = complexity === 'complex' ? 'complex' : 'medium';
    }

    // 包含实现/创建 = 复杂
    if (/实现|创建|编写|开发/i.test(intent.original)) {
      complexity = 'complex';
    }

    return complexity;
  }
}

module.exports = { TaskRouter };
