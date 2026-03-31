# Visuals extraction prep (MVP transfer map)

Контекст: это prep-документ для переноса `visuals` из `D7-ANAL` в `d7-design-product`.

Ограничения этого prep:
- `D7-ANAL` не трогаем
- в `d7-design-product` пока не тащим весь legacy-монолит
- цель: зафиксировать очень конкретный MVP scope для безопасного extraction
- ориентир: переносить `visuals` как отдельный модуль поверх уже существующих foundation-частей (`users`, `projects`, `creatives`)

---

## 1. Что считать MVP для visuals

Для первого переносимого рабочего контура достаточно закрыть один сквозной flow:

1. requester создаёт visual request
2. HoD видит новые заявки и либо:
   - берёт/назначает дизайнера напрямую
   - либо отправляет в аукцион
3. designer берёт задачу в работу / выигрывает аукцион
4. designer загружает result files
5. requester + designer общаются в чате заявки
6. requester/HoD переводит заявку в revision / accepted / cancelled
7. accepted result можно отправить в gallery
8. gallery item можно использовать как source при создании новой заявки

Это и есть MVP. Всё остальное — phase 2+.

---

## 2. MVP endpoints: точная карта

Ниже список endpoint-ов, которые реально нужны для MVP extraction. Разбивка по приоритету.

### 2.1 Must-have: core request lifecycle

#### Create / list / detail
- `POST /api/visuals`
  - создание visual request
  - нужен для create modal / form
  - поддержать поля:
    - `department`
    - `projectId` или нормализованный project ref
    - `project` (если пока mock/snapshot)
    - `geo`
    - `language`
    - `format`
    - `urgency`
    - `taskType`
    - `formData`
    - `gallerySourceId?`
    - `modelProfileId?`
    - `visualPurpose?`
    - `visualFormat?`
    - `compositionSteps?`
    - `referenceInstructions?`

- `GET /api/visuals`
  - основной список для страницы `/visuals`
  - MVP filters:
    - `status`
    - `department`
    - `requesterId`
    - `assignedDesignerId`
    - `designerOrAuction`
  - сразу отдавать enough data для list/card без отдельного hydrate на каждый row

- `GET /api/visuals/:id`
  - detail sidebar/panel
  - нужен для открытой карточки, метаданных, ролей, связей, аукционного контекста

#### Status actions
- `PATCH /api/visuals/:id/status`
  - универсальный status transition endpoint
  - MVP transitions:
    - `new -> on_review`
    - `on_review -> in_progress`
    - `on_review -> pending_hod_setup`
    - `in_progress -> submitted`
    - `submitted -> revision`
    - `submitted -> accepted`
    - `submitted -> rejected` (опционально, но лучше сохранить)
    - `revision -> in_progress`
    - `clarification -> in_progress`
    - `new|on_review|in_progress|submitted|revision -> cancelled` (по правилам роли)
  - комментарий/причина нужен минимум для:
    - revision
    - rejection
    - cancellation
    - return-to-auction (если делаем в phase 1.5)

#### Direct assignment / take
- `PATCH /api/visuals/:id/assign`
  - HoD назначает конкретного дизайнера
  - must-have для non-auction path

- `PATCH /api/visuals/:id/take`
  - HoD/direct take flow из `new|on_review`
  - в MVP можно оставить либо `assign`, либо `take`; лучше иметь оба, если быстро переносится

#### Edit before processing
- `PATCH /api/visuals/:id/edit`
  - requester может править заявку, пока она `new`
  - полезно для реального UX, но можно считать borderline MVP
  - если scope режем, это первый кандидат на defer

---

### 2.2 Must-have: files

- `POST /api/visuals/:id/files`
  - загрузка reference/result файлов
  - MVP достаточно multipart upload без chunked flow
  - file types, которые нужно поддержать в модели:
    - `reference`
    - `result`
    - `comment_attachment` / chat attachment (если не разводим отдельно)

- `GET /api/visuals/:id/files`
  - список файлов заявки
  - нужен detail panel + gallery share + preview grid

- `GET /api/visuals/file/:fileId/preview`
  - inline preview для image/video/document-lite UX

- `GET /api/visuals/file/:fileId/download`
  - скачивание оригинала

#### Not MVP for first cut
- `POST /api/visuals/:id/files/register-chunked`
  - chunked registration можно отложить
  - в extraction prep не включать в первый проход

---

### 2.3 Must-have: chat inside visual request

- `GET /api/visuals/:id/messages`
- `POST /api/visuals/:id/messages`
- `PATCH /api/visuals/messages/:id`
- `DELETE /api/visuals/messages/:id`

Почему это MVP:
- без чата visual flow почти сразу упрётся в коммуникацию вне системы
- `D7-ANAL/client/src/components/visuals/VisualChat.tsx` уже выделен в отдельный компонент — хороший кандидат на extraction slice

MVP scope для chat:
- текстовое сообщение
- до 5 attachments на сообщение — можно оставить только если storage уже готовится
- edit/delete своих сообщений
- анонимизация автора для designer/requester можно пока не переносить 1:1, если хотим сначала упростить server rules

---

### 2.4 Must-have: gallery

- `POST /api/visual-gallery`
  - отправить accepted visual в gallery
  - payload минимум:
    - `visualRequestId`
    - `comment`

- `GET /api/visual-gallery`
  - список gallery items
  - должен возвращать:
    - gallery item meta
    - summary полей visual request
    - result files

MVP-optional:
- `DELETE /api/visual-gallery/:id`
  - оставить, если удаление gallery entry нужно в UI сразу
  - если режем scope — можно отложить

---

### 2.5 Should-have for MVP if auction path включаем сразу

Если аукцион входит в MVP, нужны ещё эти endpoints:

- `POST /api/visuals/:id/send-to-auction`
- `PATCH /api/visuals/:id/hod-setup`
- `POST /api/visual-auction-bids`
- `GET /api/visual-auction-bids/my/:visualId`
- `GET /api/visuals/:id/auction-info`

Минимальный аукционный сценарий:
1. owner/HoD отправляет visual в auction
2. HoD задаёт auction params
3. designers оставляют bid
4. UI показывает bids + winner
5. visual уходит в `in_progress`

### 2.6 Not-MVP / phase 2 endpoints

Это не тащить в первый extraction cut:

- `GET /api/visuals/model-search`
- `GET /api/visuals/stats/requester-timings`
- `GET /api/visuals/stats/geo`
- `GET /api/visuals/analytics`
- `GET /api/visuals/designer-loads`
- `GET /api/visuals/queue-position/:id`
- `POST /api/visuals/:id/extend-deadline`
- `POST /api/visuals/:id/return-from-auction`
- `POST /api/visuals/:id/designer-return-to-auction`
- `POST /api/visuals/:id/hod-return-to-auction`
- `GET /api/visuals/all-status-logs`
- `GET /api/visuals/:id/status-logs`
- `GET /api/visual-overdue-penalty-config`
- `POST /api/visual-overdue-penalty-config`
- `DELETE /api/visual-overdue-penalty-config/:id`
- full cron/overdue automation

---

## 3. Сущности для extraction: что переносить первым слоем

Ниже сущности не в терминах legacy SQL, а как модульный product contract.

### 3.1 Core entity: `VisualRequest`

Минимальный shape для design-product:

```ts
export type VisualRequestStatus =
  | 'new'
  | 'on_review'
  | 'pending_hod_setup'
  | 'queued_for_auction'
  | 'in_auction'
  | 'in_progress'
  | 'submitted'
  | 'revision'
  | 'clarification'
  | 'on_hold'
  | 'accepted'
  | 'rejected'
  | 'cancelled'

export type VisualTaskType =
  | 'chat_interface'
  | 'creative'
  | 'video'
  | 'visual'

export type VisualUrgency =
  | 'normal'
  | 'fast'
  | 'urgent'
  | 'critical'

export type VisualRequest = {
  id: number
  displayId: string
  requesterId: number
  assignedDesignerId: number | null
  department: 'processing' | 'reviews' | 'smm' | 'other'
  taskType: VisualTaskType
  status: VisualRequestStatus
  urgency: VisualUrgency
  projectId: number | null
  projectName?: string | null
  geo?: string | null
  language?: string | null
  format?: string | null
  formData?: Record<string, unknown> | null
  revisionCount: number
  deadlineAt?: string | null
  deadlineFrozen?: boolean | null
  rating?: number | null
  ratingComment?: string | null
  modelProfileId?: number | null
  visualPurpose?: 'funnel' | 'sales' | 'internal' | 'proof' | null
  visualFormat?: 'photo' | 'video' | 'circle' | 'screenshot' | 'document' | null
  compositionSteps?: string | null
  referenceInstructions?: string | null
  priorityOverride?: boolean | null
  isEmergency?: boolean | null
  auctionStartedAt?: string | null
  auctionEndedAt?: string | null
  auctionDuration?: number | null
  maxBudget?: string | null
  winningBidId?: number | null
  excludedDesignerIds?: number[]
  createdAt: string
  updatedAt: string
}
```

Почему так:
- это уже ближе к `visual_requests`-модели из `D7-ANAL`
- не смешивает visuals с legacy `creatives`
- покрывает и direct assignment, и auction path

### 3.2 `VisualFile`

```ts
export type VisualFile = {
  id: number
  visualRequestId: number
  fileType: 'reference' | 'result' | 'attachment'
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType?: string | null
  version: number
  uploadedById?: number | null
  createdAt: string
}
```

MVP usage:
- references для входящих материалов
- results для output дизайнера
- attachments для чата можно оставить тем же типом либо отдельно

### 3.3 `VisualMessage`

```ts
export type VisualMessage = {
  id: number
  visualRequestId: number
  userId: number
  text: string
  isDeleted: boolean
  createdAt: string
  updatedAt?: string | null
}
```

### 3.4 `VisualMessageAttachment`

```ts
export type VisualMessageAttachment = {
  id: number
  messageId: number
  fileName: string
  fileUrl: string
  mimeType?: string | null
  fileSize?: number | null
}
```

### 3.5 `VisualStatusLog`

```ts
export type VisualStatusLog = {
  id: number
  visualRequestId: number
  fromStatus: VisualRequestStatus | null
  toStatus: VisualRequestStatus
  changedById?: number | null
  comment?: string | null
  createdAt: string
}
```

Нужен даже в MVP, потому что:
- timeline на странице visuals опирается на историю переходов
- дедлайны/разбор кейсов потом без логов будет трудно нарастить

### 3.6 `VisualAuctionBid` (если auction в MVP)

```ts
export type VisualAuctionBid = {
  id: number
  visualRequestId: number
  designerId: number
  amount: string
  estimatedTime?: string | null
  proposedDeadline?: string | null
  createdAt: string
}
```

### 3.7 `VisualTemplate` (не первый приоритет)

Шаблоны есть в `D7-ANAL`, но для MVP они optional.
Если время ограничено — не переносить в первую поставку.

### 3.8 `VisualGalleryItem`

```ts
export type VisualGalleryItem = {
  id: number
  visualRequestId: number
  comment: string
  sharedByUserId: number
  createdAt: string
}
```

Фактически в list API галерея должна приходить уже денормализованной, с summary исходной заявки и с `resultFiles`.

---

## 4. UI-срезы: что реально переносить как независимые slices

Ниже — разрез по UI, не по файлам-монолитам.

### 4.1 `/visuals` page: MVP slices

`D7-ANAL/client/src/pages/visuals.tsx` — огромный файл. Его нельзя переносить как есть.
Нужно распилить минимум на такие slices:

#### Slice A. Visuals page shell
Назначение:
- route entry
- top-level query params / local page state
- wiring layout

Что содержит:
- view mode state (`list` / `kanban`)
- selected visual id
- create modal open state
- search/filter state

#### Slice B. Visuals filters bar
MVP controls:
- status filter
- department filter
- role-aware preset:
  - my requests
  - my active work
  - auction / open
- search by `displayId` / text

#### Slice C. Visuals list / cards
MVP для card/list item:
- displayId
- taskType
- department
- urgency
- status badge
- requester / assigned designer names
- revision count
- createdAt / updatedAt
- deadlineAt
- CTA: open detail

#### Slice D. Visuals kanban board
Если хотим быстрее extraction — kanban можно не включать в first functional MVP.
Но если переносим, то только read + open detail.
Без drag-and-drop.

#### Slice E. Visual detail panel
Это один из самых важных срезов.
Должен показывать:
- header: `displayId`, status, urgency, task type
- business meta: department, project, geo, language, format
- formData summary
- visual-specific fields:
  - `visualPurpose`
  - `visualFormat`
  - `compositionSteps`
  - `referenceInstructions`
- assigned designer / requester
- references/results files tabs or blocks
- status actions block
- chat block
- auction block (если включён)
- gallery share action (если accepted)

#### Slice F. Create visual modal
Создавать как отдельный reusable slice, потому что:
- используется на `/visuals`
- и переиспользуется из `/visual-gallery` для “создать на основе gallery item”

MVP form sections:
1. common fields
   - department
   - taskType
   - urgency
   - project
   - geo
   - language
   - format
2. brief / formData
3. visual-only block
   - visualPurpose
   - visualFormat
   - compositionSteps
   - referenceInstructions
4. attachments / references
5. gallery source prefill (optional)

#### Slice G. Status actions panel
Отдельный action component, потому что бизнес-правила завязаны на role + current status.

MVP actions:
- assign designer
- send to auction
- submit result
- request revision
- accept
- cancel
- edit if `new`

#### Slice H. Files panel
MVP blocks:
- reference files list
- result files list
- upload button(s)
- preview/download links

#### Slice I. Visual chat
Уже выделен в `client/src/components/visuals/VisualChat.tsx`.
Для extraction это хороший готовый boundary.

---

### 4.2 `/visual-gallery` page: MVP slices

`D7-ANAL/client/src/pages/visual-gallery.tsx` уже ближе к самостоятельному модулю, чем `visuals.tsx`.

Нужные slices:

#### Slice A. Gallery page shell
- fetch gallery items
- manage lightbox state
- manage “order from gallery” flow

#### Slice B. Gallery card grid
На карточке нужны:
- превью первого файла
- счётчик файлов
- comment
- displayId
- taskType
- project / geo / format
- author / createdAt
- CTA “Заказать похожее / Использовать как основу”

#### Slice C. Gallery lightbox
- image/video preview
- next/prev
- open in new tab
- download

#### Slice D. Create-from-gallery bridge
- преобразует gallery item в prefilled create modal payload
- это must-have bridge между gallery и create flow

---

## 5. Рекомендуемый MVP extraction order

### Step 0. Contracts first
В `d7-design-product` сначала завести типы/контракты, не UI:
- `VisualRequest`
- `VisualFile`
- `VisualMessage`
- `VisualStatusLog`
- `VisualGalleryItem`
- `VisualAuctionBid` (если нужен)

### Step 1. Server read path
Сначала поднять read-only endpoints:
- `GET /api/visuals`
- `GET /api/visuals/:id`
- `GET /api/visuals/:id/files`
- `GET /api/visuals/:id/messages`
- `GET /api/visual-gallery`

Это даст возможность быстро собрать экран без write business logic.

### Step 2. Core write path without auction
Далее:
- `POST /api/visuals`
- `PATCH /api/visuals/:id/assign`
- `PATCH /api/visuals/:id/status`
- `POST /api/visuals/:id/files`
- `POST /api/visuals/:id/messages`
- `POST /api/visual-gallery`

Это уже даст usable direct-assignment MVP.

### Step 3. Add auction path
После стабилизации direct flow:
- `POST /api/visuals/:id/send-to-auction`
- `PATCH /api/visuals/:id/hod-setup`
- `POST /api/visual-auction-bids`
- `GET /api/visuals/:id/auction-info`
- `GET /api/visual-auction-bids/my/:visualId`

### Step 4. Nice-to-have ops
Потом уже:
- analytics
- queue position
- deadline extension
- return-to-auction variants
- penalty config
- cron automation

---

## 6. Что не переносить 1:1 из D7-ANAL в первый проход

Не повторять сразу все тяжёлые части монолита:

1. гигантский `visuals.tsx` page file
2. весь auction edge-case matrix
3. overdue penalty config UI
4. cron/auto-accept behavior
5. model-search integration
6. full anonymity logic и все nuanced visibility rules
7. chunked upload registration
8. all-status-logs / analytics dashboards

Идея: сначала переносим понятный, короткий, проверяемый продуктовый контур.

---

## 7. Suggested target module structure in d7-design-product

### Client

```text
client/src/modules/visuals/
  index.ts
  types.ts
  api/
    visuals.ts
    gallery.ts
  components/
    visuals-page-shell.tsx
    visuals-filters.tsx
    visuals-list.tsx
    visual-card.tsx
    visual-detail-panel.tsx
    visual-files-panel.tsx
    visual-status-actions.tsx
    visual-create-modal.tsx
    visual-chat-panel.tsx
    gallery-grid.tsx
    gallery-card.tsx
    gallery-lightbox.tsx
  hooks/
    use-visuals-filters.ts
    use-visual-detail.ts
```

### Server

```text
server/src/modules/visuals/
  index.ts
  routes.ts
  contracts.ts
  service.ts
  repository.ts
```

Если пока storage mock/in-memory — это ок. Важно зафиксировать boundary.

---

## 8. Минимальные зависимости visuals-модуля от foundation

Visuals-модуль в `d7-design-product` должен зависеть только от:
- users
- projects
- auth/current user
- file storage abstraction

Желательно не связывать MVP visuals напрямую с:
- payroll
- designer payouts
- admin export
- telegram channels
- design-team reports
- legacy creatives internals

---

## 9. Конкретный MVP backlog для следующего extraction-агента

### Backend
1. Завести `server/src/modules/visuals/contracts.ts`
2. Завести `server/src/modules/visuals/routes.ts`
3. Поднять mock/in-memory endpoints:
   - `GET /api/visuals`
   - `GET /api/visuals/:id`
   - `POST /api/visuals`
   - `PATCH /api/visuals/:id/status`
   - `PATCH /api/visuals/:id/assign`
   - `GET /api/visuals/:id/files`
   - `GET /api/visuals/:id/messages`
   - `GET /api/visual-gallery`
4. Подключить module register в `server/src/index.ts` только когда routes не ломают build

### Frontend
1. Завести `client/src/modules/visuals/types.ts`
2. Завести `client/src/modules/visuals/api/visuals.ts`
3. Завести `client/src/modules/visuals/api/gallery.ts`
4. Вынести first slice: `visual-create-modal`
5. Вынести second slice: `visual-chat-panel`
6. Потом собирать page shell для `/visuals`
7. Потом отдельную `/visual-gallery`

---

## 10. Мои product/architecture decisions для переноса

### Decision A
Для первого extraction cut лучше запускать **direct-assignment MVP + gallery**, а аукцион подключать вторым шагом.

Причина:
- аукцион даёт disproportionate complexity
- direct flow уже покрывает основной полезный сценарий
- UI/endpoint surface резко упрощается

### Decision B
`VisualChat` — это хороший extraction boundary, его стоит переносить рано.

### Decision C
`CreateModal` надо проектировать как reusable module component, а не как часть одной страницы.

### Decision D
Gallery стоит держать внутри того же `visuals` module family, а не выносить в отдельный top-level domain.

### Decision E
Если придётся выбирать между `kanban` и `detail panel + actions`, канбан нужно отложить. Detail panel важнее.

---

## 11. Source anchors in D7-ANAL

Куда смотреть следующему агенту при реальном переносе:

### Frontend
- `D7-ANAL/client/src/pages/visuals.tsx`
- `D7-ANAL/client/src/pages/visual-gallery.tsx`
- `D7-ANAL/client/src/components/visuals/VisualChat.tsx`

### Backend
- `D7-ANAL/server/modules/visuals/routes.ts`
- `D7-ANAL/server/storage/visuals.ts`
- `D7-ANAL/shared/schema` (таблицы `visual_requests`, `visual_files`, `visual_messages`, `visual_status_logs`, `visual_gallery`, `visual_auction_bids`)

---

## 12. Short extraction summary

Если совсем коротко, то MVP visuals для переноса =
- create request
- list/detail
- assign/take
- status transitions
- files
- chat
- accepted -> gallery
- gallery -> create-from-source

Аукцион, аналитика, penalty/cron и сложные edge-cases — не первый cut.
