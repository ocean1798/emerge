# UI 与视效规格

## 设计目标

Emerge 的视觉应该像 AI 时代的文件系统，而不是传统网盘、聊天软件或知识库。

关键词：

- 信息密度高，但不压迫。
- 文件不是列表项，而是可被 AI 理解和操作的对象。
- 用户始终知道系统在读什么、懂了什么、引用了什么、下一步能做什么。

## 第一屏布局

桌面端采用四区结构：

```text
┌──────────────┬──────────────────────────────┬──────────────────────┐
│ Sources      │ Objects                      │ Semantic Inspector   │
│              │                              │                      │
│              │                              │                      │
├──────────────┴──────────────────────────────┴──────────────────────┤
│ Pipeline Strip / Trace / Background Jobs                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Sources

用途：管理入口，而不是普通目录树。

内容：

- Local Files
- Notes
- URLs
- Collections
- Recent Imports
- Errors / Needs Review

### Objects

用途：主工作区。

对象行必须包含：

- 文件类型图标
- 标题
- source path / URL
- 语义状态
- topics/tags
- last updated
- quick actions

推荐行高：64-84px。不要做成巨大卡片墙，默认应适合高频扫描。

### Semantic Inspector

用途：展示 AI 对当前对象的理解。

模块：

- Summary
- Content Preview
- Topics
- Entities
- Evidence
- Relations
- Suggested Actions
- Snapshot Metadata

### Pipeline Strip

用途：让后台处理可见。

展示：

- queued
- ingesting
- parsing
- snapshotting
- indexing
- ready
- error

## 色彩方向

避免全紫、全蓝、全黑。建议使用冷静的工作台底色，加少量高能状态色。

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

## 动效原则

- 状态变化可以有微动效。
- 列表滚动、选择、高亮要稳。
- 后台 pipeline 可以使用轻量进度动画。
- 不使用装饰性渐变球、漂浮光斑、过重玻璃拟态。

## 空状态

空状态不是营销页。它应该直接给入口：

- Add local files
- Import URL
- Create note
- Open sample workspace

## 错误状态

错误必须可操作：

- 显示失败步骤。
- 显示错误摘要。
- 提供 retry、view log、mark ignored。

## 响应式

窄屏下：

- Sources 收起为侧边抽屉。
- Inspector 变为详情页或底部面板。
- Pipeline Strip 保留为可展开状态条。

核心原则：移动端可以少展示，但不能让对象状态和证据关系消失。
