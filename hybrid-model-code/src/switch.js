/**
 * Switch 状态管理模块
 * 类似 CC Switch 的模型切换功能
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const SWITCH_FILE = path.join(OPENCLAW_DIR, 'switch.json');
const CONFIG_FILE = path.join(OPENCLAW_DIR, 'workspace', 'hybrid-model', 'config.json');

const VALID_STRATEGIES = ['balanced', 'cost-optimal', 'performance'];
const VALID_LEVELS = ['small', 'medium', 'large', 'auto'];

function ensureOpenClawDir() {
  if (!fs.existsSync(OPENCLAW_DIR)) {
    fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
  }
}

function getDefaultState() {
  return {
    mode: 'auto',
    model: null,
    strategy: 'balanced',
    lastUpdated: new Date().toISOString()
  };
}

function getSwitchState() {
  try {
    if (fs.existsSync(SWITCH_FILE)) {
      const content = fs.readFileSync(SWITCH_FILE, 'utf-8');
      return { ...getDefaultState(), ...JSON.parse(content) };
    }
  } catch (err) {
    console.error('读取 switch.json 失败:', err.message);
  }
  return getDefaultState();
}

function setSwitchState(state) {
  ensureOpenClawDir();
  const fullState = {
    ...getSwitchState(),
    ...state,
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(SWITCH_FILE, JSON.stringify(fullState, null, 2), 'utf-8');
  return fullState;
}

function parseSwitchCommand(input) {
  if (typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  
  const cmdMatch = trimmed.match(/^\/switch\s+(\S+)/i);
  if (cmdMatch) {
    return { command: cmdMatch[1].toLowerCase(), source: 'slash' };
  }
  
  const directMatch = trimmed.match(/^switch\s+(\S+)/i);
  if (directMatch) {
    return { command: directMatch[1].toLowerCase(), source: 'direct' };
  }
  
  return null;
}

function isSwitchCommand(input) {
  return parseSwitchCommand(input) !== null;
}

function handleSwitch(input, config = null) {
  const parsed = parseSwitchCommand(input);
  if (!parsed) {
    return { success: false, message: '无效的 switch 命令' };
  }

  const { command } = parsed;
  const state = getSwitchState();

  if (command === 'status') {
    const modeDesc = state.mode === 'auto' 
      ? '自动模式' 
      : state.mode === 'manual' 
        ? `手动指定: ${state.model}` 
        : `强制级别: ${state.mode}`;
    
    return {
      success: true,
      message: `当前状态\n├─ 模式: ${modeDesc}\n├─ 策略: ${state.strategy}\n└─ 更新: ${state.lastUpdated || 'N/A'}`,
      state
    };
  }

  if (command === 'reset' || command === 'clear') {
    const newState = setSwitchState(getDefaultState());
    return {
      success: true,
      message: '已重置为默认状态（自动模式）',
      state: newState
    };
  }

  if (VALID_STRATEGIES.includes(command)) {
    const newState = setSwitchState({ strategy: command });
    return {
      success: true,
      message: `策略已切换为: ${command}\n\n说明:\n${getStrategyDescription(command)}`,
      state: newState
    };
  }

  if (VALID_LEVELS.includes(command)) {
    const newState = setSwitchState({ 
      mode: command, 
      model: null 
    });
    return {
      success: true,
      message: command === 'auto' 
        ? '已恢复自动模式，将根据消息复杂度自动选择模型'
        : `已强制使用 ${command} 模型级别`,
      state: newState
    };
  }

  const newState = setSwitchState({ 
    mode: 'manual', 
    model: command 
  });
  return {
    success: true,
    message: `模型已切换为: ${command}`,
    state: newState
  };
}

function getStrategyDescription(strategy) {
  const descriptions = {
    'balanced': '根据分类结果选择模型，平衡成本与性能',
    'cost-optimal': '优先使用小模型，能降级就降级',
    'performance': '优先使用大模型，能升级就升级'
  };
  return descriptions[strategy] || '';
}

function getModelForMessage(message, classification, routerConfig) {
  const state = getSwitchState();

  if (state.mode === 'manual' && state.model) {
    return {
      modelRef: state.model,
      level: 'manual',
      reason: '用户手动指定',
      source: 'switch-manual'
    };
  }

  if (['small', 'medium', 'large'].includes(state.mode)) {
    const model = routerConfig?.models?.[state.mode];
    if (model) {
      return {
        modelRef: model.ref,
        level: state.mode,
        reason: `用户强制指定 ${state.mode} 级别`,
        source: 'switch-level'
      };
    }
  }

  return {
    level: classification.level,
    reason: classification.reason,
    source: 'auto'
  };
}

function getStatusDisplay() {
  const state = getSwitchState();
  const lines = [
    '================================',
    '  Switch 状态',
    '================================',
    '',
    `模式: ${state.mode === 'auto' ? '自动' : state.mode === 'manual' ? `手动 (${state.model})` : state.mode}`,
    `策略: ${state.strategy}`,
    `更新: ${state.lastUpdated || 'N/A'}`,
    '',
    '可用命令:',
    '  /switch status       - 查看状态',
    '  /switch auto         - 自动模式',
    '  /switch small        - 强制小模型',
    '  /switch medium       - 强制中等模型',
    '  /switch large        - 强制大模型',
    '  /switch balanced     - 平衡策略',
    '  /switch cost-optimal - 成本优先',
    '  /switch performance  - 性能优先',
    '  /switch <模型名>     - 直接指定模型',
    '  /switch reset        - 重置为默认',
    '================================'
  ];
  return lines.join('\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSwitchState,
    setSwitchState,
    parseSwitchCommand,
    isSwitchCommand,
    handleSwitch,
    getModelForMessage,
    getStatusDisplay,
    VALID_STRATEGIES,
    VALID_LEVELS
  };
}
