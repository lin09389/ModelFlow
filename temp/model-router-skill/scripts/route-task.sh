#!/bin/bash
# route-task.sh - 自动分析任务并推荐模型
# 用法：./route-task.sh "任务描述"

TASK="$1"

if [ -z "$TASK" ]; then
    echo "用法：$0 \"任务描述\""
    exit 1
fi

echo "📊 任务分析：$TASK"
echo ""

# 简单关键词检测
LIGHT_KEYWORDS="转换 提取 格式化 重命名 合并 简单 快速"
MEDIUM_KEYWORDS="分析 总结 审查 对比 优化 统计 查找"
HEAVY_KEYWORDS="设计 架构 规划 创意 策略 从零 系统 框架"

SCORE=0

# 检测轻量关键词
for kw in $LIGHT_KEYWORDS; do
    if echo "$TASK" | grep -q "$kw"; then
        SCORE=$((SCORE - 1))
    fi
done

# 检测中等关键词
for kw in $MEDIUM_KEYWORDS; do
    if echo "$TASK" | grep -q "$kw"; then
        SCORE=$((SCORE + 1))
    fi
done

# 检测复杂关键词
for kw in $HEAVY_KEYWORDS; do
    if echo "$TASK" | grep -q "$kw"; then
        SCORE=$((SCORE + 2))
    fi
done

echo "推荐模型："
if [ $SCORE -le -1 ]; then
    echo "  🟢 qwen-turbo (轻量)"
    echo "  原因：任务简单，不需要复杂推理"
elif [ $SCORE -le 2 ]; then
    echo "  🟡 qwen-plus (标准)"
    echo "  原因：任务需要一定分析和理解"
else
    echo "  🔴 qwen-max (强模型)"
    echo "  原因：任务复杂，需要创造性或多步推理"
fi

echo ""
echo "使用命令："
echo "  sessions_spawn model=<model> task=\"$TASK\""
