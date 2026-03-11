# Design System

## 颜色系统

### 主色调
```css
--color-primary: #ec5b13;        /* 主色调（橙色） - 用于按钮、链接、活动状态 */
--color-danger: #ef4444;          /* 危险色（红色） - 用于删除、警告操作 */
```

**Tailwind 类名:**
- `bg-primary` / `text-primary` / `border-primary`
- `bg-danger` / `text-danger` / `border-danger`

### 背景色
```css
--color-bg-light: #f5f7f8;       /* 浅色背景 - 用于页面背景 */
--color-bg-dark: #0f1923;        /* 深色背景 - 用于暗色模式页面背景 */
--color-bg-white: #ffffff;       /* 白色背景 - 用于卡片、对话框 */
```

**Tailwind 类名:**
- `bg-background-light` / `dark:bg-background-dark`
- `bg-white` / `dark:bg-gray-800`

### 文字颜色
```css
--color-text-primary: #1f2937;   /* 主要文字 - 标题、正文 */
--color-text-secondary: #6b7280; /* 次要文字 - 描述、时间戳 */
--color-text-tertiary: #9ca3af;  /* 三级文字 - 占位符 */
--color-text-white: #ffffff;     /* 白色文字 - 用于深色背景 */
```

**Tailwind 类名:**
- `text-gray-900` / `dark:text-white` (主要文字)
- `text-gray-500` / `dark:text-gray-400` (次要文字)
- `text-gray-400` / `dark:text-gray-500` (三级文字)

### 边框颜色
```css
--color-border-light: #e5e7eb;   /* 浅色边框 */
--color-border-dark: #374151;    /* 深色边框 - 用于暗色模式 */
```

**Tailwind 类名:**
- `border-gray-200` / `dark:border-gray-700`

### 状态颜色
```css
--color-online: #10b981;         /* 在线状态 - 绿色 */
--color-offline: #6b7280;        /* 离线状态 - 灰色 */
--color-success: #10b981;        /* 成功状态 - 绿色 */
--color-warning: #f59e0b;        /* 警告状态 - 黄色 */
```

**Tailwind 类名:**
- `bg-online` / `text-online` (在线)
- `bg-offline` / `text-offline` (离线)
- `bg-green-500` / `text-green-500` (成功)
- `bg-yellow-500` / `text-yellow-500` (警告)

## 字体系统

### 字体族
```css
font-family: 'Public Sans', 'Noto Sans SC', sans-serif;
```

**Tailwind 类名:**
- `font-display`

### 字体大小
```css
--font-size-xs: 0.75rem;    /* 12px - 标签、徽章 */
--font-size-sm: 0.875rem;   /* 14px - 次要文字、描述 */
--font-size-base: 1rem;     /* 16px - 正文、标题 */
--font-size-lg: 1.125rem;   /* 18px - 大标题 */
--font-size-xl: 1.25rem;    /* 20px - 页面标题 */
--font-size-2xl: 1.5rem;    /* 24px - 主标题 */
--font-size-badge: 10px;    /* 10px - 徽章数字 */
```

**Tailwind 类名:**
- `text-xs` (12px)
- `text-sm` (14px)
- `text-base` (16px)
- `text-lg` (18px)
- `text-xl` (20px)
- `text-2xl` (24px)
- `text-badge` (10px)

### 字体粗细
```css
--font-weight-normal: 400;   /* 正常 */
--font-weight-medium: 500;   /* 中等 */
--font-weight-semibold: 600; /* 半粗 */
--font-weight-bold: 700;     /* 粗体 */
```

**Tailwind 类名:**
- `font-normal` (400)
- `font-medium` (500)
- `font-semibold` (600)
- `font-bold` (700)

## 间距系统

### Padding/Margin 规范
```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

**Tailwind 类名:**
- `p-1` / `m-1` (4px)
- `p-2` / `m-2` (8px)
- `p-3` / `m-3` (12px)
- `p-4` / `m-4` (16px)
- `p-6` / `m-6` (24px)
- `p-8` / `m-8` (32px)
- `p-12` / `m-12` (48px)
- `p-16` / `m-16` (64px)

### 常用间距组合
```css
/* 搜索框、列表项 */
padding: 12px 16px;  /* py-3 px-4 */

/* 按钮 */
padding: 8px 16px;   /* py-2 px-4 */

/* 卡片内容 */
padding: 16px 24px;  /* py-4 px-6 */

/* 页面内边距 */
padding: 16px;       /* p-4 */
```

## 圆角系统

```css
--radius-sm: 0.25rem;    /* 4px - 小元素 */
--radius-default: 0.5rem; /* 8px - 默认圆角 */
--radius-lg: 0.5rem;     /* 8px - 大元素 */
--radius-xl: 0.75rem;    /* 12px - 卡片 */
--radius-full: 9999px;   /* 完全圆形 - 头像、徽章 */
```

**使用场景:**
- 按钮、输入框：`rounded-lg` (8px)
- 卡片、对话框：`rounded-xl` (12px)
- 头像、徽章：`rounded-full` (完全圆形)

**Tailwind 类名:**
- `rounded-sm` (4px)
- `rounded` / `rounded-lg` (8px)
- `rounded-xl` (12px)
- `rounded-full` (完全圆形)

## 阴影系统

```css
/* 卡片阴影 */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* 主色调阴影 */
--shadow-primary-20: 0 4px 6px -1px rgb(236 91 19 / 0.2);
--shadow-primary-25: 0 10px 15px -3px rgb(236 91 19 / 0.25);
```

**使用场景:**
- 列表项、小卡片：`shadow-sm`
- 按钮悬停：`shadow-md`
- 对话框、弹窗：`shadow-lg` 或 `shadow-xl`
- 主按钮：`shadow-primary-20`

**Tailwind 类名:**
- `shadow-sm`
- `shadow-md`
- `shadow-lg`
- `shadow-xl`
- `shadow-2xl`
- `shadow-primary-20` (自定义)
- `shadow-primary-25` (自定义)

## 动画系统

### 过渡效果
```css
/* 颜色过渡 */
transition: color 150ms ease-in-out,
            background-color 150ms ease-in-out,
            border-color 150ms ease-in-out;

/* 所有属性过渡 */
transition: all 150ms ease-in-out;

/* 变换过渡 */
transition: transform 200ms ease-in-out;
```

**Tailwind 类名:**
- `transition-colors duration-150`
- `transition-all duration-150`
- `transition-transform duration-200`

### 动画时长
```css
--duration-fast: 150ms;    /* 快速 - 颜色、透明度变化 */
--duration-normal: 200ms;  /* 正常 - 位移、缩放 */
--duration-slow: 300ms;    /* 慢速 - 复杂动画 */
```

**Tailwind 类名:**
- `duration-150` (快速)
- `duration-200` (正常)
- `duration-300` (慢速)

### 常用动画类
```css
/* 旋转动画（加载） */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 淡入效果 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 缩放进入 */
@keyframes zoom-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 从底部滑入 */
@keyframes slide-in-from-bottom {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

**Tailwind 类名:**
- `animate-spin` (旋转)
- `animate-fade-in` (淡入)
- `animate-zoom-in` (缩放进入)
- `animate-slide-in-from-bottom` (从底部滑入)

## 透明度系统

```css
--opacity-0: 0;       /* 完全透明 */
--opacity-40: 0.4;    /* 40% - 遮罩层 */
--opacity-60: 0.6;    /* 60% - 禁用状态 */
--opacity-80: 0.8;    /* 80% - 次要元素 */
--opacity-95: 0.95;   /* 95% - 半透明背景 */
--opacity-100: 1;     /* 完全不透明 */
```

**使用场景:**
- 对话框遮罩：`bg-black/40`
- 半透明背景：`bg-white/95`
- 毛玻璃效果：`backdrop-blur-sm`

**Tailwind 类名:**
- `opacity-0`
- `opacity-40`
- `opacity-60`
- `opacity-80`
- `opacity-95`
- `opacity-100`

## 布局系统

### 视口高度
```css
min-height: 100dvh;  /* 动态视口高度 - 适配移动端地址栏 */
```

**Tailwind 类名:**
- `min-h-screen` (100vh)
- `min-h-dvh` (100dvh, 需要自定义配置)

### 滚动条隐藏
```css
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**Tailwind 类名:**
- `hide-scrollbar` (自定义工具类)

### Z-index 层级
```css
--z-index-base: 0;           /* 基础层 */
--z-index-dropdown: 10;      /* 下拉菜单 */
--z-index-sticky: 20;        /* 固定元素 */
--z-index-modal-backdrop: 40; /* 对话框遮罩 */
--z-index-modal: 50;         /* 对话框 */
--z-index-toast: 60;         /* 提示消息 */
```

**Tailwind 类名:**
- `z-0` (基础层)
- `z-dropdown` (10)
- `z-sticky` (20)
- `z-modal-backdrop` (40)
- `z-modal` (50)
- `z-toast` (60)
