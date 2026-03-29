#!/usr/bin/env node

/**
 * 混合模型路由 - OpenClaw 集成脚本 v2.0
 * 新增 Switch 功能，支持类似 CC Switch 的模型切换
 */

const fs = require('fs');
const path = require('path');

const { classifyTask } = require('./src/classifier');
const { HybridModelRouter, DEFAULT_CONFIG } = require('./src/router');
const { 
  isSwitchCommand, 
  handleSwitch, 
  getSwitchState, 
  getModelForMessage,
  getStatusDisplay 
} = require('./src/switch');

const configPath = path.join(__dirname, '../../workspace/hybrid-model/config.json');
let userConfig = {};
if (fs.existsSync(configPath)) {
  try {
    userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.error('读取配置文件失败:', err.message);
  }
}

const router = new HybridModelRouter(userConfig);

function routeMessage(message) {
  if (isSwitchCommand(message)) {
    const result = handleSwitch(message, userConfig);
    return {
      isSwitchCommand: true,
      success: result.success,
      message: result.message,
      state: result.state
    };
  }

  const classification = classifyTask(message);
  const switchOverride = getModelForMessage(message, classification, router.config);
  
  let routeResult;
  if (switchOverride.source !== 'auto') {
    const model = router.config.models[switchOverride.level] || { ref: switchOverride.modelRef };
    routeResult = {
      modelRef: switchOverride.modelRef || model.ref,
      level: switchOverride.level,
      description: model.description || '用户指定模型',
      reason: switchOverride.reason,
      estimatedCost: '0.0000',
      estimatedTokens: Math.round(message.length * 0.5)
    };
  } else {
    routeResult = router.route(message, classification);
  }

  return {
    isSwitchCommand: false,
    original: { 
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''), 
      length: message.length 
    },
    classification: { 
      level: classification.level, 
      taskType: classification.taskType, 
      score: classification.score, 
      reason: classification.reason,
      confidence: classification.confidence
    },
    routing: { 
      modelRef: routeResult.modelRef, 
      level: routeResult.level, 
      description: routeResult.description, 
      reason: routeResult.reason, 
      estimatedCost: routeResult.estimatedCost, 
      estimatedTokens: routeResult.estimatedTokens 
    },
    switch: {
      active: switchOverride.source !== 'auto',
      mode: getSwitchState().mode
    },
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

function showHelp() {
  console.log(`
================================
  混合模型路由 v2.0
================================

用法:
  node integrate.js test <消息>     测试路由
  node integrate.js status          查看路由状态
  node integrate.js switch <命令>   Switch 命令

Switch 命令:
  status              查看当前状态
  auto                恢复自动模式
  small               强制使用小模型
  medium              强制使用中等模型
  large               强制使用大模型
  balanced            平衡策略（默认）
  cost-optimal        成本优先策略
  performance         性能优先策略
  <模型名>            直接指定模型
  reset               重置为默认

示例:
  node integrate.js test "你好"
  node integrate.js test "请深度分析这个问题"
  node integrate.js switch status
  node integrate.js switch large
  node integrate.js switch gpt-4o
================================
`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  if (command === 'test') {
    const testMessage = args.slice(1).join(' ') || '你好，简单介绍一下你自己';
    console.log('测试消息:', testMessage);
    console.log('\n路由结果:');
    const result = routeMessage(testMessage);
    console.log(JSON.stringify(result, null, 2));
    
  } else if (command === 'status') {
    console.log('路由器状态:');
    const status = getRouterStatus();
    console.log(JSON.stringify(status, null, 2));
    console.log('\n' + getStatusDisplay());
    
  } else if (command === 'switch') {
    const switchCmd = args.slice(1).join(' ');
    if (!switchCmd) {
      console.log(getStatusDisplay());
      process.exit(0);
    }
    
    const fullCmd = '/switch ' + switchCmd;
    const result = handleSwitch(fullCmd, userConfig);
    console.log(result.message);
    if (result.state) {
      console.log('\n状态已更新:', JSON.stringify(result.state, null, 2));
    }
    
  } else if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    
  } else {
    console.log('未知命令:', command);
    showHelp();
    process.exit(1);
  }
}

module.exports = { 
  routeMessage, 
  getRouterStatus, 
  updateConfig,
  handleSwitch,
  isSwitchCommand
};
