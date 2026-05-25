/**
 * SecurityChecker - 安全检查器 v2.0
 * 检查输入安全性，防止恶意指令、XSS、SQL注入、路径遍历
 * 
 * From mark-StillWater security.js: SecurityChecker — XSS/SQL注入/路径遍历检测
 */

class SecurityChecker {
    constructor() {
        // 危险shell命令模式
        this.dangerousShellPatterns = [
            /rm\s+-rf\s+\//,
            /curl\s+.+\|\s*sh/,
            /eval\s*\(/,
            /exec\s*\(/,
            /__import__\s*\(/,
            /subprocess.*shell\s*=\s*True/,
            /nc\s+-e\s+/,
            /bash\s+-i/,
            /:\s*!{2}/,
        ];

        // XSS注入模式
        this.xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript\s*:/gi,
            /onerror\s*=/gi,
            /onload\s*=/gi,
            /onclick\s*=/gi,
            /onmouseover\s*=/gi,
            /<iframe[^>]*>/gi,
            /<img[^>]+onerror/gi,
            /vbscript\s*:/gi,
            /data\s*:\s*text\/html/gi,
        ];

        // SQL注入模式
        this.sqlInjectionPatterns = [
            /(\bunion\b.*\bselect\b)/gi,
            /(\bdrop\b.*\btable\b)/gi,
            /(\bdrop\b.*\bdatabase\b)/gi,
            /(\binsert\b.*\binto\b)/gi,
            /(\bupdate\b.*\bset\b)/gi,
            /(\bdelete\b.*\bfrom\b)/gi,
            /(--\s*$)/gm,
            /('\s*or\s*'1'\s*=\s*'1)/gi,
            /('\s*or\s*1\s*=\s*1)/gi,
            /(\bor\b\s+\d+\s*=\s*\d+)/gi,
            /(\band\b\s+\d+\s*=\s*\d+)/gi,
            /(\bexec\b\s*\()/gi,
            /(\bxp_cmdshell\b)/gi,
        ];

        // 路径遍历模式
        this.pathTraversalPatterns = [
            /(\.\.\/){1,}/g,
            /(\.\.\\){1,}/g,
            /(%2e%2e){1,}/gi,
            /(%252e){1,}/gi,
            /(\.\.%2f){1,}/gi,
            /(\.\.%5c){1,}/gi,
            /\/(etc\/passwd|boot\.ini|windows\/win\.ini)/gi,
            /\/(windows|system32|system64)\//gi,
        ];

        this.checked = 0;
        this.xssDetected = 0;
        this.sqlInjectionDetected = 0;
        this.pathTraversalDetected = 0;
    }

    boot() {
        return this;
    }

    /**
     * 检查输入是否安全
     * @param {string} input 
     * @returns {object} - { safe: boolean, reason?: string, details?: object }
     */
    check(input) {
        this.checked++;

        // 检查危险shell命令
        for (const pattern of this.dangerousShellPatterns) {
            if (pattern.test(input)) {
                return { 
                    safe: false, 
                    reason: 'dangerous_shell_command', 
                    pattern: pattern.source,
                    category: 'shell'
                };
            }
        }

        // 检查XSS注入
        for (const pattern of this.xssPatterns) {
            if (pattern.test(input)) {
                this.xssDetected++;
                return { 
                    safe: false, 
                    reason: 'xss_injection', 
                    pattern: pattern.source,
                    category: 'xss'
                };
            }
        }

        // 检查SQL注入
        for (const pattern of this.sqlInjectionPatterns) {
            if (pattern.test(input)) {
                this.sqlInjectionDetected++;
                return { 
                    safe: false, 
                    reason: 'sql_injection', 
                    pattern: pattern.source,
                    category: 'sql'
                };
            }
        }

        // 检查路径遍历
        for (const pattern of this.pathTraversalPatterns) {
            if (pattern.test(input)) {
                this.pathTraversalDetected++;
                return { 
                    safe: false, 
                    reason: 'path_traversal', 
                    pattern: pattern.source,
                    category: 'path'
                };
            }
        }

        return { safe: true };
    }

    /**
     * 分类检查 - 返回所有检测结果而不止第一个
     * @param {string} input
     * @returns {object} - 检测结果详情
     */
    checkAll(input) {
        const results = {
            safe: true,
            threats: []
        };

        // 检查所有类别
        const checks = [
            { patterns: this.dangerousShellPatterns, category: 'shell', name: '危险Shell命令' },
            { patterns: this.xssPatterns, category: 'xss', name: 'XSS注入' },
            { patterns: this.sqlInjectionPatterns, category: 'sql', name: 'SQL注入' },
            { patterns: this.pathTraversalPatterns, category: 'path', name: '路径遍历' },
        ];

        for (const check of checks) {
            for (const pattern of check.patterns) {
                if (pattern.test(input)) {
                    results.safe = false;
                    results.threats.push({
                        category: check.category,
                        name: check.name,
                        pattern: pattern.source
                    });
                }
            }
        }

        return results;
    }

    getStats() {
        return {
            checked: this.checked,
            xssDetected: this.xssDetected,
            sqlInjectionDetected: this.sqlInjectionDetected,
            pathTraversalDetected: this.pathTraversalDetected,
            version: 'v2.0.0'
        };
    }

    shutdown() {}
}

module.exports = { SecurityChecker };
