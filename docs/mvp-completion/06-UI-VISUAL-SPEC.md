# 06 UI Visual Spec

## 设计定位

Emerge 的 UI 要像 AI 时代的文件管理器，而不是：

- 网盘
- 聊天工具
- 传统知识库
- 营销落地页

默认第一屏是 Objects 工作台。用户打开后应该立即感到：

- 我的文件、网页、笔记都变成了可理解的对象。
- 系统正在处理、索引、引用、追踪这些对象。
- 我可以从对象进入 Ask，而不是被迫从聊天框开始。

## 视觉关键词

- 高信息密度
- 安静、清晰、工具感
- 文件系统 + AI 理解层
- 有状态、有证据、有轨迹
- 少装饰，多反馈

## 第一屏布局

桌面：

```text
┌──────────────────────────────────────────────────────────────┐
│ Header: brand / ask / import / model status / settings        │
├──────────────┬────────────────────────────┬──────────────────┤
│ Sources      │ Objects                    │ Inspector        │
│              │ Search / filters / rows    │ Snapshot/Ask     │
│              │                            │ Evidence/Preview │
├──────────────┴────────────────────────────┴──────────────────┤
│ Pipeline / Trace / Background Jobs                            │
└──────────────────────────────────────────────────────────────┘
```

窄屏：

- Header 保留。
- Sources 变为横向 segmented 或抽屉。
- Objects 在上。
- Inspector 在下或单独详情页。
- Pipeline / Trace 可折叠。

## Header

必须包含：

- 品牌：Emerge
- 副标题：Local Brain Layer 或本地 Brain Layer
- Ask 输入
- 导入文件按钮
- 新建笔记按钮
- 捕获 URL 按钮
- 模型设置按钮
- API 状态
- LLM 状态

状态按钮要求：

- API offline：明确提示 `本地 API 未连接`，并给出启动命令。
- LLM missing key：提示配置模型。
- Embedding failure：提示 Ollama 状态，不要影响基本词法检索。

## Sources

不是目录树，而是来源导航。

项目：

- All Objects
- Local Files
- Notes
- URLs
- Collections
- Needs Review

每项显示数量。

后续可加：

- Recent Imports
- Failed Jobs
- Reindex Needed

## Objects List

对象行必须适合高频扫描，不要做成大卡片。

每行包含：

- 类型图标
- 标题
- 来源路径或 URL
- 状态 pill
- tags/topics
- 更新时间
- 快捷动作

行高建议：

- 桌面：68-84px
- 窄屏：可增加到 92px

### 状态颜色

- ready: green / semantic
- indexing/running: blue
- queued: neutral
- partial/stale: amber
- error: red

### 批量导入状态

批量导入时，列表顶部或底部应显示轻量进度条：

```text
Importing 3/10 · 1 failed · 6 indexed
```

失败项可以在导入摘要 modal 中查看。

## Semantic Inspector

Inspector 是“AI 理解结果”，不是普通详情页。

模块顺序建议：

1. Object header
2. Ask result
3. Original source preview
4. Indexed content preview
5. Summary
6. Topics
7. Entities
8. Evidence
9. Suggested actions
10. Metadata

### Original vs Indexed

必须区分：

- Original source：原始文本或网页正文。
- Indexed chunks：实际进入检索的片段。

视觉上可以用 tabs 或并列小标题。

文案示例：

```text
Original Source
本地保存的原始文本预览。

Indexed Chunks
Ask/Search 实际使用的证据片段。
```

## Trace / Pipeline

Trace 是 MVP 的关键视效。它让系统从“黑盒 AI”变成“可追踪工作台”。

### Pipeline strip

保留底部 5 步：

- ingest
- parse
- snapshot
- index
- verify

每步显示：

- icon
- 状态
- message
- duration

### Object Trace Panel

新增对象级 trace 面板。

每条事件显示：

- 时间
- kind
- status
- title
- message
- 可展开 details

视觉要求：

- 不要做成聊天气泡。
- 更像开发工具中的 run history / log timeline。
- 成功事件低对比，失败事件明显。

## Model Settings

分两段：

### OpenAI-compatible

字段：

- Base URL
- Model
- Provider label
- Chat Path optional
- API Key

### Local Embedding

字段：

- Ollama Base URL
- Embedding model
- Test result

文案要求：

- 说明 API key runtime-only。
- 说明 Chat Path 可留空。
- 说明 Embedding 不可用时会降级词法检索。

## Empty States

空状态不是营销页。必须给直接动作：

- Import local files
- Capture URL
- Create note
- Open sample workspace

不要写大段产品介绍。

## Error States

错误必须包含：

- 哪一步失败
- 错误摘要
- 下一步动作

示例：

```text
Embedding 失败
Ollama 没有响应。请确认 Ollama 正在运行，或继续使用词法检索。
```

## 色彩

保留当前冷静工作台色彩，避免单一紫蓝或营销渐变。

建议：

```text
background: #F6F7F9
surface:    #FFFFFF
ink:        #15171A
muted:      #69707A
line:       #DADDE3
accent:     #2F6FED
semantic:   #13A88B
warning:    #D98614
danger:     #D94A4A
trace:      #7C5CFC
```

## 动效

可以有：

- indexing 轻微进度动画
- trace 新事件淡入
- 行选择高亮
- modal 轻微出现

不要有：

- 装饰性渐变球
- 大面积毛玻璃
- 纯氛围背景
- 复杂英雄动效

## 文字

规则：

- 按钮短句。
- 错误文案可操作。
- 不在页面里解释功能哲学。
- 不用巨大 hero 字体。
- 不让文字溢出按钮或卡片。

## 响应式

必须检查：

- 1440x920
- 1280x800
- 390x844

移动端允许减少信息，但不能隐藏：

- 对象状态
- evidence
- API/LLM 状态
- 失败状态

## 验收截图

每个视觉迭代都应保存截图到：

```text
dev/web/emerge/artifacts/
```

命名：

```text
iter-NNN-feature-name.png
```
