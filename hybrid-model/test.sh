#!/bin/bash

# 混合模型路由 - 快速测试脚本

ROUTER_DIR=~/.openclaw/skills/hybrid-model-router

echo "================================"
echo "  混合模型路由 - 快速测试"
echo "================================"
echo ""

# 测试用例
test_case() {
  local name="$1"
  local message="$2"
  echo "📝 测试：$name"
  echo "   消息：$message"
  
  # 运行并解析结果
  local result=$(node "$ROUTER_DIR/integrate.js" test "$message" 2>&1 | tail -n +4)
  
  # 提取字段
  local level=$(echo "$result" | grep -o '"level": "[^"]*"' | head -1 | cut -d'"' -f4)
  local score=$(echo "$result" | grep -o '"score": [0-9-]*' | head -1 | cut -d: -f2 | tr -d ' ')
  local model=$(echo "$result" | grep -o '"modelRef": "[^"]*"' | head -1 | cut -d'"' -f4)
  local cost=$(echo "$result" | grep -o '"estimatedCost": "[^"]*"' | head -1 | cut -d'"' -f4)
  local reason=$(echo "$result" | grep -o '"reason": "[^"]*"' | head -1 | cut -d'"' -f4)
  
  echo "   👉 分类：$level (得分：$score)"
  echo "   🎯 推荐：$model"
  echo "   💰 预估成本：\$$cost"
  echo "   📊 原因：$reason"
  echo ""
}

# 运行测试
test_case "简单问候" "你好"
test_case "代码任务" "帮我写个 Python 快速排序"
test_case "深度分析" "请深度分析这个复杂问题，需要多维度对比"
test_case "文档写作" "帮我写一份项目文档，包含架构设计和 API 说明"
test_case "日常聊天" "今天天气不错，你有什么计划吗"
test_case "复杂任务" "第一步分析需求，第二步设计架构，第三步实现代码，第四步测试优化"

echo "================================"
echo "  测试完成！"
echo "================================"
