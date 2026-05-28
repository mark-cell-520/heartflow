/**
 * HTTP 工具 v1.0.0
 *
 * HTTP 请求：GET, POST, PUT, DELETE, PATCH
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class HttpTool {
  constructor() {
    this.name = 'http';
    this.description = 'HTTP 请求工具';
    this.danger = 2;  // 低危险等级

    this.args = {
      url: {
        type: 'string',
        required: true,
        description: '请求 URL'
      },
      method: {
        type: 'string',
        required: false,
        default: 'GET',
        description: 'HTTP 方法: GET|POST|PUT|DELETE|PATCH'
      },
      headers: {
        type: 'object',
        required: false,
        description: '请求头'
      },
      body: {
        type: 'string',
        required: false,
        description: '请求体'
      },
      timeout: {
        type: 'number',
        required: false,
        default: 30000,
        description: '超时时间（毫秒）'
      }
    };
  }

  /**
   * 执行 HTTP 请求
   */
  async execute(args, context) {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = 30000
    } = args;

    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: method.toUpperCase(),
          headers: {
            'User-Agent': 'HeartFlow/1.0',
            'Accept': 'application/json, text/plain, */*',
            ...headers
          },
          timeout
        };

        const req = client.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            const duration = Date.now() - startTime;

            let parsed = null;
            try {
              parsed = JSON.parse(data);
            } catch {
              // 不是 JSON
            }

            resolve({
              success: res.statusCode >= 200 && res.statusCode < 300,
              statusCode: res.statusCode,
              statusMessage: res.statusMessage,
              headers: res.headers,
              body: data,
              json: parsed,
              duration,
              timestamp: new Date().toISOString()
            });
          });
        });

        req.on('error', (error) => {
          resolve({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            success: false,
            error: '请求超时',
            timestamp: new Date().toISOString()
          });
        });

        if (body) {
          req.write(body);
        }

        req.end();

      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
}

module.exports = { HttpTool };
