# CivicDesk Frontend Plan (canonical, living)

**Read and update this file every session.** The older
`CivicDesk_Frontend_Plan 1.md` in this folder is the original three-person team
plan. It is now used only as the **functional spec for Track 2** (its Section 24)
and the **modal design** (its Section 33.9). Everything current lives here.

- **Repo:** `civicdesk-frontend`, working branch `sazzad-frontend`
- **Owner:** solo build (one person)
- **Backend:** `../civicdesk-backend`, NestJS, `:3000`, Swagger at `/api`
- **Frontend:** Next.js 16 App Router + TypeScript + Tailwind v4, `:3001`
- **Last updated:** 2026-09-07

---

## 1. Scope

**Only Track 2 of the old plan (its Section 24): the admin CRUD area.**

| Task | Route | Status |
|---|---|---|
| T2.1 Departments | `/admin/departments` | to build |
| T2.2 Wards | `/admin/wards` | to build |
| T2.3 Categories | `/admin/categories` | to build |
| T2.4 SLA policies | `/admin/sla-policies` | to build |
| T2.5 Staff management | `/admin/users` | to build |
| T2.6 Analytics | `/analytics` (its own route, not under `/admin`) | to build |

**Out of scope** (leave the current stubs untouched): grievance detail, all
engagement panels, notifications, and the `/admin/tags`,
`/admin/canned-responses`, `/admin/escalation-rules` pages. The user will say if
any of these come back.

---

## 2. Decisions

| # | Decision |
|---|---|
| D1 | Build on top of the existing scaffold, do not rewrite. |
| D2 | Track 2 only (Section 1). |
| D3 | No AI. |
| D4 | Frontend only, no backend changes. Every backend gap is worked around here (Section 6). |
| A1 | **T2.6 Analytics is in scope now**, built alongside T2.1 to T2.5. |
| A2 | **Staff ward multi-select is replace-all and starts blank**, with an explicit label that unselected wards are removed. No reconstruction of current wards. |
| A3 | **Count columns: cheap ones only.** Departments show a "Categories" count (one extra `GET /categories?includeInactive=true`, joined client-side). Drop "# officers" and "# complaints" columns everywhere. No per-row N+1 calls. |
| A4 | **Admin guard lives in `src/app/admin/layout.tsx`** as a client wrapper (`RoleGate allow={["admin"]}` with a permission fallback). `/analytics` gets the same guard in `src/app/analytics/layout.tsx`. Backend 403s remain the real enforcement. |

---

## 3. What already exists (relevant to Track 2)

**Primitives to use as-is** (`src/components/ui/`): `Button` (variants
`primary` / `secondary` / `danger` / `ghost`, `loading`, `disabled`), `Input`,
`Textarea`, `Select` (chevron, wires into `Field` context), `Field` (label +
help + error + `aria-*`, context-based), `Card`, `Badge`, `Modal` (native
`<dialog>`, sizes `sm` = max-w-md, `md` = max-w-xl, `footer` slot, backdrop
click + Escape close), `Table` / `THead` / `TBody` / `TR` / `TH` / `TD`
(compound, already wrapped in an `overflow-x-auto` bordered card), `Spinner`,
`EmptyState`, `ErrorState`, `Pagination` (`page` / `limit` / `total` /
`onPageChange`), `ConfirmDialog` (`tone="danger"`, `loading`, names the thing),
`Toast` + `useToast()` (`showToast(message, "success" | "error" | "info")`).

**Data layer** (`src/lib/`): `http` (axios at `/api`), `errorMessage(err)`,
`fieldErrors(err)` (maps 400/422 class-validator messages to
`Record<field,string>`), `zodFieldErrors(zodError)`, `qk` query keys,
`useToast`. **Taxonomy hooks** (`src/hooks/useTaxonomy.ts`): `useDepartments()`,
`useWards()`, `useCategories()` (NB: defaults to active only), `useTags()`.
`useCurrentUser()` -> `["me"]`.

**Admin shell:** `src/app/admin/layout.tsx` currently wraps `AppShell` only, no
role check (A4 fixes this). All six admin/analytics pages are stubs rendering a
`PageHeader` with "Track 2 is building this section". `src/app/admin/page.tsx`
does not exist, so a manual visit to `/admin` 404s (add a redirect to
`/admin/departments`). Sidebar nav (`src/lib/roles.ts`) already lists every
admin link; the three out-of-scope ones keep their stubs.

**Backend seed / test data:** run the backend (`npm run start:dev`) then
`npm run seed`. Admin login: `admin@civicdesk.local` / `AdminPass1!`. Seed
creates 2 departments, 3 wards, 3 categories, 3 SLA policies, 2 officers,
2 citizens, 5 grievances.

---

## 4. Shared pieces to build first

Path: `src/components/admin/`.

1. **`AdminGuard`** (client). Wraps children in the admin check; renders a
   permission `EmptyState` ("You do not have permission to view this area.") for
   non-admins, a `Spinner` while `useCurrentUser` loads. Used by
   `admin/layout.tsx` and `analytics/layout.tsx`.
2. **`CrudPage`** (or just a consistent pattern, not over-abstracted). Each admin
   page = `PageHeader` (title + row count in the description + an "Add ..."
   `Button` action) + filters row (optional) + a table + a create/edit `Modal` +
   a `ConfirmDialog`. Four states every time (loading skeleton rows, empty with a
   CTA, error with retry, normal).
3. **`CrudTable`** thin helper over the `Table` primitives: takes columns +
   rows + a render-per-row, plus a right-aligned actions cell. Keep it simple;
   forms stay bespoke per resource.
4. **`Checkbox`** (`src/components/ui/`) — new shared primitive. Needed by T2.3
   (show-retired filter, Active toggle) and T2.5 (ward multi-select). Token-based,
   44px hit area, label, optional help, `aria-*`. Deliberate addition, noted here.
5. One **zod schema file per resource** in `src/lib/schemas/`:
   `department.ts`, `ward.ts`, `category.ts`, `slaPolicy.ts`, `staff.ts`. Each
   exports the schema + inferred input type. Messages are user-facing sentences.
6. Add query keys to `src/lib/queryKeys.ts`: `slaPolicies`, `users(query)`,
   `analytics(section)`, and reuse `departments` / `wards` / `categories` /
   `tags`. After any mutation, invalidate the matching key.

---

## 5. Screen specs

Common: admin only (A4). Create/edit through a `Modal`. Validate on submit with
zod, then map the server's 400 back onto fields with `fieldErrors`. Success ->
`useToast("...", "success")`, close modal, invalidate the list. 409 and other
failures -> the rewritten sentence (below) in a panel above the form's actions.
Edit modals load initial values from the row already in the list; they also fire
the `GET /:id` (cheap bare entity) to refresh, **except staff** (Section 6, W-STAFF-3).

### T2.1 Departments  `/admin/departments`
- **List:** `GET /departments` -> `{id,name,description}[]`. Columns: **Name**,
  **Description**, **Categories** (count, from one `GET /categories?includeInactive=true`
  grouped by `departmentId`).
- **Create/Edit form:** `name` (required, min 2), `description` (optional textarea).
  `POST /departments` / `GET /departments/:id` + `PATCH /departments/:id`.
- **Delete:** `ConfirmDialog` naming the department. `DELETE /departments/:id`.
  409 -> "This department still has officers or categories assigned. Move or
  remove them first." (covers both backend messages).
- 409 on create/rename (duplicate name) -> "A department with that name already
  exists."

### T2.2 Wards  `/admin/wards`
- **List:** `GET /wards` -> `{id,name,code}[]`. Columns: **Name**, **Code**.
  No count column (A3). **No delete** (no endpoint). One-line note above the
  table: "Wards cannot be deleted because complaints are linked to them."
- **Create/Edit form:** `name` (required, min 1), `code` (required, min 1).
  `POST /wards` / `GET /wards/:id` + `PATCH /wards/:id`.
- 409 (duplicate code) -> "A ward with code {code} already exists."

### T2.3 Categories  `/admin/categories`
- **List:** `GET /categories` with `?departmentId=` (filter) and
  `?includeInactive=true` (when "Show retired" is on; default off).
  Columns: **Name**, **Department** (name joined from `useDepartments()`),
  **Status** (Active / Retired `Badge`).
- **Filters:** department `Select`; "Show retired" `Checkbox`.
- **Create form:** `name` (required, min 2), `description` (optional),
  `departmentId` (required `Select`). `POST /categories`.
- **Edit form:** same fields + **Active** `Checkbox`. `GET /categories/:id` +
  `PATCH /categories/:id` (unchecking Active = the retire path). Help under the
  toggle: "Retiring a category hides it from the report form but keeps existing
  complaints."
- **Delete:** `ConfirmDialog`. `DELETE /categories/:id`. 409 (referenced by an
  SLA policy) -> "This category is used by an SLA policy. Retire it instead, or
  delete the policy first." Any other failure (e.g. grievances reference it ->
  backend 500) -> generic error; the copy already nudges toward retiring.

### T2.4 SLA policies  `/admin/sla-policies`
- **List:** `GET /sla-policies` -> `{id,categoryId,priority,responseDueHours,
  resolutionDueHours}[]`. Join category + department name from
  `useCategories()` called with `includeInactive` so retired categories still
  resolve. **Group the table by category** (category name as a subheading row,
  its policies beneath). Per-policy columns: **Priority**, **Response (hours)**,
  **Resolution (hours)**, actions.
- Note above the table: "If no policy matches a complaint's category and
  priority, the system default applies."
- **Create form:** `categoryId` (required `Select`, active categories),
  `priority` (required `Select`: Low / Medium / High / Urgent),
  `responseDueHours` (integer >= 1), `resolutionDueHours` (integer >= 1).
  `POST /sla-policies`.
- **Edit form:** same. `GET /sla-policies/:id` + `PATCH /sla-policies/:id`.
- **Delete:** plain `ConfirmDialog`. `DELETE /sla-policies/:id`.
- 409 (duplicate category+priority) -> "A policy already exists for {category} at
  {priority} priority. Edit that one instead."

### T2.5 Staff management  `/admin/users`
- **List:** `GET /users?role=&departmentId=&page=&limit=20` ->
  `{data: toUserResponse[], total, page, limit}` where a row is
  `{id,email,fullName,phone,role,isActive,departmentId,createdAt}`.
  Columns: **Name**, **Email**, **Role** (`Badge`), **Department** (name joined,
  "-" when none), **Status** (Active / Inactive `Badge`), actions ("Manage").
- **Filters:** role `Select` (All / Citizen / Officer / Admin), department
  `Select`. `Pagination`.
- **Add staff modal:** `email` (required, email), `fullName` (required, min 2),
  `phone` (optional), `password` (required, min 8), `role` (required `Select`:
  Officer / Admin only). `POST /users`. 409 -> "An account with that email
  already exists." Note under the form: "New officers get their department and
  wards from the Manage panel after they are created."
- **Manage {name} modal** (officer, active):
  - **Department:** `Select` (from `useDepartments()`) + Save ->
    `PATCH /users/:id/department` `{departmentId}`.
  - **Wards:** `Checkbox` list from `useWards()`, **starts blank** (A2). Label:
    "This replaces {name}'s entire ward coverage. Any ward not selected here is
    removed." Save -> `PATCH /users/:id/wards` `{wardIds}`.
  - **Deactivate:** danger button -> `ConfirmDialog`: "Deactivate {name}? They
    are signed out on their next action and their open complaints return to the
    queue. This cannot be undone here." -> `PATCH /users/:id/deactivate`.
  - Line in the modal: "Name, email, and phone cannot be edited (no endpoint)."
- **Manage modal** (admin role): only Deactivate. (Backend 400s on
  department/wards for non-officers.)
- **Manage modal** (inactive user): "This account is deactivated." Nothing
  actionable (no reactivate endpoint).

### T2.6 Analytics  `/analytics`
- Guard `src/app/analytics/layout.tsx` with `AdminGuard` (A4). All endpoints are
  admin-only.
- **Summary cards** from `GET /analytics/overview`
  (`{byStatus:{OPEN,IN_PROGRESS,WAITING_ON_CITIZEN,RESOLVED,REOPENED,CLOSED},
  total, openCount, resolvedCount, responseBreachRate, resolutionBreachRate}`):
  Total, Open, In progress, Resolved, Closed, Resolution breach rate
  (`resolutionBreachRate * 100`, 1 dp).
- **Bar charts** (`recharts`, horizontal, primary ramp colours in order,
  title + axis label, "No data yet" when empty). Coerce string counts with
  `Number()`:
  - `GET /analytics/departments` -> `{name,total}` per department
  - `GET /analytics/wards` -> `{name,total}` per ward
  - `GET /analytics/categories` -> `{name,total}` per category
- **Officer performance table** `GET /analytics/officers` ->
  `{fullName, assigned, resolved, avgResolutionHours, avgCsat}`. Columns: Name,
  Assigned, Resolved, Avg resolution (hours, 1 dp, `null` -> "-"), Avg rating
  (1 dp, `null` -> "-").
- **Breach panel** `GET /analytics/sla` -> rows of
  `{department, priority, responseBreaches, resolutionBreaches, total}`. Small
  table grouped by department, showing response vs resolution breach counts.
- All chart/table components are `"use client"`. Wrap charts in
  `ResponsiveContainer` with a fixed-height parent.

---

## 6. Backend gaps that shape Track 2 (D4 workarounds)

| id | Gap | Handling |
|---|---|---|
| W-LIST | `GET` list endpoints return bare rows: no joined names, no counts. | Join department/category names client-side from the taxonomy hooks. Counts: departments "# categories" only, via one extra call (A3). Everything else dropped. |
| W-CAT-DEL | `DELETE /categories/:id` only blocks on SLA-policy references, not grievances. A grievance-referenced category fails at the DB and surfaces as a 500. | Copy steers admins to "retire". The 500 shows the generic error sentence. |
| W-STAFF-1 | `POST /users` ignores `departmentId` (controller hardcodes it out). | Two-step: create, then set department in the Manage modal. Copy says so. |
| W-STAFF-2 | No `PATCH /users/:id` for name / email / phone. | Manage modal states these are not editable. |
| W-STAFF-3 | `GET /users/:id` returns the raw entity **including `passwordHash`**. | Not called. Manage modal uses the list row. Coverage row left unticked on purpose; flagged to the user for a later backend fix. |
| W-STAFF-4 | No endpoint returns an officer's current wards; `PATCH /users/:id/wards` replaces the whole set. | Multi-select starts blank with an explicit "this replaces everything" label (A2). |
| W-STAFF-5 | Deactivate is one-way (no reactivate endpoint). | Confirm dialog says "cannot be undone here". Inactive rows show no actions. |
| W-ANALYTICS | Raw SQL rows: counts as strings, `avgResolutionHours` / `avgCsat` nullable. | `Number()` coercion for display; `null` -> "-". Percentages come pre-computed from the API. |
| W-GUARD | `admin/layout.tsx` and `analytics/layout.tsx` have no role check; `proxy.ts` only checks cookie presence. | `AdminGuard` client wrapper in both layouts (A4). |

---

## 7. Coverage checklist (Track 2 endpoints)

- [ ] `GET /` (health) -> **not in Track 2** (About page, out of scope)
- [x] `POST /departments`  [x] `GET /departments`
      [x] `PATCH /departments/:id`  [x] `DELETE /departments/:id`
- [~] `GET /departments/:id` -> not used: returns data identical to the list row,
      and calling it in an effect tripped `react-hooks/set-state-in-effect`.
- [ ] `POST /wards`  [ ] `GET /wards`  [ ] `GET /wards/:id`  [ ] `PATCH /wards/:id`
- [ ] `GET /wards/:id/officers` -> **not used in Track 2** (was for grievance assign)
- [ ] `POST /categories`  [ ] `GET /categories`  [ ] `GET /categories/:id`
      [ ] `PATCH /categories/:id`  [ ] `DELETE /categories/:id`
- [ ] `POST /sla-policies`  [ ] `GET /sla-policies`  [ ] `GET /sla-policies/:id`
      [ ] `PATCH /sla-policies/:id`  [ ] `DELETE /sla-policies/:id`
- [ ] `POST /users`  [ ] `GET /users`  [ ] `PATCH /users/:id/department`
      [ ] `PATCH /users/:id/wards`  [ ] `PATCH /users/:id/deactivate`
- [~] `GET /users/:id` -> intentionally skipped (W-STAFF-3)
- [ ] `GET /analytics/overview`  [ ] `/officers`  [ ] `/departments`
      [ ] `/categories`  [ ] `/wards`  [ ] `/sla`

---

## 8. Build order and how we work

**Working rules (set by the user 2026-09-07):**
- **The assistant never runs git.** No `add`, `commit`, `push`, `branch`. Not on
  `sazzad-frontend`, not anywhere.
- **One step at a time.** Do a step, run `npm run typecheck` + `npm run lint`,
  report results, then give the user exact manual test steps (commands, URL,
  what to click, expected result). Stop and wait.
- The user tests, commits themselves, and says when to start the next step. The
  assistant may suggest a commit message but does not commit.
- **`node_modules` is not installed yet.** First thing the user runs:
  `npm install` in `civicdesk-frontend`. Backend must also be running and seeded.

| Step | Contents | Depends on |
|---|---|---|
| S0 | DONE (committed). `AdminGuard` + wired into `admin/layout.tsx` and `analytics/layout.tsx`. `src/app/admin/page.tsx` redirects to `/admin/departments`. | - |
| S1 | DONE (awaiting user test/commit). T2.1 Departments: table, add/edit modal, delete + 409 copy, 4 states, toasts. Categories count via one `GET /categories?includeInactive=true`. Notes below. | S0 |
| S2 | T2.2 Wards: table, add/edit, no delete + note. | S1 |
| S3 | T2.3 Categories: `Checkbox` primitive, department filter, show-retired toggle, Active/retire toggle. | S1 |
| S4 | T2.4 SLA policies: grouped-by-category table, duplicate-pair 409 copy, fallback note. | S1, S3 |
| S5 | T2.5 Staff: list + role/department filters + pagination; Add modal; Manage modal (department, replace-all ward checkboxes starting blank, one-way deactivate). | S1, S3 |
| S6 | T2.6 Analytics at `/analytics`: overview cards, 3 `recharts` bar charts, officer table, SLA breach table, "no data" states. | S0 |
| S7 | Pass: 390 / 768 / 1440 responsive, keyboard + focus, greyscale, four-states audit, coverage checklist ticked. | S1 to S6 |

`CrudTable` / shared helpers are extracted only if real duplication appears
across S1 to S3, not built speculatively in S0.

---

## 9. Conventions (inherited)

- `.tsx` for markup, `.ts` for logic. Routes only in `src/app`.
- No hex / font-size / spacing literal outside `globals.css`; use tokens.
- No em dashes anywhere (code, comments, copy, commits).
- Every screen: loading, empty, error, normal.
- Validate on submit; clear a field error as the user fixes it; server 400 maps
  back onto fields via `fieldErrors`.
- Plain-language, sentence-case copy. No system words or raw status codes shown.
- Dates: "12 Sep 2026, 3:40 PM". Relative time only in addition.
- Backend has `forbidNonWhitelisted: true`: send exactly the DTO shape, no stray
  fields.

---

## 10. Open items

1. **Commits are the user's job.** The assistant never runs git. The user
   decides the branch and PR flow. (Do not commit to `sazzad-frontend`.)
2. **`GET /users/:id` passwordHash leak** (W-STAFF-3): flagged for a later
   backend fix; not blocking Track 2.
3. Custom features beyond Track 2: none for now; the user will say.
4. **`useCategories` hook** may need an optional `{ includeInactive }` arg (used
   by S1 count column and S3 filter). Extending the shared hook is low risk;
   alternative is a one-off query in each page.

---

## 11. Changelog

- **2026-09-08**: S1 Departments built. New: `src/lib/schemas/department.ts`,
  `src/components/admin/DepartmentForm.tsx` (form is a keyed component, reset by
  remount, so no setState-in-effect), `src/app/admin/departments/page.tsx`.
  Modified: `useCategories()` gains optional `{ includeInactive }`;
  `qk.categories` is now a function + `qk.department(id)` added;
  `ConfirmDialog` gains optional `error?: string` (red panel in the dialog, for
  delete 409s). `GET /departments/:id` intentionally not used (see Section 7).
- **2026-09-08**: S0 Admin guard built and committed.
- **2026-09-07**: Scope narrowed to Track 2 only (T2.1 to T2.6). Decisions
  A1 to A4 recorded. `.env.local` created. Backend gaps re-scoped to Track 2
  (W-LIST, W-CAT-DEL, W-STAFF-1..5, W-ANALYTICS, W-GUARD). Build order S0 to S7.
- **2026-09-07 (earlier)**: File created; full-frontend decisions D1 to D5;
  backend reviewed.
