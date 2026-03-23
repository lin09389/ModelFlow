#!/bin/bash
# detect-dirty-work.sh - 检测任务是否适合本地处理
# 用法：./detect-dirty-work.sh "任务描述"

TASK="$1"

if [ -z "$TASK" ]; then
    echo "用法：$0 \"任务描述\""
    exit 1
fi

echo "🔍 脏活检测：$TASK"
echo ""

# 脏活关键词
DIRTY_KEYWORDS="批量 转换 重命名 合并 统计 查找 去重 格式化 压缩 提取 移动 复制 删除"

# AI 活关键词
AI_KEYWORDS="设计 架构 规划 创意 策略 分析 审查 总结 对比 优化 理解 推理"

DIRTY_SCORE=0
AI_SCORE=0

# 检测脏活关键词
for kw in $DIRTY_KEYWORDS; do
    if echo "$TASK" | grep -q "$kw"; then
        DIRTY_SCORE=$((DIRTY_SCORE + 1))
    fi
done

# 检测 AI 活关键词
for kw in $AI_KEYWORDS; do
    if echo "$TASK" | grep -q "$kw"; then
        AI_SCORE=$((AI_SCORE + 1))
    fi
done

echo "检测结果："
if [ $DIRTY_SCORE -gt $AI_SCORE ]; then
    echo "  ✅ 这是脏活！推荐用本地命令"
    echo ""
    echo "  原因："
    echo "  - 重复性高，不需要创造性"
    echo "  - 有现成 CLI 工具可用"
    echo "  - 用 AI 浪费 token"
    echo ""
    echo "  建议："
    echo "  exec \"<本地命令>\""
else
    echo "  🤖 这是 AI 活！推荐用模型处理"
    echo ""
    echo "  原因："
    echo "  - 需要理解或推理"
    echo "  - 没有明确规则"
    echo "  - 需要创造性"
    echo ""
    echo "  建议："
    echo "  sessions_spawn task=\"$TASK\""
fi

echo ""
