---
name: dirty-work-detector
description: 脏活检测工具。识别适合本地处理的任务（批量操作、格式转换、数据清洗、文件操作等），优先使用本地命令而非 AI 模型。当需要减少 AI 调用、优化 token 消耗、或批量处理文件时触发。
---

# Dirty Work Detector - 脏活检测器

## 核心目标

**脏活用本地命令，脏活不用 AI**

把重复性高、创造性低、规则明确的任务交给本地命令，token 成本降为 0。

---

## 什么是"脏活"？

### 脏活特征

- ✅ **重复性高**：批量处理多个文件
- ✅ **规则明确**：有固定转换规则
- ✅ **不需要推理**：机械性操作
- ✅ **容错率高**：错了可以重来
- ✅ **命令行能搞定**：有现成 CLI 工具

### 脏活分类

| 类型 | 示例 | 本地命令 |
|------|------|----------|
| **格式转换** | JSON→YAML, CSV→Excel | `jq`, `csvkit` |
| **批量操作** | 重命名 100 个文件 | `rename`, `mv` |
| **数据清洗** | 去重、格式化 | `sort`, `awk`, `sed` |
| **文件操作** | 移动、复制、合并 | `cp`, `mv`, `cat` |
| **内容提取** | grep 关键词 | `grep`, `find` |
| **统计信息** | 行数、字数 | `wc`, `du` |

---

## 检测规则

### 关键词触发

```yaml
# 脏活关键词（优先用本地命令）
"批量" + 文件操作
"转换" + 格式
"重命名" + 文件
"合并" + 文件
"统计" + 文件
"查找" + 内容
"去重" + 数据
"格式化" + 文件
"压缩" + 图片/视频
"提取" + 文本
```

### 决策流程

```
用户请求
   ↓
检测脏活关键词
   ↓
┌──────────────────┐
│ 有现成 CLI 工具？   │
│ 规则是否明确？    │
│ 是否需要推理？    │
└──────────────────┘
   ↓
是 → 用本地 exec 命令
否 → 用 AI 模型处理
```

---

## 常用脏活命令库

### 格式转换

```bash
# JSON → YAML
jq -r 'to_entries | map("\(.key): \(.value)") | .[]' input.json

# YAML → JSON
yq -o=json '.' input.yaml

# CSV → JSON
csvjson input.csv

# XML → JSON
xml2json input.xml
```

### 批量操作

```bash
# 批量重命名（添加前缀）
for f in *.txt; do mv "$f" "backup_$f"; done

# 批量转换格式
for f in *.json; do jq '.' "$f" > "$f.yaml"; done

# 批量压缩图片
mogrify -quality 80% *.jpg
```

### 数据清洗

```bash
# 去重
sort file.txt | uniq > unique.txt

# 提取特定列
awk -F',' '{print $1,$3}' data.csv

# 正则替换
sed -i 's/old/new/g' file.txt

# 过滤空行
grep -v '^$' file.txt
```

### 文件操作

```bash
# 合并文件
cat *.txt > all.txt

# 分割大文件
split -l 1000 large.txt small_

# 查找内容
grep -r "keyword" ./path

# 统计信息
wc -l *.txt
du -sh ./folder
```

---

## 使用方法

### 自动检测

```bash
# 直接说任务，自动判断是否脏活
"把这 100 个 JSON 文件转成 YAML"
→ 检测为脏活 → 用本地命令

"分析这个代码库的架构"
→ 不是脏活 → 用 AI 模型
```

### 手动指定

```bash
# 明确用本地命令
exec "for f in *.json; do jq '.' $f; done"

# 明确用 AI 模型
sessions_spawn task="分析这个代码库"
```

---

## 脏活 vs AI 活对比

| 任务 | 脏活处理 | AI 处理 | 选择 |
|------|----------|--------|------|
| JSON→YAML | ✅ jq 命令 | ❌ 浪费 token | 本地 |
| 批量重命名 | ✅ rename | ❌ 浪费 token | 本地 |
| 代码审查 | ❌ 无法 | ✅ 需要理解 | AI |
| 架构设计 | ❌ 无法 | ✅ 需要推理 | AI |
| 日志分析 | ✅ grep/awk | ✅ 需要理解 | 混合 |
| 数据清洗 | ✅ awk/sed | ❌ 浪费 token | 本地 |

---

## 混合模式

有些任务可以 **本地预处理 + AI 分析**：

```bash
# 1. 本地提取关键信息
grep "ERROR" app.log > errors.txt

# 2. AI 分析错误原因
sessions_spawn task="分析这些错误的原因" files="errors.txt"
```

**优势**：
- 本地过滤减少数据量
- AI 只处理关键内容
- token 节省 50%+

---

## 脚本工具

### detect-dirty-work.sh

检测任务是否适合本地处理。

```bash
#!/bin/bash
# 用法：./detect-dirty-work.sh "任务描述"
# 输出：是否脏活 + 推荐命令
```

### command-suggest.sh

根据任务推荐本地命令。

---

## 最佳实践

### 1. 优先想"能不能用命令行"

收到任务后，先想：
- 这个任务有 CLI 工具吗？
- 规则是否明确？
- 需要创造性吗？

### 2. 批量任务必用本地

100 个文件处理 = 100 次 AI 调用 vs 1 个循环命令

### 3. 预处理减少 AI 输入

先用本地命令过滤/提取，再让 AI 分析结果。

### 4. 建立命令库

常用脏活命令存成脚本，下次直接用。

---

## 参考文档

- [多模型路由](../model-router/SKILL.md) - 智能选择 AI 模型
- [Token 优化](../token-optimizer/SKILL.md) - 整体 token 管理策略

---

## 快速决策表

| 任务 | 推荐方式 | 命令示例 |
|------|----------|----------|
| "批量重命名" | 本地 | `rename 's/old/new/' *.txt` |
| "JSON 转 YAML" | 本地 | `jq` + `yq` |
| "去重数据" | 本地 | `sort | uniq` |
| "代码审查" | AI | `sessions_spawn` |
| "日志分析" | 混合 | `grep` + AI 分析 |
| "架构设计" | AI | `sessions_spawn model="qwen-max"` |
