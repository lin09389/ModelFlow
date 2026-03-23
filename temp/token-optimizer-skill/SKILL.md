---
name: token-optimizer
description: Token 消耗优化工具。监控 session context 使用率，提供压缩建议，管理 memory 懒加载，分块读取大文件，隔离复杂任务到 sub-agent。当需要减少 token 消耗、优化 context 使用、或管理长期对话时触发。
---

# Token Optimizer - Token 消耗优化器

## 核心目标

在不降低任务处理质量的前提下，最小化 token 消耗。

## 使用场景

- 长对话 context 接近上限（>70%）
- 需要频繁读取大文件
- 复杂任务需要隔离执行
- 定期检查 token 使用情况
- Memory 文件过大需要优化加载

---

## 快速开始

### 1. 检查当前 Context 使用率

```bash
session_status
```

查看输出中的 context 使用百分比。

### 2. 根据阈值采取行动

| Context % | 行动 |
|-----------|------|
| **< 50%** | 正常操作 |
| **50-70%** | 开始写入关键决策到 daily notes |
| **70-85%** | 主动压缩：把重要信息写入文件 |
| **> 85%** | 紧急压缩：停止对话，先写摘要 |

### 3. 复杂任务隔离

```bash
# 预估 >3 步的任务，直接 spawn sub-agent
sessions_spawn runtime="subagent" mode="run" task="分析这个代码库"
```

---

## 核心策略

### 策略 1：Session 隔离（效果：⭐⭐⭐⭐⭐）

**原则**：主 session 保持轻量，复杂任务扔到 isolated session

```yaml
# 坏的模式
用户问问题 → 加载 MEMORY.md → 读一堆文件 → 回复（context 爆炸）

# 好的模式
用户问问题 → spawn sub-agent → 子 agent 处理 → 只返回结果
```

**何时使用**：
- 任务步骤 > 3
- 需要读取多个大文件
- 涉及代码分析/重构
- 需要并行执行多个独立任务

### 策略 2：Memory 懒加载（效果：⭐⭐⭐⭐）

**原则**：不要直接 `read MEMORY.md`，用 `memory_search + memory_get`

```yaml
# 坏的
read path="MEMORY.md" → 加载全部内容（可能 5000+ 行）

# 好的
memory_search query="用户偏好" maxResults=3
memory_get path="MEMORY.md" from=10 lines=20
```

**何时使用**：
- 需要查询历史决策
- 需要用户偏好信息
- 需要项目背景信息

### 策略 3：文件分块读取（效果：⭐⭐⭐⭐）

**原则**：大文件用 `offset/limit` 分块，不要一次性读完

```yaml
# 坏的
read path="large-log.txt" → 返回 10000 行

# 好的
read path="large-log.txt" offset=1 limit=100
# 需要再继续
read path="large-log.txt" offset=101 limit=100
```

**何时使用**：
- 文件 > 1000 行
- 日志文件分析
- 大型配置文件

**技巧**：先用 `grep` 定位关键词行号，再 `read` 具体片段

### 策略 4：回复精简（效果：⭐⭐⭐）

**原则**：默认简短回复，用户要求展开再详细说

```yaml
# 坏的
"好的，我来帮你分析这个问题。首先我们需要考虑以下几个方面..."（500 字）

# 好的
"问题在 auth 模块第 42 行，token 验证逻辑缺失。修复方案：[代码片段]"（100 字）
```

**何时使用**：
- 所有对话默认
- 代码/配置用文件交付
- 用 bullet points 代替长段落

### 策略 5：Context 主动压缩（效果：⭐⭐⭐⭐）

**原则**：定期把重要信息写入文件，释放 context

```yaml
# 每 10-15 轮对话检查一次
session_status
# 如果 >70%，写入 daily notes
```

**写入内容**：
- 已完成的决策和原因
- 待办事项和负责人
- 关键代码片段（写文件，不贴对话）
- 开放问题和下一步

### 策略 6：Cron 代替 Heartbeat 轮询（效果：⭐⭐）

**原则**：定期检查任务用 isolated session 的 cron，不用 main session heartbeat

```yaml
# 坏的
每 30 分钟 → main session 心跳 → 加载完整 context → 检查邮件/日历

# 好的
cron add → isolated session → 检查 → 有结果才通知 main session
```

**何时使用**：
- 定期邮件检查
- 日历提醒
- 天气/新闻推送

---

## 工具脚本

### check_context.sh

检查当前 session 的 context 使用率并给出建议。

```bash
#!/bin/bash
# 调用 session_status 并解析结果
```

### compress_suggest.sh

根据当前 context 内容，生成压缩建议。

---

## 参考文档

- [Session 管理最佳实践](references/session-management.md)
- [Memory 优化指南](references/memory-optimization.md)
- [文件读取策略](references/file-reading.md)

---

## 优化效果对比

| 策略 | 实施难度 | Token 节省 | 推荐指数 |
|------|----------|-----------|----------|
| Session 隔离 | 低 | 60%+ | ⭐⭐⭐⭐⭐ |
| Memory 懒加载 | 中 | 70%+ | ⭐⭐⭐⭐⭐ |
| 文件分块读取 | 低 | 50-80% | ⭐⭐⭐⭐ |
| 回复精简 | 低 | 20-30% | ⭐⭐⭐⭐ |
| Context 压缩 | 中 | 40-50% | ⭐⭐⭐⭐ |
| Cron 替代 Heartbeat | 中 | 80%+ | ⭐⭐⭐ |

**组合使用预期**：整体 token 消耗可减少 **50-70%**

---

## 立即行动清单

1. [ ] 下次复杂任务用 `sessions_spawn`
2. [ ] 把 `read MEMORY.md` 改成 `memory_search + memory_get`
3. [ ] 大文件读取默认 `limit=100`
4. [ ] 回复用 bullet points，代码写文件
5. [ ] 每 10 轮对话检查 `session_status`
