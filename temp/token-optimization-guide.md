# OpenClaw Token 优化终极指南

> 完整 token 优化方案：多模型路由 + 脏活本地化 + 智能管理  
> 更新时间：2026-03-17

---

## 🎯 三层优化架构

```
┌─────────────────────────────────────────────────┐
│           Layer 1: 任务分流层                     │
│   脏活检测 → 本地命令 vs AI 模型                   │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│           Layer 2: 模型路由层                     │
│   AI 任务 → 轻量/标准/强模型                       │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│           Layer 3: Context 管理层                 │
│   Session 隔离 + Memory 懒加载 + 文件分块          │
└─────────────────────────────────────────────────┘
```

---

## 📦 已安装技能

| 技能 | 位置 | 用途 |
|------|------|------|
| **token-optimizer** | `~/.openclaw/skills/token-optimizer` | Context 监控与管理 |
| **model-router** | `~/.openclaw/skills/model-router` | 多模型智能路由 |
| **dirty-work-detector** | `~/.openclaw/skills/dirty-work-detector` | 脏活识别与本地化 |

---

## 🚀 使用流程

### Step 1: 任务输入

```
用户："把这 100 个 JSON 文件转成 YAML，然后分析数据结构"
```

### Step 2: 脏活检测（自动）

```
检测到 "转换" + "批量" → 脏活
→ 用本地命令处理格式转换
```

### Step 3: 模型路由（自动）

```
检测到 "分析" + "数据结构" → AI 活，中等复杂度
→ 用 qwen-plus 模型
```

### Step 4: Context 管理（自动）

```
大文件读取 → 分块读取
Memory 查询 → memory_search + memory_get
复杂任务 → sub-agent 隔离
```

---

## 💰 成本对比

### 场景：处理 100 个 JSON 文件 + 分析

| 方案 | Token 消耗 | 成本 | 时间 |
|------|-----------|------|------|
| **全用 AI** | 500k+ | 💰💰💰💰💰 | 10 分钟 |
| **优化后** | 50k | 💰 | 2 分钟 |
| **节省** | **90%** | **80%** | **80%** |

---

## 📊 优化效果总览

| 策略 | 单独效果 | 组合效果 |
|------|----------|----------|
| 脏活本地化 | 40-60% | - |
| 多模型路由 | 30-50% | - |
| Context 管理 | 50-70% | - |
| **三者组合** | - | **80-90%** |

---

## 🛠️ 快速命令

### 脏活检测

```bash
~/.openclaw/skills/dirty-work-detector/scripts/detect-dirty-work.sh "任务描述"
```

### 模型路由

```bash
~/.openclaw/skills/model-router/scripts/route-task.sh "任务描述"
```

### Context 检查

```bash
session_status
```

### 快速优化清单

```bash
~/.openclaw/skills/token-optimizer/scripts/quick-optimize.sh
```

---

## 📋 决策速查表

### 脏活 vs AI 活

| 任务类型 | 处理方式 |
|----------|----------|
| 批量文件操作 | ✅ 本地命令 |
| 格式转换 | ✅ 本地命令 |
| 数据清洗 | ✅ 本地命令 |
| 代码审查 | 🤖 AI 模型 |
| 架构设计 | 🤖 AI 模型 |
| 创意写作 | 🤖 AI 模型 |

### 模型选择

| 任务复杂度 | 推荐模型 |
|------------|----------|
| 简单（单步、规则明确） | qwen-turbo |
| 中等（2-3 步、需要理解） | qwen-plus |
| 复杂（>3 步、需要创造性） | qwen-max |

### Context 管理

| Context % | 行动 |
|-----------|------|
| < 50% | 正常 |
| 50-70% | 写入决策到 daily notes |
| 70-85% | 主动压缩 |
| > 85% | 紧急压缩 |

---

## 🎓 最佳实践

### 1. 收到任务先问三个问题

1. 这是脏活吗？（有 CLI 工具吗？）
2. 需要哪个模型？（简单/中等/复杂？）
3. Context 够吗？（需要压缩吗？）

### 2. 建立本地命令库

常用脏活命令存成脚本：

```bash
~/.openclaw/workspace/scripts/
├── json2yaml.sh
├── batch-rename.sh
├── data-clean.sh
└── ...
```

### 3. 定期审查 token 使用

每周检查：
- 哪些任务可以用本地命令替代？
- 哪些任务用了过强的模型？
- Context 使用是否合理？

### 4. 混合模式最优化

```bash
# 本地预处理
grep "ERROR" app.log > errors.txt

# AI 分析
sessions_spawn model="qwen-plus" task="分析错误原因" files="errors.txt"
```

---

## 🔧 进阶配置

### 自定义模型映射

编辑 `~/.openclaw/skills/model-router/SKILL.md` 修改模型选择逻辑。

### 添加脏活命令

编辑 `~/.openclaw/skills/dirty-work-detector/SKILL.md` 添加新的脏活检测规则。

### 自动化脚本

创建 cron 任务定期检查 token 使用：

```bash
cron add --schedule "every 24h" --payload "检查 token 使用并生成报告"
```

---

## 📚 参考资源

| 资源 | 链接 |
|------|------|
| OpenClaw 文档 | https://docs.openclaw.ai |
| ClawHub 技能市场 | https://clawhub.ai |
| 社区 Discord | https://discord.com/invite/clawd |

---

*最后更新：2026-03-17*  
*维护者：momo*
