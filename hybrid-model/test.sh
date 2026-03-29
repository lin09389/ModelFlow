#!/bin/bash

# 混合模型路由 - 完整测试脚本 v2.0
# 新增 Switch 功能测试

ROUTER_DIR=~/.openclaw/skills/hybrid-model-router

# 如果本地运行，使用当前目录
if [ ! -d "$ROUTER_DIR" ]; then
  ROUTER_DIR="$(cd "$(dirname "$0")/../hybrid-model-code" && pwd)"
fi

echo "================================"
echo "  混合模型路由 v2.0 - 测试"
echo "================================"
echo ""

# 测试用例
test_case() {
  local name="$1"
  local message="$2"
  local expected="$3"
  
  echo "📝 测试：$name"
  echo "   消息：$message"
  
  local result=$(node "$ROUTER_DIR/integrate.js" test "$message" 2>&1 | tail -n +4)
  
  local level=$(echo "$result" | grep -o '"level": "[^"]*"' | head -1 | cut -d'"' -f4)
  local score=$(echo "$result" | grep -o '"score": [0-9-]*' | head -1 | cut -d: -f2 | tr -d ' ')
  local confidence=$(echo "$result" | grep -o '"confidence": [0-9.]*' | head -1 | cut -d: -f2 | tr -d ' ')
  local model=$(echo "$result" | grep -o '"modelRef": "[^"]*"' | head -1 | cut -d'"' -f4)
  local reason=$(echo "$result" | grep -o '"reason": "[^"]*"' | head -1 | cut -d'"' -f4)
  local switchMode=$(echo "$result" | grep -o '"mode": "[^"]*"' | head -1 | cut -d'"' -f4)
  
  local status="✅"
  if [ -n "$expected" ] && [ "$level" != "$expected" ]; then
    status="⚠️ (预期: $expected)"
  fi
  
  echo "   $status 分类：$level (得分：$score, 置信度：$confidence)"
  echo "   🎯 推荐：$model"
  if [ -n "$switchMode" ]; then
    echo "   🔧 Switch模式：$switchMode"
  fi
  echo "   📊 原因：$reason"
  echo ""
}

# Switch 测试函数
test_switch() {
  local cmd="$1"
  local description="$2"
  
  echo "🔧 Switch测试：$description"
  echo "   命令：/switch $cmd"
  
  local result=$(node "$ROUTER_DIR/integrate.js" switch "$cmd" 2>&1)
  
  echo "   结果："
  echo "$result" | head -5 | while read line; do
    echo "     $line"
  done
  echo ""
}

echo "=== 基础测试 ==="
test_case "简单问候" "你好" "small"
test_case "英文问候" "hello" "small"
test_case "确认回复" "好的" "small"

echo ""
echo "=== 否定处理测试 ==="
test_case "否定-不需要分析" "不需要深度分析，简单看看就行" "small"
test_case "否定-不用复杂" "不用写复杂代码，就一个简单函数" "small"
test_case "否定-别做详细" "别做详细分析，给个大概就行" "small"

echo ""
echo "=== 代码复杂度测试 ==="
test_case "简单代码" "\`let x = 1;\`" "small"
test_case "中等代码" "帮我写个 Python 快速排序" "medium"
test_case "复杂代码" "请设计一个高并发的分布式微服务架构，包含负载均衡、服务发现、熔断降级等功能" "large"

echo ""
echo "=== 复杂度分级测试 ==="
test_case "深度分析" "请深度分析这个复杂问题，需要多维度对比" "large"
test_case "文档写作" "帮我写一份项目文档，包含架构设计和 API 说明" "medium"
test_case "日常聊天" "今天天气不错，你有什么计划吗" "small"
test_case "多步骤任务" "第一步分析需求，第二步设计架构，第三步实现代码，第四步测试优化" "large"

echo ""
echo "=== 边界情况测试 ==="
test_case "短问候" "hi" "small"
test_case "单个问题" "这是什么？" "small"
test_case "确认词" "ok" "small"

echo ""
echo "=== 多语言测试 ==="
test_case "日语问候" "こんにちは" "small"
test_case "日语复杂" "詳細な分析をお願いします" "large"
test_case "韩语问候" "안녕하세요" "small"
test_case "法语问候" "bonjour" "small"
test_case "德语问候" "hallo" "small"
test_case "西班牙语问候" "hola" "small"

echo ""
echo "================================"
echo "  Switch 功能测试"
echo "================================"
echo ""

test_switch "status" "查看当前状态"
test_switch "large" "强制使用大模型"
test_switch "status" "确认状态已更新"
test_switch "auto" "恢复自动模式"
test_switch "status" "确认已恢复"
test_switch "cost-optimal" "切换成本优先策略"
test_switch "performance" "切换性能优先策略"
test_switch "balanced" "切换回平衡策略"
test_switch "gpt-4o" "直接指定模型"
test_switch "reset" "重置为默认"

echo ""
echo "================================"
echo "  Switch 影响测试"
echo "================================"
echo ""

echo "🔧 设置 Switch 为 large 模式..."
node "$ROUTER_DIR/integrate.js" switch large > /dev/null 2>&1

echo ""
test_case "简单问候(large模式)" "你好" "large"

echo "🔧 恢复自动模式..."
node "$ROUTER_DIR/integrate.js" switch auto > /dev/null 2>&1

echo ""
test_case "简单问候(auto模式)" "你好" "small"

echo ""
echo "================================"
echo "  测试完成！"
echo "================================"
echo ""
echo "运行状态查看："
echo "  node $ROUTER_DIR/integrate.js status"
echo ""
echo "Switch 命令："
echo "  node $ROUTER_DIR/integrate.js switch status"
echo "  node $ROUTER_DIR/integrate.js switch large"
echo "  node $ROUTER_DIR/integrate.js switch auto"
