# Token Optimizer 技能安装说明

## 安装完成 ✅

技能已安装到：`~/.openclaw/skills/token-optimizer`

## 目录结构

```
token-optimizer/
├── SKILL.md                      # 技能主文件（触发条件 + 使用说明）
├── scripts/
│   ├── check-context.sh          # 检查 context 使用率
│   └── quick-optimize.sh         # 快速优化清单
└── references/
    ├── memory-optimization.md    # Memory 优化指南
    ├── session-management.md     # Session 管理最佳实践
    └── file-reading.md           # 文件读取策略
```

## 如何使用

### 自动触发

当你提到以下关键词时，技能会自动触发：

- "token 消耗"
- "优化 context"
- "减少 token"
- "context 满了"
- "压缩对话"
- "session 优化"

### 手动使用

1. **检查 Context 使用率**
   ```
   帮我检查当前 context 使用率
   ```

2. **获取优化建议**
   ```
   怎么减少 token 消耗
   ```

3. **隔离复杂任务**
   ```
   用 sub-agent 分析这个代码库
   ```

4. **Memory 查询**
   ```
   搜索一下我之前关于用户偏好的记录
   ```

## 快速行动清单

运行以下脚本查看快速优化建议：

```bash
~/.openclaw/skills/token-optimizer/scripts/quick-optimize.sh
```

## 预期效果

| 优化策略 | Token 节省 |
|----------|-----------|
| Session 隔离 | 60%+ |
| Memory 懒加载 | 70%+ |
| 文件分块读取 | 50-80% |
| 回复精简 | 20-30% |
| Context 压缩 | 40-50% |

**组合使用**：整体减少 **50-70%**

## 故障排除

**技能没有触发？**

检查关键词是否匹配，或直接说：
```
使用 token-optimizer 技能
```

**需要更新技能？**

编辑 `~/.openclaw/skills/token-optimizer/SKILL.md`

## 贡献

有问题或建议？可以修改技能文件，或者创建新技能。
