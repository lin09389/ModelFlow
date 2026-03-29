"""
高质量训练数据生成器
用于微调 text2vec-base-chinese 嵌入模型，提升混合模型路由的分类能力

数据类型：
1. Triplet (三元组) - 用于复杂度分类
2. Pair (句子对) - 用于任务类型识别
3. STS (语义相似度) - 用于语义理解增强
"""

import json
import random
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TripletData:
    anchor: str
    positive: str
    negative: str
    category: str
    difficulty: str

@dataclass
class PairData:
    sentence_a: str
    sentence_b: str
    label: float
    task_type: str

@dataclass
class STSData:
    sentence_a: str
    sentence_b: str
    score: float
    category: str

HIGH_QUALITY_TEMPLATES = {
    "small": {
        "greetings": [
            "你好", "早上好", "晚上好", "嗨", "哈喽", "在吗", "你好呀",
            "hello", "hi", "hey", "good morning", "good evening",
            "您好", "请问在吗", "有人吗", "打扰一下"
        ],
        "simple_questions": [
            "是什么意思", "是什么", "怎么读", "怎么写", "有多少",
            "是什么东西", "是什么概念", "简单介绍一下",
            "举个例子", "一句话解释", "通俗地说",
            "what is", "what does mean", "how to say"
        ],
        "confirmations": [
            "好的", "收到", "明白", "了解", "知道了", "OK", "ok",
            "是的", "对的", "没错", "可以", "行", "好的好的",
            "确认", "没问题", "搞定"
        ],
        "quick_lookups": [
            "快速查一下", "简单看看", "帮我确认", "检查一下",
            "验证一下", "看一下", "帮我看看", "确认下"
        ],
        "short_commands": [
            "继续", "停止", "取消", "重试", "下一个", "上一个",
            "刷新", "清空", "重置", "保存", "退出"
        ]
    },
    "medium": {
        "coding": [
            "写一个{}函数", "实现一个{}", "帮我写{}", "编写一个{}",
            "创建一个{}类", "定义一个{}", "封装一个{}",
            "修复这个bug", "调试这段代码", "优化这个函数",
            "重构这段代码", "添加{}功能", "实现{}接口",
            "写一个{}脚本", "帮我写一个{}程序", "实现{}逻辑",
            "写一个Python脚本{}", "用JavaScript实现{}"
        ],
        "documentation": [
            "写一份{}文档", "整理{}文档", "生成{}报告",
            "写一篇{}博客", "帮我写{}", "撰写{}说明",
            "总结一下{}", "归纳{}要点", "整理{}资料"
        ],
        "data_processing": [
            "处理这个{}数据", "转换{}格式", "清洗{}数据",
            "分析这个表格", "统计{}数据", "生成{}报表",
            "解析{}文件", "提取{}信息", "格式化{}数据"
        ],
        "translation": [
            "翻译这段{}", "把{}翻译成{}", "帮我翻译{}",
            "转换{}语言", "翻译一下{}", "将{}翻译为{}"
        ],
        "moderate_analysis": [
            "分析一下{}", "解释一下{}", "说明一下{}",
            "介绍一下{}", "讲解一下{}", "阐述{}原理"
        ]
    },
    "large": {
        "deep_analysis": [
            "深度分析{}", "全面分析{}", "详细分析{}",
            "系统性分析{}", "多维度分析{}", "深入剖析{}",
            "全面评估{}", "综合分析{}", "深入研究{}"
        ],
        "architecture": [
            "设计一个{}架构", "规划{}系统架构", "设计{}整体方案",
            "从零设计{}", "架构设计{}", "系统设计方案",
            "微服务架构设计", "分布式系统设计", "高可用架构设计"
        ],
        "complex_reasoning": [
            "推导{}", "证明{}", "论证{}",
            "逻辑推理{}", "因果分析{}", "归纳总结{}"
        ],
        "comprehensive_tasks": [
            "端到端实现{}", "全栈开发{}", "完整实现{}",
            "从头构建{}", "全流程设计{}", "一体化方案{}"
        ],
        "research": [
            "可行性研究{}", "技术选型分析{}", "竞品分析{}",
            "市场调研{}", "用户研究{}", "风险评估{}"
        ],
        "optimization": [
            "性能优化{}", "深度优化{}", "全面优化{}",
            "重构优化{}", "架构优化{}", "系统调优{}"
        ]
    }
}

TASK_TYPE_EXAMPLES = {
    "coding": {
        "positive": [
            ("写一个排序算法", 0.95),
            ("帮我实现一个二分查找", 0.92),
            ("创建一个用户类", 0.90),
            ("写一个API接口", 0.88),
            ("修复这个bug", 0.85),
            ("重构这段代码", 0.87),
            ("实现登录功能", 0.90),
            ("写一个Python爬虫", 0.92),
            ("封装一个HTTP请求类", 0.88),
            ("帮我写一个单元测试", 0.85),
        ],
        "negative": [
            ("你好在吗", 0.15),
            ("今天天气怎么样", 0.10),
            ("帮我写一封邮件", 0.25),
            ("分析一下市场趋势", 0.20),
        ]
    },
    "writing": {
        "positive": [
            ("写一封商务邮件", 0.92),
            ("帮我写一篇博客", 0.90),
            ("润色这段文字", 0.88),
            ("写一份产品说明", 0.85),
            ("帮我写个简历", 0.87),
            ("撰写项目报告", 0.88),
            ("写一篇技术文章", 0.90),
            ("帮我写个通知", 0.85),
        ],
        "negative": [
            ("写一个函数", 0.20),
            ("分析数据", 0.15),
            ("你好", 0.10),
        ]
    },
    "analysis": {
        "positive": [
            ("分析销售数据趋势", 0.92),
            ("对比两个方案优劣", 0.90),
            ("评估项目可行性", 0.88),
            ("研究竞品特点", 0.87),
            ("分析用户行为", 0.90),
            ("深度分析市场", 0.92),
            ("全面评估风险", 0.88),
            ("对比分析数据", 0.90),
        ],
        "negative": [
            ("写一个函数", 0.15),
            ("你好", 0.10),
            ("帮我写邮件", 0.18),
        ]
    },
    "chat": {
        "positive": [
            ("你好", 0.95),
            ("在吗", 0.92),
            ("谢谢", 0.90),
            ("好的收到", 0.88),
            ("早安", 0.92),
            ("晚安", 0.90),
            ("哈哈", 0.85),
            ("好的好的", 0.88),
        ],
        "negative": [
            ("写一个函数", 0.10),
            ("分析数据", 0.12),
            ("帮我写报告", 0.15),
        ]
    },
    "question": {
        "positive": [
            ("什么是机器学习", 0.92),
            ("为什么需要缓存", 0.90),
            ("怎么做性能优化", 0.88),
            ("如何实现分布式", 0.87),
            ("什么是微服务", 0.90),
            ("为什么选择这个方案", 0.88),
            ("怎么解决这个bug", 0.85),
            ("如何提高效率", 0.87),
        ],
        "negative": [
            ("写一个函数", 0.15),
            ("你好", 0.20),
            ("帮我写报告", 0.18),
        ]
    }
}

STS_QUALITY_DATA = [
    ("快速排序算法", "排序算法实现", 0.85),
    ("快速回答问题", "简单回复", 0.88),
    ("深度分析数据", "详细研究数据", 0.90),
    ("简单介绍一下", "简要说明", 0.92),
    ("帮我写个函数", "帮我实现一个函数", 0.95),
    ("设计系统架构", "规划系统结构", 0.88),
    ("修复这个bug", "解决这个错误", 0.87),
    ("优化性能", "提升效率", 0.82),
    ("写一份文档", "撰写文档", 0.93),
    ("分析市场趋势", "研究市场动向", 0.85),
    ("实现登录功能", "开发登录模块", 0.90),
    ("重构代码", "优化代码结构", 0.80),
    ("测试接口", "验证API", 0.85),
    ("处理数据", "操作数据", 0.75),
    ("设计数据库", "规划数据存储", 0.82),
    ("你好", "您好", 0.98),
    ("谢谢", "感谢", 0.95),
    ("好的", "收到", 0.90),
    ("写代码", "编程", 0.88),
    ("分析问题", "研究问题", 0.85),
    ("深度学习", "机器学习", 0.70),
    ("前端开发", "网页开发", 0.82),
    ("后端开发", "服务端开发", 0.85),
    ("数据库优化", "SQL优化", 0.80),
    ("系统设计", "架构设计", 0.88),
    ("代码审查", "代码评审", 0.95),
    ("性能测试", "压力测试", 0.75),
    ("单元测试", "功能测试", 0.80),
    ("集成测试", "系统测试", 0.78),
    ("部署上线", "发布部署", 0.90),
]

def fill_template(template: str, items: List[str]) -> List[str]:
    results = []
    placeholder_count = template.count("{}")
    for item in items:
        if "{}" in template:
            results.append(template.format(*([item] * placeholder_count)))
    return results

FILL_ITEMS = {
    "coding": [
        "排序", "查找", "登录", "注册", "支付", "订单", "用户", "商品",
        "购物车", "评论", "搜索", "推荐", "缓存", "队列", "栈", "树",
        "图", "链表", "哈希表", "二叉树", "红黑树", "B树", "堆"
    ],
    "documentation": [
        "项目", "产品", "技术", "接口", "需求", "设计", "测试", "部署",
        "运维", "开发", "架构", "API", "数据库", "系统"
    ],
    "analysis": [
        "市场", "用户", "数据", "竞品", "需求", "技术", "风险", "可行性",
        "性能", "成本", "收益", "趋势"
    ],
    "architecture": [
        "电商", "社交", "支付", "推荐", "搜索", "消息", "订单", "用户",
        "内容", "直播", "短视频", "游戏"
    ]
}

def generate_triplet_data(count: int = 500) -> List[TripletData]:
    triplets = []
    
    small_sentences = []
    for category, sentences in HIGH_QUALITY_TEMPLATES["small"].items():
        small_sentences.extend(sentences)
    
    medium_sentences = []
    for category, templates in HIGH_QUALITY_TEMPLATES["medium"].items():
        for template in templates:
            items = FILL_ITEMS.get(category, FILL_ITEMS["coding"])
            medium_sentences.extend(fill_template(template, items))
    
    large_sentences = []
    for category, templates in HIGH_QUALITY_TEMPLATES["large"].items():
        for template in templates:
            items = FILL_ITEMS.get("architecture", FILL_ITEMS["analysis"])
            large_sentences.extend(fill_template(template, items))
    
    for _ in range(count // 3):
        if small_sentences and medium_sentences:
            anchor = random.choice(small_sentences)
            positive = random.choice(small_sentences)
            negative = random.choice(medium_sentences)
            triplets.append(TripletData(anchor, positive, negative, "small", "easy"))
    
    for _ in range(count // 3):
        if medium_sentences and (small_sentences or large_sentences):
            anchor = random.choice(medium_sentences)
            positive = random.choice(medium_sentences)
            negative = random.choice(random.choice([small_sentences, large_sentences]))
            triplets.append(TripletData(anchor, positive, negative, "medium", "medium"))
    
    for _ in range(count // 3):
        if large_sentences and medium_sentences:
            anchor = random.choice(large_sentences)
            positive = random.choice(large_sentences)
            negative = random.choice(medium_sentences)
            triplets.append(TripletData(anchor, positive, negative, "large", "hard"))
    
    random.shuffle(triplets)
    return triplets

def generate_pair_data(count: int = 400) -> List[PairData]:
    pairs = []
    
    for task_type, examples in TASK_TYPE_EXAMPLES.items():
        for sentence, label in examples["positive"]:
            pairs.append(PairData(sentence, f"{task_type}任务", label, task_type))
        
        for sentence, label in examples["negative"]:
            pairs.append(PairData(sentence, f"{task_type}任务", label, task_type))
    
    while len(pairs) < count:
        task_type = random.choice(list(TASK_TYPE_EXAMPLES.keys()))
        templates = HIGH_QUALITY_TEMPLATES.get(random.choice(["small", "medium", "large"]), {})
        if templates:
            category = random.choice(list(templates.keys()))
            sentences = templates[category]
            if sentences:
                sentence = random.choice(sentences)
                if "{}" in sentence:
                    items = FILL_ITEMS.get(category, FILL_ITEMS["coding"])
                    placeholder_count = sentence.count("{}")
                    sentence = sentence.format(*([random.choice(items)] * placeholder_count))
                pairs.append(PairData(sentence, f"{task_type}任务", random.uniform(0.7, 0.95), task_type))
    
    random.shuffle(pairs)
    return pairs[:count]

def generate_sts_data(count: int = 300) -> List[STSData]:
    sts_data = []
    
    for sent_a, sent_b, score in STS_QUALITY_DATA:
        category = "high" if score >= 0.85 else ("medium" if score >= 0.70 else "low")
        sts_data.append(STSData(sent_a, sent_b, score, category))
    
    while len(sts_data) < count:
        base_data = random.choice(STS_QUALITY_DATA)
        sent_a, _, score = base_data
        
        variations = [
            (sent_a.replace("帮我", "请帮我"), score * 0.98),
            (sent_a.replace("写", "编写"), score * 0.95),
            (sent_a.replace("分析", "研究"), score * 0.92),
            (sent_a + "一下", score * 0.90),
        ]
        
        for var_sent, var_score in variations:
            if var_sent != sent_a and len(sts_data) < count:
                category = "high" if var_score >= 0.85 else ("medium" if var_score >= 0.70 else "low")
                sts_data.append(STSData(sent_a, var_sent, round(var_score, 2), category))
    
    random.shuffle(sts_data)
    return sts_data[:count]

def save_training_data(output_dir: str = "training_data"):
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    print("正在生成训练数据...")
    
    triplets = generate_triplet_data(500)
    triplet_file = output_path / f"triplet_data_{timestamp}.jsonl"
    with open(triplet_file, "w", encoding="utf-8") as f:
        for t in triplets:
            f.write(json.dumps({
                "anchor": t.anchor,
                "positive": t.positive,
                "negative": t.negative,
                "category": t.category,
                "difficulty": t.difficulty
            }, ensure_ascii=False) + "\n")
    print(f"[OK] 三元组数据: {len(triplets)} 条 -> {triplet_file}")
    
    pairs = generate_pair_data(400)
    pair_file = output_path / f"pair_data_{timestamp}.jsonl"
    with open(pair_file, "w", encoding="utf-8") as f:
        for p in pairs:
            f.write(json.dumps({
                "sentence_a": p.sentence_a,
                "sentence_b": p.sentence_b,
                "label": p.label,
                "task_type": p.task_type
            }, ensure_ascii=False) + "\n")
    print(f"[OK] 句子对数据: {len(pairs)} 条 -> {pair_file}")
    
    sts_data = generate_sts_data(300)
    sts_file = output_path / f"sts_data_{timestamp}.jsonl"
    with open(sts_file, "w", encoding="utf-8") as f:
        for s in sts_data:
            f.write(json.dumps({
                "sentence_a": s.sentence_a,
                "sentence_b": s.sentence_b,
                "score": s.score,
                "category": s.category
            }, ensure_ascii=False) + "\n")
    print(f"[OK] STS数据: {len(sts_data)} 条 -> {sts_file}")
    
    stats = {
        "timestamp": timestamp,
        "total_samples": len(triplets) + len(pairs) + len(sts_data),
        "triplet": {
            "count": len(triplets),
            "categories": {
                "small": len([t for t in triplets if t.category == "small"]),
                "medium": len([t for t in triplets if t.category == "medium"]),
                "large": len([t for t in triplets if t.category == "large"])
            }
        },
        "pair": {
            "count": len(pairs),
            "task_types": {tt: len([p for p in pairs if p.task_type == tt]) for tt in set(p.task_type for p in pairs)}
        },
        "sts": {
            "count": len(sts_data),
            "categories": {
                "high": len([s for s in sts_data if s.category == "high"]),
                "medium": len([s for s in sts_data if s.category == "medium"]),
                "low": len([s for s in sts_data if s.category == "low"])
            }
        }
    }
    
    stats_file = output_path / f"data_stats_{timestamp}.json"
    with open(stats_file, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    print(f"[OK] 统计信息 -> {stats_file}")
    
    print(f"\n[STATS] 数据统计:")
    print(f"   总样本数: {stats['total_samples']}")
    print(f"   三元组: {stats['triplet']['count']} 条")
    print(f"   句子对: {stats['pair']['count']} 条")
    print(f"   STS: {stats['sts']['count']} 条")
    
    return stats

if __name__ == "__main__":
    save_training_data()
