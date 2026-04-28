class HealingMemoryRL {
  constructor(maxMemory = 100) { this.maxMemory = maxMemory; this.memory = []; }
  record(pattern, patch, success) {
    this.memory.push({ pattern, patch, success: !!success, timestamp: Date.now() });
    if (this.memory.length > this.maxMemory) this.memory = this.memory.slice(-this.maxMemory);
  }
  bestPatch(pattern) {
    return [...this.memory].reverse().find(x => x.pattern === pattern && x.success)?.patch || null;
  }
}
module.exports = { HealingMemoryRL };
