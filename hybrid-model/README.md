# 混合模型路由 - 使用指南

## 🎯 快速开始

### 1. 测试路由效果

```bash
cd ~/.openclaw/skills/hybrid-model-router

# 测试简单消息
node integrate.js test "你好，介绍一下你自己"

# 测试复杂任务
node integrate.js test "请深度分析这个复杂问题，需要从多个维度进行对比分析"

# 查看路由器状态
node integrate.js status
```

### 2. 查看测试结果

**简单消息** → 自动选择 `small` 模型
```json
{
  "classification": { "level": "small", "score": -1 },
  "suggestion": "建议使用 small 模型：qwen/qwen-plus"
}
```

**复杂分析** → 自动选择 `large` 模型
```json
{
  "classification": { "level": "large", "score": 12 },
  "suggestion": "建议使用 large 模型：qwen/qwen-plus"
}
```

---

## 📋 配置说明

### 配置文件位置

```
~/.openclaw/workspace/hybrid-model/config.json
```

### 模型配置

```json
{
  "models": {
    "small": {
      "ref": "qwen/qwen-plus",
      "costPer1kTokens": 0.002
    },
    "medium": {
      "ref": "qwen/qwen-max",
      "costPer1kTokens": 0.01
    },
    "large": {
      "ref": "qwen/qwen-plus",
      "costPer1kTokens": 0.05
    }
  }
}
```

**修改为你自己的模型：**
- 阿里云：`qwen/qwen-plus`, `qwen/qwen-max`
- OpenAI：`openai/gpt-4o`, `openai/gpt-4o-mini`
- Anthropic：`anthropic/claude-sonnet-4-6`, `anthropic/claude-opus-4-6`

### 策略配置

```json
{
  "strategy": "balanced"  // 可选：balanced | cost-optimal | performance
}
```

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `balanced` | 平衡模式（默认） | 日常使用 |
| `cost-optimal` | 成本优先 | 预算有限 |
| `performance` | 性能优先 | 关键任务 |

### 关键词覆盖

```json
{
  "rules": {
    "overrideKeywords": {
      "深度分析": "large",
      "快速回答": "small",
      "用大模型": "large",
      "用小模型": "small"
    }
  }
}
```

在消息中包含这些关键词，会强制使用指定模型。

---

## 🔧 集成到 OpenClaw

### 方案 A：手动调用（推荐新手）

在发送消息前，先运行路由脚本：

```bash
# 1. 获取路由建议
RESULT=$(node ~/.openclaw/skills/hybrid-model-router/integrate.js test "你的消息")

# 2. 提取推荐模型
MODEL=$(echo $RESULT | jq -r '.routing.modelRef')

# 3. 使用推荐模型发送
openclaw agent --message "你的消息" --model "$MODEL"
```

### 方案 B：修改 OpenClaw 源码（高级）

在 `openclaw` 的会话处理流程中集成：

1. 找到会话入口文件（通常在 `src/sessions/` 目录）
2. 在消息处理前调用 `routeMessage()`
3. 根据返回结果设置 `model` 参数

**示例代码：**
```javascript
const { routeMessage } = require('./hybrid-model-router/integrate');

async function handleSession(message) {
  // 路由决策
  const routeResult = routeMessage(message);
  
  // 使用推荐的模型
  const model = routeResult.routing.modelRef;
  
  // 调用原有逻辑
  return await callAgent(message, { model });
}
```

### 方案 C：使用 Cron 定时任务（自动化）

```bash
# 添加环境变量
export HYBRID_MODEL_ENABLED=true
export HYBRID_MODEL_CONFIG=~/.openclaw/workspace/hybrid-model/config.json
```

---

## 📊 监控与优化

### 查看使用统计

```bash
node ~/.openclaw/skills/hybrid-model-router/integrate.js status
```

输出示例：
```json
{
  "strategy": "balanced",
  "metrics": {
    "totalRequests": 100,
    "modelUsage": { "small": 60, "medium": 30, "large": 10 },
    "totalCost": 2.50
  }
}
```

### 日志文件

```
~/.openclaw/workspace/hybrid-model/logs/metrics.json
```

### 优化建议

1. **调整阈值**：如果发现太多任务被分到 `large`，提高 `wordCount` 阈值
2. **添加关键词**：根据你的使用习惯，添加更多覆盖关键词
3. **定期清理**：定期重置 `dailyCost` 统计

---

## 🎨 自定义扩展

### 添加新的分类规则

编辑 `~/.openclaw/skills/hybrid-model-router/src/classifier.js`：

```javascript
const COMPLEXITY_RULES = {
  // 添加你的自定义关键词
  myCustomKeywords: ['我的关键词 1', '我的关键词 2'],
  
  // 添加新的任务类型
  taskTypes: {
    myTaskType: ['关键词 1', '关键词 2']
  }
};
```

### 添加新的路由策略

编辑 `~/.openclaw/skills/hybrid-model-router/src/router.js`：

```javascript
selectForCustom(classification) {
  // 你的自定义策略逻辑
  if (/* 你的条件 */) return 'large';
  return 'medium';
}
```

---

## ❓ 常见问题

### Q: 为什么有些代码任务被分到 small？

A: 分类器默认对"快速"等词降权。可以在配置中添加：
```json
"overrideKeywords": {
  "代码": "medium",
  "编程": "medium"
}
```

### Q: 如何完全禁用自动路由？

A: 在配置文件中设置：
```json
{ "enabled": false }
```

### Q: 能集成其他模型提供商吗？

A: 可以！在 `models` 配置中添加：
```json
"models": {
  "small": { "ref": "openai/gpt-4o-mini" },
  "large": { "ref": "anthropic/claude-opus-4-6" }
}
```

---

## 📝 更新日志

- **v1.0.0** (2026-03-23) - 初始版本
  - 任务复杂度分类器
  - 三种路由策略
  - 成本追踪
  - 关键词覆盖

---

## 🙏 反馈与贡献

遇到问题或有改进建议？欢迎反馈！

**项目位置：** `~/.openclaw/skills/hybrid-model-router/`
