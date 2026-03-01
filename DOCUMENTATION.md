# Документация сервиса Qwen Agent

**Версия:** 1.0.0
**Авторы:** Claude Opus 4.6 + Qwen Code 3.5
**Дата:** Март 2026

---

## Содержание

1. [Обзор системы](#1-обзор-системы)
2. [Архитектура](#2-архитектура)
3. [Компоненты системы](#3-компоненты-системы)
4. [Поток данных](#4-поток-данных)
5. [Протокол взаимодействия](#5-протокол-взаимодействия)
6. [Системный промпт](#6-системный-промпт)
7. [Управление сессиями](#7-управление-сессиями)
8. [MCP архитектура](#8-mcp-архитектура)
9. [Фронтенд архитектура](#9-фронтенд-архитектура)
10. [Безопасность](#10-безопасность)
11. [Хранение данных](#11-хранение-данных)
12. [Обработка ошибок](#12-обработка-ошибок)

---

## 1. Обзор системы

Qwen Agent — это полнофункциональный веб-интерфейс для работы с AI-ассистентом Qwen через командную строку (qwen-cli). Система построена на архитектуре клиент-сервер с использованием WebSocket для реального времени.

### Ключевые возможности

- **Чат-интерфейс** — веб-UI на React 19 + TypeScript + Vite + Tailwind CSS 4
- **Стриминг ответов** — отображение процесса мышления модели в реальном времени
- **MCP инструменты** — выполнение системных команд через Model Context Protocol
- **Подтверждение операций** — UI для подтверждения опасных команд (bash, ssh, файлы)
- **Долгосрочная память** — сохранение фактов между сессиями через SQLite
- **Множественные сессии** — параллельная работа с несколькими чатами

### Технические характеристики

| Компонент | Технология |
|-----------|------------|
| Бэкенд | FastAPI + Python 3.14 |
| Фронтенд | React 19 + TypeScript + Vite 7 |
| WebSocket | Нативный API браузера |
| База данных | SQLite 3 (sessions.db) |
| MCP | Model Context Protocol SDK |
| AI | qwen-cli (SDK mode) |

---

## 2. Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        Браузер (Клиент)                         │
│  React 19 + TypeScript + Vite + Tailwind CSS 4                  │
│  WebSocket для стриминга ответов                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket (порт 10310)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Server (server.py)                   │
│  • Управление сессиями (SQLite)                                 │
│  • WebSocket handler                                            │
│  • MCP Session Manager                                          │
│  • Security Middleware                                          │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    │                           │
                    ▼                           ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│     qwen CLI (SDK mode)   │   │   MCP Server (mcp_tools_server) │
│  --input-format stream-json│  │  Stdio transport                │
│  --output-format stream-json│ │  Инструменты:                   │
└───────────────────────────┘   │  • run_bash_command             │
                                │  • run_ssh_command              │
                                │  • write_file                   │
                                │  • edit_file                    │
                                └─────────────────────────────────┘
                                            │
                                            ▼
                              ┌─────────────────────────┐
                              │   SQLite (sessions.db)  │
                              │   • sessions            │
                              │   • messages            │
                              │   • memory              │
                              └─────────────────────────┘
```

### Слои архитектуры

1. **Клиентский слой** — React SPA с WebSocket клиентом
2. **Транспортный слой** — HTTP REST API + WebSocket
3. **Серверный слой** — FastAPI приложение
4. **Слой интеграции** — qwen CLI (SDK mode) + MCP сервер
5. **Слой хранения** — SQLite база данных

---

## 3. Компоненты системы

### 3.1 FastAPI сервер (`server.py`)

**Назначение:** Основной сервер приложения, обрабатывающий HTTP запросы и WebSocket соединения.

**Основные функции:**

| Функция | Описание |
|---------|----------|
| `init_db()` | Инициализация SQLite базы данных |
| `create_session()` | Создание новой чат-сессии |
| `get_messages()` | Получение истории сообщений |
| `save_message()` | Сохранение сообщения в БД |
| `build_history()` | Построение контекста для qwen CLI |
| `stream_chat_background()` | Асинхронная обработка запроса к qwen |
| `websocket_endpoint()` | Обработка WebSocket соединений |

**Middleware:**

```python
# Порядок применения (внешний → внутренний):
1. SecurityHeadersMiddleware      # Security headers
2. RequestSizeLimitMiddleware     # Лимит 5MB на запрос
3. CORSMiddleware                 # CORS политики
```

### 3.2 MCP сервер (`mcp_tools_server.py`)

**Назначение:** Сервер инструментов Model Context Protocol для выполнения системных операций.

**Инструменты:**

```python
@mcp.tool()
def run_bash_command(command: str) -> str:
    """Выполняет bash команду с таймаутом 120 сек."""

@mcp.tool()
def run_ssh_command(host: str, command: str, user: str = "root") -> str:
    """SSH подключение к удалённому серверу."""

@mcp.tool()
def write_file(path: str, content: str) -> str:
    """Запись содержимого в файл."""

@mcp.tool()
def edit_file(path: str, old_string: str, new_string: str) -> str:
    """Редактирование файла (замена первого вхождения)."""
```

### 3.3 Фронтенд (`static/src/`)

**Технологии:**
- React 19.2.3
- TypeScript 5.9.3
- Vite 7.2.4
- Tailwind CSS 4.1.17
- Framer Motion (анимации)
- Highlight.js (подсветка кода)
- Marked (Markdown рендеринг)

**Основные компоненты:**

| Компонент | Назначение |
|-----------|------------|
| `App.tsx` | Главный компонент, управление состоянием |
| `Sidebar.tsx` | Список сессий |
| `ChatHeader.tsx` | Заголовок чата |
| `ChatInput.tsx` | Поле ввода сообщения |
| `MessageBubble.tsx` | Отображение сообщений |
| `ConfirmBar.tsx` | Панель подтверждения операций |
| `StatusBar.tsx` | Индикатор состояния |
| `SettingsModal.tsx` | Настройки сессии |
| `EmptyState.tsx` | Пустое состояние чата |
| `ThinkingBlock.tsx` | Блок мышления AI |
| `ToolBlock.tsx` | Блок вызова инструментов |

---

## 4. Поток данных

### 4.1 Обработка запроса пользователя

```
┌──────────┐     ┌───────────┐     ┌────────────┐     ┌──────────┐     ┌─────────┐
│ Браузер  │────▶│ FastAPI   │────▶│ qwen CLI   │────▶│ MCP      │────▶│ Система │
│ (WebSocket)│   │ (server.py)│   │ (SDK mode) │   │ (tools)  │     │         │
└──────────┘     └───────────┘     └────────────┘     └──────────┘     └─────────┘
     │                │                  │                  │                │
     │ 1. message     │                  │                  │                │
     │───────────────▶│                  │                  │                │
     │                │                  │                  │                │
     │                │ 2. control_request (initialize)     │                │
     │                │─────────────────▶│                  │                │
     │                │                  │                  │                │
     │                │ 3. control_response (success)       │                │
     │                │◀─────────────────│                  │                │
     │                │                  │                  │                │
     │                │ 4. user message   │                  │                │
     │                │─────────────────▶│                  │                │
     │                │                  │                  │                │
     │                │ 5. thinking      │                  │                │
     │                │◀─────────────────│                  │                │
     │ 6. thinking   │                  │                  │                │
     │◀──────────────│                  │                  │                │
     │                │                  │                  │                │
     │                │ 7. tool_use      │                  │                │
     │                │◀─────────────────│                  │                │
     │                │                  │                  │                │
     │                │ 8. control_request (can_use_tool)  │                │
     │                │─────────────────▶│                  │                │
     │                │                  │                  │                │
     │ 9. confirm_request               │                  │                │
     │◀──────────────│                  │                  │                │
     │                │                  │                  │                │
     │ 10. confirm_response (allow)     │                  │                │
     │──────────────▶│                  │                  │                │
     │                │                  │                  │                │
     │                │ 11. control_response (allow)       │                │
     │                │─────────────────▶│                  │                │
     │                │                  │                  │                │
     │                │                  │ 12. tool call    │                │
     │                │                  │─────────────────▶│                │
     │                │                  │                  │                │
     │                │                  │                  │ 13. execute    │
     │                │                  │                  │───────────────▶│
     │                │                  │                  │                │
     │                │                  │ 14. tool_result  │                │
     │                │                  │◀─────────────────│                │
     │                │                  │                  │                │
     │ 15. tool_result│                  │                  │                │
     │◀──────────────│                  │                  │                │
     │                │                  │                  │                │
     │                │ 16. text response│                  │                │
     │                │◀─────────────────│                  │                │
     │ 17. content   │                  │                  │                │
     │◀──────────────│                  │                  │                │
     │                │                  │                  │                │
     │                │ 18. result (done)│                  │                │
     │                │◀─────────────────│                  │                │
     │                │                  │                  │                │
     │ 19. response_end                 │                  │                │
     │◀──────────────│                  │                  │                │
     │                │                  │                  │                │
     │                │ 20. save to DB   │                  │                │
     │                │─────────────────────────────────────▶                │
```

### 4.2 Функция `stream_chat_background()`

**Алгоритм работы:**

1. **Инициализация:**
   - Автосохранение заголовка сессии (первые 50 символов сообщения)
   - Сохранение сообщения пользователя в БД
   - Отправка `response_start` и `stream_start` клиенту

2. **Построение контекста:**
   - Загрузка истории сообщений из БД
   - Получение кастомного системного промпта (если есть)
   - Инъекция сохранённой памяти через `read_memory_for_session()`
   - Обрезка контекста по `MAX_CONTEXT_CHARS`

3. **Запуск qwen CLI:**
   ```python
   # Если есть история и валидный UUID — resume сессии
   if has_history and is_valid_uuid:
       proc = run_qwen_cli_sdk(resume_id=session_id)
   elif is_valid_uuid:
       proc = run_qwen_cli_sdk(session_id=session_id)
   else:
       proc = run_qwen_cli_sdk()  # Без контекста
   ```

4. **Инициализация SDK mode:**
   ```json
   {"type": "control_request", "request_id": "init-001",
    "request": {"subtype": "initialize"}}
   ```

5. **Чтение потока ответов:**
   - Цикл чтения stdout qwen процесса
   - Парсинг JSON строк (SDK format)
   - Обработка типов: `thinking`, `text`, `tool_use`, `tool_result`

6. **Обработка `control_request` (can_use_tool):**
   - Если `connection_state["allow_all"]` — авто-одобрение
   - Иначе — отправка `confirm_request` клиенту
   - Ожидание `confirm_response` через `_wait_for_confirmation()`
   - Отправка `control_response` обратно в qwen

7. **Завершение:**
   - Сохранение сообщений в БД в правильном порядке
   - Отправка `response_end` клиенту

---

## 5. Протокол взаимодействия

### 5.1 WebSocket сообщения

#### Клиент → Сервер

**Отправка сообщения:**
```json
{
  "type": "message",
  "content": "Привет, как дела?"
}
```

**Остановка генерации:**
```json
{
  "type": "stop"
}
```

**Ответ на запрос подтверждения:**
```json
{
  "type": "confirm_response",
  "action": "allow"     // Разрешить эту операцию
}
// или
{
  "type": "confirm_response",
  "action": "deny"      // Запретить
}
// или
{
  "type": "confirm_response",
  "action": "allow_all" // Разрешить все до конца сессии
}
```

#### Сервер → Клиент

| Тип | Поля | Описание |
|-----|------|----------|
| `response_start` | — | Начало обработки запроса |
| `stream_start` | — | Начало стриминга ответа |
| `thinking` | `content: string` | Фрагмент мышления модели |
| `content` | `content: string` | Фрагмент текстового ответа |
| `tool_call` | `name: string`, `args: object` | Вызов инструмента |
| `tool_result` | `name: string`, `content: string` | Результат инструмента |
| `tool_denied` | `name: string` | Инструмент запрещён |
| `confirm_request` | `name: string`, `args: object` | Запрос подтверждения |
| `allow_all_enabled` | — | Режим «разрешить все» активирован |
| `response_end` | — | Завершение ответа |
| `stopped` | — | Остановлено пользователем |
| `error` | `content: string` | Ошибка |
| `session_renamed` | `id: string`, `title: string` | Сессия переименована |
| `ping` | — | Heartbeat (каждые 30 сек) |

### 5.2 qwen CLI SDK protocol

**Формат:** JSON Lines (каждое сообщение на отдельной строке)

**Типы сообщений от qwen:**

```json
// Инициализация
{"type": "control_response", "response": {"subtype": "success", ...}}

// Мышление
{"type": "assistant", "message": {"content": [
  {"type": "thinking", "thinking": "Думаю..."}
]}}

// Текст
{"type": "assistant", "message": {"content": [
  {"type": "text", "text": "Ответ пользователю"}
]}}

// Вызов инструмента
{"type": "assistant", "message": {"content": [
  {"type": "tool_use", "id": "tool_123", "name": "run_bash_command",
   "input": {"command": "ls -la"}}
]}}

// Запрос подтверждения
{"type": "control_request", "request_id": "req_456",
 "request": {"subtype": "can_use_tool", "tool_name": "run_bash_command",
             "input": {"command": "ls -la"}}}

// Результат инструмента
{"type": "user", "message": {"content": [
  {"type": "tool_result", "tool_use_id": "tool_123",
   "content": "total 48\n..."}
]}}

// Завершение
{"type": "result", "result": {"content": [...]}}
```

**Ответы сервера в qwen:**

```json
// Разрешение инструмента
{"type": "control_response", "response": {
  "subtype": "success", "request_id": "req_456",
  "response": {"behavior": "allow"}}}

// Запрет инструмента
{"type": "control_response", "response": {
  "subtype": "success", "request_id": "req_456",
  "response": {"behavior": "deny", "message": "Отклонено"}}}
```

---

## 6. Системный промпт

### 6.1 Структура промпта

Системный промпт определяется в константе `SYSTEM_PROMPT` и включает:

1. **Роль и среда:**
   - Определение роли AI-ассистента
   - Информация об ОС, хостнейме, Python версии
   - Рабочие директории

2. **Доступные инструменты:**
   - Список всех доступных инструментов
   - Краткое описание каждого

3. **Принципы работы:**
   ```
   1. 🚀 ДЕЙСТВУЙ, НЕ РАССУЖДАЙ
   2. 📋 РАЗБИВАЙ СЛОЖНЫЕ ЗАДАЧИ
   3. 🎯 МИНИМУМ ТЕКСТА, МАКСИМУМ ДЕЛА
   4. 🧠 ЗАПОМИНАЙ ВАЖНОЕ
   5. ✅ ПРОВЕРЯЙ РЕЗУЛЬТАТЫ
   6. 🔒 БЕЗОПАСНОСТЬ
   ```

4. **Примеры правильного поведения:**
   ```
   ❌ ПЛОХО: «Я могу проверить содержимое директории командой ls»
   ✅ ХОРОШО: [вызов list_directory(path="/home/andrew/qwen-agent")]
   ```

### 6.2 Инъекция памяти

При построении контекста (`build_history()`) в промпт добавляется блок сохранённых фактов:

```
Сохранённые факты (долгосрочная память):
  • server_ip: 192.168.1.100
  • database_name: myapp_db
  • preferred_editor: vim
```

**Механизм:**
1. Чтение записей из таблицы `memory` через `read_memory_for_session()`
2. Фильтрация ключей с префиксом `_auto_` (автосохранённые темы)
3. Форматирование в виде списка
4. Добавление как `system` сообщение после основного промпта

### 6.3 Кастомный промпт сессии

Пользователь может установить кастомный системный промпт для сессии через Settings Modal.

**Хранение:**
- Поле `system_prompt` в таблице `sessions`
- `NULL` = использование промпта по умолчанию

**Применение:**
```python
custom_prompt = get_session_prompt(sid)
effective_prompt = custom_prompt or SYSTEM_PROMPT
```

---

## 7. Управление сессиями

### 7.1 Жизненный цикл сессии

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│ Создание    │────▶│ Активная      │────▶│ Обновление  │────▶│ Удаление    │
│ (POST /api) │     │ (WebSocket)  │     │ (сообщения) │     │ (DELETE)    │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
```

### 7.2 Создание сессии

**API:** `POST /api/sessions`

**Тело запроса:**
```json
{"title": "Мой новый чат"}
```

**Ответ:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Мой новый чат",
  "created_at": "2026-03-01T12:00:00",
  "updated_at": "2026-03-01T12:00:00",
  "user_id": null
}
```

**Процесс:**
1. Генерация UUID v4
2. Запись в таблицу `sessions`
3. Возврат данных клиенту

### 7.3 Автоматическое переименование

При первом сообщении пользователя сессия автоматически переименовывается:

```python
def auto_title(session_id: str, user_msg: str):
    title = user_msg[:50].strip()
    if len(user_msg) > 50:
        title += "..."
    # Обновление в БД только если это первое сообщение
```

### 7.4 Контекст и лимиты

**Функция `build_history()`:**

1. **Базовый контекст:**
   - Системный промпт
   - Инъекция памяти
   - История сообщений (user/assistant/tool)

2. **Обрезка по лимиту:**
   ```python
   if MAX_CONTEXT_CHARS <= 0:
       return history  # Без лимита

   if _estimate_chars(history) <= MAX_CONTEXT_CHARS:
       return history  # Укладывается

   # Обрезка старых сообщений
   trimmed = []
   for m in reversed(all_msgs):
       if budget - msg_size < 0:
           break
       budget -= msg_size
       trimmed.append(m)
   ```

3. **Контекст notice:**
   ```
   [Контекст обрезан: показаны последние 50 из 120 сообщений.]
   Темы из предыдущих сообщений пользователя:
     • Как настроить сервер
     • Установка пакетов
   ```

---

## 8. MCP архитектура

### 8.1 MCPSessionManager

**Назначение:** Управление единственной MCP сессией (не привязана к session_id чата).

**Состояния:**
```python
class MCPSessionManager:
    _session: ClientSession       # Активная сессия
    _cm_stdio: stdio_client       # Контекст stdio
    _cm_client: ClientSession     # Контекст клиента
    _connected: bool              # Флаг подключения
    _lock: asyncio.Lock           # Блокировка для потокобезопасности
```

**Методы:**

| Метод | Описание |
|-------|----------|
| `_create_session()` | Создание новой MCP сессии |
| `_close_internal()` | Закрытие ресурсов |
| `_ensure_session()` | Гарантия живой сессии |
| `call_tool()` | Вызов инструмента |
| `list_tools()` | Список доступных инструментов |

### 8.2 Протокол MCP

**Транспорт:** Stdio (stdin/stdout)

**Инициализация:**
```python
env = {
    **os.environ,
    "MCP_DB_PATH": str(Path(DB_PATH).resolve()),
}
params = StdioServerParameters(
    command=MCP_PYTHON,
    args=[MCP_SERVER_SCRIPT],
    cwd=str(Path(__file__).parent),
    env=env,
)
```

**Поток:**
```
┌──────────────┐     ┌──────────────┐
│ server.py    │     │ mcp_tools_   │
│ (MCPSession) │     │ server.py    │
└──────────────┘     └──────────────┘
       │                    │
       │ 1. initialize      │
       │───────────────────▶│
       │                    │
       │ 2. initialized     │
       │◀───────────────────│
       │                    │
       │ 3. list_tools      │
       │───────────────────▶│
       │                    │
       │ 4. tools list      │
       │◀───────────────────│
       │                    │
       │ 5. call_tool       │
       │───────────────────▶│
       │                    │
       │ 6. tool result     │
       │◀───────────────────│
```

### 8.3 Инструменты и подтверждение

**Список инструментов требующих подтверждения:**

```python
TOOLS_REQUIRING_CONFIRMATION = {
    "Bash", "bash", "run_bash_command", "execute_command",
    "run_command", "shell", "run_shell_command",
    "ssh", "SSH", "run_ssh_command", "remote_command",
    "Write", "write_file", "create_file",
    "Edit", "edit_file", "replace_in_file",
}
```

**Механизм подтверждения:**

1. qwen отправляет `control_request` (can_use_tool)
2. Сервер проверяет название инструмента
3. Если требует подтверждения:
   - Отправка `confirm_request` клиенту
   - Ожидание через `_wait_for_confirmation()`
   - Отправка `control_response` в qwen
4. Если `allow_all` — авто-одобрение

---

## 8. Безопасность

---

## 9. Фронтенд архитектура

### 9.1 Структура приложения

**Точка входа:** `static/src/main.tsx`

**Главный компонент:** `App.tsx`

### 9.2 Компонент App.tsx

**Состояния (useState):**

| Состояние | Тип | Описание |
|-----------|-----|----------|
| `sessions` | `Session[]` | Список сессий |
| `currentSession` | `Session \| null` | Текущая сессия |
| `messages` | `Message[]` | История сообщений |
| `isBusy` | `boolean` | Флаг активной генерации |
| `phase` | `Phase` | Текущая фаза (idle/waiting/thinking/generating/tool/confirming) |
| `sidebarOpen` | `boolean` | Открыта ли боковая панель |
| `settingsOpen` | `boolean` | Открыто ли окно настроек |
| `confirmRequest` | `ConfirmRequest \| null` | Запрос подтверждения |
| `wsStatus` | `WsStatus` | Статус WebSocket подключения |
| `streaming` | `StreamingMessage` | Текущее стримящееся сообщение |
| `isStreamingActive` | `boolean` | Активен ли стриминг |

**Фазы работы (Phase):**

| Фаза | Описание |
|------|----------|
| `idle` | Ожидание сообщения |
| `waiting` | Ожидание ответа от qwen |
| `thinking` | AI думает (stream thinking) |
| `generating` | AI генерирует ответ |
| `tool` | Выполнение инструмента |
| `confirming` | Ожидание подтверждения пользователя |

### 9.3 WebSocket логика

**Подключение:**
```typescript
const ws = api.createWebSocket(sessionId);
wsRef.current = ws;
```

**Обработка сообщений:**
```typescript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleWsMessage(data);
};
```

**Auto-reconnect:**
- Экспоненциальная задержка (1s, 2s, 4s, 8s, 10s max)
- Максимум 5 попыток
- Reconnect только для той же сессии

### 9.4 Компоненты UI

#### Sidebar.tsx
Боковая панель со списком сессий:
- Отображение списка чатов
- Переключение между сессиями
- Создание новой сессии
- Удаление сессии

#### ChatHeader.tsx
Заголовок чата:
- Название текущей сессии
- Кнопка открытия sidebar
- Кнопка настроек

#### ChatInput.tsx
Поле ввода сообщения:
- Textarea с авто-высотой
- Кнопка отправки
- Кнопка остановки генерации
- Поддержка Ctrl+Enter

#### MessageBubble.tsx
Отображение сообщения:
- Рендеринг Markdown (marked.js)
- Подсветка кода (highlight.js)
- Отображение thinking блока
- Отображение tool вызовов

#### ConfirmBar.tsx
Панель подтверждения операций:
- Название инструмента
- Аргументы команды
- Кнопки: Разрешить / Запретить / Разрешить все

#### StatusBar.tsx
Индикатор состояния:
- Текущая фаза работы
- Таймер выполнения
- Статус WebSocket подключения

#### SettingsModal.tsx
Модальное окно настроек:
- Переименование сессии
- Установка кастомного системного промпта
- Просмотр дефолтного промпта

### 9.5 Рендеринг сообщений

**Функция `renderMessageList()`:**

Группирует сообщения для правильного отображения:
1. `user` → отдельный bubble
2. `assistant` / `assistant_tool_call` + `tool` × N → комбинированный bubble
3. Стримящиеся сообщения → отдельный блок

**Порядок сохранения в БД:**
```
assistant_tool_call (с tool_calls JSON)
  ↓
tool × N (результаты инструментов)
  ↓
assistant (финальный ответ)
```

### 9.6 Типы (types.ts)

**Основные интерфейсы:**
```typescript
interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  system_prompt?: string;
}

interface Message {
  id: number;
  session_id: string;
  role: 'user' | 'assistant' | 'assistant_tool_call' | 'tool';
  content: string;
  thinking?: string;
  tool_calls?: string;
  tool_name?: string;
  created_at: string;
}

interface ToolCall {
  id?: string;
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}
```

---

## 10. Безопасность

### 10.1 Security headers

```python
HEADERS = [
    (b"x-content-type-options", b"nosniff"),
    (b"x-frame-options", b"DENY"),
    (b"x-xss-protection", b"1; mode=block"),
    (b"referrer-policy", b"strict-origin-when-cross-origin"),
]
```

### 10.2 Лимиты

| Лимит | Значение |
|-------|----------|
| `MAX_REQUEST_SIZE` | 5 MB |
| `MAX_CONTEXT_CHARS` | 0 (без лимита) или заданное |
| `TOOL_RESULT_MAX_CHARS` | 0 (без лимита) или заданное |
| Таймаут bash/ssh | 120 секунд |
| Таймаут подтверждения | 300 секунд |

---

## 11. Хранение данных

### 11.1 SQLite схема

**Таблица `sessions`:**
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,           -- UUID
    user_id TEXT,                  -- OAuth user_id
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    system_prompt TEXT DEFAULT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

**Таблица `messages`:**
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,            -- user/assistant/assistant_tool_call/tool
    content TEXT NOT NULL,
    thinking TEXT,
    tool_calls TEXT,               -- JSON
    tool_name TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
```

**Таблица `memory`:**
```sql
CREATE TABLE memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(session_id, key)
);

CREATE INDEX idx_memory_session_id ON memory(session_id);
```

### 11.2 Порядок сохранения сообщений

**Для сообщений с инструментами:**

```
1. assistant_tool_call (содержит tool_calls JSON)
   ├─ role: "assistant_tool_call"
   ├─ content: "Текст ответа (если есть)"
   ├─ thinking: "Содержимое thinking"
   └─ tool_calls: [{"function": {"name": "...", "arguments": {...}}}]

2. tool × N (по одному на каждый вызов)
   ├─ role: "tool"
   ├─ content: "Результат выполнения"
   └─ tool_name: "название_инструмента"
```

**Для обычных сообщений:**

```
assistant
├─ role: "assistant"
├─ content: "Текст ответа"
└─ thinking: "Содержимое thinking"
```

### 11.3 Долгосрочная память

**Автосохранение тем:**

При каждом сообщении пользователя сохраняется тема для контекста:

```python
def _auto_save_digest(session_id: str, last_user_msg: str):
    DIGEST_KEY = "_auto_conversation_topics"
    MAX_TOPICS = 20
    # Добавление темы в список (обрезка до 20)
```

**Ручное сохранение:**

Через инструмент `save_memory`:

```python
@mcp.tool()
def save_memory(key: str, value: str, session_id: str) -> str:
    """Сохраняет факт в долгосрочную память сессии."""
```

---

## 12. Обработка ошибок

### 12.1 Типы ошибок

| Тип | Обработка |
|-----|-----------|
| WebSocket disconnect | Логирование, очистка ресурсов |
| qwen process crash | Fallback на новый запуск |
| MCP session error | Пересоздание сессии |
| Database error | Логирование, возврат ошибки клиенту |
| Timeout | Отправка `error` сообщения |

### 12.2 Механизм восстановления

**При ошибке qwen процесса:**

```python
# Fallback: если процесс умер
if init_resp is None and proc.poll() is not None:
    logger.warning(f"qwen процесс завершился, пробуем без --resume")
    proc = run_qwen_cli_sdk(session_id=session_id)
    proc.stdin.write(init_msg + "\n")
    proc.stdin.flush()
    await _wait_for_init_response(proc)
```

**При ошибке MCP:**

```python
except Exception:
    # Реальная ошибка MCP — пересоздадим сессию при следующем вызове
    self._connected = False
    self._session = None
    raise
```

### 12.3 Логирование

**Файл логов:** `server.log`

**Формат:**
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

**Уровни:**
- `INFO` — штатные события (подключения, запросы)
- `WARNING` — предупреждения (fallback режимы)
- `ERROR` — ошибки с traceback

**Примеры:**
```
2026-03-01 12:00:00 - server - INFO - WebSocket подключен: session_id=abc-123
2026-03-01 12:00:01 - server - INFO - Начало обработки: abc-123, сообщение: Привет...
2026-03-01 12:00:05 - server - WARNING - qwen процесс завершился, пробуем без --resume
2026-03-01 12:00:10 - server - ERROR - Ошибка: Connection refused
    Traceback (most recent call last):
      ...
```

---

## Приложения

### A. Переменные окружения (полный список)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SESSION_SECRET` | Секрет для cookie | Случайный |
| `QWEN_PATH` | Путь к qwen CLI | `/home/andrew/.nvm/versions/node/v22.12.0/bin/qwen` |
| `MCP_PYTHON` | Python для MCP | `sys.executable` |
| `MAX_CONTEXT_CHARS` | Лимит контекста | `0` |
| `TOOL_RESULT_MAX_CHARS` | Лимит результата | `0` |
| `OAUTH_ENABLED` | Включить OAuth | `false` |
| `OAUTH_PROVIDER` | Провайдер | `github` |
| `OAUTH_CLIENT_ID` | Client ID | — |
| `OAUTH_CLIENT_SECRET` | Client Secret | — |
| `OAUTH_REDIRECT_URI` | Redirect URI | `http://localhost:8080/auth/callback` |
| `OAUTH_SCOPES` | Scopes | `user:email` |
| `ALLOWED_ORIGINS` | CORS origins | `localhost:10310` |

### B. Порты

| Сервис | Порт |
|--------|------|
| FastAPI | 10310 |
| Vite dev server | 5173 (не используется в продакшне) |

### C. Файлы

| Файл | Назначение |
|------|------------|
| `server.py` | Основной сервер |
| `mcp_tools_server.py` | MCP инструменты |
| `sessions.db` | SQLite база |
| `server.log` | Логи |
| `static/dist/` | Сборка фронтенда |
| `.env` | Переменные окружения |

---

**Конец документа**
