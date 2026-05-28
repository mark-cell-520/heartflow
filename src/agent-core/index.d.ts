/**
 * HeartFlow Agent TypeScript 类型定义
 */

export = MarkCode;
export as namespace MarkCode;

/**
 * Agent 配置
 */
interface AgentConfig {
  apiKey?: string;
  apiType?: 'anthropic' | 'openai';
  model?: string;
  maxTokens?: number;
  temperature?: number;
  rootPath?: string;
  maxContextMessages?: number;
  maxTokensPerRequest?: number;
  maxToolCallsPerTurn?: number;
  maxConcurrency?: number;
  rateLimit?: RateLimitConfig;
  budget?: BudgetConfig;
  mcpServers?: Record<string, McpServerConfig>;
}

/**
 * 速率限制配置
 */
interface RateLimitConfig {
  requests?: number;
  window?: number;
}

/**
 * 预算配置
 */
interface BudgetConfig {
  maxTokens?: number;
  warnThreshold?: number;
}

/**
 * MCP 服务器配置
 */
interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Agent 处理结果
 */
interface ProcessResult {
  success: boolean;
  output?: string;
  error?: string;
  task?: Task;
  steps?: Step[];
  evaluation?: Evaluation;
  metadata?: ProcessMetadata;
}

/**
 * 任务
 */
interface Task {
  original: string;
  intent: Intent;
  entities: Entities;
  context: Record<string, any>;
  timestamp: number;
}

/**
 * 意图
 */
interface Intent {
  type: string;
  confidence: number;
  name?: string;
}

/**
 * 实体
 */
interface Entities {
  paths: string[];
  commands: string[];
  keywords: string[];
}

/**
 * 步骤
 */
interface Step {
  id: string;
  description: string;
  tool?: string;
  input?: any;
  success?: boolean;
  result?: any;
  error?: string;
}

/**
 * 评估
 */
interface Evaluation {
  score: number;
  level: string;
  reasons: string[];
  confidence: number;
  suggestions: string[];
}

/**
 * 元数据
 */
interface ProcessMetadata {
  duration: number;
  toolsUsed: string[];
  sessionId: string;
  turnCount: number;
}

/**
 * 健康状态
 */
interface HealthStatus {
  initialized: boolean;
  running: boolean;
  sessionId: string | null;
  turnCount: number;
  messageCount: number;
  toolCount: number;
  mcpServers: string[];
  memory: MemoryStats;
  resources: ResourceStats;
  budget: BudgetStatus;
  operations: OperationStats;
  agentLoop: LoopStatus;
  rateLimiter: RateLimiterStatus;
  circuitBreaker: CircuitBreakerStatus;
  connection: ConnectionStatus;
  audit: AuditStats;
  api: ApiHealth;
}

/**
 * 内存统计
 */
interface MemoryStats {
  shortTermCount: number;
  longTermCount: number;
  contextKeys: number;
}

/**
 * 资源状态
 */
interface ResourceStats {
  totalRequests: number;
  totalTokens: number;
  blockedRequests: number;
  activeRequests: number;
  currentMemory: number;
}

/**
 * 预算状态
 */
interface BudgetStatus {
  used: number;
  max: number;
  remaining: number;
  percentUsed: string;
}

/**
 * 操作统计
 */
interface OperationStats {
  total: number;
  successful: number;
  failed: number;
  successRate: string;
}

/**
 * Loop 状态
 */
interface LoopStatus {
  state: string;
  isRunning: boolean;
  iterations: number;
  queueLength: number;
}

/**
 * 速率限制器状态
 */
interface RateLimiterStatus {
  isRetrying: boolean;
  retryCount: number;
  currentDelay: number;
}

/**
 * 断路器状态
 */
interface CircuitBreakerStatus {
  state: string;
  failures: number;
  lastFailure: string | null;
}

/**
 * 连接状态
 */
interface ConnectionStatus {
  state: string;
  connected: boolean;
  connectedAt: string | null;
}

/**
 * 审计统计
 */
interface AuditStats {
  totalInMemory: number;
  todayEntries: number;
  successRate: string;
  errorCount: number;
}

/**
 * API 健康
 */
interface ApiHealth {
  success: boolean;
  status: number;
}

/**
 * 工具定义
 */
interface Tool {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
  handler?: Function;
}

/**
 * 工具输入模式
 */
interface ToolInputSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

/**
 * 并发执行选项
 */
interface ConcurrentOptions {
  concurrency?: number;
  timeout?: number;
  stopOnError?: boolean;
}

/**
 * 链式步骤
 */
interface ChainStep {
  name: string;
  fn: Function;
}

/**
 * 计划结果
 */
interface PlanResult {
  success: boolean;
  plan?: any;
  result?: any;
  stats?: any;
  error?: string;
}

/**
 * API 响应
 */
interface ApiResponse {
  success: boolean;
  content?: any;
  error?: string;
  usage?: TokenUsage;
  model?: string;
}

/**
 * Token 使用
 */
interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

/**
 * MarkCode 类
 */
declare class MarkCode {
  constructor(config?: AgentConfig);

  // 生命周期
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;

  // 核心方法
  process(input: string, options?: any): Promise<ProcessResult>;
  sendToApi(messages: any[], tools?: Tool[]): Promise<ApiResponse>;

  // 并发执行
  executeConcurrent(tasks: any[], options?: ConcurrentOptions): Promise<any>;
  executeChain(steps: ChainStep[]): Promise<any>;
  createAndExecutePlan(goal: string, context?: any): Promise<PlanResult>;

  // 工具管理
  getTools(): Tool[];
  registerTool(tool: Tool): void;
  registerMcpServer(name: string, server: any): void;

  // 状态
  getStatus(): any;
  healthCheck(): Promise<HealthStatus>;
  getHistory(limit?: number): any[];
  resetSession(): Promise<void>;
  exportState(): any;

  // 组件访问
  toolRegistry: any;
  apiClient: any;
  session: any;
  memory: any;
  planner: any;
  executor: any;
  hooks: any;
  // 新增组件
  contextManager: any;
  conversationManager: any;
  taskDecomposer: any;
  dependencyResolver: any;
  reflectionEngine: any;
  selfImprover: any;

  // 新增方法
  decomposeTask(task: string, context?: any): any;
  reflect(execution: any, context?: any): any;
  reflectBatch(executions: any[], context?: any): any[];
  getReflectionHistory(limit?: number): any[];
  findSimilarReflection(reflection: any): any;
  generateImprovement(reflection: any): any;
  applyImprovement(improvement: any): any;
  addContextMessage(role: string, content: string, metadata?: any): any;
  setSystemPrompt(prompt: string): void;
  getContext(maxTokens?: number): any;
  searchContext(query: string): any;
  clearContextHistory(keepSystem?: boolean): any;
  createConversation(metadata?: any): any;
  switchConversation(id: string): any;
  deleteConversation(id: string): boolean;
  listConversations(limit?: number): any[];
}

/**
 * 创建 Agent 实例
 */
declare function createAgent(config?: AgentConfig): Promise<MarkCode>;

export = MarkCode;
