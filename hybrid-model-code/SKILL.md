# Hybrid Model Router - 混合模型路由 Skill

## 功能说明

根据任务复杂度、类型、成本预算自动选择最优 AI 模型。

## 安装

已预装在 `~/.openclaw/skills/hybrid-model-router/`

## 使用方法

### 自动路由（默认）

```
/模型路由 启用
```

之后所有消息会自动根据复杂度选择模型。

### 手动指定策略

```
/模型路由 策略 cost-optimal   # 成本优先
/模型路由 策略 performance    # 性能优先
/模型路由 策略 balanced       # 平衡模式（默认）
```

### 强制使用某类模型

```
/模型路由 使用 small    # 小模型（快速/便宜）
/模型路由 使用 medium   # 中等模型
/模型路由 使用 large    # 大模型（最强）
```

### 查看状态

```
/模型路由 状态
```

## 配置

编辑 `~/.openclaw/workspace/hybrid-model/config.json`

## 作者

基于 OpenClaw 改造

## 许可证

MIT
