# 文件读取策略

## 大文件分块读取

### 原则

文件 > 1000 行时，用 `offset/limit` 分块读取。

### 示例

```bash
# 第一次读取前 100 行
read path="large-log.txt" offset=1 limit=100

# 需要继续
read path="large-log.txt" offset=101 limit=100

# 读取特定范围
read path="config.yaml" offset=50 limit=50
```

## 先用 grep 定位

```bash
# 先找关键词行号
grep -n "ERROR" large-log.txt | head -20

# 然后读取具体范围
read path="large-log.txt" offset=1200 limit=50
```

## 文件类型建议

| 文件类型 | 策略 |
|----------|------|
| **日志文件** | grep 定位 + 分块读取 |
| **配置文件** | 直接读取（通常 < 500 行） |
| **代码文件** | 按函数/模块分块 |
| **数据文件** | 先读 header，再分块 |
| **文档文件** | 用 memory_search 搜索 |

## 避免重复读取

**问题**：同一个文件在对话中被多次读取。

**解决**：

1. 第一次读取后写入 `temp/` 目录的摘要文件
2. 后续需要时先检查摘要文件
3. 只在必要时重新读取原文

```bash
# 第一次
read path="api-spec.yaml" > temp/api-spec-cache.txt

# 后续需要时
read path="temp/api-spec-cache.txt"
```

## 图片/二进制文件

**不要**用 `read` 读取二进制文件！

- 图片：用 `browser screenshot` 或 `canvas snapshot`
- PDF：用 `pdf` skill
- Excel：用 `xlsx` skill
