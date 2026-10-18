# BiliBili 视频下载工具

> 提取 B 站视频直链的网页工具 · ZIUI Tech

一个基于 Web 的 BiliBili 视频下载工具，可以快速提取 B 站视频的播放直链，支持分P视频选择，完全在本地浏览器运行，无需后端服务。

![BiliBili Downloader](https://img.shields.io/badge/BiliBili-下载工具-ff69b4?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/status-active-success?style=flat-square)

## ✨ 特性

- 🎬 **快速提取** - 从 B 站链接中提取 BV 码和视频直链
- 📺 **分P支持** - 自动识别分P视频的编号
- 🎨 **双模式** - 简易模式和高级模式，满足不同需求
- 🔧 **自定义API** - 支持配置自定义 API 服务
- 🌓 **主题切换** - 亮色/暗色主题自动切换
- 📱 **响应式设计** - 完美适配 PC 和移动设备
- 🔒 **隐私安全** - 所有操作在本地完成，不上传任何数据
- 🎯 **一键下载** - 提取后可直接点击下载按钮

## 🚀 使用方法

### 在线访问

访问 [https://ziui1008.top/bilibili-downloader/bilibili-downloader.html](https://ziui1008.top/bilibili-downloader/bilibili-downloader.html)

### 本地部署

1. 克隆或下载本项目
2. 在浏览器中打开 `bilibili-downloader.html`
3. 无需任何依赖或构建步骤

## 📖 使用教程

### 简易模式

1. 复制 B 站视频链接
2. 点击"粘贴链接"按钮或手动粘贴链接
3. 点击"提取视频链接"按钮
4. 在结果中点击"点击下载"或"复制链接"

### 高级模式

1. 输入 B 站视频链接
2. 选择 API 服务（默认或自定义）
3. 如选择自定义，填写 API 前缀
4. 点击"提取视频信息"
5. 获取结果并下载

### 支持的链接格式

```
https://www.bilibili.com/video/BV1GpcQzpEa9/
https://www.bilibili.com/video/BV1GpcQzpEa9/?p=2
https://b23.tv/xxxxxx
```

## 🔧 技术实现

### 提取原理

1. **BV 码提取** - 使用正则表达式 `BV[a-zA-Z0-9]{10}` 提取视频 BV 码
2. **分P识别** - 通过 `p=(\d+)` 识别分P编号
3. **链接生成** - 组合 API 前缀 + BV 码 + 分P参数生成播放链接

### 技术栈

- **纯前端实现** - HTML5 + CSS3 + Vanilla JavaScript
- **零依赖** - 无需任何第三方库
- **响应式布局** - CSS Grid + Flexbox
- **现代 API** - Clipboard API, Local Storage

### 设计系统

遵循 **ZIUI Tech** 设计规范：
- 色彩：四色标志系统（蓝、粉、青、黄）
- 排版：SF Pro Text 系统字体栈
- 间距：8px 基础网格系统
- 圆角：12-28px 多级圆角
- 阴影：分层毛玻璃效果

## 📂 文件结构

```
bilibili-downloader/
└── bilibili-downloader.html  # 主文件（包含所有样式和脚本）
```

单文件设计，方便部署和分享。

## 🎨 设计特点

- **优雅背景** - 清淡的径向渐变科技感背景
- **毛玻璃效果** - 顶栏和卡片使用 backdrop-filter
- **流畅动画** - 180ms 标准过渡动画
- **交互反馈** - Toast 提示、按钮状态、加载动画

## 🔗 相关链接

- **ZIUI Tech 主页**: [https://ziui1008.top](https://ziui1008.top)
- **原始项目**: [pc-tool by cuteFishovo](https://github.com/cuteFishovo/pc-tool)

## 📝 开发说明

### 修改样式

CSS 变量定义在 `:root` 和 `:root[data-theme="dark"]` 中，可以轻松自定义配色：

```css
:root {
  --bg: #f5f5f7;
  --panel: #fff;
  --action: #0066cc;
  --blue: #b3e0ff;
  --pink: #ffb3d9;
  /* ... */
}
```

### 修改 API

在简易模式中，默认 API 定义在代码中：

```javascript
const apiUrl = 'http://ckapi.sevenbrothers.cn/bili/api?id=';
```

高级模式允许用户自定义 API 服务。

### 添加新功能

所有代码都在单个 HTML 文件中：
- **样式** - `<style>` 标签内
- **脚本** - `<script>` 标签内
- **结构** - HTML body 部分

## ⚠️ 注意事项

1. **API 可用性** - 默认 API 由第三方提供，可能会失效
2. **视频来源** - 仅用于个人学习研究，请勿用于商业用途
3. **版权声明** - 下载的视频版权归原作者所有
4. **浏览器兼容** - 需要支持现代浏览器特性（ES6+, Clipboard API）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 反馈问题

如果遇到问题，请提供：
- 浏览器版本
- B 站链接示例
- 错误截图或描述

## 📄 许可证

MIT License

原始项目基于 [pc-tool](https://github.com/cuteFishovo/pc-tool)  
ZIUI Tech 版本由 ZIUI Tech 工作室维护

---

**ZIUI Tech** - 独立数字工作室  
把想法，拼成作品。

© 2026 ZIUI Tech. All rights reserved.
