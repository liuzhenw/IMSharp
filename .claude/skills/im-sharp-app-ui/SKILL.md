---
name: im-sharp-app-ui
description: IM Sharp App UI design system and Vue 3 component specifications. Use when (1) implementing UI components for im-sharp-app, (2) checking design tokens (colors, fonts, spacing), (3) generating component code, (4) validating UI consistency with design system, (5) working with Vue 3 + Tailwind CSS + TypeScript components.
---

# IM Sharp App UI Skill

这是 IM Sharp App 的 UI 设计系统和组件库规范 skill,帮助开发团队快速实现符合设计规范的 Vue 3 组件。

## 快速查找

根据你的需求,查看对应的文档:

| 需求 | 文档 |
|------|------|
| 查询颜色、字体、间距等设计 token | `references/design-system.md` |
| 实现导航和布局组件 (BottomNav, Header, TabBar) | `references/components-nav-layout.md` |
| 实现对话框组件 (ConfirmationModal, SuccessModal, DropdownMenu, NoticeModal) | `references/components-dialogs.md` |
| 实现表单组件 (Button, Input, Textarea, SearchInput, Toggle) | `references/components-forms.md` |
| 实现数据展示组件 (Avatar, Badge, ChatListItem, ContactListItem, MessageBubble, NoticeBar) | `references/components-data.md` |
| 实现反馈组件 (LoadingSpinner, EmojiPicker) | `references/components-feedback.md` |
| 配置项目和最佳实践 | `references/usage-guide.md` |
| Tailwind CSS 配置 | `assets/tailwind.config.js` |
| Vue 3 组件模板 | `assets/templates/component-template.vue` |
| 页面模板 | `assets/templates/page-template.vue` |

## 工作流程决策树

```
用户请求 → 判断类型：
├─ 查询设计规范（颜色/字体/间距）
│  └─ 读取 references/design-system.md
│
├─ 实现组件
│  ├─ 导航/布局 → references/components-nav-layout.md
│  ├─ 对话框 → references/components-dialogs.md
│  ├─ 表单 → references/components-forms.md
│  ├─ 数据展示 → references/components-data.md
│  └─ 反馈 → references/components-feedback.md
│
├─ 生成组件代码
│  ├─ 读取 assets/templates/component-template.vue
│  └─ 读取对应组件规范
│
├─ 验证一致性
│  ├─ 读取 references/design-system.md
│  └─ 检查代码是否符合规范
│
└─ 配置项目
   ├─ 读取 references/usage-guide.md
   └─ 读取 assets/tailwind.config.js
```

## 组件索引

| 组件 | 类型 | 文档位置 |
|------|------|----------|
| BottomNav | 导航和布局 | components-nav-layout.md |
| Header | 导航和布局 | components-nav-layout.md |
| TabBar | 导航和布局 | components-nav-layout.md |
| ConfirmationModal | 对话框 | components-dialogs.md |
| SuccessModal | 对话框 | components-dialogs.md |
| DropdownMenu | 对话框 | components-dialogs.md |
| NoticeModal | 对话框 | components-dialogs.md |
| Button | 表单 | components-forms.md |
| Input | 表单 | components-forms.md |
| Textarea | 表单 | components-forms.md |
| SearchInput | 表单 | components-forms.md |
| Toggle | 表单 | components-forms.md |
| Avatar | 数据展示 | components-data.md |
| Badge | 数据展示 | components-data.md |
| ChatListItem | 数据展示 | components-data.md |
| ContactListItem | 数据展示 | components-data.md |
| MessageBubble | 数据展示 | components-data.md |
| NoticeBar | 数据展示 | components-data.md |
| LoadingSpinner | 反馈 | components-feedback.md |
| EmojiPicker | 反馈 | components-feedback.md |

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Tailwind CSS
- Material Symbols 图标

## 设计原则

- **一致性**: 统一的颜色、字体、间距和圆角规范
- **可复用性**: 通过 props 和 slots 提供灵活性
- **类型安全**: 完整的 TypeScript 类型定义
- **可访问性**: 遵循 ARIA 标准,支持键盘导航
- **响应式**: 适配不同屏幕尺寸
- **暗色模式**: 全面支持暗色模式
- **性能优化**: 避免不必要的重渲染
