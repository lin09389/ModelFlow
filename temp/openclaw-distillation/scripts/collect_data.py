#!/usr/bin/env python3
"""
collect_data.py - 从 OpenClaw 历史对话中收集训练数据

用法：
  python scripts/collect_data.py --output data/raw/conversations.json
"""

import json
import argparse
from pathlib import Path
from datetime import datetime

def collect_from_memory():
    """从 memory/ 目录收集每日对话日志"""
    conversations = []
    memory_dir = Path("memory/")
    
    if not memory_dir.exists():
        print("⚠️  memory/ 目录不存在")
        return conversations
    
    for file in sorted(memory_dir.glob("*.md")):
        if file.name == "YYYY-MM-DD.md":
            continue
            
        try:
            content = file.read_text(encoding="utf-8")
            # 解析 markdown 格式的对话
            # 这里需要根据实际格式调整解析逻辑
            conversations.append({
                "source": str(file),
                "date": file.stem,
                "content": content,
                "collected_at": datetime.now().isoformat()
            })
            print(f"✅ 收集：{file.name}")
        except Exception as e:
            print(f"❌ 失败：{file.name} - {e}")
    
    return conversations

def collect_from_sessions():
    """从 sessions_list 收集活跃会话"""
    # 这需要通过 OpenClaw API 调用
    # 这里用伪代码表示
    conversations = []
    print("📋 从 sessions 收集对话...")
    return conversations

def main():
    parser = argparse.ArgumentParser(description="收集 OpenClaw 训练数据")
    parser.add_argument("--output", type=str, required=True, help="输出文件路径")
    parser.add_argument("--days", type=int, default=30, help="收集最近 N 天")
    args = parser.parse_args()
    
    print("🚀 开始收集训练数据...")
    
    # 收集数据
    conversations = []
    conversations.extend(collect_from_memory())
    # conversations.extend(collect_from_sessions())
    
    # 保存
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "count": len(conversations),
            "collected_at": datetime.now().isoformat(),
            "conversations": conversations
        }, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 完成！共收集 {len(conversations)} 条对话")
    print(f"📁 保存到：{output_path}")

if __name__ == "__main__":
    main()
