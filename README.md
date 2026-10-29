# PasarGuard Template

A modern, responsive user dashboard template for PasarGuard with multi-language support (English, Persian, Chinese, Russian).

<p align="center">
  <img src="https://raw.githubusercontent.com/PasarGuard/subscription-template/refs/heads/main/screenshots/en.png" alt="English UI" width="40%">
  <img src="https://raw.githubusercontent.com/PasarGuard/subscription-template/refs/heads/main/screenshots/fa.png" alt="Persian UI" width="30%">
</p>

Built with React 18 + TypeScript + Vite, featuring real-time data updates, QR code generation, traffic usage charts, and beautiful UI components.

## ✨ Features

- 🌍 Multi-language support (EN, FA, ZH, RU) — users can change language in the UI
- 📱 Fully responsive design (mobile-first, Telegram webview-native)
- 🎨 Modern UI with dark mode support (light/dark/system)
- 🔄 Real-time data updates (SWR with 10s interval)
- 📊 Traffic usage charts with time range selection (Recharts)
- 🔗 Connection links with copy-to-clipboard and QR code modal
- 📱 Prominent subscription link with QR code generation
- 🔔 Announcement banner (supports plain text, URL-encoded, and base64-encoded messages)
- 🟢 Online status badge with last-online time display
- 📋 One-click copy to clipboard
- 📱 Platform-specific app download links (Windows, macOS, Linux, Android, iOS)
- ⚡ Fast and lightweight (Vite single-file build)
- 🎯 Theme toggle (light/dark/system)

---

## 📦 Installation

**1. Download the template**

Each release includes language-prefixed fallback versions. The default version uses Persian (fa) as the fallback language. Users can change their language in the UI, but you can set a different fallback:

```sh
# Download default version (Persian fallback)
sudo wget -N -O /var/lib/pasarguard/templates/subscription/index.html https://github.com/PasarGuard/subscription-template/releases/latest/download/index.html

# Or download a specific fallback language (en, fa, zh, ru)
sudo wget -N -O /var/lib/pasarguard/templates/subscription/index.html https://github.com/PasarGuard/subscription-template/releases/latest/download/en.html
```

**2. Configure PasarGuard**

```sh
echo 'CUSTOM_TEMPLATES_DIRECTORY="/var/lib/pasarguard/templates/"' | sudo tee -a /opt/pasarguard/.env
echo 'SUBSCRIPTION_PAGE_TEMPLATE="subscription/index.html"' | sudo tee -a /opt/pasarguard/.env
```

Or manually edit `/opt/pasarguard/.env` and uncomment:
```
CUSTOM_TEMPLATES_DIRECTORY="/var/lib/pasarguard/templates/"
SUBSCRIPTION_PAGE_TEMPLATE="subscription/index.html"
```

**3. Restart PasarGuard**

```sh
pasarguard restart
```

---

## 🛠️ Development

```sh
npm install
npm run dev      # Start dev server
npm run build    # Production build (single-file output)
npm run preview  # Preview production build
```

### Tech Stack

- **Framework**: React 18, TypeScript, Vite 7
- **Styling**: TailwindCSS 4, tw-animate-css
- **UI**: Radix UI (accordion, dialog, dropdown-menu, select, separator, slot)
- **Charts**: Recharts 2.15
- **QR Codes**: qrcode.react 4.0
- **Data fetching**: SWR 2.3
- **i18n**: i18next 25 + react-i18next 16 + browser language detector + http backend
- **Theming**: next-themes
- **Notifications**: Sonner
- **Icons**: lucide-react, react-icons
- **Dates**: dayjs
- **Build**: vite-plugin-singlefile (single HTML file output)

### Project Structure

```
subscription-template/
├── src/
│   ├── App.tsx                    # Main dashboard (user info, status, charts, links, apps, announcements)
│   ├── main.tsx                   # Entry point (ThemeProvider + Toaster)
│   ├── components/
│   │   ├── AppsList.tsx           # Platform-specific app download links
│   │   ├── connection-links.tsx   # Connection links with copy + QR modal
│   │   ├── prominent-subscription-link.tsx  # Main subscription URL with QR
│   │   ├── qr-modal.tsx           # QR code modal dialog
│   │   ├── traffic-chart.tsx      # Traffic usage chart (Recharts)
│   │   ├── theme-toggle.tsx       # Light/dark/system toggle
│   │   ├── language-switcher.tsx  # EN/FA/ZH/RU dropdown
│   │   ├── online-badge.tsx       # Online status indicator
│   │   ├── layout/                # Layout wrapper + footer
│   │   └── ui/                    # Radix UI primitives (button, card, dialog, etc.)
│   ├── hooks/                     # SWR data hooks, language, direction
│   ├── lib/                       # Date formatting utilities
│   └── constants/                 # Project constants (renew/edit base URLs)
├── public/                        # Static assets
└── package.json
```

---

## 📖 Other Languages

- [فارسی (Persian)](README.fa.md)
- [中文 (Chinese)](README.zh.md)
- [Русский (Russian)](README.ru.md)
