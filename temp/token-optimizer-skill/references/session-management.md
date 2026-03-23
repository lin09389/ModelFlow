# Session 管理最佳实践

## Session 类型对比

| 类型 | 用途 | 隐私加载 | 推荐场景 |
|------|------|----------|----------|
| **Main Session** | 直接对话 | ✅ MEMORY.md | 日常聊天、简单任务 |
| **Isolated Session** | 子 agent | ❌ 无隐私 | 复杂任务、并行处理 |
| **Group Session** | 群聊 | ❌ 无隐私 | 多人协作 |

## 何时使用 Sub-agent

**触发条件**（任一满足即可）：

- [ ] 任务步骤 > 3
- [ ] 需要读取 > 3 个文件
- [ ] 预估耗时 > 5 分钟
- [ ] 需要并行执行多个独立任务
- [ ] 涉及代码分析/重构

## Sub-agent 模板

```bash
# 一次性任务
sessions_spawn runtime="subagent" mode="run" \
  task="分析这个代码库的 auth 模块" \
  label="auth-analysis"

# 持久会话（多轮对话）
sessions_spawn runtime="subagent" mode="session" \
  task="帮我重构这个模块" \
  label="refactor-session" \
  thread=true
```

## Context 监控

```bash
# 每 10-15 轮对话检查一次
session_status
```

**阈值行动**：

| Context % | 行动 |
|-----------|------|
| < 50% | 正常 |
| 50-70% | 开始写入决策到 daily notes |
| 70-85% | 主动压缩 |
| > 85% | 紧急压缩 |

## Session 隔离规则

**绝对禁止**：

- ❌ 为理解当前消息读取其他 session 历史
- ❌ 群聊加载 `MEMORY.md`
- ❌ 跨 session 查找文件 context

**正确做法**：

- ✅ 只基于当前 session 的聊天记录
- ✅ 不确定直接问用户
- ✅ 用 `sessions_send` 明确指定 target
