# Memory 优化指南

## 问题

`MEMORY.md` 和 `memory/YYYY-MM-DD.md` 文件可能变得很大，每次加载消耗大量 token。

## 解决方案

### 1. 拆分 Memory 文件

把 `MEMORY.md` 拆成多个小文件：

```
memory/
├── users.md           # 用户信息
├── projects.md        # 项目背景
├── preferences.md     # 偏好设置
├── decisions.md       # 重要决策
└── YYYY-MM-DD.md      # 每日日志
```

### 2. 用 memory_search 代替 read

```bash
# 坏的
read path="MEMORY.md"

# 好的
memory_search query="用户偏好" maxResults=3
memory_get path="MEMORY.md" from=10 lines=20
```

### 3. 只取需要的片段

```bash
# 只取相关行
memory_get path="memory/projects.md" from=50 lines=10
```

### 4. 定期归档

把旧的 daily notes 移到 `memory/archive/` 目录，减少搜索范围。

## 实施步骤

1. 分析当前 `MEMORY.md` 内容结构
2. 拆分成多个小文件
3. 更新所有 `read MEMORY.md` 为 `memory_search + memory_get`
4. 设置定期归档 cron 任务
