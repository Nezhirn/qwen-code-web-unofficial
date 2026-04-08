# Qwen Agent — Веб-интерфейс для Qwen CLI с MCP

Автономный AI-ассистент с веб-интерфейсом для работы с системой, интернетом и памятью. Построен на базе Qwen CLI с поддержкой Model Context Protocol (MCP) для расширения инструментов.

## 🚀 Возможности

### Основной функционал
- **Стриминг ответов в реальном времени** — отображение thinking-блоков и генерации контента
- **Множественные сессии чатов** — управление несколькими диалогами с сохранением истории
- **Tool calling loop** — автоматическое выполнение инструментов с циклом обратной связи
- **Подтверждение опасных команд** — интерактивное подтверждение для bash/ssh/file операций
- **Остановка генерации** — возможность остановить выполнение в любой момент
- **Долгосрочная память** — сохранение важной информации между сессиями

### MCP Инструменты
- 🔹 **run_bash_command** — выполнение bash-команд на сервере (таймаут: 120с)
- 🔹 **run_ssh_command** — SSH-подключение к удалённым серверам
- 🔹 **write_file** — запись содержимого в файлы
- 🔹 **edit_file** — редактирование файлов (замена строк)
- 🔹 **save_memory** — сохранение фактов в долгосрочную память
- 🔹 **read_memory** — чтение сохранённых фактов
- 🔹 **delete_memory** — удаление записей из памяти

### Нативные инструменты Qwen CLI
- 📂 **read_file** — чтение файлов
- 📂 **list_directory** — список файлов в директории
- 🔍 **glob** — поиск файлов по шаблону
- 🔍 **grep_search** — поиск по содержимому файлов
- 🌐 **web_fetch** — загрузка веб-страниц
- 🌐 **web_search** — поиск в интернете
- ✅ **todo_write/todo_read** — управление задачами

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  App.tsx    │  │ WebSocket│  │  Компоненты UI   │   │
│  │  State Mgmt │  │  Client  │  │ (Sidebar, Chat,  │   │
│  └──────┬──────┘  └────┬─────┘  │  MessageBubble)  │   │
│         │              │        └──────────────────┘   │
└─────────┼──────────────┼───────────────────────────────┘
          │              │
          ▼              ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (FastAPI + Python)                  │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │  server.py   │  │ WebSocket API │  │  REST API   │  │
│  │  Qwen CLI    │◄─┤  Streaming    │  │  Sessions   │  │
│  │  Integration │  │  Tool Calls   │  │  Messages   │  │
│  └──────┬───────┘  └───────────────┘  └─────────────┘  │
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              MCP Server (mcp_tools_server.py)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │   Bash   │  │   SSH    │  │  Write   │  │  Edit  │  │
│  │ Commands │  │ Commands │  │   File   │  │  File  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   SQLite Database                        │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐            │
│  │  sessions  │  │ messages │  │  memory  │            │
│  └────────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

## 📦 Технологический стек

### Backend
- **FastAPI** — асинхронный веб-фреймворк
- **WebSocket** — стриминг данных в реальном времени
- **SQLite** — хранение сессий, сообщений и памяти
- **MCP SDK** — Model Context Protocol для инструментов
- **SlowAPI** — rate limiting

### Frontend
- **React 18+** — библиотека UI
- **TypeScript** — типизация
- **Vite** — сборщик
- **Framer Motion** — анимации
- **Tailwind CSS** — стилизация

## 🛠️ Установка

### Требования
- Python 3.10+
- Node.js 18+
- Qwen CLI (установлен и доступен в PATH)

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd qwen-code-web-unofficial
```

### 2. Установка зависимостей backend
```bash
pip install -r requirements.txt
```

### 3. Установка зависимостей frontend
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

# Python для MCP сервера (опционально, по умолчанию sys.executable)
MCP_PYTHON=/usr/bin/python3
```

## 🚀 Запуск

### Режим разработки

#### 1. Запуск backend
```bash
python server.py
```

#### 2. Запуск frontend (в отдельном терминале)
```bash
cd static
npm run dev
```

Приложение доступно по адресу: `http://localhost:5173`

### Продакшен режим

#### Сборка frontend
```bash
cd static
npm install
npm run build
```

#### Запуск сервера
```bash
python server.py
```

Сервер запускает FastAPI с встроенным static files serving. Приложение доступно по адресу http://localhost:10310

## 📁 Структура проекта

```
qwen-code-web-unofficial_prod/
├── server.py                 # Основной сервер (FastAPI + WebSocket + Qwen CLI)
├── mcp_tools_server.py       # MCP сервер для инструментов (bash, ssh, files)
├── system_prompt.py          # Системный промпт для Qwen Agent
├── requirements.txt          # Python зависимости
├── .env                      # Переменные окружения (не отслеживается git)
│
├── static/                   # Frontend приложение
│   ├── index.html            # HTML шаблон
│   ├── package.json          # Node зависимости
│   ├── vite.config.ts        # Конфигурация Vite
│   ├── tsconfig.json         # Конфигурация TypeScript
│   └── src/
│       ├── main.tsx          # Точка входа React
│       ├── App.tsx           # Главный компонент приложения
│       ├── api.ts            # API функции (REST + WebSocket)
│       ├── types.ts          # TypeScript типы
│       ├── index.css         # Глобальные стили
│       ├── components/       # React компоненты
│       │   ├── Sidebar.tsx           # Боковая панель с сессиями
│       │   ├── ChatHeader.tsx        # Шапка чата
│       │   ├── ChatInput.tsx         # Поле ввода сообщений
│       │   ├── MessageBubble.tsx     # Компонент сообщения
│       │   ├── StatusBar.tsx         # Статусная строка
│       │   ├── ConfirmBar.tsx        # Панель подтверждения команд
│       │   ├── SettingsModal.tsx     # Модальное окно настроек
│       │   ├── EmptyState.tsx        # Пустое состояние
│       │   ├── ThinkingBlock.tsx     # Блок thinking процесса
│       │   └── ToolBlock.tsx         # Блок выполнения инструмента
│       └── utils/
│           ├── cn.ts         # Утилита для CSS классов
│           └── markdown.ts   # Парсинг markdown
│
└── sessions.db               # База данных SQLite (создаётся автоматически)
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `QWEN_PATH` | Путь к qwen CLI | Ищет в PATH через `which` |
| `MCP_PYTHON` | Python интерпретатор для MCP сервера | `sys.executable` |

### Rate Limiting
Настроен через SlowAPI. Конфигурация по умолчанию ограничивает количество запросов с одного IP.

### Безопасность
- **Размер запросов**: лимит 50 MB
- **SSH**: требуется настроенный SSH ключ (`~/.ssh/id_ed25519`)
- **File operations**: запись разрешена только в безопасные директории:
  - Текущая директория проекта
  - `~/projects`
  - `~/workspace`
  - `/tmp`
- **Process isolation**: использование process groups для корректного завершения процессов

## 📊 База данных

### Таблица `sessions`
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | TEXT | UUID сессии (PRIMARY KEY) |
| user_id | TEXT | ID пользователя (опционально) |
| title | TEXT | Название чата |
| created_at | TEXT | Дата создания (ISO 8601) |
| updated_at | TEXT | Дата обновления (ISO 8601) |
| system_prompt | TEXT | Кастомный системный промпт (опционально) |

### Таблица `messages`
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | INTEGER | AUTOINCREMENT PRIMARY KEY |
| session_id | TEXT | FK → sessions.id |
| role | TEXT | user/assistant/assistant_tool_call/tool |
| content | TEXT | Содержание сообщения |
| thinking | TEXT | Thinking блок (опционально) |
| tool_calls | TEXT | JSON с вызовами инструментов |
| tool_name | TEXT | Название инструмента |
| created_at | TEXT | Дата создания (ISO 8601) |

### Таблица `memory`
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | INTEGER | AUTOINCREMENT PRIMARY KEY |
| session_id | TEXT | FK → sessions.id |
| key | TEXT | Ключ факта |
| value | TEXT | Значение факта |
| created_at | TEXT | Дата создания (ISO 8601) |

## 🔄 WebSocket протокол

### Подключение
```
ws://host/ws/{session_id}
```

### Клиент → Сервер

| Тип сообщения | Описание | Поля |
|---------------|----------|------|
| `message` | Отправка сообщения | `content: string` |
| `stop` | Остановка генерации | — |
| `confirm_response` | Ответ на подтверждение | `action: "allow" \| "deny" \| "allow_all"` |
| `set_allow_all` | Включить/выключить авто-подтверждение | `value: boolean` |

### Сервер → Клиент

| Тип сообщения | Описание | Поля |
|---------------|----------|------|
| `response_start` | Начало ответа | — |
| `stream_start` | Начало стриминга | — |
| `thinking` | Thinking контент | `content: string` |
| `content` | Основной контент | `content: string` |
| `tool_call` | Вызов инструмента | `name: string`, `args: object` |
| `tool_result` | Результат инструмента | `name: string`, `content: string` |
| `confirm_request` | Запрос подтверждения | `name: string`, `args: object` |
| `tool_denied` | Инструмент запрещён | `name: string` |
| `response_end` | Ответ завершён | — |
| `stopped` | Генерация остановлена | — |
| `error` | Ошибка | — |
| `session_renamed` | Сессия переименована | `id: string`, `title: string` |
| `allow_all_enabled` | Авто-подтверждение включено | — |
| `allow_all_changed` | Изменение авто-подтверждения | `value: boolean` |
| `ping` | Ping для поддержания соединения | — |

## 🎨 Фронтенд компоненты

### App.tsx
Главный компонент приложения. Управляет:
- Состоянием сессий и сообщений
- WebSocket подключением
- Обработкой стриминга
- Подтверждением команд

### Sidebar.tsx
Боковая панель со списком сессий. Позволяет:
- Переключаться между сессиями
- Создавать новые сессии
- Удалять сессии

### MessageBubble.tsx
Компонент отображения сообщения. Поддерживает:
- Пользовательские сообщения
- Ассистент сообщения с thinking
- Tool call/results блоки
- Markdown рендеринг

### ConfirmBar.tsx
Панель подтверждения опасных команд. Показывает:
- Название инструмента
- Аргументы команды
- Кнопки allow/deny/allow_all

### StatusBar.tsx
Статусная строка показывает:
- Текущую фазу (waiting/thinking/generating/tool)
- Статус WebSocket подключения
- Переключатель allow_all

## 🔐 Безопасность

### Опасные инструменты требуют подтверждения
- `run_bash_command`
- `run_ssh_command`
- `write_file`
- `edit_file`

### Таймауты
- Создание MCP сессии: **30 секунд**
- MCP tool вызов: **180 секунд**
- Bash команда: **120 секунд**
- SSH команда: **120 секунд**
- Ожидание подтверждения: **300 секунд**

### Rate Limiting
- Настроен через SlowAPI
- Ограничение запросов с одного IP

### Валидация путей
- Предотвращение path traversal attacks
- Разрешена запись только в безопасные директории

## 🧪 Разработка

### Добавление нового MCP инструмента

1. Добавьте функцию в `mcp_tools_server.py`:
```python
@mcp.tool()
def my_new_tool(param1: str) -> str:
    """Описание инструмента для модели."""
    # Реализация
    return result
```

2. Если требует подтверждения, добавьте в `server.py`:
```python
TOOLS_REQUIRING_CONFIRMATION = {
    ...,
    "my_new_tool"
}
```

### Кастомизация системного промпта
Отредактируйте `system_prompt.py` или используйте кастомный промпт для каждой сессии через SettingsModal.

## 🐛 Troubleshooting

### Qwen CLI не найден
```bash
# Установите qwen или укажите путь в .env
export QWEN_PATH=/path/to/qwen
```

### MCP сервер не запускается
```bash
# Проверьте зависимости
pip install -r requirements.txt

# Проверьте логи
cat server.log
```

### WebSocket не подключается
- Убедитесь что сервер запущен
- Проверьте CORS настройки в `server.py`
- Откройте DevTools консоль для ошибок

### База данных заблокирована
```bash
# Удалите файл блокировки (если нет активных запросов)
rm sessions.db-wal
rm sessions.db-shm
```

## 📝 Планы развития

- [ ] Мультипользовательский режим с авторизацией
- [ ] Экспорт/импорт сессий (JSON, Markdown)
- [ ] Голосовой ввод
- [ ] Поддержка нескольких моделей
- [ ] Горячие клавиши
- [ ] Темная/светлая тема
- [ ] Мобильная адаптация
- [ ] PWA поддержка

## 📄 Лицензия

Некоммерческий проект для обучения и экспериментов с AI.

## 🤝 Контрибьюция

1. Fork репозиторий
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📞 Поддержка

При возникновении проблем открывайте Issue в репозитории с:
- Описанием проблемы
- Шагами воспроизведения
- Логами из `server.log`
- Версией Python и Node.js
