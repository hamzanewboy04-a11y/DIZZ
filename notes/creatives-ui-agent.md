# Creatives UI transfer prep

Подготовлен безопасный каркас для выноса UI из монолитного `D7-ANAL/client/src/pages/creatives.tsx` в `d7-design-product`.

## Что создано

- `client/src/modules/creatives/types/index.ts`
- `client/src/modules/creatives/components/CreativesMetricsShell.tsx`
- `client/src/modules/creatives/components/CreativesListShell.tsx`
- `client/src/modules/creatives/components/CreativesDetailShell.tsx`
- `client/src/modules/creatives/index.ts`

## Цель каркаса

Сейчас это **presentational-only shells** без бизнес-логики монолита. Они нужны как безопасная точка входа для поэтапного переноса:

1. сначала типы и визуальные контейнеры;
2. затем маппинг данных из API;
3. затем декомпозиция действий, диалогов, фильтров и realtime-обновлений.

## Карта будущих компонентов из монолита

Исходник: `D7-ANAL/client/src/pages/creatives.tsx`

### 1. Page composition / orchestration

Предлагаемый будущий контейнер:

- `CreativesPageContainer`
  - загрузка `/api/creative-requests`, `/assigned`, `/my`, `/projects`, `/designers`, `/buyers`
  - role-based branching
  - query invalidation / refresh
  - selection state
  - dialog state

### 2. Presentational shells

Уже выделены:

- `CreativesMetricsShell`
- `CreativesListShell`
- `CreativesDetailShell`

Позже можно расширить до:

- `CreativesFiltersBar`
- `CreativesToolbar`
- `CreativesKanbanBoard`
- `CreativeListCard`
- `CreativeDetailHeader`
- `CreativeDetailMeta`
- `CreativeBriefSection`
- `CreativeFilesSection`
- `CreativeAuctionSection`
- `CreativeActionsPanel`

### 3. Dialog / action groups, которые стоит выносить отдельно

Из монолита явно выделяются группы:

- order/create creative dialog
- assign / reassign designer dialog
- submit for review dialog
- request revision dialog
- approve with rating dialog
- HoD auction setup dialog
- ad mapping dialog
- TL return dialog

Рекомендуемый формат:

- `modules/creatives/components/dialogs/*`
- `modules/creatives/components/actions/*`

### 4. Domain helpers worth extracting

Из файла видны кандидатуры на вынос в `modules/creatives/lib`:

- `normalizeStatus`
- `formatDuration`
- `calcCreativeStatusBreakdown`
- `getWaitInfo`
- `priorityConfig`
- `statusLabels`
- `subtypeLabels`

### 5. Sub-features already conceptually separated in monolith

В исходнике уже импортируются независимые куски:

- `CreativeChat`
- `DesignerReportsPanel`
- `AnalyticsTab`
- `DesignerReviewFeed`

Это хороший сигнал, что дальнейшая декомпозиция должна идти feature-модулями:

- `chat`
- `analytics`
- `reports`
- `auction`
- `review`
- `files`

## Предлагаемый порядок следующего переноса

### Phase 1 — safe structural split

- перенести constants/helpers/types
- сделать `CreativesPageContainer`
- подключить shell-компоненты к реальным данным

### Phase 2 — list and filters

- вынести filters bar
- вынести list card
- вынести kanban board отдельно от list

### Phase 3 — detail modal

- разбить detail view на meta / brief / files / auction / history / actions

### Phase 4 — dialogs and mutations

- по одному сценарию за раз
- assign
- revision
- submit
- approve
- archive/restore

### Phase 5 — cross-cutting extras

- analytics tab
- chat
- reports
- timers
- ad mappings

## Замечания по рискам

`creatives.tsx` в D7-ANAL совмещает сразу несколько слоёв:

- fetch/query layer
- role/permission layer
- page composition
- presentational UI
- domain helpers
- action handlers / mutations
- dialogs

Поэтому прямой перенос «куском» рискованный. Текущий каркас намеренно минимальный: он позволяет начинать перенос без копирования всей связанной логики.

## Что уже подключено

В `client/src/App.tsx` нового проекта добавлен модульный showcase-блок с:

- metrics shell
- list shell
- detail shell

Он использует текущие загруженные данные и не ломает существующий foundation-screen.
