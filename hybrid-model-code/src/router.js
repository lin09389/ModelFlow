/**
 * 混合模型路由策略引擎
 */

const DEFAULT_CONFIG = {
  models: {
    small: { ref: "qwen/qwen-plus", maxTokens: 4000, costPer1kTokens: 0.002, description: "小模型 - 快速响应" },
    medium: { ref: "qwen/qwen-max", maxTokens: 16000, costPer1kTokens: 0.01, description: "中等模型 - 平衡性能与成本" },
    large: { ref: "qwen/qwen-plus", maxTokens: 64000, costPer1kTokens: 0.05, description: "大模型 - 最强能力" }
  },
  rules: {
    autoUpgrade: { enabled: true, thresholds: { wordCount: 500, complexityScore: 5 } },
    autoDowngrade: { enabled: false, dailyBudget: 10, downgradeThreshold: 0.8 },
    overrideKeywords: {
      "深度分析": "large", "详细分析": "large", "全面分析": "large",
      "快速回答": "small", "简单看看": "small",
      "用大模型": "large", "用小模型": "small"
    }
  },
  strategy: "balanced",
  metrics: { enabled: true, logPath: "~/.openclaw/workspace/hybrid-model/logs/metrics.json" }
};

class HybridModelRouter {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = { totalRequests: 0, modelUsage: { small: 0, medium: 0, large: 0 }, totalCost: 0, dailyCost: 0 };
  }

  route(message, classification) {
    this.metrics.totalRequests++;
    const overrideModel = this.checkOverride(message);
    if (overrideModel) return this.createResult(overrideModel, "用户关键词覆盖");

    let selectedLevel, reason;
    if (this.config.strategy === "cost-optimal") {
      selectedLevel = this.selectForCost(classification);
      reason = "成本优先策略";
    } else if (this.config.strategy === "performance") {
      selectedLevel = this.selectForPerformance(classification);
      reason = "性能优先策略";
    } else {
      selectedLevel = classification.level;
      reason = classification.reason;
    }

    selectedLevel = this.applyAutoRules(selectedLevel, classification);
    const result = this.createResult(selectedLevel, reason, classification);
    this.recordMetrics(result, classification);
    return result;
  }

  checkOverride(message) {
    const text = message.toLowerCase();
    for (const [keyword, modelLevel] of Object.entries(this.config.rules.overrideKeywords)) {
      if (text.includes(keyword.toLowerCase())) return modelLevel;
    }
    return null;
  }

  selectForCost(classification) {
    if (classification.score >= 8) return 'large';
    if (classification.score >= 3) return 'medium';
    return 'small';
  }

  selectForPerformance(classification) {
    if (classification.score <= 1) return 'small';
    if (classification.score <= 4) return 'medium';
    return 'large';
  }

  applyAutoRules(level, classification) {
    const { autoUpgrade, autoDowngrade } = this.config.rules;
    if (autoUpgrade.enabled) {
      const { thresholds } = autoUpgrade;
      if (classification.metrics.wordCount > thresholds.wordCount) {
        if (level === 'small') return 'medium';
        if (level === 'medium') return 'large';
      }
    }
    if (autoDowngrade.enabled) {
      if (this.metrics.dailyCost > autoDowngrade.dailyBudget * autoDowngrade.downgradeThreshold) {
        if (level === 'large') return 'medium';
        if (level === 'medium') return 'small';
      }
    }
    return level;
  }

  createResult(level, reason, classification = null) {
    const model = this.config.models[level];
    const estimatedInputTokens = classification ? classification.metrics.wordCount * 1.3 : 100;
    const estimatedCost = (estimatedInputTokens / 1000) * model.costPer1kTokens;
    return {
      modelRef: model.ref, level, description: model.description, reason,
      estimatedCost: estimatedCost.toFixed(4), estimatedTokens: Math.round(estimatedInputTokens)
    };
  }

  recordMetrics(result, classification) {
    this.metrics.modelUsage[result.level]++;
    this.metrics.totalCost += parseFloat(result.estimatedCost);
    this.metrics.dailyCost += parseFloat(result.estimatedCost);
  }

  getStatus() {
    return {
      strategy: this.config.strategy,
      metrics: this.metrics,
      models: Object.entries(this.config.models).map(([level, model]) => ({
        level, ref: model.ref, cost: model.costPer1kTokens
      }))
    };
  }

  updateConfig(patch) {
    this.config = { ...this.config, ...patch };
    return this.config;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HybridModelRouter, DEFAULT_CONFIG };
}
