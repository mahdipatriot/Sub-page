# Шаблон PasarGuard

Современный адаптивный шаблон пользовательской панели для PasarGuard с поддержкой нескольких языков (английский, персидский, китайский, русский).

<p align="center">
  <img src="https://raw.githubusercontent.com/PasarGuard/subscription-template/refs/heads/main/screenshots/en.png" alt="Английский интерфейс" width="40%">
  <img src="https://raw.githubusercontent.com/PasarGuard/subscription-template/refs/heads/main/screenshots/fa.png" alt="Персидский интерфейс" width="30%">
</p>

Построен на React 18 + TypeScript + Vite, с функциями обновления данных в реальном времени, генерации QR-кодов, графиков использования трафика и красивыми компонентами интерфейса.

## ✨ Возможности

- 🌍 Поддержка нескольких языков (EN, FA, ZH, RU) - пользователи могут изменить язык в интерфейсе
- 📱 Полностью адаптивный дизайн (мобильный-first, нативный для Telegram webview)
- 🎨 Современный интерфейс с поддержкой тёмной темы (светлая/тёмная/системная)
- 🔄 Обновление данных в реальном времени (SWR, интервал 10 секунд)
- 📊 Графики использования трафика с выбором временного диапазона (Recharts)
- 🔗 Ссылки подключения с копированием в буфер обмена и QR-код модальным окном
- 📱 Выделенная ссылка подписки с генерацией QR-кода
- 🔔 Баннер объявлений (поддержка простого текста, URL-кодирования и base64)
- 🟢 Индикатор онлайн-статуса с отображением времени последнего подключения
- 📋 Одним кликом копирование в буфер обмена
- 📱 Ссылки на скачивание приложений для конкретных платформ (Windows, macOS, Linux, Android, iOS)
- ⚡ Быстрый и лёгкий (однофайловая сборка Vite)
- 🎯 Переключение темы (светлая/тёмная/системная)

---

## 📦 Установка

**1. Загрузите шаблон**

Каждый релиз включает версии по умолчанию с языковыми префиксами. Версия по умолчанию использует персидский (fa) в качестве языка по умолчанию. Пользователи могут изменить язык в интерфейсе, но вы можете установить другой язык по умолчанию:

```sh
# Загрузить версию по умолчанию (персидский по умолчанию)
sudo wget -N -O /var/lib/pasarguard/templates/subscription/index.html https://github.com/PasarGuard/subscription-template/releases/latest/download/index.html

# Или загрузить конкретный язык по умолчанию (en, fa, zh, ru)
sudo wget -N -O /var/lib/pasarguard/templates/subscription/index.html https://github.com/PasarGuard/subscription-template/releases/latest/download/ru.html
```

**2. Настройте PasarGuard**

```sh
echo 'CUSTOM_TEMPLATES_DIRECTORY="/var/lib/pasarguard/templates/"' | sudo tee -a /opt/pasarguard/.env
echo 'SUBSCRIPTION_PAGE_TEMPLATE="subscription/index.html"' | sudo tee -a /opt/pasarguard/.env
```

Или вручную отредактируйте `/opt/pasarguard/.env` и раскомментируйте:
```
CUSTOM_TEMPLATES_DIRECTORY="/var/lib/pasarguard/templates/"
SUBSCRIPTION_PAGE_TEMPLATE="subscription/index.html"
```

**3. Перезапустите PasarGuard**

```sh
pasarguard restart
```

