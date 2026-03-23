# OpenClaw Workspace + Hybrid Model System

这个仓库包含我的 OpenClaw 工作区和自定义的混合模型路由系统。

## 📁 目录结构

```
.
├── hybrid-model/           # 混合模型路由系统
│   ├── config.json        # 配置文件
│   ├── README.md          # 使用文档
│   ├── DELIVERY.md        # 交付总结
│   └── test.sh            # 测试脚本
├── memory/                # 记忆文件
├── temp/                  # 临时文件
├── AGENTS.md              # Agent 配置
├── SOUL.md                # 人格设定
└── TOOLS.md               # 工具配置
```

## 🚀 混合模型系统

### 快速开始

```bash
# 测试路由效果
cd ~/.openclaw/skills/hybrid-model-router
node integrate.js test "请深度分析这个复杂问题"

# 运行完整测试
cd ~/openclaw/workspace/hybrid-model
bash test.sh
```

### 功能特性

- ✅ 智能任务分类（简单/中等/复杂）
- ✅ 三种路由策略（平衡/成本优先/性能优先）
- ✅ 自动升级/降级规则
- ✅ 成本追踪与预算控制
- ✅ 关键词覆盖（手动指定模型）

### 详细文档

查看 [`hybrid-model/README.md`](hybrid-model/README.md)

## 📝 使用说明

### 安装 Skill

```bash
# Skill 已预装在
~/.openclaw/skills/hybrid-model-router/
```

### 配置模型

编辑 `hybrid-model/config.json`：

```json
{
  "models": {
    "small": { "ref": "qwen/qwen-plus" },
    "medium": { "ref": "qwen/qwen-max" },
    "large": { "ref": "qwen/qwen-plus" }
  },
  "strategy": "balanced"
}
```

## 🧪 测试

```bash
bash hybrid-model/test.sh
```

## 📄 许可证

MIT License

## 🙏 致谢

基于 [OpenClaw](https://github.com/openclaw/openclaw) 改造

---

*最后更新：2026-03-23*
