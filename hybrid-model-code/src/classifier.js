/**
 * 任务复杂度分类器
 * 根据消息内容判断任务复杂度，返回推荐的模型级别
 */

const COMPLEXITY_RULES = {
  highComplexityKeywords: [
    '深度分析', '详细分析', '全面分析', '多维度',
    '复杂', '推理', '推导', '证明',
    '架构设计', '系统设计', '方案设计',
    '对比分析', '优劣分析', '风险评估',
    '长文档', '多步骤', '分阶段',
    'optimize', 'analyze deeply', 'comprehensive',
    'architecture', 'design system', 'refactor'
  ],
  mediumComplexityKeywords: [
    '代码', '编程', '函数', '类', '模块',
    '文档', '报告', '总结', '整理',
    '翻译', '改写', '润色',
    '数据', '表格', '图表',
    'debug', 'code', 'function', 'class',
    'document', 'report', 'translate'
  ],
  lowComplexityKeywords: [
    '简单', '快速', '简要', '大概',
    'hello', 'hi', '在吗', '谢谢',
    '是什么', '怎么做', '怎么弄'
  ],
  taskTypes: {
    coding: ['代码', '编程', 'python', 'javascript', 'java', 'cpp', 'function', 'class', 'import', 'def '],
    writing: ['文章', '文档', '报告', '邮件', '文案', '写作', '润色', '改写'],
    analysis: ['分析', '对比', '评估', '调研', '研究', '分析'],
    chat: ['你好', 'hello', '在吗', '谢谢', '再见', '哈哈'],
    question: ['什么', '为什么', '怎么', '如何', 'whether', 'what', 'why', 'how']
  }
};

function classifyTask(message) {
  const text = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;
  const charCount = message.length;
  let score = 0;
  let matchedReasons = [];

  for (const keyword of COMPLEXITY_RULES.highComplexityKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 3;
      matchedReasons.push('高复杂度关键词：' + keyword);
    }
  }
  for (const keyword of COMPLEXITY_RULES.mediumComplexityKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 2;
      matchedReasons.push('中复杂度关键词：' + keyword);
    }
  }
  for (const keyword of COMPLEXITY_RULES.lowComplexityKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      score -= 1;
      matchedReasons.push('低复杂度关键词：' + keyword);
    }
  }

  if (wordCount > 500 || charCount > 2000) {
    score += 3;
    matchedReasons.push('长文本：' + wordCount + '字');
  } else if (wordCount > 100 || charCount > 500) {
    score += 1;
    matchedReasons.push('中文本：' + wordCount + '字');
  }

  let taskType = 'unknown';
  for (const [type, keywords] of Object.entries(COMPLEXITY_RULES.taskTypes)) {
    const matchCount = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (matchCount > 0) {
      taskType = type;
      break;
    }
  }

  const hasCode = /```|function\s*\(|class\s+\w+|import\s+.*from|def\s+\w+/.test(text);
  const hasMultipleSteps = /第一步 | 第二步 | 然后 | 接着 | finally|step 1|step 2/i.test(text);
  const hasReasoning = /为什么 | 如何 | 分析 | 比较 | 推理|why|how|compare|analyze/i.test(text);

  if (hasCode) { score += 2; matchedReasons.push('包含代码'); }
  if (hasMultipleSteps) { score += 2; matchedReasons.push('多步骤任务'); }
  if (hasReasoning) { score += 2; matchedReasons.push('需要推理'); }

  let level;
  if (score >= 5) level = 'large';
  else if (score >= 2) level = 'medium';
  else level = 'small';

  const reason = matchedReasons.length > 0 
    ? matchedReasons.slice(0, 3).join(', ')
    : '默认级别（得分：' + score + '）';

  return {
    level, taskType, score, reason,
    metrics: { wordCount, charCount, hasCode, hasMultipleSteps, hasReasoning }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { classifyTask, COMPLEXITY_RULES };
}
