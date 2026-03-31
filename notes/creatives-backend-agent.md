# Creatives backend agent report

## Что сделал

- Выделил минимальные типы и DTO для creatives MVP в `shared/src/types/creatives.ts`.
- На основе `D7-ANAL` сузил MVP до простого lifecycle:
  - `draft -> sent_to_designer -> in_progress -> review -> completed`
  - плюс `revision` как запасной статус для следующего шага.
- Перевёл mock-данные на более реалистичную форму:
  - `shared/src/data/mock.ts`
  - добавил `brief`, `price`, `orderedByUserId`, `submittedAt`, `acceptedAt`, `subtypes`, `statusLogs`.
- В `server/src/modules/creatives/` собрал foundation из трёх слоёв:
  - `storage.ts` — in-memory storage + status logs
  - `service.ts` — бизнес-правила и переходы статусов
  - `routes.ts` — HTTP endpoints
- Добавил server-side заготовки для detail/actions на mock/in-memory данных:
  - `GET /api/creative-requests/:id`
  - `POST /api/creative-requests/:id/assign`
  - `POST /api/creative-requests/:id/detail/assign`
  - `POST /api/creative-requests/:id/take-to-work`
  - `POST /api/creative-requests/:id/accept`
  - `POST /api/creative-requests/:id/detail/accept`

## Предлагаемая структура для дальнейшего переноса

```text
server/src/modules/creatives/
  routes.ts        # transport / express handlers
  service.ts       # status transitions, validation, orchestration
  storage.ts       # repo adapter (mock now, db later)

shared/src/types/
  creatives.ts     # domain types + DTO
```

Следующий естественный шаг — заменить `storage.ts` на DB-backed repository, сохранив `service.ts` и контракт роутов почти без изменений.

## Что ещё осталось

- Вынести auth/role checks, когда в новом проекте появится реальный session/user context.
- Добавить create/update/revision/submit-review/reassign/unassign, если фронту они уже нужны.
- Подменить in-memory storage на persistent storage.
- Свести старые типы из `shared/src/types/domain.ts` с новым `creatives.ts`, чтобы не держать дублирование.
- Если нужен полный parity с `D7-ANAL`, потом отдельно переносить аукцион, файлы, chat, ratings, ad mappings, notifications.

## Замечания по переносу из D7-ANAL

- В `D7-ANAL` модуль creatives сильно перегружен и смешивает transport, orchestration, side effects и интеграции.
- Для `d7-design-product` разумно тащить сначала только thin foundation:
  1. detail
  2. assign
  3. take-to-work
  4. accept
  5. status logs

Это даёт рабочий скелет без раннего переноса Telegram, Google backup, auction и file storage.
