#!/usr/bin/env node

/**
 * 混合模型路由 - OpenClaw 集成脚本
 */

const fs = require('fs');
const path = require('path');

const { classifyTask } = require('./src/classifier');
const { HybridModelRouter, DEFAULT_CONFIG } = require('./src/router');

const configPath = path.join(__dirname, '../../workspace/hybrid-model/config.json');
let userConfig = {};
if (fs.existsSync(configPath)) {
  userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

const router = new HybridModelRouter(userConfig);

function routeMessage(message) {
  const classification = classifyTask(message);
  const routeResult = router.route(message, classification);
  return {
    original: { message: message.substring(0, 100) + (message.length > 100 ? '...' : ''), length: message.length },
    classification: { level: classification.level, taskType: classification.taskType, score: classification.score, reason: classification.reason },
    routing: { modelRef: routeResult.modelRef, level: routeResult.level, description: routeResult.description, reason: routeResult.reason, estimatedCost: routeResult.estimatedCost, estimatedTokens: routeResult.estimatedTokens },
    suggestion: '建议使用 ' + routeResult.level + ' 模型：' + routeResult.modelRef
  };
}

function getRouterStatus() {
  return router.getStatus();
}

function updateConfig(patch) {
  const newConfig = router.updateConfig(patch);
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
  return newConfig;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === 'test') {
    const testMessage = args.slice(1).join(' ') || '你好，简单介绍一下你自己';
    console.log('测试消息:', testMessage);
    console.log('\n路由结果:');
    const result = routeMessage(testMessage);
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === 'status') {
    console.log('路由器状态:');
    const status = getRouterStatus();
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log('混合模型路由测试工具');
    console.log('用法：node integrate.js test <你的消息>');
    console.log('或：node integrate.js status');
    console.log('\n示例:');
    console.log('  node integrate.js test 你好');
    console.log('  node integrate.js test 请深度分析这个复杂问题...');
  }
}

module.exports = { routeMessage, getRouterStatus, updateConfig };
