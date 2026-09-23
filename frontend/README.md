# Фронтенд «Аким на 5 часов»

Angular 22, NG-ZORRO и Leaflet. Фронтенд получает данные города, проверяет решения,
рассчитывает результат, запрашивает AI-анализ и сохраняет сценарии через backend API.

## Локальный запуск

Сначала запустите backend из корня репозитория:

```bash
python -m pip install -r backend/requirements.txt
cp .env.example .env
python backend/api.py
```

В отдельном терминале запустите фронтенд:

```bash
cd frontend
npm ci
npm start
```

Откройте [http://localhost:4200](http://localhost:4200). Angular dev server
проксирует `/api/**` на `http://127.0.0.1:8000` через `proxy.conf.json`.
Если backend работает на другом локальном порту, измените `target` в этом файле
и перезапустите `npm start`.

## Настройка API при развёртывании

Адрес API читается из публичного `config.js` до запуска Angular:

```js
window.__NOMAD_CONFIG__ = {
  apiBaseUrl: '/api/v1',
};
```

По умолчанию API находится на том же домене: настройте обратный прокси для `/api/`
на backend. Для отдельного backend, в том числе NVIDIA Brev, укажите полный адрес
с суффиксом `/api/v1`, например `https://backend.example.com/api/v1`.
В backend `.env` добавьте домен фронтенда в `CORS_ORIGINS`.

Перед сборкой настройка находится в `public/config.js`. После сборки её можно
изменить в `dist/frontend/browser/config.js` без повторной компиляции Angular.
При обновлении конфигурации учитывайте кэш CDN/браузера. Для переходов на
`/scenario` и `/results` настройте возврат `index.html` для маршрутов приложения.

`config.js` доступен любому посетителю. `OPENAI_API_KEY` и остальные секреты
хранятся только в backend `.env`; не добавляйте их во фронтенд.

## Подключённые операции

| API | Использование в интерфейсе |
| --- | --- |
| `GET /api/v1/health` | Проверка подключения к серверу и доступного AI-провайдера |
| `GET /api/v1/dataset` | Районы, каталог мер, бюджет, правила и базовые показатели |
| `POST /api/v1/scenarios/validate` | Проверка выбранных решений и бюджета |
| `POST /api/v1/scenarios/calculate` | Расчёт результатов сценария |
| `POST /api/v1/scenarios/analyze` | AI-анализ рассчитанного результата |
| `POST /api/v1/scenarios` | Сохранение именованного сценария на сервере |
| `GET /api/v1/scenarios` | История результатов и открытие сохранённых сценариев |

История хранится в SQLite backend. Для открытия сохранённого сценария необходимо
загрузить данные города; сценарии другой версии данных не открываются как текущие.

## Проверки и сборка

```bash
npm test -- --watch=false
npm run build
```

Готовые статические файлы находятся в `dist/frontend/browser`.
