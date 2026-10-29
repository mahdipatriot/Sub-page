# PasarGuard 模板

适用于 PasarGuard 的现代化响应式用户仪表板模板，支持多语言（英语、波斯语、中文、俄语）。

<p align="center">
  <img src="https://raw.githubusercontent.com/PasarGuard/subscription-template/refs/heads/main/screenshots/en.png" alt="英文界面" width="40%">
  <img src="https://raw.githubusercontent.com/PasarGuard/subscription-template/refs/heads/main/screenshots/fa.png" alt="波斯语界面" width="30%">
</p>

使用 React 18 + TypeScript + Vite 构建，具有实时数据更新、QR 码生成、流量使用图表和美观的 UI 组件。

## ✨ 功能

- 🌍 多语言支持（EN, FA, ZH, RU）- 用户可在界面中更改语言
- 📱 完全响应式设计（移动优先，Telegram webview 原生）
- 🎨 支持深色模式的现代 UI（浅色/深色/系统）
- 🔄 实时数据更新（SWR，10 秒间隔）
- 📊 流量使用图表，支持时间范围选择（Recharts）
- 🔗 连接链接，支持复制到剪贴板和 QR 码弹窗
- 📱 突出显示的订阅链接，支持 QR 码生成
- 🔔 公告横幅（支持纯文本、URL 编码和 base64 编码消息）
- 🟢 在线状态徽章，显示最后在线时间
- 📋 一键复制到剪贴板
- 📱 平台特定的应用下载链接（Windows、macOS、Linux、Android、iOS）
- ⚡ 快速轻量（Vite 单文件构建）
- 🎯 主题切换（浅色/深色/系统）

---

## 📦 安装

**1. 下载模板**

每个版本都包含带语言前缀的默认版本。默认版本使用波斯语（fa）作为默认语言。用户可以在界面中更改语言，但您可以设置不同的默认语言：

```sh
# 下载默认版本（波斯语默认）
sudo wget -N -O /var/lib/pasarguard/templates/subscription/index.html https://github.com/PasarGuard/subscription-template/releases/latest/download/index.html

# 或下载特定默认语言（en, fa, zh, ru）
sudo wget -N -O /var/lib/pasarguard/templates/subscription/index.html https://github.com/PasarGuard/subscription-template/releases/latest/download/zh.html
```

**2. 配置 PasarGuard**

```sh
echo 'CUSTOM_TEMPLATES_DIRECTORY="/var/lib/pasarguard/templates/"' | sudo tee -a /opt/pasarguard/.env
echo 'SUBSCRIPTION_PAGE_TEMPLATE="subscription/index.html"' | sudo tee -a /opt/pasarguard/.env
```

或手动编辑 `/opt/pasarguard/.env` 并取消注释：
```
CUSTOM_TEMPLATES_DIRECTORY="/var/lib/pasarguard/templates/"
SUBSCRIPTION_PAGE_TEMPLATE="subscription/index.html"
```

**3. 重启 PasarGuard**

```sh
pasarguard restart
```

