# 🦞 ModelFlow - 混合模型路由系统

> 让 AI 更聪明地选择模型 —— 简单任务用小模型省钱，复杂任务用大模型保质

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/Powered%20by-OpenClaw-blue)](https://github.com/openclaw/openclaw)

---

## 📖 项目简介

**ModelFlow** 是一个智能 AI 模型调度中间件，为 OpenClaw 设计的混合模型路由系统。它通过分析用户消息的复杂度、任务类型和上下文，自动选择最优的 AI 模型，在**成本**和**性能**之间找到最佳平衡点。

### 🎯 解决什么问题？

| 痛点 | 传统做法 | ModelFlow 方案 |
|------|----------|------------|
| **成本浪费** | 所有任务都用最强模型 | 简单任务自动降级到小模型 |
| **性能不足** | 所有任务都用便宜模型 | 复杂任务自动升级到大模型 |
| **手动切换** | 用户需要记住 `/model` 命令 | 全自动，无感知 |
| **预算失控** | 不知道花了多少钱 | 实时追踪 + 预算控制 |

### 💡 核心优势

- **智能分类** - 基于关键词、长度、任务类型的多维度分析
- **灵活策略** - 支持平衡/成本优先/性能优先三种模式
- **Switch 控制** - 类似 CC Switch 的模型切换命令
- **图形界面** - 现代化 Web 管理控制台
- **零配置使用** - 开箱即用，也可深度定制
- **成本透明** - 每次请求都有成本预估

---

## 🚀 快速开始

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

### 2. Switch 命令（新功能）

```bash
# 查看当前状态
node integrate.js switch status

# 强制使用某类模型
node integrate.js switch small    # 小模型
node integrate.js switch medium   # 中等模型
node integrate.js switch large    # 大模型
node integrate.js switch auto     # 恢复自动

# 切换策略
node integrate.js switch balanced       # 平衡模式（默认）
node integrate.js switch cost-optimal   # 成本优先
node integrate.js switch performance    # 性能优先

# 直接指定模型
node integrate.js switch gpt-4o
node integrate.js switch claude-opus-4-6

# 重置为默认
node integrate.js switch reset
```

### 3. 启动图形界面（新功能）

```bash
# 启动 Web 服务
node hybrid-model-code/ui/server.js

# 访问界面
http://localhost:3000/
```

---

## 📊 功能特性

### 1. 智能任务分类

| 维度 | 检测内容 | 权重 |
|------|----------|------|
| **关键词** | 高/中/低复杂度关键词匹配 | 40% |
| **文本长度** | 字数、字符数 | 20% |
| **任务类型** | 代码/写作/分析/聊天/问答 | 20% |
| **特殊模式** | 代码块、多步骤、推理需求 | 20% |

### 2. Switch 控制（v2.0 新增）

| 命令 | 作用 |
|------|------|
| `/switch status` | 查看当前状态 |
| `/switch auto` | 自动模式（默认） |
| `/switch small` | 强制小模型 |
| `/switch medium` | 强制中等模型 |
| `/switch large` | 强制大模型 |
| `/switch balanced` | 平衡策略 |
| `/switch cost-optimal` | 成本优先策略 |
| `/switch performance` | 性能优先策略 |
| `/switch <模型名>` | 直接指定模型 |

### 3. 三种路由策略

| 策略 | 说明 | 适用场景 | 成本影响 |
|------|------|----------|----------|
| **balanced** | 根据分类结果选择 | 日常使用 | 基准 |
| **cost-optimal** | 能降级就降级 | 预算有限 | -30%~50% |
| **performance** | 能升级就升级 | 关键任务 | +20%~40% |

### 4. 图形化管理界面（v2.0 新增）

```
┌─────────────────────────────────────────────────────┐
│  ⚡ ModelFlow v2.0                                   │
├─────────────────────────────────────────────────────┤
│  🎛️ Switch 控制          │  📈 使用统计              │
│  ┌────┬────┬────┬────┐   │  Small: 60               │
│  │自动│Small│Med │Large│  │  Medium: 30              │
│  └────┴────┴────┴────┘   │  Large: 10               │
│                          │  总请求: 100  成本: $2.50 │
│  📊 路由策略              │                          │
│  ┌────┬────┬────┐        │                          │
│  │平衡│成本│性能│        │                          │
│  └────┴────┴────┘        │                          │
├─────────────────────────────────────────────────────┤
│  🧪 路由测试              │  📜 历史记录              │
│  [输入消息测试...] [测试] │  • 你好 → small          │
│                          │  • 深度分析 → large       │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ 技术架构

```
用户消息
    ↓
┌─────────────────────┐
│   Switch 检测       │  ← v2.0 新增
│  检查 /switch 命令  │
└─────────────────────┘
    ↓
┌─────────────────────┐
│   状态管理器        │  ← v2.0 新增
│  ~/.openclaw/       │
│  switch.json        │
└─────────────────────┘
    ↓
┌─────────────────────┐
│   分类器            │
│  - 关键词匹配       │
│  - 长度判断         │
│  - 任务类型识别     │
│  - 特殊模式检测     │
└─────────────────────┘
    ↓ { level, score, taskType }
┌─────────────────────┐
│   路由策略引擎      │
│  - 策略选择         │
│  - 自动规则         │
│  - 成本计算         │
└─────────────────────┘
    ↓ { modelRef, level, cost }
┌─────────────────────┐
│   OpenClaw 会话     │
│  使用推荐模型发送   │
└─────────────────────┘
```

---

## 📁 项目结构

```
ModelFlow/
├── hybrid-model-code/       # 核心代码
│   ├── SKILL.md            # Skill 说明
│   ├── integrate.js        # 集成脚本
│   ├── src/
│   │   ├── classifier.js   # 任务分类器
│   │   ├── router.js       # 路由策略引擎
│   │   └── switch.js       # Switch 状态管理 (v2.0)
│   └── ui/                 # 图形界面 (v2.0)
│       ├── index.html      # Web 界面
│       └── server.js       # API 服务
├── hybrid-model/           # 配置和文档
│   ├── config.json        # 配置文件
│   ├── README.md          # 使用文档
│   └── test.sh            # 测试脚本
├── README.md               # 仓库主页
└── LICENSE                 # MIT 许可证
```

---

## 🔧 集成到 OpenClaw

### 方案 A：手动调用（推荐新手）

```bash
# 获取路由建议
RESULT=$(node ~/.openclaw/skills/hybrid-model-router/integrate.js test "你的消息")

# 提取推荐模型
MODEL=$(echo $RESULT | jq -r '.routing.modelRef')

# 使用推荐模型发送
openclaw agent --message "你的消息" --model "$MODEL"
```

### 方案 B：修改 OpenClaw 源码（高级）

```javascript
const { routeMessage } = require('./hybrid-model-router/integrate');

async function handleSession(message) {
  // 检查是否是 switch 命令
  if (message.startsWith('/switch')) {
    const result = routeMessage(message);
    return result.message;
  }
  
  // 路由决策
  const routeResult = routeMessage(message);
  
  // 使用推荐的模型
  const model = routeResult.routing.modelRef;
  
  // 调用原有逻辑
  return await callAgent(message, { model });
}
```

---

## 🧪 测试用例

| 场景 | 示例消息 | 分类结果 | 推荐模型 |
|------|----------|----------|----------|
| 简单问候 | "你好" | small (0 分) | qwen-plus |
| 代码任务 | "写个快速排序" | medium (2 分) | qwen-max |
| 深度分析 | "请深度分析..." | large (9 分) | qwen-plus |
| 文档写作 | "写一份项目文档" | medium (5 分) | qwen-max |
| 日常聊天 | "今天天气不错" | small (0 分) | qwen-plus |
| 多步骤 | "第一步...第二步..." | large (7 分) | qwen-plus |

---

## 💰 成本优化效果

| 场景 | 无路由（全用大模型） | 有路由（混合使用） | 节省 |
|------|---------------------|-------------------|------|
| 简单问答 (60%) | $12.00 | $2.40 | 80% |
| 中等任务 (30%) | $12.00 | $6.00 | 50% |
| 复杂分析 (10%) | $8.00 | $8.00 | 0% |
| **总计** | **$32.00** | **$16.40** | **49%** |

---

## 📈 更新日志

### v2.0.0 (2026-03-29)
- ✅ 新增 Switch 功能
  - `/switch` 命令支持
  - 状态持久化
  - 直接指定模型
  - 策略切换
- ✅ 新增图形化界面
  - Web 管理控制台
  - 实时统计
  - 历史记录
  - API 服务

### v1.0.0 (2026-03-23)
- ✅ 初始版本发布
- ✅ 任务复杂度分类器
- ✅ 三种路由策略
- ✅ 自动升级/降级规则
- ✅ 成本追踪
- ✅ 关键词覆盖
- ✅ 完整测试套件

---

## 🙏 致谢

- 基于 [OpenClaw](https://github.com/openclaw/openclaw) 改造
- 灵感来自 Claude Code 的模型选择机制

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🔗 相关链接

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [ClawHub 技能市场](https://clawhub.ai)

---

*最后更新：2026-03-29*  
*版本：v2.0.0*  
*作者：lin09389*
