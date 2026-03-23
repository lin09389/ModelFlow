#!/usr/bin/env python3
"""
train_lora.py - 用 LoRA/QLoRA 微调学生模型

用法：
  python scripts/train_lora.py \
    --base_model Qwen/Qwen-1.8B-Chat \
    --data data/gold/gold_answers.json \
    --output models/student/qwen-distilled
"""

import json
import argparse
from pathlib import Path

from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset

def load_training_data(data_path):
    """加载训练数据"""
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # 转换为训练格式
    texts = []
    for item in data:
        text = f"### Input:\n{item['input']}\n\n### Output:\n{item['output']}"
        texts.append(text)
    
    return Dataset.from_list([{"text": t} for t in texts])

def main():
    parser = argparse.ArgumentParser(description="LoRA 微调训练")
    parser.add_argument("--base_model", type=str, default="Qwen/Qwen-1.8B-Chat")
    parser.add_argument("--data", type=str, required=True)
    parser.add_argument("--output", type=str, required=True)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--lora_r", type=int, default=8)
    parser.add_argument("--lora_alpha", type=int, default=32)
    args = parser.parse_args()
    
    print(f"🚀 开始训练：{args.base_model}")
    
    # 加载模型和 tokenizer
    print("📦 加载模型...")
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        load_in_4bit=True,  # QLoRA 4bit 量化
        device_map="auto",
    )
    
    # 配置 LoRA
    print("🔧 配置 LoRA...")
    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    model = prepare_model_for_kbit_training(model)
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # 加载数据
    print("📚 加载训练数据...")
    dataset = load_training_data(args.data)
    
    # Tokenize
    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            max_length=2048,
            padding="max_length",
        )
    
    tokenized_dataset = dataset.map(tokenize_function, batched=True)
    
    # 训练配置
    print("⚙️ 配置训练...")
    training_args = TrainingArguments(
        output_dir=args.output,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        learning_rate=args.lr,
        warmup_steps=100,
        logging_steps=50,
        save_steps=500,
        save_total_limit=2,
        fp16=True,
        gradient_accumulation_steps=4,
    )
    
    # 开始训练
    print("🏋️ 开始训练...")
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )
    
    trainer.train()
    
    # 保存模型
    print("💾 保存模型...")
    trainer.save_model(args.output)
    tokenizer.save_pretrained(args.output)
    
    print(f"✅ 训练完成！模型保存到：{args.output}")

if __name__ == "__main__":
    main()
