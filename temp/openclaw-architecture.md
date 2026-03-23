# 🏛️ OpenClaw 架构设计详解

**文档版本**: 2026-03-16  
**适用版本**: OpenClaw v2026.1+

---

## 📐 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户交互层 (Surface Layer)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ WhatsApp │  │ Telegram │  │ Discord  │  │ CLI / Web / Mac  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        └─────────────┴──────┬──────┴─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  WebSocket API  │  ← 控制平面 (127.0.0.1:18789)
                    │   (Gateway)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  消息路由层    │  │  Agent 运行时   │  │  定时调度器    │
│  (Bindings)    │  │  (pi-mono)     │  │  (Cron/Heartbeat)│
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        │          ┌────────▼────────┐          │
        │          │   工具执行层     │          │
        │          │  (Tool Layer)   │          │
        │          └────────┬────────┘          │
        │                   │                   │
        │    ┌──────────────┼──────────────┐    │
        │    │              │              │    │
        │    ▼              ▼              ▼    │
        │ ┌──────┐    ┌──────────┐    ┌──────────┐
        │ │文件系统│    │ 浏览器   │    │ Shell    │
        │ │Tools │    │ Browser  │    │ Exec     │
        │ └──────┘    └──────────┘    └──────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      持久化层 (Storage Layer)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Sessions     │  │ Memory       │  │ Workspace              │ │
│  │ (JSONL)      │  │ (MD files)   │  │ (AGENTS/SOUL/TOOLS)    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 核心组件详解

### 1️⃣ **Gateway (网关守护进程)**

**职责**：系统的中枢神经，所有连接的汇聚点

```
┌─────────────────────────────────────┐
│           Gateway Daemon            │
├─────────────────────────────────────┤
│ • WebSocket 服务器 (18789 端口)      │
│ • 消息通道管理 (WhatsApp/Telegram 等) │
│ • 设备配对与认证                     │
│ • 事件广播 (presence/heartbeat)      │
│ • Canvas 宿主服务                    │
└─────────────────────────────────────┘
```

**关键特性**：
- 单例运行（每个主机一个 Gateway）
- 维护所有 messaging surface 的长连接
- 处理节点配对（macOS/iOS/Android/Headless）
- 暴露 Typed WS API（请求/响应/服务器推送事件）
- 支持设备配对认证（本地自动批准，远程需审批）

---

### 2️⃣ **Agent 运行时 (Runtime)**

**核心**：基于 pi-mono 的嵌入式 Agent 循环

```
Agent Loop 生命周期:
┌─────────────┐
│ 1. 消息接收  │ ← 用户消息/定时任务/子 Agent 汇报
└──────┬──────┘
       │
┌──────▼──────┐
│ 2. Context   │ ← 组装系统提示 + 会话历史 + 工具定义
│    组装      │
└──────┬──────┘
       │
┌──────▼──────┐
│ 3. 模型推理  │ ← 调用 LLM API (支持多模型故障转移)
└──────┬──────┘
       │
┌──────▼──────┐
│ 4. 工具调用  │ ← read/exec/browser/message...
└──────┬──────┘
       │
┌──────▼──────┐
│ 5. 结果处理  │ ← 流式回复 + 持久化 + 事件推送
└──────┬──────┘
       │
┌──────▼──────┐
│ 6. 状态更新  │ ← Session JSONL + Memory 文件
└─────────────┘
```

**关键机制**：
- **序列化执行**：每个 session 一个执行队列，防止竞争
- **流式输出**：assistant deltas 实时推送
- **超时控制**：默认 600s，可配置
- **中断恢复**：支持 `agent.wait` 等待完成
- **Hook 系统**：支持插件拦截（before_tool_call, agent_end 等）

---

### 3️⃣ **工具层 (Tool Layer)**

**设计哲学**：给 AI 装上「手和脚」

| 工具类别 | 工具名 | 物理世界映射 |
|---------|--------|-------------|
| **文件系统** | `read/write/edit` | 读写本地文件 |
| **系统执行** | `exec/process` | 运行 shell 命令、管理后台进程 |
| **网络交互** | `browser/web_fetch` | 浏览器自动化、网页抓取 |
| **消息通信** | `message/sessions_*` | 发送消息、跨 session 通信 |
| **定时任务** | `cron` | 调度器、提醒、周期性任务 |
| **子 Agent** | `sessions_spawn/subagents` | 并行任务分发 |
| **节点控制** | `nodes` | 摄像头、屏幕录制、位置、通知 |
| **画布** | `canvas` | UI 呈现与交互 |
| **语音** | `tts` | 文本转语音 |
| **记忆** | `memory_search/memory_get` | 语义搜索长期记忆 |

**工具调用流程**：
```
模型思考 → Function Call → OpenClaw 验证 → 执行工具 → 返回结果 → 模型继续推理
           ↓
      策略检查 (policy)
           ↓
      安全沙箱 (可选)
```

---

### 4️⃣ **记忆系统 (Memory System)**

**三层记忆架构**：

```
┌─────────────────────────────────────────┐
│          短期记忆 (Context Window)       │
│  • Session 对话历史                      │
│  • 工具调用记录                          │
│  • 模型可见的全部内容                    │
│  • 限制：受模型 token 限制                │
└─────────────────────────────────────────┘
              ↕ 压缩/刷新
┌─────────────────────────────────────────┐
│          中期记忆 (Daily Notes)          │
│  • memory/YYYY-MM-DD.md                 │
│  • 原始日志、任务进度、临时上下文        │
│  • 自动按日期分割                        │
└─────────────────────────────────────────┘
              ↕ 提炼/归档
┌─────────────────────────────────────────┐
│          长期记忆 (MEMORY.md)            │
│  • 精选的长期知识                        │
│  • 用户画像、偏好、重要决策              │
│  • 只在主 session 加载 (安全隔离)         │
└─────────────────────────────────────────┘
```

**外部化记忆文件**：
| 文件 | 用途 | 加载场景 |
|------|------|---------|
| `AGENTS.md` | 操作指令、工作规范 | 所有 session |
| `SOUL.md` | 人格设定、语气风格 | 所有 session |
| `TOOLS.md` | 工具使用偏好、本地配置 | 所有 session |
| `USER.md` | 用户信息、偏好 | 所有 session |
| `HEARTBEAT.md` | 定期检查任务清单 | 所有 session |
| `MEMORY.md` | 长期记忆 | 仅主 session |
| `BOOTSTRAP.md` | 首次运行引导 | 新 workspace |

---

### 5️⃣ **多 Agent 路由 (Multi-Agent Routing)**

**核心概念**：一个 Gateway 可以托管多个隔离的 Agent

```
                    Inbound Message
                         │
                         ▼
              ┌─────────────────────┐
              │   Binding Router    │
              │  (最具体匹配优先)    │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ Agent A  │   │ Agent B  │   │ Agent C  │
   │ (main)   │   │ (coding) │   │ (social) │
   │ Workspace│   │ Workspace│   │ Workspace│
   │ SOUL.md  │   │ SOUL.md  │   │ SOUL.md  │
   └──────────┘   └──────────┘   └──────────┘
```

**路由规则**（优先级从高到低）：
1. `peer` 精确匹配（特定 DM/群组 ID）
2. `parentPeer` 继承（线程）
3. `guildId + roles`（Discord 角色）
4. `guildId`（Discord 服务器）
5. `teamId`（Slack）
6. `accountId` 匹配
7. channel 级别匹配
8. fallback 到默认 agent

**Agent 隔离内容**：
- 独立 Workspace（AGENTS.md/SOUL.md/USER.md）
- 独立 agentDir（auth-profiles.json、模型注册表）
- 独立 Session Store（`~/.openclaw/agents/<agentId>/sessions`）
- 独立 Skills（`<workspace>/skills`）

---

### 6️⃣ **自动化调度 (Automation)**

```
┌─────────────────────────────────────────┐
│              Cron Scheduler             │
├─────────────────────────────────────────┤
│ • 定时任务 (cron/every/at)              │
│ • 系统事件注入 (systemEvent)            │
│ • Agent Turn 触发 (agentTurn)           │
│ • Webhook 回调                          │
│ • Wake Events                           │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│              Heartbeat                  │
├─────────────────────────────────────────┤
│ • 定期唤醒 (~30min)                     │
│ • 检查邮箱/日历/项目进度                 │
│ • 主动汇报                              │
│ • 可配置检查清单 (HEARTBEAT.md)         │
└─────────────────────────────────────────┘
```

**Cron 任务类型**：
| 类型 | 描述 | 示例 |
|------|------|------|
| `at` | 一次性定时 | 2026-03-16T08:00:00 |
| `every` | 周期性间隔 | 每 30 分钟 |
| `cron` | Cron 表达式 | `0 8 * * *` (每天早 8 点) |

**Payload 类型**：
| 类型 | 用途 | Session 要求 |
|------|------|-------------|
| `systemEvent` | 注入系统事件 | main |
| `agentTurn` | 触发 Agent 执行 | isolated |

---

### 7️⃣ **安全机制 (Security)**

```
┌─────────────────────────────────────────┐
│           安全分层模型                   │
├─────────────────────────────────────────┤
│ 1. 设备配对 (Device Pairing)            │
│    • 新设备需要用户批准                  │
│    • 本地连接可自动批准                  │
│    • Token 认证 + 签名挑战               │
├─────────────────────────────────────────┤
│ 2. 工具策略 (Tool Policy)               │
│    • allow/deny 列表                    │
│    • 危险操作需确认                      │
│    • 沙箱模式 (Docker)                   │
├─────────────────────────────────────────┤
│ 3. Session 隔离                          │
│    • 不同 session context 独立           │
│    • 防止跨 session 数据泄露             │
├─────────────────────────────────────────┤
│ 4. 多 Agent 沙箱                         │
│    • 每 Agent 独立 workspace             │
│    • 可配置 Docker 沙箱                  │
│    • 工具权限隔离                        │
└─────────────────────────────────────────┘
```

**沙箱模式**：
| 模式 | 描述 | 适用场景 |
|------|------|---------|
| `off` | 无沙箱 | 可信 Agent |
| `non-main` | 仅非主 session 沙箱 | 默认安全 |
| `all` | 所有 session 沙箱 | 高安全需求 |

---

## 🔄 完整数据流示例

### 场景：用户说「每天早上 8 点给我发 AI 要闻」

```
1. 用户消息 → WhatsApp → Gateway
2. Gateway → Binding Router → Agent (main)
3. Agent 理解意图 → 调用 cron 工具
4. cron.add({
     schedule: { kind: "cron", expr: "0 8 * * *", tz: "Asia/Shanghai" },
     payload: { kind: "agentTurn", message: "生成 AI 要闻..." }
   })
5. cron 持久化任务 → 返回 jobId
6. Agent 回复用户 → "已设置每天早 8 点提醒"
7. 第二天 8:00 → cron 触发 → spawn Agent Turn
8. Agent 执行 → web_fetch AI 新闻 → message 发送给用户
```

### 场景：多 Agent 协作

```
1. 用户在 WhatsApp 发送消息
2. Gateway 根据 binding 路由到 Agent-A
3. Agent-A 需要代码审查 → sessions_spawn(coding-agent)
4. coding-agent 执行 → 返回审查结果
5. Agent-A 整合结果 → 回复用户
6. 两个 Agent 的 session 完全隔离
```

---

## 📊 架构特点总结

| 维度 | 设计选择 | 优势 |
|------|---------|------|
| **连接模型** | 单 Gateway + 多 WebSocket 客户端 | 集中管理、低延迟、统一认证 |
| **Agent 模型** | 嵌入式 pi-mono + 多实例隔离 | 灵活扩展、安全隔离、独立人格 |
| **记忆模型** | 文件系统外部化 + 三层记忆 | 突破 context 限制、持久化 |
| **工具模型** | Function Calling + 策略过滤 | 安全可控、易扩展 |
| **调度模型** | Cron + Heartbeat 双机制 | 精确调度 + 弹性检查 |
| **安全模型** | 设备配对 + 沙箱 + 隔离 | 多层防护、最小权限 |
| **路由模型** | Binding Router + 优先级匹配 | 灵活、可预测、支持复杂场景 |

---

## 🎯 核心创新点

1. **Workspace as Memory** 📝
   - 用文件系统作为外部记忆，突破 token 限制
   - 支持版本控制（git）、人工编辑、长期保存

2. **Binding Router** 🎛️
   - 灵活的消息路由，支持多 Agent 协作
   - 最具体匹配优先，规则可预测

3. **Heartbeat Protocol** 💓
   - 定期唤醒机制，让 Agent 变「主动」
   - 支持检查清单，避免无效轮询

4. **Session Isolation** 🔒
   - 严格的 session 隔离，防止隐私泄露
   - 跨 session 通信需显式授权

5. **Tool Policy** 🛡️
   - 细粒度的工具权限控制
   - 支持 per-Agent 工具白名单/黑名单

6. **Multi-Agent Sandbox** 📦
   - 每 Agent 独立 workspace + agentDir
   - 可选 Docker 沙箱，工具权限隔离

---

## 📁 关键文件路径

```
~/.openclaw/
├── openclaw.json              # 主配置文件
├── workspace/                 # 主工作区
│   ├── AGENTS.md             # 操作指令
│   ├── SOUL.md               # 人格设定
│   ├── TOOLS.md              # 工具偏好
│   ├── USER.md               # 用户信息
│   ├── MEMORY.md             # 长期记忆
│   ├── HEARTBEAT.md          # 心跳任务
│   ├── memory/               # 日常笔记
│   │   └── YYYY-MM-DD.md
│   └── temp/                 # 临时文件
├── agents/                    # 多 Agent 状态
│   └── <agentId>/
│       ├── agent/            # agentDir (auth, config)
│       └── sessions/         # Session JSONL
├── skills/                    # 共享技能
│   └── <skill-name>/
└── credentials/               # 渠道凭证
    ├── whatsapp/
    ├── telegram/
    └── discord/
```

---

## 🔗 参考文档

- [Gateway Architecture](/gateway/architecture)
- [Agent Runtime](/concepts/agent)
- [Agent Loop](/concepts/agent-loop)
- [Multi-Agent Routing](/concepts/multi-agent)
- [Context](/concepts/context)
- [Memory](/concepts/memory)
- [Cron](/automation/cron)
- [Sandboxing](/gateway/sandboxing)

---

*最后更新：2026-03-16*
