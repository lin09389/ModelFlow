"""
text2vec-base-chinese 微调脚本
用于提升混合模型路由的分类能力

训练任务：
1. Triplet Loss - 复杂度分类
2. CosineSimilarityLoss - 任务类型识别
3. CoSENT Loss - 语义相似度
"""

import os
import json
import torch
import random
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple
from torch.utils.data import DataLoader
from sentence_transformers import SentenceTransformer, losses, InputExample, evaluation
from sentence_transformers.evaluation import EmbeddingSimilarityEvaluator, TripletEvaluator

def load_triplet_data(filepath: str) -> List[InputExample]:
    examples = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line.strip())
            examples.append(InputExample(
                texts=[data["anchor"], data["positive"], data["negative"]],
                label=0.0
            ))
    return examples

def load_pair_data(filepath: str) -> List[InputExample]:
    examples = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line.strip())
            examples.append(InputExample(
                texts=[data["sentence_a"], data["sentence_b"]],
                label=float(data["label"])
            ))
    return examples

def load_sts_data(filepath: str) -> Tuple[List[InputExample], List[Tuple[str, str, float]]]:
    examples = []
    eval_data = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line.strip())
            score = float(data["score"])
            examples.append(InputExample(
                texts=[data["sentence_a"], data["sentence_b"]],
                label=score
            ))
            eval_data.append((data["sentence_a"], data["sentence_b"], score))
    return examples, eval_data

def create_evaluator(sts_data: List[Tuple[str, str, float]], triplet_data: List[InputExample]):
    sentences1 = [s[0] for s in sts_data[:50]]
    sentences2 = [s[1] for s in sts_data[:50]]
    scores = [s[2] for s in sts_data[:50]]
    
    sts_evaluator = EmbeddingSimilarityEvaluator(
        sentences1, sentences2, scores,
        name="sts-eval",
        show_progress_bar=False
    )
    
    anchors = [ex.texts[0] for ex in triplet_data[:30]]
    positives = [ex.texts[1] for ex in triplet_data[:30]]
    negatives = [ex.texts[2] for ex in triplet_data[:30]]
    
    triplet_evaluator = TripletEvaluator(
        anchors, positives, negatives,
        name="triplet-eval",
        show_progress_bar=False
    )
    
    return [sts_evaluator, triplet_evaluator]

def train_model(
    model_name: str = "shibing624/text2vec-base-chinese",
    data_dir: str = "training_data",
    output_dir: str = "fine_tuned_model",
    epochs: int = 3,
    batch_size: int = 16,
    learning_rate: float = 2e-5,
    warmup_steps: int = 100,
    use_triplet: bool = True,
    use_pair: bool = True,
    use_sts: bool = True,
    device: str = None
):
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    print(f"[INFO] 使用设备: {device}")
    print(f"[INFO] 加载模型: {model_name}")
    
    model = SentenceTransformer(model_name, device=device)
    
    data_path = Path(data_dir)
    triplet_files = list(data_path.glob("triplet_data_*.jsonl"))
    pair_files = list(data_path.glob("pair_data_*.jsonl"))
    sts_files = list(data_path.glob("sts_data_*.jsonl"))
    
    if not triplet_files and not pair_files and not sts_files:
        raise FileNotFoundError(f"在 {data_dir} 中未找到训练数据文件")
    
    all_examples = []
    train_losses = []
    
    if use_triplet and triplet_files:
        triplet_file = triplet_files[-1]
        print(f"[INFO] 加载三元组数据: {triplet_file}")
        triplet_examples = load_triplet_data(triplet_file)
        all_examples.extend(triplet_examples)
        train_losses.append(losses.TripletLoss(model=model, triplet_margin=0.5))
        print(f"[INFO] 三元组样本数: {len(triplet_examples)}")
    
    if use_pair and pair_files:
        pair_file = pair_files[-1]
        print(f"[INFO] 加载句子对数据: {pair_file}")
        pair_examples = load_pair_data(pair_file)
        all_examples.extend(pair_examples)
        train_losses.append(losses.CosineSimilarityLoss(model=model))
        print(f"[INFO] 句子对样本数: {len(pair_examples)}")
    
    if use_sts and sts_files:
        sts_file = sts_files[-1]
        print(f"[INFO] 加载STS数据: {sts_file}")
        sts_examples, sts_eval_data = load_sts_data(sts_file)
        all_examples.extend(sts_examples)
        train_losses.append(losses.CoSENTLoss(model=model))
        print(f"[INFO] STS样本数: {len(sts_examples)}")
    
    print(f"[INFO] 总训练样本数: {len(all_examples)}")
    
    random.shuffle(all_examples)
    
    train_dataloader = DataLoader(all_examples, shuffle=True, batch_size=batch_size)
    
    if use_sts and sts_files:
        evaluators = create_evaluator(sts_eval_data, triplet_examples if use_triplet else [])
    else:
        evaluators = []
    
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_output_dir = output_path / f"model_{timestamp}"
    
    if len(train_losses) == 1:
        train_loss = train_losses[0]
    else:
        train_loss = train_losses
    
    print(f"[INFO] 开始训练...")
    print(f"  - Epochs: {epochs}")
    print(f"  - Batch size: {batch_size}")
    print(f"  - Learning rate: {learning_rate}")
    print(f"  - Warmup steps: {warmup_steps}")
    print(f"  - Output: {run_output_dir}")
    
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=epochs,
        warmup_steps=warmup_steps,
        evaluator=evaluation.SequentialEvaluator(evaluators) if evaluators else None,
        evaluation_steps=100,
        output_path=str(run_output_dir),
        optimizer_params={"lr": learning_rate},
        show_progress_bar=True,
        save_best_model=True
    )
    
    config = {
        "model_name": model_name,
        "epochs": epochs,
        "batch_size": batch_size,
        "learning_rate": learning_rate,
        "warmup_steps": warmup_steps,
        "train_samples": len(all_examples),
        "timestamp": timestamp,
        "device": device
    }
    
    config_file = run_output_dir / "training_config.json"
    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] 训练完成!")
    print(f"[OK] 模型保存至: {run_output_dir}")
    
    return str(run_output_dir)

def main():
    parser = argparse.ArgumentParser(description="微调 text2vec-base-chinese 模型")
    parser.add_argument("--model", type=str, default="shibing624/text2vec-base-chinese",
                        help="基础模型名称或路径")
    parser.add_argument("--data-dir", type=str, default="training_data",
                        help="训练数据目录")
    parser.add_argument("--output-dir", type=str, default="fine_tuned_model",
                        help="输出模型目录")
    parser.add_argument("--epochs", type=int, default=3,
                        help="训练轮数")
    parser.add_argument("--batch-size", type=int, default=16,
                        help="批次大小")
    parser.add_argument("--lr", type=float, default=2e-5,
                        help="学习率")
    parser.add_argument("--warmup", type=int, default=100,
                        help="预热步数")
    parser.add_argument("--device", type=str, default=None,
                        help="训练设备 (cuda/cpu)")
    parser.add_argument("--no-triplet", action="store_true",
                        help="不使用三元组数据")
    parser.add_argument("--no-pair", action="store_true",
                        help="不使用句子对数据")
    parser.add_argument("--no-sts", action="store_true",
                        help="不使用STS数据")
    
    args = parser.parse_args()
    
    train_model(
        model_name=args.model,
        data_dir=args.data_dir,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        warmup_steps=args.warmup,
        use_triplet=not args.no_triplet,
        use_pair=not args.no_pair,
        use_sts=not args.no_sts,
        device=args.device
    )

if __name__ == "__main__":
    main()
