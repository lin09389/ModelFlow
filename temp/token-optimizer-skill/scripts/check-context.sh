#!/bin/bash
# check-context.sh - 检查当前 session 的 context 使用率
# 用法：./check-context.sh

# 调用 session_status 并解析结果
# 注意：这个脚本需要在 openclaw 环境中运行

echo "📊 检查 Context 使用率..."
echo ""

# 调用 session_status（需要通过 openclaw 工具）
# 这里用伪代码表示，实际需要在 skill 中通过 tool call 实现

cat << 'EOF'
请运行以下命令：

  session_status

然后查看输出中的 context 使用百分比。

阈值行动指南：
  < 50%   → 正常操作
  50-70%  → 开始写入关键决策到 daily notes
  70-85%  → 主动压缩：把重要信息写入文件
  > 85%   → 紧急压缩：停止对话，先写摘要

快速压缩命令：
  1. 把决策写入 memory/YYYY-MM-DD.md
  2. 用 sessions_spawn 隔离复杂任务
  3. 用 memory_search 代替 read MEMORY.md
EOF
