# OpenClaw Distillation Project

模型蒸馏项目 - 用小型专家模型替代大模型，降低 token 成本

---

## 项目结构

```
openclaw-distillation/
├── data/                      # 训练数据
│   ├── raw/                   # 原始对话数据
│   ├── processed/             # 处理后的训练数据
│   └── gold/                  # 大模型生成的黄金答案
├── models/                    # 模型文件
│   ├── teacher/               # 教师模型配置
│   └── student/               # 学生模型配置
├── scripts/                   # 训练脚本
│   ├── collect_data.py        # 数据收集
│   ├── generate_gold.py       # 生成黄金答案
│   ├── train_lora.py          # LoRA 微调
│   └── deploy.py              # 模型部署
├── configs/                   # 配置文件
│   ├── model_config.yaml      # 模型配置
│   └── training_config.yaml   # 训练配置
└── notebooks/                 # Jupyter  notebooks
    ├── data_analysis.ipynb    # 数据分析
    └── training_demo.ipynb    # 训练演示
```

---

## 快速开始

### 1. 环境准备

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install transformers peft accelerate datasets
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 2. 收集训练数据

```bash
# 导出 OpenClaw 历史对话
python scripts/collect_data.py --output data/raw/conversations.json
```

### 3. 生成黄金答案

```bash
# 用大模型重新回答问题
python scripts/generate_gold.py \
  --input data/raw/conversations.json \
  --output data/gold/gold_answers.json \
  --model qwen-max
```

### 4. 训练学生模型

```bash
# 用 QLoRA 微调
python scripts/train_lora.py \
  --base_model Qwen/Qwen-1.8B-Chat \
  --data data/gold/gold_answers.json \
  --output models/student/qwen-distilled \
  --epochs 3 \
  --batch_size 4
```

### 5. 部署模型

```bash
# 用 Ollama 部署
python scripts/deploy.py --model models/student/qwen-distilled
```

---

## 模型选择建议

### 入门级（4-6GB GPU）

- **基座模型**：Qwen-1.8B-Chat
- **微调方法**：QLoRA（4bit）
- **训练时间**：2-4 小时
- **推理速度**：快
- **适用场景**：通用对话、简单任务

### 进阶级（12-16GB GPU）

- **基座模型**：Mistral-7B 或 Qwen-7B
- **微调方法**：LoRA
- **训练时间**：6-12 小时
- **推理速度**：中
- **适用场景**：代码生成、复杂推理

### 专业级（24GB+ GPU）

- **基座模型**：CodeLlama-13B 或 Qwen-14B
- **微调方法**：Full Fine-tune
- **训练时间**：1-2 天
- **推理速度**：慢（需要多卡）
- **适用场景**：专业领域、高质量要求

---

## 训练数据格式

```json
[
  {
    "id": "001",
    "input": "如何优化 token 消耗？",
    "output": "有三种主要方法：1) 多模型路由 2) 脏活本地化 3) Context 管理...",
    "metadata": {
      "category": "token-optimization",
      "complexity": "medium",
      "tokens_used": 500
    }
  },
  {
    "id": "002",
    "input": "帮我创建一个 OpenClaw 技能",
    "output": "创建技能需要以下步骤：1) 确定技能功能 2) 创建 SKILL.md...",
    "metadata": {
      "category": "skill-creation",
      "complexity": "high",
      "tokens_used": 1200
    }
  }
]
```

---

## 训练配置示例

```yaml
# configs/training_config.yaml

model:
  base_model: Qwen/Qwen-1.8B-Chat
  tokenizer: Qwen/Qwen-1.8B-Chat

lora:
  r: 8
  alpha: 32
  dropout: 0.05
  target_modules:
    - q_proj
    - v_proj
    - k_proj
    - o_proj

training:
  epochs: 3
  batch_size: 4
  learning_rate: 2e-4
  warmup_steps: 100
  max_length: 2048

output:
  dir: models/student/qwen-distilled
  save_steps: 500
```

---

## 成本估算

### 训练成本

| 项目 | 配置 | 成本 |
|------|------|------|
| 数据生成 | 1000 条 × qwen-max | $10-20 |
| GPU 训练 | Colab Pro (1 月) | $50 |
| 存储 | 模型文件 (10GB) | $5/月 |
| **总计** | - | **$65-75**（一次性） |

### 推理成本对比

| 模型 | 单次成本 | 1000 次/天 | 月成本 |
|------|----------|-----------|--------|
| qwen-max | $0.01 | $10 | $300 |
| qwen-plus | $0.005 | $5 | $150 |
| qwen-turbo | $0.001 | $1 | $30 |
| **本地蒸馏** | **$0** | **$0** | **$20**（服务器） |

---

## 最佳实践

### 1. 数据质量 > 数据数量

- 1000 条高质量数据 > 10000 条低质量数据
- 确保黄金答案是大模型认真生成的

### 2. 领域聚焦

- 不要试图训练通用模型
- 聚焦你的核心使用场景（如 OpenClaw 技能开发）

### 3. 迭代训练

- 第 1 版：1000 条数据，快速验证
- 第 2 版：5000 条数据，提升质量
- 第 3 版：持续收集难例，针对性优化

### 4. 评估指标

- **人工评估**：随机抽样 100 条，对比大模型输出
- **自动评估**：ROUGE, BLEU, BERTScore
- **用户反馈**：实际使用中的满意度

---

## 常见问题

### Q: 需要多少数据？

A: 
- 最小可行：500-1000 条
- 推荐：2000-5000 条
- 高质量：10000+ 条

### Q: 训练需要多长时间？

A:
- Qwen-1.8B + QLoRA: 2-4 小时
- Mistral-7B + LoRA: 6-12 小时
- CodeLlama-13B: 1-2 天

### Q: 需要多好的 GPU？

A:
- 最小：GTX 1660 (6GB) - QLoRA 微调小模型
- 推荐：RTX 3090 (24GB) - LoRA 微调 7B 模型
- 理想：A100 (40GB) - 全参数微调

### Q: 效果能接近大模型吗？

A:
- 特定领域：可以达到大模型 80-90% 的效果
- 通用任务：约 70-80%
- 优势领域（你的数据多的场景）：可能超越大模型

---

## 下一步

1. [ ] 收集历史对话数据
2. [ ] 选择基座模型
3. [ ] 生成黄金答案
4. [ ] 开始微调训练
5. [ ] 评估效果
6. [ ] 部署到 OpenClaw

---

## 参考资源

- [HuggingFace PEFT 文档](https://huggingface.co/docs/peft)
- [QLoRA 论文](https://arxiv.org/abs/2305.14314)
- [LoRA 论文](https://arxiv.org/abs/2106.09685)
- [OpenClaw 文档](https://docs.openclaw.ai)

---

*项目模板版本：1.0*  
*创建时间：2026-03-17*
