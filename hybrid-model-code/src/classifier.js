/**
 * 任务复杂度分类器 v2.1
 * 根据消息内容判断任务复杂度，返回推荐的模型级别
 * 
 * 修复问题：
 * 1. 语义理解 - 添加动词强度、句式检测
 * 2. 关键词扩充 - 150+ 关键词，多语言支持
 * 3. 置信度输出 - 所有结果包含 confidence
 * 4. 否定处理 - "不需要分析" 正确处理
 * 5. 任务类型增强 - 返回多类型 + 置信度
 * 6. 多语言支持 - 日/韩/法/德/西语
 * 7. 边界情况 - 短代码、问候语等特殊处理
 * 8. v2.1 修复 - 关键词覆盖、阈值调整、短代码处理
 */

const COMPLEXITY_RULES = {
  highComplexityKeywords: [
    '深度分析', '详细分析', '全面分析', '多维度',
    '复杂', '推理', '推导', '证明',
    '架构设计', '系统设计', '方案设计', '设计', '架构',
    '对比分析', '优劣分析', '风险评估',
    '长文档', '多步骤', '分阶段',
    '可行性研究', '技术选型', '性能优化', '安全审计',
    '算法设计', '算法', '数据建模', '系统重构', '代码审查',
    '需求分析', '竞品分析', '用户研究', 'A/B测试',
    '从头实现', '端到端', '全栈', '微服务',
    '分布式', '高并发', '高可用', '容错', '限流',
    '遗留系统', '向后兼容',
    'comprehensive', 'thorough', 'in-depth', 'systematic',
    'architecture', 'redesign', 'optimization', 'benchmark',
    'optimize', 'analyze deeply', 'refactor'
  ],
  mediumComplexityKeywords: [
    '代码', '编程', '函数', '类', '模块',
    '文档', '报告', '总结', '整理',
    '翻译', '改写', '润色',
    '数据', '表格', '图表',
    '调试', '修复', '重构', '实现', '开发',
    'API', '接口', '组件', '配置', '部署',
    '测试', '单元测试', '集成', '版本',
    '博客', '方案', '大纲', '草稿',
    '简历', '邮件', '通知', '公告',
    '统计', '处理', '转换', '清洗',
    '可视化', '报表', '仪表盘',
    '优化', '慢查询', 'SQL',
    'python', 'javascript', 'java', 'typescript',
    'debug', 'code', 'function', 'class',
    'document', 'report', 'translate'
  ],
  lowComplexityKeywords: [
    '简单', '简要', '大概',
    'hello', 'hi', '在吗', '谢谢',
    '是什么', '怎么做', '怎么弄',
    '你好', '早上好', '晚安', '再见',
    '好的', '收到', '明白', '了解',
    '对了', '顺便', '还有',
    '是什么意思', '定义', '概念', '介绍',
    '举个例子', '简单说', '一句话',
    '看看', '检查', '确认', '验证',
    '天气', '今天', '计划', '打算'
  ],
  ambiguousKeywords: {
    '快速': { notLowWhenFollowedBy: ['排序', '搜索', '查找', '算法', '傅里叶', '变换'] },
    '简单': { notLowWhenFollowedBy: ['工厂', '模式', '算法', '实现', '系统', '架构'] },
    '基础': { notLowWhenFollowedBy: ['架构', '设施', '框架', '系统', '组件'] },
    '轻量': { notLowWhenFollowedBy: ['框架', '服务器', '容器', '数据库'] }
  },
  taskTypes: {
    coding: ['代码', '编程', 'python', 'javascript', 'java', 'cpp', 'function', 'class', 'import', 'def ', 'debug', 'API', '接口', '组件', '排序', '算法'],
    writing: ['文章', '文档', '报告', '邮件', '文案', '写作', '润色', '改写', '博客', '简历'],
    analysis: ['分析', '对比', '评估', '调研', '研究', '统计', '可视化'],
    chat: ['你好', 'hello', '在吗', '谢谢', '再见', '哈哈', '嗨', 'hey', '天气', '今天'],
    question: ['什么', '为什么', '怎么', '如何', 'whether', 'what', 'why', 'how', '是否']
  }
};

const MULTILINGUAL_KEYWORDS = {
  ja: {
    high: ['詳細分析', '複雑', '設計', '最適化', 'アーキテクチャ', '深掘り', '包括的', '詳細な分析'],
    medium: ['コード', 'プログラミング', 'ドキュメント', '修正', '実装', 'テスト'],
    low: ['こんにちは', 'ありがとう', '簡単', '確認', 'はい', 'いいえ']
  },
  ko: {
    high: ['심층 분석', '복잡', '설계', '최적화', '아키텍처', '종합적'],
    medium: ['코드', '프로그래밍', '문서', '수정', '구현', '테스트'],
    low: ['안녕', '감사', '간단', '확인', '네', '아니요']
  },
  fr: {
    high: ['analyse approfondie', 'complexe', 'conception', 'optimisation', 'architecture', 'complet'],
    medium: ['code', 'programmation', 'document', 'modifier', 'implémenter', 'test'],
    low: ['bonjour', 'merci', 'simple', 'vérifier', 'oui', 'non']
  },
  de: {
    high: ['tiefgehende Analyse', 'komplex', 'Entwurf', 'Optimierung', 'Architektur', 'umfassend'],
    medium: ['Code', 'Programmierung', 'Dokument', 'ändern', 'implementieren', 'Test'],
    low: ['hallo', 'danke', 'einfach', 'überprüfen', 'ja', 'nein']
  },
  es: {
    high: ['análisis profundo', 'complejo', 'diseño', 'optimización', 'arquitectura', 'completo'],
    medium: ['código', 'programación', 'documento', 'modificar', 'implementar', 'prueba'],
    low: ['hola', 'gracias', 'simple', 'verificar', 'sí', 'no']
  }
};

const NEGATION_PATTERNS = {
  chinese: ['不', '无需', '不用', '不需要', '没必要', '别', '不要', '无需'],
  english: ["don't", "not", "no need", "without", "skip", "no need to"]
};

const VERB_INTENSITY = {
  light: ['看看', '简单', '快速', '大概', '稍微', '随便', '大概', '简单看看'],
  medium: ['分析', '解释', '整理', '优化', '修改', '处理', '实现'],
  heavy: ['深度分析', '全面评估', '架构设计', '系统性', '彻底', '完整']
};

const SPECIAL_CASES = {
  shortGreeting: (text) => /^(hi|hello|你好|嗨|hey|ok|yes|no|好|好的|是|否)[\s!.。]*$/i.test(text.trim()),
  pureCode: (text) => /^```[\s\S]*```$/.test(text.trim()),
  singleQuestion: (text) => /^[^?？]*[?？]$/.test(text.trim()) && text.length < 30,
  confirmation: (text) => /^(ok|yes|no|好|好的|是|否|确认|取消|收到|明白)[\s!.。]*$/i.test(text.trim())
};

function detectSemanticFeatures(text) {
  return {
    hasQuestion: /\?|？|什么|怎么|如何|为什么|是否/.test(text),
    hasImperative: /^请|帮我|能否|可以|麻烦/.test(text),
    hasComplexSentence: text.split(/[，,。.！!？?]/).filter(s => s.trim()).length > 3,
    verbIntensity: detectVerbIntensity(text)
  };
}

function detectVerbIntensity(text) {
  if (VERB_INTENSITY.heavy.some(v => text.includes(v))) return 3;
  if (VERB_INTENSITY.medium.some(v => text.includes(v))) return 2;
  if (VERB_INTENSITY.light.some(v => text.includes(v))) return 1;
  return 2;
}

function detectNegation(text) {
  const negations = [];
  const allNegations = [...NEGATION_PATTERNS.chinese, ...NEGATION_PATTERNS.english];
  
  for (const neg of allNegations) {
    const regex = new RegExp(neg + '[^，。,\\.!?！?]{0,15}', 'gi');
    const matches = text.match(regex);
    if (matches) {
      negations.push(...matches);
    }
  }
  
  return {
    hasNegation: negations.length > 0,
    negatedPhrases: negations,
    negationCount: negations.length
  };
}

function applyNegationToKeywords(text, matchedKeywords, keywordScores) {
  const negation = detectNegation(text);
  
  if (!negation.hasNegation) {
    return keywordScores;
  }
  
  const adjustedScores = { ...keywordScores };
  
  for (const phrase of negation.negatedPhrases) {
    for (const kw of matchedKeywords.high) {
      if (phrase.includes(kw)) {
        adjustedScores.high = Math.max(0, adjustedScores.high - 3);
      }
    }
    for (const kw of matchedKeywords.medium) {
      if (phrase.includes(kw)) {
        adjustedScores.medium = Math.max(0, adjustedScores.medium - 2);
      }
    }
  }
  
  return adjustedScores;
}

function detectTaskTypes(text) {
  const lowerText = text.toLowerCase();
  const typeScores = {};
  
  for (const [type, keywords] of Object.entries(COMPLEXITY_RULES.taskTypes)) {
    const matchedKeywords = keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
    if (matchedKeywords.length > 0) {
      typeScores[type] = {
        score: matchedKeywords.length,
        confidence: Math.min(matchedKeywords.length / 3, 1),
        matchedKeywords
      };
    }
  }
  
  const sortedTypes = Object.entries(typeScores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([type, data]) => ({ type, ...data }));
  
  return {
    primary: sortedTypes[0]?.type || 'unknown',
    secondary: sortedTypes.slice(1, 3),
    all: sortedTypes,
    isMultiType: sortedTypes.length > 1
  };
}

function analyzeCodeComplexity(text) {
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  const inlineCode = text.match(/`[^`]+`/g) || [];
  
  if (codeBlocks.length === 0 && inlineCode.length === 0) {
    return { hasCode: false, complexity: 0, codeBlockCount: 0, inlineCodeCount: 0 };
  }
  
  let complexity = 0;
  let totalLines = 0;
  
  for (const block of codeBlocks) {
    const lines = block.split('\n').length;
    totalLines += lines;
    const hasFunctions = /function|def |class |=>\s*[\({]/.test(block);
    const hasLoops = /for |while |map\(|filter\(|reduce\(/.test(block);
    const hasConditionals = /if |else |switch |case |try |catch /.test(block);
    
    if (lines < 5) {
      complexity += 0.5;
    } else if (lines < 20) {
      complexity += 1;
    } else {
      complexity += 2;
    }
    
    if (hasFunctions) complexity += 1;
    if (hasLoops) complexity += 0.5;
    if (hasConditionals) complexity += 0.5;
  }
  
  complexity += inlineCode.length * 0.2;
  
  return {
    hasCode: true,
    complexity: Math.round(complexity * 10) / 10,
    codeBlockCount: codeBlocks.length,
    inlineCodeCount: inlineCode.length,
    totalLines
  };
}

function handleSpecialCases(text) {
  const trimmed = text.trim();
  
  for (const [caseName, detector] of Object.entries(SPECIAL_CASES)) {
    if (detector(trimmed)) {
      let suggestedLevel = 'small';
      if (caseName === 'pureCode') {
        const codeAnalysis = analyzeCodeComplexity(text);
        suggestedLevel = codeAnalysis.totalLines < 5 ? 'small' : 'medium';
      }
      return {
        isSpecialCase: true,
        caseType: caseName,
        suggestedLevel,
        confidence: 0.9
      };
    }
  }
  
  return { isSpecialCase: false };
}

function detectLanguage(text) {
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if(/[àâäéèêëïîôùûüÿçœæ]/i.test(text)) return 'fr';
  if(/[äöüß]/i.test(text)) return 'de';
  if(/[áéíóúñ¿¡]/i.test(text)) return 'es';
  return 'zh-en';
}

function getMultilingualKeywords(lang) {
  return MULTILINGUAL_KEYWORDS[lang] || { high: [], medium: [], low: [] };
}

function calculateConfidence(score, matchedReasons, metrics, semanticFeatures) {
  let confidence = 0.5;
  
  confidence += Math.min(matchedReasons.length * 0.08, 0.25);
  
  const scoreDistance = Math.abs(score - 3.5);
  confidence += Math.min(scoreDistance * 0.04, 0.15);
  
  if (metrics.hasCode && metrics.codeComplexity > 1) {
    confidence += 0.1;
  }
  if (metrics.hasMultipleSteps) {
    confidence += 0.08;
  }
  if (semanticFeatures.verbIntensity === 3 || semanticFeatures.verbIntensity === 1) {
    confidence += 0.07;
  }
  
  return Math.min(Math.max(Math.round(confidence * 100) / 100, 0), 1);
}

function getAlternatives(score) {
  if (score >= 5) {
    return [
      { level: 'large', probability: 0.7 },
      { level: 'medium', probability: 0.25 },
      { level: 'small', probability: 0.05 }
    ];
  } else if (score >= 2) {
    return [
      { level: 'medium', probability: 0.6 },
      { level: 'large', probability: 0.25 },
      { level: 'small', probability: 0.15 }
    ];
  } else {
    return [
      { level: 'small', probability: 0.7 },
      { level: 'medium', probability: 0.25 },
      { level: 'large', probability: 0.05 }
    ];
  }
}

function classifyTask(message) {
  if (!message || typeof message !== 'string') {
    return {
      level: 'small',
      taskType: { primary: 'unknown', secondary: [], all: [], isMultiType: false },
      score: 0,
      confidence: 0.5,
      reason: '空消息或无效输入',
      alternatives: getAlternatives(0),
      metrics: { wordCount: 0, charCount: 0, hasCode: false, hasMultipleSteps: false, hasReasoning: false }
    };
  }
  
  const text = message.toLowerCase();
  const wordCount = message.split(/\s+/).filter(w => w).length;
  const charCount = message.length;
  
  const specialCase = handleSpecialCases(message);
  if (specialCase.isSpecialCase) {
    return {
      level: specialCase.suggestedLevel,
      taskType: { primary: 'chat', secondary: [], all: [], isMultiType: false },
      score: specialCase.suggestedLevel === 'medium' ? 3 : 0,
      confidence: specialCase.confidence,
      reason: `特殊场景：${specialCase.caseType}`,
      alternatives: getAlternatives(specialCase.suggestedLevel === 'medium' ? 3 : 0),
      metrics: { wordCount, charCount, hasCode: specialCase.caseType === 'pureCode', hasMultipleSteps: false, hasReasoning: false }
    };
  }
  
  const matchedKeywords = {
    high: [],
    medium: [],
    low: []
  };
  
  let keywordScores = { high: 0, medium: 0, low: 0 };
  const matchedReasons = [];
  
  for (const keyword of COMPLEXITY_RULES.highComplexityKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      keywordScores.high += 3;
      matchedKeywords.high.push(keyword);
      matchedReasons.push('高复杂度：' + keyword);
    }
  }
  
  for (const keyword of COMPLEXITY_RULES.mediumComplexityKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      keywordScores.medium += 2;
      matchedKeywords.medium.push(keyword);
      matchedReasons.push('中复杂度：' + keyword);
    }
  }
  
  for (const keyword of COMPLEXITY_RULES.lowComplexityKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      keywordScores.low -= 1;
      matchedKeywords.low.push(keyword);
      matchedReasons.push('低复杂度：' + keyword);
    }
  }
  
  for (const [keyword, config] of Object.entries(COMPLEXITY_RULES.ambiguousKeywords || {})) {
    if (text.includes(keyword)) {
      let shouldSkip = false;
      for (const follow of config.notLowWhenFollowedBy) {
        const pattern = keyword + follow;
        if (text.includes(pattern)) {
          shouldSkip = true;
          break;
        }
      }
      if (shouldSkip) {
        keywordScores.medium += 2;
        matchedKeywords.medium.push(keyword);
        matchedReasons.push('中复杂度（歧义词）：' + keyword);
      } else {
        keywordScores.low -= 1;
        matchedKeywords.low.push(keyword);
        matchedReasons.push('低复杂度：' + keyword);
      }
    }
  }
  
  const lang = detectLanguage(message);
  const multilingualKw = getMultilingualKeywords(lang);
  
  for (const keyword of multilingualKw.high || []) {
    if (text.includes(keyword.toLowerCase()) && !matchedKeywords.high.includes(keyword)) {
      keywordScores.high += 3;
      matchedKeywords.high.push(keyword);
      matchedReasons.push('高复杂度(多语言)：' + keyword);
    }
  }
  
  for (const keyword of multilingualKw.medium || []) {
    if (text.includes(keyword.toLowerCase()) && !matchedKeywords.medium.includes(keyword)) {
      keywordScores.medium += 2;
      matchedKeywords.medium.push(keyword);
      matchedReasons.push('中复杂度(多语言)：' + keyword);
    }
  }
  
  for (const keyword of multilingualKw.low || []) {
    if (text.includes(keyword.toLowerCase()) && !matchedKeywords.low.includes(keyword)) {
      keywordScores.low -= 1;
      matchedKeywords.low.push(keyword);
      matchedReasons.push('低复杂度(多语言)：' + keyword);
    }
  }
  
  keywordScores = applyNegationToKeywords(message, matchedKeywords, keywordScores);
  
  let score = keywordScores.high + keywordScores.medium + keywordScores.low;
  
  if (wordCount > 500 || charCount > 2000) {
    score += 3;
    matchedReasons.push('长文本：' + wordCount + '词');
  } else if (wordCount > 100 || charCount > 500) {
    score += 1;
    matchedReasons.push('中文本：' + wordCount + '词');
  }
  
  const codeAnalysis = analyzeCodeComplexity(message);
  const hasMultipleSteps = /第[一二三四五六七八九十\d]+[步步部分]|首先|然后|接着|最后|step\s*\d+|firstly|secondly|finally/i.test(text);
  const hasReasoning = /为什么|如何|分析|比较|推理|推导|why|how|compare|analyze|reasoning/i.test(text);
  
  if (codeAnalysis.hasCode) {
    score += Math.min(codeAnalysis.complexity, 3);
    if (codeAnalysis.complexity >= 2) {
      matchedReasons.push('复杂代码');
    } else {
      matchedReasons.push('简单代码');
    }
  }
  
  if (hasMultipleSteps) {
    score += 2;
    matchedReasons.push('多步骤任务');
  }
  
  if (hasReasoning) {
    score += 2;
    matchedReasons.push('需要推理');
  }
  
  const semanticFeatures = detectSemanticFeatures(message);
  
  if (semanticFeatures.verbIntensity === 3) {
    score += 1;
  } else if (semanticFeatures.verbIntensity === 1) {
    score -= 1;
  }
  
  if (semanticFeatures.hasComplexSentence) {
    score += 1;
  }
  
  let level;
  if (score >= 4) level = 'large';
  else if (score >= 1) level = 'medium';
  else level = 'small';
  
  const taskType = detectTaskTypes(message);
  const confidence = calculateConfidence(score, matchedReasons, {
    hasCode: codeAnalysis.hasCode,
    codeComplexity: codeAnalysis.complexity,
    hasMultipleSteps,
    hasReasoning
  }, semanticFeatures);
  
  const reason = matchedReasons.length > 0
    ? matchedReasons.slice(0, 3).join(', ')
    : '默认级别（得分：' + score + '）';
  
  return {
    level,
    taskType,
    score,
    confidence,
    reason,
    alternatives: getAlternatives(score),
    metrics: {
      wordCount,
      charCount,
      hasCode: codeAnalysis.hasCode,
      codeComplexity: codeAnalysis.complexity,
      hasMultipleSteps,
      hasReasoning,
      language: lang,
      semanticFeatures
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    classifyTask,
    COMPLEXITY_RULES,
    MULTILINGUAL_KEYWORDS,
    NEGATION_PATTERNS,
    detectNegation,
    detectSemanticFeatures,
    analyzeCodeComplexity,
    handleSpecialCases,
    calculateConfidence
  };
}
