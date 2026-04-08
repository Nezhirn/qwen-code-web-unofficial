# Qwen Agent — Документация

Полная документация веб-интерфейса для Qwen CLI с поддержкой MCP (Model Context Protocol).

---

## Содержание

1. [Обзор](#обзор)
2. [Архитектура](#архитектура)
3. [Технологический стек](#технологический-стек)
4. [Установка](#установка)
5. [Запуск](#запуск)
6. [Структура проекта](#структура-проекта)
7. [Backend](#backend)
   - [server.py](#serverpy)
   - [mcp_tools_server.py](#mcp_tools_serverpy)
   - [system_prompt.py](#system_promptpy)
8. [Frontend](#frontend)
   - [Компоненты](#компоненты)
   - [Утилиты](#утилиты)
   - [Стилизация](#стилизация)
9. [База данных](#база-данных)
10. [WebSocket протокол](#websocket-протокол)
11. [REST API](#rest-api)
12. [MCP Инструменты](#mcp-инструменты)
13. [Безопасность](#безопасность)
14. [Конфигурация](#конфигурация)
15. [Разработка](#разработка)
16. [Troubleshooting](#troubleshooting)

---

## Обзор

**Qwen Agent** — автономный AI-ассистент с веб-интерфейсом для работы с системой, интернетом и долгосрочной памятью. Построен на базе Qwen CLI с поддержкой Model Context Protocol (MCP) для расширения инструментов.

### Ключевые возможности

- **Стриминг ответов в реальном времени** — отображение thinking-блоков и генерации контента через WebSocket
- **Множественные сессии чатов** — управление несколькими диалогами с сохранением истории в SQLite
- **Tool calling loop** — автоматическое выполнение инструментов с циклом обратной связи
- **Подтверждение опасных команд** — интерактивное подтверждение для bash/ssh/file операций
- **Остановка генерации** — возможность остановить выполнение в любой момент
- **Долгосрочная память** — сохранение важной информации между сессиями
- **Кастомные системные промпты** — настройка инструкций для каждой сессии
- **Экспорт сессий** — выгрузка диалога в Markdown файл
- **Режим авто-подтверждения** — отключение ручного подтверждения для доверенных операций

---

## Архитектура

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend (React 19)                      │
│                                                               │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────────────┐ │
│  │ App.tsx  │  │ WebSocket │  │ Компоненты UI               │ │
│  │ State    │◄─┤  Client   │  │ • Sidebar (сессии)          │ │
│  │ Mgmt     │  │  (API)    │  │ • ChatHeader (шапка)        │ │
│  └────┬─────┘  └─────┬─────┘  │ • ChatInput (ввод)          │ │
│       │              │        │ • MessageBubble (сообщения) │ │
│       │              │        │ • StatusBar (статус)        │ │
│       │              │        │ • ConfirmBar (подтвержд.)   │ │
│       │              │        │ • ToolBlock (инструменты)   │ │
│       │              │        │ • ThinkingBlock (мышление)  │ │
│       │              │        │ • SettingsModal (настройки) │ │
│       │              │        │ • EmptyState (пусто)        │ │
│       └──────────────┘        └────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP + WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI + Python)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  server.py — Основной сервер                          │    │
│  │                                                      │    │
│  │  • REST API (сессии, сообщения, промпты, экспорт)    │    │
│  │  • WebSocket API (стриминг, tool calls, confirm)     │    │
│  │  • Qwen CLI Integration (SDK mode, stream-json)      │    │
│  │  • Session Management (SQLite, race condition lock)  │    │
│  │  • Background Tasks (asyncio, graceful shutdown)     │    │
│  │  • Security (rate limiting, size limits, headers)    │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  mcp_tools_server.py — MCP Server                     │    │
│  │                                                      │    │
│  │  • run_bash_command (таймаут 120с)                   │    │
│  │  • run_ssh_command (таймаут 120с)                    │    │
│  │  • write_file (safe directories only)                │    │
│  │  • edit_file (path validation)                       │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  SQLite Database (sessions.db)                        │    │
│  │                                                      │    │
│  │  • sessions (id, user_id, title, prompt, timestamps) │    │
│  │  • messages (role, content, thinking, tool_calls)    │    │
│  │  • memory (key-value для долгосрочной памяти)        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Технологический стек

### Backend
| Пакет | Версия | Назначение |
|-------|--------|------------|
| **FastAPI** | >=0.109.0 | Асинхронный веб-фреймворк |
| **Uvicorn** | >=0.27.0 | ASGI сервер |
| **MCP SDK** | >=1.0.0 | Model Context Protocol |
| **SlowAPI** | >=0.1.9 | Rate limiting |
| **python-dotenv** | >=1.0.0 | Загрузка .env переменных |
| **Authlib** | >=1.3.0 | OAuth поддержка |
| **httpx** | >=0.26.0 | Async HTTP клиент |

### Frontend
| Пакет | Версия | Назначение |
|-------|--------|------------|
| **React** | 19.2.3 | UI библиотека |
| **TypeScript** | 5.9.3 | Типизация |
| **Vite** | 7.2.4 | Сборщик |
| **Tailwind CSS** | 4.1.17 | Утилитарные стили |
| **Framer Motion** | ^12.34.3 | Анимации |
| **Lucide React** | ^0.575.0 | Иконки |
| **Marked** | ^17.0.3 | Markdown парсер |
| **Highlight.js** | ^11.11.1 | Подсветка кода |
| **DOMPurify** | ^3.2.4 | XSS санитизация |

---

## Установка

### Требования
- **Python** 3.10+
- **Node.js** 18+
- **Qwen CLI** (установлен и доступен в PATH)

### 1. Клонирование
```bash
git clone <repository-url>
cd qwen-code-web-unofficial_prod
```

### 2. Backend зависимости
```bash
pip install -r requirements.txt
```

### 3. Frontend зависимости
```bash
cd static
npm install
cd ..
```

### 4. Настройка окружения
Создайте файл `.env` в корне проекта:
```env
# Путь к Qwen CLI (опционально, если не в PATH)
QWEN_PATH=/path/to/qwen

# Python для MCP сервера (опционально)
MCP_PYTHON=/usr/bin/python3
```

---

## Запуск

### Режим разработки

**Terminal 1 — Backend:**
```bash
python server.py
```
Сервер запускается на `http://0.0.0.0:10310`

**Terminal 2 — Frontend:**
```bash
cd static
npm run dev
```
Vite dev server на `http://localhost:5173`

### Продакшен

**Сборка фронтенда:**
```bash
cd static
npm run build
```

**Запуск сервера:**
```bash
python server.py
```

FastAPI раздаёт статические файлы из `static/dist/`. Приложение доступно на `http://0.0.0.0:10310`.

---

## Структура проекта

```
qwen-code-web-unofficial_prod/
│
├── server.py                     # FastAPI + WebSocket + Qwen CLI SDK
├── mcp_tools_server.py           # MCP сервер инструментов
├── system_prompt.py              # Системный промпт по умолчанию
├── requirements.txt              # Python зависимости
├── sessions.db                   # SQLite БД (создаётся авто)
├── server.log                    # Лог сервера
│
└── static/                       # Frontend приложение
    ├── index.html                # HTML шаблон
    ├── package.json              # Node зависимости
    ├── vite.config.ts            # Vite конфигурация
    ├── tsconfig.json             # TypeScript конфигурация
    └── src/
        ├── main.tsx              # Точка входа React
        ├── App.tsx               # Главный компонент
        ├── api.ts                # API функции (REST + WS)
        ├── types.ts              # TypeScript типы
        ├── index.css             # Глобальные стили + Tailwind
        │
        ├── components/
        │   ├── Sidebar.tsx           # Боковая панель сессий
        │   ├── ChatHeader.tsx        # Шапка чата
        │   ├── ChatInput.tsx         # Поле ввода
        │   ├── MessageBubble.tsx     # Компонент сообщения
        │   ├── StatusBar.tsx         # Статусная строка
        │   ├── ConfirmBar.tsx        # Панель подтверждения
        │   ├── SettingsModal.tsx     # Модальное окно настроек
        │   ├── EmptyState.tsx        # Пустое состояние
        │   ├── ThinkingBlock.tsx     # Блок размышлений
        │   └── ToolBlock.tsx         # Блок инструмента
        │
        └── utils/
            ├── cn.ts             # Утилита CSS классов
            └── markdown.ts       # Markdown + Highlight
```

---

## Backend

### server.py

**Основной файл сервера** (~1786 строк). Реализует полный цикл взаимодействия с Qwen CLI.

#### Ключевые компоненты

**1. Qwen CLI SDK Integration**
```python
def run_qwen_cli_sdk(session_id=None, resume_id=None):
    """Запускает qwen CLI в SDK mode (--input-format stream-json --output-format stream-json)"""
```

- `--session-id <uuid>` — создание новой сессии с данным ID
- `--resume <uuid>` — загрузка существующей сессии
- Без параметров — режим без контекста (короткие ID)

**2. Tool Calling Loop (`stream_chat_background`)**
- Инициализация SDK через `control_request.initialize`
- Отправка истории сообщений (user/assistant/tool_call/tool)
- Обработка `control_request.can_use_tool` с подтверждением
- Стриминг thinking/content/tool_use через WebSocket
- Сохранение в БД в правильном порядке

**3. WebSocket Handler (`websocket_endpoint`)**
- Reader task для получения сообщений
- Background task для обработки каждого сообщения
- Race condition prevention через `active_sessions` dict
- Graceful shutdown с отменой задач

**4. Session Management**
- SQLite с WAL mode для производительности
- Функции: create/rename/delete/get sessions
- Messages с пагинацией (limit/offset, max 200)
- Memory: key-value хранение для долгосрочной памяти
- Auto-title: автоматическое название из первого сообщения

**5. Custom System Prompt**
- Каждая сессия может иметь свой промпт
- При наличии кастомного промпта — полная отправка истории вручную
- Fallback на SYSTEM_PROMPT по умолчанию

**6. Security**
- `RequestSizeLimitMiddleware` — лимит 50 MB
- `SecurityHeadersMiddleware` — X-Content-Type-Options, X-Frame-Options, и т.д.
- Rate limiting через SlowAPI (30 req/min на сессии, 10 req/min на создание)

**7. Graceful Shutdown**
- Закрытие MCP сессии
- Остановка всех background tasks
- Корректное завершение qwen процессов

#### Фазы обработки сообщения

| Фаза | Описание | WebSocket статус |
|------|----------|------------------|
| `idle` | Ожидание ввода | connected |
| `waiting` | Ожидание ответа от qwen | — |
| `thinking` | Генерация thinking контента | 🧠 Размышляет |
| `generating` | Генерация ответа | ✏️ Генерирует |
| `tool` | Выполнение инструмента | 🔧 Выполняет |
| `confirming` | Ожидание подтверждения | 🛡️ Ожидает |

#### Обработка `ask_user_question`
Специальный инструмент `ask_user_question` не требует подтверждения. Он форматируется в красивый текст с вариантами ответа и отправляется как обычный content, после чего qwen процесс завершается.

---

### mcp_tools_server.py

**MCP сервер для инструментов** (~170 строк). Использует `FastMCP` для определения инструментов.

#### Инструменты

| Инструмент | Описание | Таймаут | Подтверждение |
|------------|----------|---------|---------------|
| `run_bash_command` | Выполнение bash команды | 120с | ✅ |
| `run_ssh_command` | SSH подключение | 120с | ✅ |
| `write_file` | Запись в файл | — | ✅ |
| `edit_file` | Редактирование файла | — | ✅ |

#### Особенности реализации
- **Process groups** (`os.setsid`) — корректное завершение всей цепочки процессов
- **Thread timer** — надёжный таймаут для subprocess (избежание зависаний)
- **Path validation** — предотвращение path traversal атак
- **Allowed directories** — запись только в безопасные директории:
  - Текущая директория проекта (`Path.cwd()`)
  - `~/projects`
  - `~/workspace`
  - `/tmp`

---

### system_prompt.py

**Системный промпт по умолчанию**. Определяет поведение и инструменты модели.

#### Структура промпта
1. **Инструменты** — перечень всех доступных инструментов
2. **Контекст и память** — инструкция по использованию памяти
3. **Принципы работы**:
   - Действуй, не рассуждай
   - Разбивай сложные задачи
   - Минимум текста, максимум дела
   - Запоминай важное
   - Проверяй результаты
   - Безопасность
4. **Примеры** — хорошие и плохие паттерны поведения
5. **Сервис Qwen-Agent** — информация о проекте

---

## Frontend

### Компоненты

#### App.tsx
**Главный компонент приложения.**

**State management:**
- `sessions` — список сессий
- `currentSession` — текущая сессия
- `messages` — сообщения текущей сессии
- `streaming` — текущий стриминг (thinking, content, tools)
- `phase` — фаза обработки (`idle|waiting|thinking|generating|tool|confirming`)
- `wsStatus` — статус WebSocket (`connected|connecting|reconnecting|disconnected`)
- `confirmRequest` — текущий запрос подтверждения
- `allowAll` — режим авто-подтверждения

**WebSocket логика:**
- Auto-reconnect с exponential backoff (max 5 попыток)
- Игнорирование нормальных кодов закрытия (1000, 1001, 1012, 1013)
- Reconnect только для текущей сессии
- Heartbeat через ping/pong

**Обработка WS сообщений:**
```typescript
case 'thinking':    // Добавление thinking контента
case 'content':     // Добавление основного контента
case 'tool_call':   // Добавление инструмента в список
case 'tool_result': // Обновление результата инструмента
case 'confirm_request': // Показ ConfirmBar
case 'response_end':    // Загрузка сообщений из API
case 'stopped':         // Сброс состояния
```

---

#### Sidebar.tsx
**Боковая панель сессий.**

**Функции:**
- Список сессий с анимациями (Framer Motion)
- Поиск при >3 сессий
- Создание нового чата
- Удаление с анимацией
- Активный индикатор (spring animation)
- Мобильная версия (overlay + slide)

---

#### ChatInput.tsx
**Поле ввода сообщений.**

**Функции:**
- Auto-resize textarea (max 160px)
- Enter — отправка, Shift+Enter — новая строка
- Esc — остановка генерации
- Счётчик символов (>100)
- Динамическая кнопка Send/Stop
- Placeholder меняется в зависимости от состояния

---

#### MessageBubble.tsx
**Компонент сообщения.**

**Props:**
- `role: 'user' | 'assistant'`
- `content: string`
- `thinking?: string`
- `toolCalls?: ToolCall[]`
- `toolResults?: Array<{content, name?, isDenied?}>`
- `isStreaming?: boolean`
- `isStreamingThinking?: boolean`

**Особенности:**
- Markdown рендеринг с Highlight.js подсветкой
- DOMPurify санитизация (XSS prevention)
- Copy button с fallback для старых браузеров
- ThinkingBlock (сворачиваемый)
- ToolBlock для каждого вызова инструмента
- Анимация появления

---

#### StatusBar.tsx
**Статусная строка.**

**Отображает:**
- Текущую фазу с иконкой и анимацией
- Elapsed timer (с точностью до 0.1s)
- WebSocket статус (connected/connecting/reconnecting/disconnected)
- Кнопка Allow All / Control toggle

**Цветовая схема фаз:**
| Фаза | Цвет | Иконка |
|------|------|--------|
| waiting | gray | Loader2 (spin) |
| thinking | warning (#f59e0b) | Brain (pulse) |
| generating | accent (#3b82f6) | Pencil |
| tool | success (#10b981) | Wrench |
| confirming | warning (#f59e0b) | ShieldQuestion |

---

#### ConfirmBar.tsx
**Панель подтверждения опасных команд.**

**Действия:**
- **Разрешить** — выполнить одну команду
- **Разрешить всё** — отключить подтверждения до конца сессии
- **Отклонить** — запретить выполнение

**Отображение:**
- Для bash: `$ {command}`
- Для ssh: `{user}@{host} $ {command}`
- Для остальных: JSON аргументов

---

#### ToolBlock.tsx
**Блок инструмента.**

**Состояния:**
- Running ( Loader2 + pulse animation)
- Success (CheckCircle2 + зелёный)
- Denied (XCircle + красный)

**Отображение аргументов:**
- Bash: `$ {command}`
- SSH: `{user}@{host} $ {command}`
- Memory: `💾 {key}: {value}`
- Todo: список задач с эмодзи статусов

---

#### ThinkingBlock.tsx
**Сворачиваемый блок размышлений.**

**Состояния:**
- Streaming: пульсирующая анимация + border warning
- Completed: статичный вид

---

#### SettingsModal.tsx
**Модальное окно настроек сессии.**

**Возможности:**
- Переименование сессии
- Установка кастомного системного промпта
- Сброс на промпт по умолчанию
- Info box с описанием

---

#### EmptyState.tsx
**Пустое состояние.**

**Варианты:**
1. **Нет сессии** — большой hero с:
   - Анимированной иконкой бота + orbiting particles
   - Aurora background эффектом
   - Feature grid (4 карточки)
   - Hint "Создайте новый чат"

2. **Есть сессия, нет сообщений** — компактный вид:
   - Sparkles иконка с float анимацией
   - "Начните диалог"

---

### Утилиты

#### markdown.ts
**Markdown рендеринг + подсветка кода.**

**Поддерживаемые языки:**
- JavaScript, TypeScript
- Python
- Bash, Shell
- JSON, CSS, HTML/XML
- SQL, YAML
- Markdown, Diff
- Go, Rust

**Особенности:**
- GFM (GitHub Flavored Markdown) с breaks
- Code blocks с Copy button (inline onclick)
- Auto-detection языка при отсутствии указания
- `highlightAll()` — подсветка вставленного HTML

---

#### cn.ts
**Утилита для CSS классов.**
```typescript
cn('class1', 'class2', { active: isActive })
// → объединяет + удаляет дубликаты через tailwind-merge
```

---

### Стилизация

#### index.css
**Tailwind CSS v4 + кастомные темы и анимации.**

**Цветовая палитра:**
```css
--color-bg-primary: #060a13     /* Основной фон */
--color-bg-secondary: #0c1220   /* Карточки */
--color-bg-tertiary: #141d2f    /* Кнопки */
--color-accent: #3b82f6         /* Акцент (синий) */
--color-purple: #a855f7         /* Фиолетовый */
--color-cyan: #06b6d4           /* Голубой */
--color-success: #10b981        /* Зелёный */
--color-warning: #f59e0b        /* Жёлтый */
--color-danger: #ef4444         /* Красный */
```

**Кастомные анимации:**
- `shimmer` — эффект блеска
- `gradient-rotate` — вращение градиента
- `breathing-glow` — пульсирующее свечение
- `aurora` — аврора фон
- `float` — парение
- `ripple` — рябь
- `slide-up-enter` — появление сообщений

**Утилитарные классы:**
- `.glass` — glassmorphism эффект
- `.noise-overlay` — текстура шума
- `.gradient-text-animated` — анимированный градиентный текст
- `.hover-lift` — подъём при наведении
- `.border-gradient` — градиентная рамка
- `.input-glow` — свечение фокуса

---

## База данных

### Схема

#### Таблица `sessions`
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | TEXT PRIMARY KEY | UUID сессии |
| `user_id` | TEXT | ID пользователя (NULL для анонимных) |
| `title` | TEXT NOT NULL | Название чата |
| `created_at` | TEXT NOT NULL | Дата создания (ISO 8601) |
| `updated_at` | TEXT NOT NULL | Дата обновления (ISO 8601) |
| `system_prompt` | TEXT | Кастомный промпт (NULL = default) |

**Индексы:**
- `idx_sessions_user_id` — фильтра по user_id

#### Таблица `messages`
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | AUTOINCREMENT |
| `session_id` | TEXT NOT NULL | FK → sessions.id |
| `role` | TEXT NOT NULL | user/assistant/assistant_tool_call/tool |
| `content` | TEXT NOT NULL | Содержание сообщения |
| `thinking` | TEXT | Thinking блок (NULL если нет) |
| `tool_calls` | TEXT | JSON массив вызовов инструментов |
| `tool_name` | TEXT | Название инструмента (для role=tool) |
| `created_at` | TEXT NOT NULL | Дата создания (ISO 8601) |

**Индексы:**
- `idx_messages_session_id` — фильтра по сессии

#### Таблица `memory`
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | INTEGER PRIMARY KEY | AUTOINCREMENT |
| `session_id` | TEXT NOT NULL | FK → sessions.id |
| `key` | TEXT NOT NULL | Ключ факта |
| `value` | TEXT NOT NULL | Значение факта |
| `created_at` | TEXT NOT NULL | Дата создания (ISO 8601) |

**Constraints:**
- `UNIQUE(session_id, key)` — один ключ на сессию
- При дубликате — UPDATE значения

**Индексы:**
- `idx_memory_session_id` — фильтра по сессии

### Настройки SQLite
```sql
PRAGMA journal_mode=WAL        -- Write-Ahead Logging для конкурентного доступа
PRAGMA busy_timeout=5000       -- Ожидание блокировки 5 секунд
PRAGMA foreign_keys=ON         -- Внешние ключи
```

---

## WebSocket протокол

### Подключение
```
ws://host:port/ws/{session_id}
```

### Клиент → Сервер

#### `message`
Отправить сообщение ассистенту.
```json
{ "type": "message", "content": "Текст сообщения" }
```

#### `stop`
Остановить генерацию.
```json
{ "type": "stop" }
```

#### `confirm_response`
Ответ на подтверждение инструмента.
```json
{ "type": "confirm_response", "action": "allow" }
```
**Action:** `allow` | `deny` | `allow_all`

#### `set_allow_all`
Включить/выключить авто-подтверждение.
```json
{ "type": "set_allow_all", "value": true }
```

### Сервер → Клиент

| Тип | Описание | Поля |
|-----|----------|------|
| `response_start` | Начало обработки | — |
| `stream_start` | Начало стриминга | — |
| `thinking` | Thinking контент | `content: string` |
| `content` | Основной контент | `content: string` |
| `tool_call` | Вызов инструмента | `name: string`, `args: object` |
| `tool_result` | Результат инструмента | `name: string`, `content: string` |
| `tool_denied` | Инструмент запрещён | `name: string` |
| `confirm_request` | Запрос подтверждения | `name: string`, `args: object` |
| `response_end` | Ответ завершён | — |
| `stopped` | Генерация остановлена | — |
| `error` | Ошибка | `content: string` |
| `session_renamed` | Сессия переименована | `id`, `title` |
| `allow_all_enabled` | Авто-подтверждение включено | — |
| `allow_all_changed` | Статус авто-подтверждения | `value: boolean` |
| `ping` | Heartbeat | — |

### Flow обработки сообщения

```
1. Клиент отправляет {type: "message", content: "..."}
2. Сервер создаёт background task
3. Сервер отправляет: response_start → stream_start
4. Цикл обработки:
   - thinking: стриминг thinking контента
   - content: стриминг основного ответа
   - tool_call: вызов инструмента
   - tool_result: результат инструмента
   - confirm_request: запрос подтверждения → ждёт confirm_response
5. Завершение: stream_end → response_end
6. Клиент загружает сообщения из API
```

---

## REST API

### Базовый URL
```
http://host:port/api
```

### Sessions

#### GET /api/sessions
Получить все сессии.
```json
[{ "id": "uuid", "title": "Чат", "created_at": "...", "updated_at": "...", "user_id": null, "system_prompt": null }]
```

#### POST /api/sessions
Создать сессию.
```json
// Request: { "title": "Новый чат" }
// Response: { "id": "uuid", "title": "Новый чат", ... }
```

#### PUT /api/sessions/{sid}
Переименовать сессию.
```json
// Request: { "title": "Новое название" }
// Response: { "ok": true }
```

#### DELETE /api/sessions/{sid}
Удалить сессию + сообщения + память.
```json
// Response: { "ok": true }
```

### Messages

#### GET /api/sessions/{sid}/messages
Получить сообщения с пагинацией.
```
?limit=50&offset=0
```
```json
{
  "messages": [...],
  "total": 120,
  "limit": 50,
  "offset": 0
}
```

### System Prompt

#### GET /api/default-prompt
Получить промпт по умолчанию.
```json
{ "default_prompt": "Ты — Qwen Agent..." }
```

#### GET /api/sessions/{sid}/system-prompt
Получить промпт сессии.
```json
{ "system_prompt": "Кастомный промпт...", "default_prompt": "..." }
```

#### PUT /api/sessions/{sid}/system-prompt
Установить промпт сессии.
```json
// Request: { "system_prompt": "..." } или { "system_prompt": null } для сброса
// Response: { "ok": true, "system_prompt": "..." }
```

### Export

#### GET /api/sessions/{sid}/export
Экспорт в Markdown.
```
// Response: File download (chat_{sid[:8]}.md)
```

### Health

#### GET /api/health
Проверка работоспособности.
```json
{ "status": "ok", "database": true, "version": "1.0.0" }
```

---

## MCP Инструменты

### run_bash_command
```python
def run_bash_command(command: str) -> str
```
- **Таймаут:** 120 секунд
- **Подтверждение:** Требуется
- **Output:** stdout + stderr (max 8000 символов)
- **Process group:** `os.setsid` + `os.killpg` для завершения

### run_ssh_command
```python
def run_ssh_command(host: str, command: str, user: str = "root") -> str
```
- **Таймаут:** 120 секунд
- **Подтверждение:** Требуется
- **Требует:** SSH ключ `~/.ssh/id_ed25519`
- **SSH опции:** `StrictHostKeyChecking=accept-new`, `ConnectTimeout=10`

### write_file
```python
def write_file(path: str, content: str) -> str
```
- **Подтверждение:** Требуется
- **Safe dirs:** cwd, ~/projects, ~/workspace, /tmp
- **Path validation:** `Path.resolve()` + `is_relative_to()`

### edit_file
```python
def edit_file(path: str, old_string: str, new_string: str) -> str
```
- **Подтверждение:** Требуется
- **Safe dirs:** cwd, ~/projects, ~/workspace
- **Заменяет:** Только первое вхождение

### Memory инструменты (из Qwen CLI)

#### save_memory
```python
save_memory(fact: str, scope: str)  # scope: "global" | "project"
```
Сохраняет факт в БД (key-value). При дубликате ключа — обновляет значение.

#### read_memory
Читает все записи памяти для текущей сессии.

#### delete_memory
Удаляет запись по ключу.

---

## Безопасность

### Rate Limiting
| Endpoint | Лимит |
|----------|-------|
| GET /api/sessions | 30 req/min |
| POST /api/sessions | 10 req/min |
| DELETE /api/sessions/{sid} | 20 req/min |

### Request Size
- **Max:** 50 MB
- **Middleware:** `RequestSizeLimitMiddleware` (ASGI)

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Tool Confirmation
**Инструменты требующие подтверждения:**
- `run_bash_command`, `bash`, `shell`, `run_shell_command`
- `run_ssh_command`, `ssh`, `remote_command`
- `write_file`, `create_file`
- `edit_file`, `replace_in_file`

### Timeouts
| Операция | Таймаут |
|----------|---------|
| Создание MCP сессии | 30 сек |
| MCP tool вызов | 180 сек |
| Bash команда | 120 сек |
| SSH команда | 120 сек |
| Ожидание подтверждения | 300 сек |
| Чтение от qwen процесса | 300 сек |
| Ожидание init response | 30 сек |

### Path Validation
- **Path traversal prevention:** `Path.resolve()`
- **Allowed directories:** cwd, ~/projects, ~/workspace, /tmp
- **File write:** проверка `is_relative_to()` для каждого root

### XSS Protection
- **DOMPurify** санитизация на фронтеде
- **Allowed tags:** p, br, strong, code, pre, h1-h6, table, и т.д.
- **Allowed attrs:** href, src, alt, class, id, target

### Process Isolation
- **Process groups:** `os.setsid` + `os.killpg`
- **SIGTERM → wait 5s → SIGKILL** для гарантированного завершения
- **Graceful shutdown** в lifespan обработчике

---

## Конфигурация

### Переменные окружения (.env)
| Переменная | Описание | Default |
|------------|----------|---------|
| `QWEN_PATH` | Путь к qwen CLI | Ищет в PATH |
| `MCP_PYTHON` | Python для MCP сервера | `sys.executable` |

### Константы в коде
| Константа | Файл | Значение |
|-----------|------|----------|
| `DB_PATH` | server.py | `sessions.db` |
| `MAX_REQUEST_SIZE` | server.py | 50 MB |
| `MAX_TOPICS` | server.py | 20 (авто-темы) |
| `TOOL_EXECUTION_TIMEOUT` | server.py | 180 сек (bash) |

### Server Configuration
```python
uvicorn.run("server:app", host="0.0.0.0", port=10310, reload=False, log_level="info")
```

---

## Разработка

### Добавление MCP инструмента

**1. Добавьте функцию в `mcp_tools_server.py`:**
```python
@mcp.tool()
def my_new_tool(param1: str, param2: int = 10) -> str:
    """Описание инструмента для модели."""
    try:
        # Реализация
        return f"Результат: {result}"
    except Exception as e:
        return f"Error: {str(e)}"
```

**2. Если требует подтверждения, добавьте в `server.py`:**
```python
TOOLS_REQUIRING_CONFIRMATION = {
    ...,
    "my_new_tool"
}
```

**3. Если bash-подобный таймаут, добавьте в `BASH_TOOLS`:**
```python
BASH_TOOLS = {..., "my_new_tool"}
```

### Кастомизация системного промпта

**Вариант 1:** Редактирование `system_prompt.py`
```python
SYSTEM_PROMPT = """Ваш промпт..."""
```

**Вариант 2:** Через UI (SettingsModal)
- Откройте настройки сессии
- Введите промпт
- Сохраните

**Вариант 3:** Через API
```bash
curl -X PUT http://localhost:10310/api/sessions/{sid}/system-prompt \
  -H "Content-Type: application/json" \
  -d '{"system_prompt": "Ваш промпт..."}'
```

### Добавление нового WS сообщения

**1. Сервер (server.py):**
```python
await _safe_send(ws, {"type": "my_custom_event", "data": {...}})
```

**2. Клиент (App.tsx):**
```typescript
case 'my_custom_event':
  // Обработка
  break;
```

### Добавление нового компонента

```bash
# Создайте файл
touch static/src/components/MyComponent.tsx

# Импортируйте в App.tsx
import MyComponent from './components/MyComponent';

# Используйте
<MyComponent prop={value} />
```

---

## Troubleshooting

### Qwen CLI не найден
```bash
# Проверьте установку
which qwen

# Или укажите путь в .env
echo "QWEN_PATH=/path/to/qwen" >> .env
```

### MCP сервер не запускается
```bash
# Проверьте зависимости
pip install -r requirements.txt

# Проверьте логи
tail -f server.log

# Тест MCP сервера вручную
python mcp_tools_server.py
```

### WebSocket не подключается
1. Убедитесь что сервер запущен
2. Проверьте CORS в `server.py` (`allow_origins=["*"]`)
3. Откройте DevTools Console для ошибок
4. Проверьте `wsStatus` в состоянии App

### База данных заблокирована
```bash
# Остановите сервер
# Удалите WAL файлы (если нет активных запросов)
rm -f sessions.db-wal sessions.db-shm

# Перезапустите сервер — SQLite пересоздаст их
```

### Зависание bash команды
- **Причина:** Команда ожидает ввод или работает бесконечно
- **Решение:** MCP сервер убьёт процесс через 120 сек через `os.killpg`
- **Debug:** Проверьте `server.log` для таймаутов

### Процессы qwen не завершаются
```bash
# Проверьте активные процессы
ps aux | grep qwen

# Graceful shutdown через Ctrl+C (сервер обработает)
# Или принудительно
pkill -f "qwen --input-format stream-json"
```

### Фронтенд не видит backend
- **Dev mode:** Vite проксирует API запросы (проверьте `vite.config.ts`)
- **Prod mode:** FastAPI раздаёт статику из `static/dist/`
- **CORS:** Проверьте `CORSMiddleware` настройки

### Ошибка `session_id` слишком короткий
- **Причина:** Старые сессии с короткими ID
- **Решение:** Создайте новую сессию — UUID будет 36 символов
- **Логика:** `len(session_id) == 36 and session_id.count('-') == 4`

---

## Планы развития

- [ ] OAuth авторизация и мультипользовательский режим
- [ ] Импорт сессий из JSON/Markdown
- [ ] Голосовой ввод (Web Speech API)
- [ ] Поддержка нескольких моделей
- [ ] Расширенные горячие клавиши
- [ ] Светлая тема
- [ ] Улучшенная мобильная адаптация
- [ ] PWA поддержка
- [ ] Уведомления о завершении генерации
- [ ] Drag & drop файлов
- [ ] Поиск по сообщениям
- [ ] Теги для сессий
