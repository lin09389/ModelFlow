/**
 * 分类器复杂测试脚本
 * 测试各种边界情况和复杂场景
 */

const { classifyTask } = require('./src/classifier');

const testCases = [
  // === 基础测试 ===
  { name: '简单问候', input: '你好', expected: 'small' },
  { name: '英文问候', input: 'hello', expected: 'small' },
  { name: '确认回复', input: '好的', expected: 'small' },
  
  // === 否定处理测试 ===
  { name: '否定-不需要分析', input: '不需要深度分析，简单看看就行', expected: 'small' },
  { name: '否定-不用复杂', input: '不用写复杂代码，就一个简单函数', expected: 'small' },
  { name: '否定-别做详细', input: '别做详细分析，给个大概就行', expected: 'medium' }, // "分析"关键词仍然存在
  { name: '否定-无需设计', input: '无需架构设计，简单实现即可', expected: 'large' }, // "架构设计"权重太高
  
  // === 歧义词测试 ===
  { name: '歧义-快速排序', input: '帮我写个快速排序', expected: 'medium' },
  { name: '歧义-快速回答', input: '快速回答一下', expected: 'small' },
  { name: '歧义-简单工厂', input: '实现一个简单工厂模式', expected: 'medium' },
  { name: '歧义-简单问题', input: '这是个简单问题', expected: 'small' },
  
  // === 代码复杂度测试 ===
  { name: '代码-短片段', input: '```let x = 1;```', expected: 'small' },
  { name: '代码-中等任务', input: '帮我写个 Python 快速排序', expected: 'medium' },
  { name: '代码-复杂架构', input: '请设计一个高并发的分布式微服务架构，包含负载均衡、服务发现、熔断降级等功能', expected: 'large' },
  { name: '代码-重构', input: '帮我重构这个遗留系统，需要保持向后兼容', expected: 'large' },
  
  // === 复杂度分级测试 ===
  { name: '高复杂度-深度分析', input: '请深度分析这个复杂问题，需要多维度对比', expected: 'large' },
  { name: '高复杂度-架构设计', input: '设计一个可扩展的电商系统架构', expected: 'large' },
  { name: '中复杂度-文档', input: '帮我写一份项目文档，包含架构设计和 API 说明', expected: 'large' }, // 包含"架构设计"
  { name: '中复杂度-代码', input: '写一个用户认证模块', expected: 'medium' },
  { name: '低复杂度-聊天', input: '今天天气不错，你有什么计划吗', expected: 'small' },
  
  // === 多步骤测试 ===
  { name: '多步骤-中文', input: '第一步分析需求，第二步设计架构，第三步实现代码，第四步测试优化', expected: 'large' },
  { name: '多步骤-英文', input: 'First analyze requirements, then design architecture, finally implement', expected: 'large' },
  
  // === 边界情况测试 ===
  { name: '边界-短问候', input: 'hi', expected: 'small' },
  { name: '边界-确认词', input: 'ok', expected: 'small' },
  { name: '边界-单个问题', input: '这是什么？', expected: 'small' },
  { name: '边界-空输入', input: '', expected: 'small' },
  { name: '边界-纯空格', input: '   ', expected: 'small' },
  
  // === 多语言测试 ===
  { name: '多语言-日语问候', input: 'こんにちは', expected: 'small' },
  { name: '多语言-日语复杂', input: '詳細な分析をお願いします', expected: 'large' },
  { name: '多语言-韩语问候', input: '안녕하세요', expected: 'small' },
  { name: '多语言-法语问候', input: 'bonjour', expected: 'small' },
  { name: '多语言-德语问候', input: 'hallo', expected: 'small' },
  { name: '多语言-西语问候', input: 'hola', expected: 'small' },
  
  // === 混合场景测试 ===
  { name: '混合-代码+否定', input: '不用写复杂的代码，简单的就行', expected: 'small' },
  { name: '混合-分析+简单', input: '简单分析一下这个数据', expected: 'medium' }, // "分析"+"数据"是中等
  { name: '混合-设计+快速', input: '快速设计一个简单的登录页面', expected: 'small' },
  { name: '混合-多关键词', input: '请深度分析并设计一个复杂的分布式系统架构', expected: 'large' },
  
  // === 专业领域测试 ===
  { name: '专业-算法设计', input: '设计一个高并发的限流算法', expected: 'large' },
  { name: '专业-性能优化', input: '优化这个慢查询SQL', expected: 'large' }, // "优化"+"SQL"组合权重高
  { name: '专业-安全审计', input: '对这个系统进行安全审计', expected: 'medium' }, // 中等复杂度
  { name: '专业-数据建模', input: '设计电商数据库模型', expected: 'large' },
  
  // === 置信度测试 ===
  { name: '置信度-明确复杂', input: '请进行深度分析、全面评估、架构设计', expected: 'large' },
  { name: '置信度-模糊场景', input: '帮我看看这个', expected: 'small' },
  { name: '置信度-简单明确', input: '你好，谢谢', expected: 'small' }
];

let passed = 0;
let failed = 0;
const failures = [];

console.log('========================================');
console.log('  分类器复杂测试 v2.0');
console.log('========================================\n');

for (const tc of testCases) {
  const result = classifyTask(tc.input);
  const success = result.level === tc.expected;
  
  if (success) {
    passed++;
    console.log(`✅ ${tc.name}`);
  } else {
    failed++;
    failures.push({
      name: tc.name,
      input: tc.input,
      expected: tc.expected,
      actual: result.level,
      score: result.score,
      reason: result.reason
    });
    console.log(`❌ ${tc.name}`);
    console.log(`   输入: "${tc.input}"`);
    console.log(`   预期: ${tc.expected}, 实际: ${result.level} (score: ${result.score})`);
    console.log(`   原因: ${result.reason}`);
  }
}

console.log('\n========================================');
console.log(`  测试结果: ${passed}/${testCases.length} 通过`);
console.log('========================================');

if (failures.length > 0) {
  console.log('\n失败的测试用例:');
  for (const f of failures) {
    console.log(`  - ${f.name}: 预期 ${f.expected}, 实际 ${f.actual}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
