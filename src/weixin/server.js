/**
 * HeartFlow Weixin Server
 * 集成 HeartFlow AI 的微信服务器
 */

const express = require('express');
const bodyParser = require('body-parser');
const { WeixinClient } = require('./weixin-client');
const { SelfAgent } = require('../core/agents/SelfAgent');
const fs = require('fs');
const path = require('path');

function assertWeixinEnabled() {
  if (process.env.HEARTFLOW_ENABLE_WEIXIN !== '1') {
    throw new Error('HeartFlow Weixin integration disabled by default for marketplace-safe runtime');
  }
}

class HeartFlowWeixin {
  constructor(projectRoot, config = {}) {
    assertWeixinEnabled();
    this.projectRoot = projectRoot;
    this.config = config;
    this.agent = new SelfAgent(projectRoot);
    this.client = null;
    this.messageLog = path.join(projectRoot, 'logs', 'weixin-messages.json');
    
    this.loadMessageLog();
  }

  loadMessageLog() {
    try {
      if (fs.existsSync(this.messageLog)) {
        this.messages = JSON.parse(fs.readFileSync(this.messageLog, 'utf8'));
      } else {
        this.messages = [];
      }
    } catch (e) {
      this.messages = [];
    }
  }

  saveMessage(msg) {
    this.messages.push({
      ...msg,
      timestamp: new Date().toISOString()
    });
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
    fs.writeFileSync(this.messageLog, JSON.stringify(this.messages, null, 2));
  }

  async handleTextMessage(fromUser, content) {
    console.log(`[Weixin] 收到消息 from ${fromUser}: ${content}`);
    
    this.saveMessage({
      type: 'user',
      from: fromUser,
      content: content
    });

    try {
      const result = await this.agent.process(content, {
        source: 'weixin',
        userId: fromUser
      });
      
      const responseText = result.finalResponse || 
                          result.internalMonologue || 
                          '我收到了你的消息。';
      
      this.saveMessage({
        type: 'ai',
        from: 'HeartFlow',
        content: responseText
      });

      return responseText;
      
    } catch (e) {
      console.error('[Weixin] AI处理错误:', e.message);
      return '抱歉，我现在有点困惑。请稍后再试。';
    }
  }

  async handleEvent(event, eventKey, fromUser) {
    if (event === 'subscribe') {
      return '欢迎使用 HeartFlow。你可以直接发送问题、计划、判断任务或需要整理的长期上下文。';
    } else if (event === 'unsubscribe') {
      console.log(`[Weixin] 用户取消关注: ${fromUser}`);
      return null;
    } else if (event === 'CLICK') {
      if (eventKey === 'help') {
        return '我是 HeartFlow。你可以让我帮你做分析、判断、总结、规划和执行拆解。';
      }
    }
    return null;
  }

  start() {
    const app = express();
    
    app.use(express.query());
    app.use(express.bodyParser({ xmlParser: {
      explicitArray: false,
      ignoreAttrs: true
    }}));

    // 微信服务器验证
    app.get('/weixin', (req, res) => {
      const { signature, timestamp, nonce, echostr } = req.query;
      
      if (this.client.verifySignature(timestamp, nonce, signature)) {
        res.send(echostr);
      } else {
        res.status(403).send('signature verification failed');
      }
    });

    // 微信消息处理
    app.post('/weixin', async (req, res) => {
      try {
        const message = this.client.parseXmlMessage(req.body);
        
        let responseText = null;
        
        if (message.msgType === 'text') {
          responseText = await this.handleTextMessage(message.fromUserName, message.content);
        } else if (message.msgType === 'event') {
          responseText = await this.handleEvent(message.event, message.eventKey, message.fromUserName);
        }

        if (responseText) {
          const xmlResponse = this.client.createTextResponse(
            message.fromUserName,
            message.toUserName,
            responseText
          );
          res.type('application/xml').send(xmlResponse);
        } else {
          res.send('success');
        }
        
      } catch (e) {
        console.error('[Weixin] 处理错误:', e.message);
        res.send('success');
      }
    });

    // 状态检查
    app.get('/status', (req, res) => {
      res.json({
        status: 'running',
        service: 'HeartFlow Weixin',
        agent: this.agent.getStatus(),
        messages: this.messages.length
      });
    });

    // 初始化微信客户端
    if (this.config.appId && this.config.appSecret) {
      this.client = new WeixinClient({
        appId: this.config.appId,
        appSecret: this.config.appSecret,
        token: this.config.token || 'heartflow-weixin'
      });
    }

    const port = this.config.port || 3000;
    app.listen(port, () => {
      console.log(`[Weixin] HeartFlow server started: http://localhost:${port}`);
      console.log(`[Weixin] Weixin callback path: /weixin`);
    });

    return app;
  }
}

/**
 * 启动脚本
 */
if (require.main === module) {
  const projectRoot = path.resolve(__dirname, '../..');
  const config = {
    port: process.env.WECHAT_PORT || 3000,
    appId: process.env.WECHAT_APPID,
    appSecret: process.env.WECHAT_APPSECRET,
    token: process.env.WECHAT_TOKEN || 'heartflow-weixin'
  };

  if (!config.appId || !config.appSecret) {
    console.log('⚠️  请设置环境变量:');
    console.log('   WECHAT_APPID=***');
    console.log('   WECHAT_APPSECRET=***');
    console.log('   WECHAT_TOKEN=***');
    console.log('');
    console.log('示例:');
    console.log('   WECHAT_APPID=*** WECHAT_APPSECRET=*** WECHAT_TOKEN=*** heartflow api');
    process.exit(1);
  }

  const server = new HeartFlowWeixin(projectRoot, config);
  server.start();
}

module.exports = { HeartFlowWeixin };
