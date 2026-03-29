# 分类器问题修复计划

> 创建时间: 2026-03-29
> 目标: 修复 classifier.js 的 7 个核心问题

---

## 一、问题清单与解决方案

### 问题 1: 纯规则匹配，无语义理解

**现状**: 只能匹配字面关键词，无法理解语义

**示例问题**:
- "帮我看看这个bug" → 无匹配 → small（可能应该是 medium）
- "评估一下方案" → 无匹配 → small（应该是 medium/high）

**解决方案**:
- [ ] 添加语义特征检测（疑问句、祈使句、复杂句结构）
- [ ] 添加动词强度分析（"看看" vs "深度分析"）
- [ ] 添加上下文线索检测

**代码改动**:
```javascript
// 新增：语义特征检测
function detectSemanticFeatures(text) {
  const features = {
    hasQuestion: /\?|？|什么|怎么|如何|为什么|是否/.test(text),
    hasImperative: /^请|帮我|能否|可以/.test(text),
    hasComplexSentence: text.split(/[，,。.]/).length > 3,
    verbIntensity: detectVerbIntensity(text)
  };
  return features;
}

function detectVerbIntensity(text) {
  const lightVerbs = ['看看', '简单', '快速', '大概', '稍微'];
  const mediumVerbs = ['分析', '解释', '整理', '优化', '修改'];
  const heavyVerbs = ['深度分析', '全面评估', '架构设计', '系统性'];
  
  if (heavyVerbs.some(v => text.includes(v))) return 3;
  if (mediumVerbs.some(v => text.includes(v))) return 2;
  if (lightVerbs.some(v => text.includes(v))) return 1;
  return 2; // 默认中等
}
```

---

### 问题 2: 关键词覆盖有限

**现状**: 高/中/低关键词各只有 15-20 个，遗漏大量词汇

**解决方案**:
- [ ] 扩充关键词库（每类增加到 50+ 个）
- [ ] 添加同义词/近义词映射
- [ ] 支持正则表达式模式匹配

**新增关键词**:

```javascript
const EXPANDED_KEYWORDS = {
  highComplexity: [
    // 原有
    '深度分析', '详细分析', '全面分析', '多维度',
    '复杂', '推理', '推导', '证明',
    '架构设计', '系统设计', '方案设计',
    '对比分析', '优劣分析', '风险评估',
    '长文档', '多步骤', '分阶段',
    // 新增 - 专业领域
    '可行性研究', '技术选型', '性能优化', '安全审计',
    '算法设计', '数据建模', '系统重构', '代码审查',
    '需求分析', '竞品分析', '用户研究', 'A/B测试',
    // 新增 - 复杂操作
    '从头实现', '端到端', '全栈', '微服务',
    '分布式', '高并发', '高可用', '容错',
    // 英文扩充
    'comprehensive', 'thorough', 'in-depth', 'systematic',
    'architecture', 'redesign', 'optimization', 'benchmark'
  ],
  mediumComplexity: [
    // 原有
    '代码', '编程', '函数', '类', '模块',
    '文档', '报告', '总结', '整理',
    '翻译', '改写', '润色',
    '数据', '表格', '图表',
    // 新增 - 开发相关
    '调试', '修复', '重构', '实现', '开发',
    'API', '接口', '组件', '配置', '部署',
    '测试', '单元测试', '集成', '版本',
    // 新增 - 内容相关
    '博客', '方案', '计划', '大纲', '草稿',
    '简历', '邮件', '通知', '公告',
    // 新增 - 数据相关
    '统计', '分析', '处理', '转换', '清洗',
    '可视化', '报表', '仪表盘'
  ],
  lowComplexity: [
    // 原有
    '简单', '快速', '简要', '大概',
    'hello', 'hi', '在吗', '谢谢',
    '是什么', '怎么做', '怎么弄',
    // 新增 - 日常对话
    '你好', '早上好', '晚安', '再见',
    '好的', '收到', '明白', '了解',
    '对了', '顺便', '还有',
    // 新增 - 简单询问
    '是什么意思', '定义', '概念', '介绍',
    '举个例子', '简单说', '一句话',
    // 新增 - 轻量操作
    '看看', '检查', '确认', '验证'
  ]
};
```

---

### 问题 3: 无置信度输出

**现状**: 所有结果同等对待，无法识别模糊场景

**解决方案**:
- [ ] 计算分类置信度（0-1）
- [ ] 低置信度时标记为"不确定"
- [ ] 支持多级别候选输出

**代码改动**:
```javascript
function calculateConfidence(score, matchedReasons, metrics) {
  // 基于多个因素计算置信度
  let confidence = 0.5; // 基础置信度
  
  // 匹配原因越多，置信度越高
  confidence += Math.min(matchedReasons.length * 0.1, 0.3);
  
  // 分数离阈值越远，置信度越高
  const scoreDistance = Math.abs(score - 3.5); // 阈值中间值
  confidence += Math.min(scoreDistance * 0.05, 0.2);
  
  // 有明确特征时提高置信度
  if (metrics.hasCode || metrics.hasMultipleSteps) {
    confidence += 0.1;
  }
  
  return Math.min(Math.max(confidence, 0), 1);
}

// 返回结果增加置信度
return {
  level,
  confidence: calculateConfidence(score, matchedReasons, metrics),
  alternatives: getAlternatives(score), // 候选级别
  // ...
};
```

---

### 问题 4: 无否定处理

**现状**: "不需要分析" 也会被误判为复杂任务

**解决方案**:
- [ ] 添加否定词检测
- [ ] 否定词降低关键词权重
- [ ] 处理双重否定

**代码改动**:
```javascript
const NEGATION_PATTERNS = {
  chinese: ['不', '无需', '不用', '不需要', '没必要', '别', '不要'],
  english: ["don't", "not", "no need", "without", "skip"]
};

function detectNegation(text) {
  const negations = [];
  const lowerText = text.toLowerCase();
  
  // 检测否定词
  for (const neg of [...NEGATION_PATTERNS.chinese, ...NEGATION_PATTERNS.english]) {
    const regex = new RegExp(neg + '\\s*[^，。,\\.]{0,10}', 'gi');
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

// 在评分时应用否定
function applyNegationToScore(score, text, matchedKeywords) {
  const negation = detectNegation(text);
  
  if (negation.hasNegation) {
    // 检查否定是否影响了匹配的关键词
    for (const phrase of negation.negatedPhrases) {
      for (const keyword of matchedKeywords) {
        if (phrase.includes(keyword)) {
          score -= 2; // 被否定的关键词降权
        }
      }
    }
  }
  
  return score;
}
```

---

### 问题 5: 任务类型识别弱

**现状**: 只取第一个匹配类型，遗漏其他可能类型

**解决方案**:
- [ ] 返回所有匹配的任务类型
- [ ] 按匹配度排序
- [ ] 支持多任务类型（如"代码+分析"）

**代码改动**:
```javascript
function detectTaskTypes(text) {
  const typeScores = {};
  
  for (const [type, keywords] of Object.entries(COMPLEXITY_RULES.taskTypes)) {
    const matchCount = keywords.filter(kw => 
      text.toLowerCase().includes(kw.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      typeScores[type] = {
        score: matchCount,
        confidence: matchCount / keywords.length
      };
    }
  }
  
  // 按分数排序
  const sortedTypes = Object.entries(typeScores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([type, data]) => ({
      type,
      ...data
    }));
  
  return {
    primary: sortedTypes[0]?.type || 'unknown',
    secondary: sortedTypes.slice(1, 3),
    all: sortedTypes,
    isMultiType: sortedTypes.length > 1
  };
}
```

---

### 问题 6: 多语言支持差

**现状**: 关键词主要中英，其他语言难识别

**解决方案**:
- [ ] 添加日语、韩语、法语、德语、西班牙语关键词
- [ ] 使用语言检测 + 对应关键词库
- [ ] 添加通用特征（不依赖语言）

**代码改动**:
```javascript
const MULTILINGUAL_KEYWORDS = {
  ja: { // 日语
    high: ['詳細分析', '複雑', '設計', '最適化', 'アーキテクチャ'],
    medium: ['コード', 'プログラミング', 'ドキュメント', '修正', '実装'],
    low: ['こんにちは', 'ありがとう', '簡単', '確認']
  },
  ko: { // 韩语
    high: ['심층 분석', '복잡', '설계', '최적화', '아키텍처'],
    medium: ['코드', '프로그래밍', '문서', '수정', '구현'],
    low: ['안녕', '감사', '간단', '확인']
  },
  fr: { // 法语
    high: ['analyse approfondie', 'complexe', 'conception', 'optimisation'],
    medium: ['code', 'programmation', 'document', 'modifier'],
    low: ['bonjour', 'merci', 'simple', 'vérifier']
  },
  de: { // 德语
    high: ['tiefgehende Analyse', 'komplex', 'Entwurf', 'Optimierung'],
    medium: ['Code', 'Programmierung', 'Dokument', 'ändern'],
    low: ['hallo', 'danke', 'einfach', 'überprüfen']
  },
  es: { // 西班牙语
    high: ['análisis profundo', 'complejo', 'diseño', 'optimización'],
    medium: ['código', 'programación', 'documento', 'modificar'],
    low: ['hola', 'gracias', 'simple', 'verificar']
  }
};

// 通用特征（不依赖语言）
const LANGUAGE_AGNOSTIC_FEATURES = {
  codePatterns: /```[\s\S]*?```|`[^`]+`/,
  mathPatterns: /[=+\-*/^∑∫√]/,
  listPatterns: /^\s*[-*]\s|^\s*\d+\.\s/m,
  questionPatterns: /\?|？/,
  longText: (text) => text.length > 500
};
```

---

### 问题 7: 无边界情况处理

**现状**: 短代码片段被误判为复杂任务

**解决方案**:
- [ ] 区分代码片段长度
- [ ] 区分代码复杂度
- [ ] 添加特殊场景处理

**代码改动**:
```javascript
function analyzeCodeComplexity(text) {
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  const inlineCode = text.match(/`[^`]+`/g) || [];
  
  if (codeBlocks.length === 0 && inlineCode.length === 0) {
    return { hasCode: false, complexity: 0 };
  }
  
  let complexity = 0;
  
  // 分析代码块
  for (const block of codeBlocks) {
    const lines = block.split('\n').length;
    const hasFunctions = /function|def |class |=>/.test(block);
    const hasLoops = /for |while |map\(|filter\(/.test(block);
    const hasConditionals = /if |else |switch |case /.test(block);
    
    // 短代码片段（<5行）降权
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
  
  // 内联代码通常不复杂
  complexity += inlineCode.length * 0.2;
  
  return {
    hasCode: true,
    complexity,
    codeBlockCount: codeBlocks.length,
    inlineCodeCount: inlineCode.length
  };
}

// 特殊场景处理
const SPECIAL_CASES = {
  // 短问候语
  shortGreeting: (text) => /^(hi|hello|你好|嗨|hey)[\s!.]*$/i.test(text.trim()),
  // 纯代码片段
  pureCode: (text) => /^```[\s\S]*```$/.test(text.trim()),
  // 单个问题
  singleQuestion: (text) => /^[^?？]*[?？]$/.test(text.trim()) && text.length < 50,
  // 确认/取消
  confirmation: (text) => /^(ok|yes|no|好|好的|是|否|确认|取消)[\s!.]*$/i.test(text.trim())
};

function handleSpecialCases(text) {
  for (const [caseName, detector] of Object.entries(SPECIAL_CASES)) {
    if (detector(text)) {
      return {
        isSpecialCase: true,
        caseType: caseName,
        suggestedLevel: caseName === 'pureCode' ? 'medium' : 'small'
      };
    }
  }
  return { isSpecialCase: false };
}
```

---

## 二、实施步骤

### Step 1: 重构分类器结构

**文件**: `src/classifier.js`

**改动**:
- [ ] 将关键词配置分离到独立对象
- [ ] 添加辅助函数模块
- [ ] 重构主函数结构

### Step 2: 实现语义特征检测

**文件**: `src/classifier.js`

**改动**:
- [ ] 添加 `detectSemanticFeatures()` 函数
- [ ] 添加 `detectVerbIntensity()` 函数
- [ ] 集成到主评分流程

### Step 3: 扩充关键词库

**文件**: `src/classifier.js`

**改动**:
- [ ] 添加扩充后的关键词
- [ ] 添加多语言关键词
- [ ] 添加同义词映射

### Step 4: 实现置信度计算

**文件**: `src/classifier.js`

**改动**:
- [ ] 添加 `calculateConfidence()` 函数
- [ ] 修改返回值结构
- [ ] 添加候选级别输出

### Step 5: 实现否定处理

**文件**: `src/classifier.js`

**改动**:
- [ ] 添加否定词配置
- [ ] 实现 `detectNegation()` 函数
- [ ] 集成到评分流程

### Step 6: 增强任务类型识别

**文件**: `src/classifier.js`

**改动**:
- [ ] 重写 `detectTaskTypes()` 函数
- [ ] 返回多任务类型
- [ ] 添加置信度

### Step 7: 实现边界情况处理

**文件**: `src/classifier.js`

**改动**:
- [ ] 添加 `analyzeCodeComplexity()` 函数
- [ ] 添加特殊场景检测
- [ ] 集成到主流程

### Step 8: 更新测试

**文件**: `hybrid-model/test.sh`

**改动**:
- [ ] 添加新场景测试用例
- [ ] 验证所有修复生效

---

## 三、测试用例

### 否定处理测试

| 输入 | 预期级别 | 原级别 |
|------|----------|--------|
| "不需要深度分析，简单看看就行" | small | large |
| "不用写复杂代码，就一个函数" | small/medium | large |
| "别做详细分析，给个大概就行" | small | large |

### 置信度测试

| 输入 | 预期置信度 |
|------|------------|
| "你好" | >0.8 (高) |
| "帮我看看这个代码" | 0.4-0.6 (中) |
| "请深度分析这个复杂系统的架构设计" | >0.9 (高) |

### 边界情况测试

| 输入 | 预期级别 | 原级别 |
|------|----------|--------|
| "hi" | small | small ✓ |
| "```let x = 1;```" | small | medium |
| "第一步...第二步...第三步..." | large | large ✓ |

### 多语言测试

| 输入 | 预期级别 |
|------|----------|
| "こんにちは" | small |
| "詳細な分析をお願いします" | large |
| "안녕하세요" | small |

---

## 四、文件变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/classifier.js` | 重写 | 核心修复 |
| `hybrid-model/test.sh` | 修改 | 新增测试用例 |

---

## 五、验收标准

| 指标 | 标准 |
|------|------|
| 否定处理 | 所有否定测试用例通过 |
| 置信度输出 | 所有结果包含 confidence 字段 |
| 任务类型 | 返回多类型 + 置信度 |
| 边界情况 | 特殊场景正确处理 |
| 向后兼容 | 原有测试用例全部通过 |

---

*计划版本: v1.0*
*创建时间: 2026-03-29*
