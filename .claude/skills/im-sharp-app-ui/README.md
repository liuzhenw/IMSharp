# IM Sharp App UI Skill

这是 IM Sharp App 的 UI 设计系统和组件库规范 skill。

## 功能

这个 skill 提供:

1. **设计系统规范**: 颜色、字体、间距、圆角、阴影、动画等设计 token
2. **20 个 Vue 3 组件规范**: 包含 Props、Events、使用示例和实现要点
3. **Tailwind CSS 配置**: 完整的 Tailwind 配置文件
4. **组件模板**: Vue 3 组件和页面模板
5. **最佳实践**: 暗色模式、响应式设计、类型安全、可访问性等
6. **常见场景**: 聊天列表、聊天详情、用户设置等页面示例

## 使用方法

### 在 Claude Code 中使用

当你需要:
- 查询设计规范(颜色、字体、间距等)
- 实现 UI 组件
- 生成组件代码
- 验证代码是否符合设计规范
- 配置 Tailwind CSS

只需在对话中提及相关需求,Claude 会自动使用这个 skill。

### 示例

```
用户: "主色调是什么颜色?"
Claude: 会读取 design-system.md 并回答

用户: "帮我实现一个 Button 组件"
Claude: 会读取 components-forms.md 并生成代码

用户: "生成一个聊天列表页面"
Claude: 会读取 usage-guide.md 和相关组件文档并生成代码
```

## 文件结构

```
im-sharp-app-ui/
├── SKILL.md                          # 主文件:概述、快速查找、组件索引
├── references/
│   ├── design-system.md              # 设计系统:颜色、字体、间距等
│   ├── components-nav-layout.md      # 导航和布局组件
│   ├── components-dialogs.md         # 对话框组件
│   ├── components-forms.md           # 表单组件
│   ├── components-data.md            # 数据展示组件
│   ├── components-feedback.md        # 反馈组件
│   └── usage-guide.md                # 使用指南:配置、最佳实践、场景
├── assets/
│   ├── tailwind.config.js            # Tailwind 配置
│   └── templates/
│       ├── component-template.vue    # Vue 3 组件模板
│       └── page-template.vue         # 页面模板
└── README.md                         # 本文件
```

## 组件列表

### 导航和布局 (3)
- BottomNav - 底部导航栏
- Header - 页面头部
- TabBar - 标签栏切换

### 对话框 (4)
- ConfirmationModal - 确认对话框
- SuccessModal - 成功提示对话框
- DropdownMenu - 下拉菜单
- NoticeModal - 公告详情对话框

### 表单 (5)
- Button - 按钮
- Input - 输入框
- Textarea - 文本域
- SearchInput - 搜索输入框
- Toggle - 开关

### 数据展示 (6)
- Avatar - 头像
- Badge - 徽章
- ChatListItem - 聊天列表项
- ContactListItem - 联系人列表项
- MessageBubble - 消息气泡
- NoticeBar - 通知栏

### 反馈 (2)
- LoadingSpinner - 加载动画
- EmojiPicker - 表情选择器

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Tailwind CSS
- Material Symbols 图标

## 设计原则

- 一致性:统一的颜色、字体、间距和圆角规范
- 可复用性:通过 props 和 slots 提供灵活性
- 类型安全:完整的 TypeScript 类型定义
- 可访问性:遵循 ARIA 标准,支持键盘导航
- 响应式:适配不同屏幕尺寸
- 暗色模式:全面支持暗色模式
- 性能优化:避免不必要的重渲染
