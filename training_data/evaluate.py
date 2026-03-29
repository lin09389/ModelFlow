"""
模型评估脚本
对比微调前后模型在任务复杂度分类上的表现
"""

import json
import torch
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

TEST_CASES = [
    {"text": "你好", "expected": "small"},
    {"text": "在吗", "expected": "small"},
    {"text": "好的收到", "expected": "small"},
    {"text": "是什么意思", "expected": "small"},
    {"text": "简单介绍一下", "expected": "small"},
    {"text": "帮我写个函数", "expected": "medium"},
    {"text": "实现一个排序算法", "expected": "medium"},
    {"text": "写一份文档", "expected": "medium"},
    {"text": "修复这个bug", "expected": "medium"},
    {"text": "分析一下数据", "expected": "medium"},
    {"text": "深度分析市场趋势", "expected": "large"},
    {"text": "设计一个微服务架构", "expected": "large"},
    {"text": "全面评估项目可行性", "expected": "large"},
    {"text": "从零构建一个分布式系统", "expected": "large"},
    {"text": "系统性重构整个代码库", "expected": "large"},
]

COMPLEXITY_PROTOTYPES = {
    "small": [
        "你好", "在吗", "好的", "收到", "谢谢",
        "是什么", "怎么做", "简单说说", "快速回答", "确认一下"
    ],
    "medium": [
        "写一个函数", "实现功能", "修复bug", "写文档",
        "分析数据", "处理请求", "优化代码", "测试接口",
        "整理资料", "翻译文档"
    ],
    "large": [
        "深度分析", "架构设计", "系统重构", "全面评估",
        "从零构建", "端到端实现", "可行性研究", "技术选型",
        "性能优化", "分布式设计"
    ]
}

def load_model(model_path: str):
    return SentenceTransformer(model_path)

def get_prototype_embeddings(model: SentenceTransformer) -> Dict[str, np.ndarray]:
    embeddings = {}
    for level, sentences in COMPLEXITY_PROTOTYPES.items():
        embeddings[level] = model.encode(sentences)
    return embeddings

def classify_text(model: SentenceTransformer, text: str, prototype_embeddings: Dict[str, np.ndarray]) -> Tuple[str, float]:
    text_embedding = model.encode([text])
    
    similarities = {}
    for level, embeddings in prototype_embeddings.items():
        sims = cosine_similarity(text_embedding, embeddings)
        similarities[level] = np.mean(sims)
    
    best_level = max(similarities, key=similarities.get)
    confidence = similarities[best_level]
    
    return best_level, confidence, similarities

def evaluate_model(model_path: str, model_name: str = None) -> Dict:
    if model_name is None:
        model_name = Path(model_path).name
    
    print(f"\n[INFO] 评估模型: {model_name}")
    print("-" * 50)
    
    model = load_model(model_path)
    prototype_embeddings = get_prototype_embeddings(model)
    
    correct = 0
    total = len(TEST_CASES)
    results = []
    
    for case in TEST_CASES:
        text = case["text"]
        expected = case["expected"]
        
        predicted, confidence, similarities = classify_text(model, text, prototype_embeddings)
        
        is_correct = predicted == expected
        if is_correct:
            correct += 1
        
        results.append({
            "text": text,
            "expected": expected,
            "predicted": predicted,
            "confidence": round(confidence, 4),
            "similarities": {k: round(v, 4) for k, v in similarities.items()},
            "correct": is_correct
        })
        
        status = "[OK]" if is_correct else "[X]"
        print(f"{status} '{text[:20]}...' -> {predicted} (期望: {expected}, 置信度: {confidence:.4f})")
    
    accuracy = correct / total
    print(f"\n[RESULT] 准确率: {accuracy:.2%} ({correct}/{total})")
    
    return {
        "model_name": model_name,
        "accuracy": accuracy,
        "correct": correct,
        "total": total,
        "results": results
    }

def compare_models(base_model: str, fine_tuned_model: str = None):
    print("=" * 60)
    print("模型对比评估")
    print("=" * 60)
    
    base_results = evaluate_model(base_model, "基础模型 (text2vec-base-chinese)")
    
    if fine_tuned_model:
        fine_tuned_results = evaluate_model(fine_tuned_model, "微调模型")
        
        print("\n" + "=" * 60)
        print("对比结果")
        print("=" * 60)
        print(f"基础模型准确率: {base_results['accuracy']:.2%}")
        print(f"微调模型准确率: {fine_tuned_results['accuracy']:.2%}")
        improvement = fine_tuned_results['accuracy'] - base_results['accuracy']
        print(f"提升: {improvement:+.2%}")
        
        return base_results, fine_tuned_results
    
    return base_results, None

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="评估嵌入模型")
    parser.add_argument("--base-model", type=str, default="shibing624/text2vec-base-chinese",
                        help="基础模型路径")
    parser.add_argument("--fine-tuned", type=str, default=None,
                        help="微调模型路径")
    parser.add_argument("--output", type=str, default="evaluation_results.json",
                        help="评估结果输出文件")
    
    args = parser.parse_args()
    
    base_results, fine_tuned_results = compare_models(args.base_model, args.fine_tuned)
    
    output = {
        "base_model": base_results,
        "fine_tuned_model": fine_tuned_results
    }
    
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] 评估结果已保存至: {args.output}")

if __name__ == "__main__":
    main()
