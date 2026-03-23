#!/bin/bash
# quick-optimize.sh - Token 优化快速行动清单
# 用法：./quick-optimize.sh

cat << 'EOF'
🎯 Token 优化快速行动清单

立即可以做的 3 件事：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  复杂任务用 sub-agent
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   下次遇到 >3 步的任务，直接运行：
   
   sessions_spawn runtime="subagent" mode="run" \
     task="任务描述" \
     label="task-name"

2️⃣  Memory 懒加载
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   把 read MEMORY.md 改成：
   
   memory_search query="关键词" maxResults=3
   memory_get path="MEMORY.md" from=10 lines=20

3️⃣  大文件分块读取
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   文件 >1000 行时：
   
   read path="file.txt" offset=1 limit=100
   # 需要继续再读下一块

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

进阶优化（选做）：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4️⃣  回复精简
   - 默认用 bullet points
   - 代码写文件不贴对话里
   - 用户要求展开再详细说

5️⃣  Context 监控
   - 每 10-15 轮对话运行 session_status
   - >70% 时主动压缩到 daily notes

6️⃣  Cron 代替 Heartbeat
   - 定期检查任务用 isolated session
   - 有结果才通知 main session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

预期效果：整体 token 消耗减少 50-70%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
