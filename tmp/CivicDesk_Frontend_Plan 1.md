# CivicDesk Frontend: Complete Build Plan

**Repo:** `civicdesk-frontend`, a new repository, separate from `civicdesk-backend`
**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
**Runs:** locally, Nest on port 3000 and Next on port 3001, both started by hand
**Team:** three people, three tracks
**Version:** v2. Replaces the earlier draft completely.

This document contains everything. There are no instructions outside it. If something is not written here, it is not part of the project.

---

# PART A: WHAT AND WHY

## 1. The goal

**Every endpoint the NestJS backend exposes must be used by a screen in this Next.js app.** The backend has 16 controllers and roughly 71 endpoints. An endpoint with no screen is a feature nobody can see, and it will be counted as unfinished work.

Section 14 is the coverage table. It lists every endpoint, the screen that uses it, and the person who owns that screen. It is the checklist the project is measured against.

Three secondary goals sit underneath that, and all three are graded:

1. **Nothing important lives in the browser.** A user must not be able to change what they are allowed to do by editing anything on their own machine. Section 5 is the full rule set.
2. **The interface is genuinely well designed**, with a colour system that is derived rather than picked by eye, and simple enough for a person of any age to use without help. Section 9.
3. **Every error the user can hit produces a clear sentence telling them what happened and what to do.** Section 10.

## 2. Who uses it

| Role | What they do in this app |
|---|---|
| **Citizen** | Registers, signs in, reports a problem, receives a tracking code, follows progress, replies to the officer, uploads evidence, reopens a bad fix, rates the service |
| **Officer** | Signs in, sees the queue for their department and the wards they cover, claims a complaint, works it, replies publicly, writes internal notes, attaches evidence, asks the citizen for information, recategorises, escalates, resolves |
| **Admin** | Everything an officer can do, plus configuring departments, wards, categories, SLA policies, tags, canned responses and escalation rules, creating and managing staff, and reading analytics |

The backend already decides who sees what. `GET /grievances` returns different rows for each of the three roles from the same URL. **The frontend never re-implements a permission rule.** It hides buttons that would obviously fail, and shows a clear message when the server refuses.

## 3. Glossary

Read this once. Everything after it assumes these words.

| Word | What it means here |
|---|---|
| **App Router** | The Next.js system where a folder inside `src/app` becomes a URL. `src/app/about/page.tsx` becomes `/about`. |
| **`page.tsx`** | The file that renders a URL. One per route folder. Nothing else in `src/app` renders a page. |
| **`layout.tsx`** | Wraps every page below it. We have exactly one, at the root, and it loads fonts and providers. |
| **Route handler** | A file at `src/app/api/.../route.ts`. It runs on the server, not in the browser. It is how we talk to Nest without exposing anything. |
| **Client component** | A file starting with `"use client"`. It runs in the browser and can use `useState` and event handlers. Almost all our components are these. |
| **Server component** | The default in the App Router. Runs only on the server. We use it only for the root layout. |
| **Signed-in check** | `src/proxy.ts`. Runs on the server before a page loads. We use it to bounce signed-out visitors to `/login`. Next.js 16 renamed this file convention from `middleware.ts` to `proxy.ts`. Not to be confused with the API proxy route. |
| **API proxy route** | `src/app/api/[...path]/route.ts`. Receives every call the browser makes, reads the token from the cookie, and forwards to Nest. |
| **httpOnly cookie** | A cookie the server can read but browser JavaScript cannot. This is where the token lives. |
| **Proxy** | Our own `src/app/api/[...path]/route.ts`. The browser calls it, it calls Nest and adds the token. |
| **TanStack Query** | The library that fetches data and gives us `isLoading`, `error` and `data` without writing that logic twenty times. |
| **Token / JWT** | The signed string that proves who you are. The browser never sees ours. |
| **Invariant** | A rule the backend guarantees is always true. Written as INV-1 to INV-12 in the PRD. The frontend must never assume it can break one. |

## 4. Architecture

```
  Browser (localhost:3001)
      |
      |  fetch("/api/grievances")        same origin, no token in the browser
      v
  Next.js server (localhost:3001)
      |
      |  src/app/api/[...path]/route.ts
      |  reads the httpOnly cookie, adds Authorization: Bearer ...
      v
  NestJS API (localhost:3000)
      |
      v
  PostgreSQL
```

**Why the middle layer exists.** If the browser called Nest directly, the token would have to live somewhere browser JavaScript can read: `localStorage` or a plain cookie. Anything JavaScript can read, an injected script can steal, and a user can read it too by opening DevTools. Putting the token in an httpOnly cookie and adding it server side means the browser never holds anything worth stealing. This directly answers the requirement that critical data must not sit in the frontend.

**It is one file, not seventy-one.** A single catch-all route forwards any path and any method. The rest of the app never knows it is there.

**Both apps still run separately on their own ports.** The proxy is not a merge. Nest is started with `npm run start:dev` on 3000, Next with `npm run dev` on 3001, in two terminals.

**CORS stays configured on the backend anyway.** In the intended flow the browser never crosses origins, so it does nothing. It is kept for three reasons: it is correct practice, it is insurance if the proxy is ever bypassed, and it is what the course taught. Section 6, B6.

---

# PART B: THE RULES

## 5. What must never live in the frontend

This section is a requirement, not advice. Every line here is something a user could otherwise manipulate.

### 5.1 Secrets and identity

1. **The JWT never reaches browser JavaScript.** It lives in an httpOnly, `sameSite: "strict"` cookie set by our own server route. `localStorage` and `sessionStorage` are not used anywhere in this project for anything.
2. **No `NEXT_PUBLIC_` variables.** Anything with that prefix is compiled into the JavaScript the browser downloads and can be read by anyone. Our backend address is `API_URL`, read only on the server.
3. **The user object is never persisted.** It lives in the TanStack Query cache in memory, keyed `["me"]`, and disappears on refresh, at which point it is fetched again from `GET /auth/me`.
4. **The role is never read from the token and never stored.** It comes from `GET /auth/me` on every page load. The backend re-reads the user from the database on every request, which is why deactivating an officer takes effect immediately rather than when their token expires. A stored role would be stale and editable.
5. **No password is ever kept in state after the request is sent.** Clear the field on submit.
6. **Nothing is logged.** No `console.log` of responses, tokens, or user objects in committed code. ESLint rule `no-console` set to error, with `console.error` allowed.

### 5.2 Decisions the frontend is not allowed to make

The frontend may hide a button. It may never decide an answer. Every one of these is computed by the server and only displayed by us:

| Never computed in the browser | Where it comes from |
|---|---|
| Whether an officer may be assigned a complaint | `GET /grievances/:id/eligible-officers`. The backend has one definition of eligibility. A second copy in TypeScript would drift the first time a ward changes |
| Which department a complaint belongs to | `category.department` on the response. INV-2 says department is derived through the category and never stored on the grievance |
| Whether a status change is legal | The server's state machine. We send an action, it decides |
| SLA deadlines, and whether a deadline was missed | `responseDueAt`, `resolutionDueAt`, `responseBreached`, `resolutionBreached` on the response. INV-5 says the scanner is the only writer of those flags |
| Whether a citizen may rate, or has already rated | `GET /grievances/:id/rating` |
| Which complaints a user can see | The list endpoint is already role-scoped in the service layer |
| Any total, count, average or breach rate | The analytics endpoints, computed in SQL |

### 5.3 Fields the frontend must never send

Sending any of these is either ignored or rejected by the backend, and attempting it is a design error:

| Do not send | Why |
|---|---|
| `role` on register | The backend hard-codes `citizen`. If the client could set it, anyone could register as an admin |
| `departmentId` on a grievance | Derived from the category. INV-2 |
| `status` as a target value | Send an **action** (`START`, `RESOLVE`, `REOPEN`). The state machine decides the resulting status. INV-6 |
| `trackingCode` | Generated by the server. INV-12 |
| `responseDueAt`, `resolutionDueAt`, breach flags, `resolvedAt`, `pausedMs`, `waitingSince` | Owned by the SLA service and the scanner |
| `citizenId` on a grievance | Taken from the token server side. Sending it would let anyone file on someone else's behalf |
| `assignedOfficerId` directly on an update | Assignment has its own eligibility-checked endpoint |

### 5.4 Interface rules that follow

7. **Hiding a control is cosmetic.** Every admin action must also fail with 403 if reached another way. We never build a feature whose only protection is that the link is not shown.
8. **`RoleGate` and `src/proxy.ts` are convenience, not security.** The signed-in check only confirms that a cookie exists. It does not validate it. Nest does that on every request.
9. **No `dangerouslySetInnerHTML` anywhere.** Message bodies are user-written text and are rendered as text. React escapes by default and we do not opt out.
10. **Attachments are fetched through the proxy**, never by linking directly at the backend, so an unauthenticated URL is never exposed in the DOM.
11. **URLs may be typed by hand.** `/grievances/<someone-elses-id>` must produce the backend's 404 rendered as a friendly page, never a crash and never someone else's data.

### 5.5 The manipulation tests

These are part of the deliverable. They are run in front of the examiner and written into the README. Each one proves a rule above.

| # | What you do | What must happen |
|---|---|---|
| 1 | Sign in as a citizen, open DevTools, run `document.cookie` | The token is not there |
| 2 | Sign in as a citizen, check Application, Local Storage | Empty |
| 3 | As a citizen, type `/admin/users` in the address bar | A permission page, not the admin screen |
| 4 | As a citizen, use DevTools to un-hide a hidden admin button and click it | A clear permission message, no data change |
| 5 | As a citizen, run `fetch("/api/users")` in the console | 403 from the server, rendered as a message |
| 6 | Copy another citizen's grievance id and open it | "We could not find that", which is the backend's 404 and not a leak |
| 7 | As an officer, open a complaint from another department | Permission message |
| 8 | Edit a status button's payload in DevTools to send an illegal action | The state machine rejects it and the message is shown |
| 9 | Register while adding `"role": "admin"` to the request body | An ordinary citizen account is created |
| 10 | Have an admin deactivate an officer while that officer is signed in, then have the officer click anything | Signed out immediately, not at token expiry |

## 6. Backend work

These are pull requests on `civicdesk-backend`, branched from `dev`, squash-merged, same workflow as the rest of that repo. They are part of this project, not a prerequisite to it, and they are owned by Track 1. Their place in the schedule is in Section 18.

**B1. Open `GET /wards` to every signed-in role.**
Ward endpoints are currently admin only. A citizen filling in the submit form needs the ward list, so without this the most important form in the product cannot be completed. Only `GET` opens up. `POST` and `PATCH` stay admin only. This mirrors what `GET /categories` already does and for the same reason.
**Done when** a citizen token gets 200 from `GET /wards` and still gets 403 from `POST /wards`.

**B2. Add `GET /grievances/:id/eligible-officers`.**
Admin only. Returns the sanitised user shape for officers who pass `isEligible` for that grievance, meaning they are active, in the complaint's department, and cover its ward. The assign dropdown reads this.

The cheaper alternative, returning every officer's wards on `GET /users` and filtering in the browser, is rejected. It would place a second copy of the eligibility rule in TypeScript, where it drifts the first time someone changes a ward assignment, and it would leak the full staff directory to build a dropdown. One definition of eligibility, in the backend, is the point.
**Done when** the endpoint returns only eligible officers and any non-admin calling it gets 403.

**B3. Attachment download headers.**
`GET /attachments/:id` must set `content-type` to the stored mime type and `content-disposition` to `attachment; filename="<original name>"`. Without them, every download arrives named `route` with no extension, because the proxy forwards what it is given.
**Done when** a downloaded photo opens with its original name and extension.

**B4. Keep Swagger reachable at `GET /api-json`.**
This is the document the frontend generates its TypeScript types from. If Swagger is ever switched off outside development, type generation breaks.
**Done when** `curl http://localhost:3000/api-json` returns the OpenAPI document.

**B5. A health endpoint that is safe to show.**
`GET /` should return something small and non-sensitive, for example `{ "status": "ok", "name": "CivicDesk API" }`. The frontend shows it as a status line on the About page, which is what gives that endpoint a screen and completes the coverage table.
**Done when** the response contains no version numbers, environment names or database details.

**B6. Keep CORS configured and scoped.**
In our architecture the browser never crosses origins, so this does nothing in the normal flow. It stays because it is correct practice, because it is insurance if the proxy is ever bypassed, and because it is what the course taught.

```ts
app.enableCors({
  origin: ["http://localhost:3001"],
  credentials: true,
});
```

Never `origin: "*"` and never `origin: true` together with `credentials: true`. That combination lets any website on the internet make authenticated requests as your signed-in user, and it is the exact mistake people make when CORS blocks them and they want it to stop.
**Done when** the origin list is an explicit array with no wildcard.

## 7. Ground rules for the team

1. **`.tsx` for anything containing markup, `.ts` for pure logic.** No `.jsx` and no `.js` anywhere. Files in `src/lib` and `src/types` are `.ts` because they contain no HTML.
2. **Routes live only in `src/app`.** One folder per URL segment, one `page.tsx` inside. `src/app/about/page.tsx` serves `/about`. No other kind of file goes in `src/app` except `layout.tsx`, `error.tsx`, `not-found.tsx` and the `api` folder.
3. **Anything used by two or more pages lives in `src/components`.**
4. **Nobody edits a file another track owns.** Section 17 is the ownership table. If you need a change in someone else's file, ask them, they make a small pull request, it merges first.
5. **No new npm package without the lead agreeing.** Every extra dependency is another thing to justify in the viva.
6. **Every screen handles four states: loading, empty, error, normal.** A screen that only handles normal is not finished.
7. **No hex colour, no font size and no spacing value is written anywhere except `globals.css`.** Everything else uses a token.
8. **No em dashes** in code, comments, copy, commit messages or documentation.
9. **Commits are small and describe what changed**, not "update" or "fix".

---

# PART C: HOW IT IS BUILT

## 8. Technology decisions

| Area | Choice | Reason |
|---|---|---|
| Framework | Next.js 16, App Router, `src` directory | Course requirement, and file-based routing is the easiest thing to teach a teammate |
| Language | TypeScript, `strict: true` | The backend is typed. Losing that at the boundary is where most bugs come from |
| Styling | Tailwind CSS v4 with CSS variables for tokens | One place holds the design system, and no separate stylesheet to keep in sync |
| HTTP client | `axios`, one instance pointed at `/api` | Handles JSON, status codes and error shapes natively. No token handling, because there is no token in the browser |
| Data fetching | TanStack Query | Gives loading, error, caching and refetch to all three people in the same shape |
| Forms | React state, a shared `Field` component, `zod` for validation | One zod schema per feature gives the type and the runtime check from a single declaration, and validates the form, which a generated type never did |
| Types | Inferred from zod schemas | Rejected: generating types from Swagger. It produced a thousand-line file nobody read, needed re-running on every backend change, and validated nothing at runtime |
| Icons | `lucide-react` | One import per icon, consistent stroke weight |
| Charts | `recharts` | Only the analytics screen needs it |
| Auth transport | httpOnly cookie set by a Next.js route handler | Section 5.1 |
| Identity | `GET /auth/me` | The token payload holds only `sub`, `email` and `role`, deliberately, and the backend re-reads the user on every request |
| Dates | `date-fns` | Formatting only. All date logic stays on the server |

Total added dependencies: six. `@tanstack/react-query`, `axios`, `zod`, `lucide-react`, `recharts`, `date-fns`. That is a number you can defend, and every one of them earns its place in a sentence.

## 9. Project structure

```
civicdesk-frontend/
  .env.local                   API_URL=http://localhost:3000
  next.config.ts
  package.json                 "dev": "next dev -p 3001"
  src/
    app/
      layout.tsx               fonts, providers, <html>. The only server component
      page.tsx                 landing                     ->  /
      error.tsx                app wide error boundary
      not-found.tsx            404 page
      about/page.tsx           ->  /about
      login/page.tsx           ->  /login
      register/page.tsx        ->  /register
      grievances/
        page.tsx               list                        ->  /grievances
        new/page.tsx           submit form                 ->  /grievances/new
        [id]/page.tsx          detail                      ->  /grievances/<id>
      notifications/page.tsx   ->  /notifications
      analytics/page.tsx       ->  /analytics
      admin/
        departments/page.tsx
        wards/page.tsx
        categories/page.tsx
        sla-policies/page.tsx
        users/page.tsx
        tags/page.tsx
        canned-responses/page.tsx
        escalation-rules/page.tsx
      api/                     server only. never rendered
        [...path]/route.ts     catch-all proxy to Nest
        session/route.ts       POST signs in, DELETE signs out
        session/register/route.ts

    components/
      ui/          Button Input Textarea Select Field Card Badge Modal Table
                   Spinner EmptyState ErrorState Pagination Toast ConfirmDialog
      layout/      AppShell Sidebar TopBar PageHeader RoleGate
      grievances/  GrievanceCard GrievanceFilters StatusBadge PriorityBadge
                   DeadlineBadge StatusTimeline MessageThread ReplyBox
                   StatusActions AssignPanel RecategorizePanel EscalatePanel
                   HistoryPanel
      admin/       CrudTable CrudModal DepartmentForm WardForm CategoryForm
                   SlaPolicyForm StaffForm WardMultiSelect StatCard ChartCard
      engagement/  AttachmentsPanel RatingPanel TagsPanel NotificationBell
                   CannedResponsePicker

    lib/
      http.ts       the single axios instance. no token handling
      errors.ts     turns any failure into a sentence
      queryKeys.ts  every cache key in one place
      format.ts     dates, relative time, file sizes, label maps
      constants.ts  status and priority tables, page sizes
      roles.ts      the Role union and the per-role sidebar map
      cn.ts         class name join
      schemas/      one zod file per feature. the schema is the type
        grievance.ts  attachment.ts  auth.ts  ...

    hooks/
      useCurrentUser.ts  useDebounce.ts

    proxy.ts        the signed-in check. Next 16 renamed middleware to proxy
```

`app/providers.tsx` holds `QueryClientProvider` and `ToastProvider`, and is
mounted in `app/layout.tsx`. There is no separate `providers/` folder and no
`AuthProvider`: identity is a TanStack Query entry under `["me"]`, so there is
one source of it rather than two that can drift.

There is no `endpoints.ts` and no generated `types/api.ts`. See Section 12.

There is no `dashboard` folder wrapping the app and no route groups. Routes are flat, and the sidebar lives in one `AppShell` component that hides itself on `/`, `/about`, `/login` and `/register` by reading `usePathname()`.

## 10. Setup, exactly

Run once, by the lead, as task T1.1.

```bash
npx create-next-app@latest civicdesk-frontend
#  TypeScript      yes
#  ESLint          yes
#  Tailwind CSS    yes
#  src/ directory  yes
#  App Router      yes
#  Turbopack       yes
#  import alias    yes, keep @/*

cd civicdesk-frontend
npm i @tanstack/react-query axios zod lucide-react recharts date-fns
```

`package.json` scripts:

```json
"dev": "next dev -p 3001",
"build": "next build",
"start": "next start -p 3001",
"lint": "eslint",
"typecheck": "tsc --noEmit"
```

**Next.js 16 changed three things** the rest of this document was originally
written against:

- `next lint` was removed. The lint script calls `eslint` directly, which picks
  up `eslint.config.mjs` and `eslint-config-next` exactly as before.
- `middleware.ts` was renamed to `proxy.ts`, and the exported function is now
  `proxy` rather than `middleware`. It runs on the Node runtime.
- Turbopack is the only bundler, so the `--turbopack` flag is gone.

`.gitattributes` in the repo root, or Windows and Linux clones will produce pull
requests where every line of a file appears changed:

```
* text=auto eol=lf
```

`.env.local`, which is gitignored:

```
API_URL=http://localhost:3000
```

`.env.example`, which is committed, holds the same key with an empty value.

**Running the project.** Two terminals, every time.

```
terminal 1:  cd civicdesk-backend  &&  npm run start:dev     # port 3000
terminal 2:  cd civicdesk-frontend &&  npm run dev           # port 3001
```

Open `http://localhost:3001`. Swagger stays available at `http://localhost:3000/api`.

## 11. The server layer

Four files. Track 1 owns them and nobody else opens them.

**A naming warning.** Next 16 renamed the middleware convention to `proxy.ts`,
so the word "proxy" now means two different things. In this project:

- **the API proxy route** is `src/app/api/[...path]/route.ts`. It forwards
  requests to Nest and attaches the token.
- **the signed-in check** is `src/proxy.ts`. It looks for the cookie and
  redirects to `/login`.

Say the full name in the viva. If you say "the proxy" while the examiner is
looking at the other file, you lose the thread of the best architectural story
in the project.

**`src/app/api/[...path]/route.ts`**, the API proxy route.

```ts
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const BACKEND = process.env.API_URL!;
const BLOCKED = ["auth/login", "auth/register"];

async function forward(req: NextRequest, path: string[]) {
  const joined = path.join("/");

  if (BLOCKED.includes(joined)) {
    return Response.json({ message: "Not available" }, { status: 404 });
  }

  const token = (await cookies()).get("civicdesk_token")?.value;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const res = await fetch(`${BACKEND}/${joined}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const out = new Headers();
  for (const h of ["content-type", "content-disposition", "content-length"]) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }

  return new Response(res.body, { status: res.status, headers: out });
}

type Ctx = { params: Promise<{ path: string[] }> };
export async function GET(r: NextRequest, c: Ctx)    { return forward(r, (await c.params).path); }
export async function POST(r: NextRequest, c: Ctx)   { return forward(r, (await c.params).path); }
export async function PATCH(r: NextRequest, c: Ctx)  { return forward(r, (await c.params).path); }
export async function PUT(r: NextRequest, c: Ctx)    { return forward(r, (await c.params).path); }
export async function DELETE(r: NextRequest, c: Ctx) { return forward(r, (await c.params).path); }
```

Three details that are not optional:

- **`auth/login` and `auth/register` are blocked in the catch-all.** Without that block, the proxy would forward a login and hand the raw token back to the browser, which destroys the entire design.
- **The body is read with `arrayBuffer()`**, not streamed. Streaming a request body in Node needs a duplex option and breaks file uploads.
- **`content-disposition` is forwarded**, or attachments download with no filename.
- **`cache: "no-store"` stays.** Next 16 rebuilt its caching model, and this is still required. Without it one user's list can be served to another.

**`src/app/api/session/route.ts`**, sign in and sign out.

```ts
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const res = await fetch(`${process.env.API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(await req.json()),
  });

  const data = await res.json();
  if (!res.ok) return Response.json(data, { status: res.status });

  (await cookies()).set("civicdesk_token", data.accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete("civicdesk_token");
  return new Response(null, { status: 204 });
}
```

Note it returns `{ ok: true }` and not the user. The user comes from `GET /auth/me` immediately afterwards, so there is exactly one source of identity in the app.

**`src/app/api/session/register/route.ts`** is the same shape against `/auth/register`.

**`src/proxy.ts`** checks only that the cookie exists. The file sits beside
`src/app`, not inside it.

```ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/", "/about", "/login", "/register"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname) || pathname.startsWith("/api")) return NextResponse.next();

  if (!req.cookies.get("civicdesk_token")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

It does not validate the token. Somebody can forge a cookie with any value and
get past this, and it does not matter, because the request that actually fetches
data goes to Nest, which verifies the JWT signature on every single request.
This file only saves a signed-out user from loading a page that would show them
nothing.

Say that before anyone asks. "Your auth check does not verify the token" sounds
like a serious finding until you explain that authentication lives on the server
that owns the data.

While `/kitchen-sink` exists, add it to `PUBLIC` so it stays reachable. Remove
that entry at T1.8 when the page is deleted.

## 12. The data layer

Four things: one axios instance, one file of zod schemas per feature, one file
of cache keys, one error module. Nothing else sits between a screen and the API.

**`src/lib/http.ts`** is the only place an HTTP call is configured.

```ts
import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const onAuthPage = path === "/login" || path === "/register";

    if (status === 401 && !onAuthPage && typeof window !== "undefined") {
      void fetch("/api/session", { method: "DELETE" }).then(() => {
        window.location.href = `/login?next=${encodeURIComponent(path)}`;
      });
    }

    return Promise.reject(error);
  },
);
```

Three things this file deliberately does not have:

- **No `withCredentials`.** `/api` is the same origin, so the cookie is sent
  automatically.
- **No request interceptor.** There is no token to attach. That is the entire
  point of Section 11.
- **No base URL pointing at port 3000.** If you ever see `localhost:3000` in a
  file under `src/lib` or `src/components`, the security model has been
  bypassed.

The response interceptor handles exactly one case: an expired session. Clear the
cookie, go to login, remember where the user was. The `onAuthPage` guard
prevents a redirect loop, because a failed sign-in attempt is itself a 401.

**There is no `endpoints.ts`.** An earlier draft of this plan wrapped every
backend route in a typed function. That is a layer of indirection with no
behaviour in it: twenty functions that each call `http.get` once. Screens call
`http` directly inside their query function, which is one less file to keep in
sync and one less place for shapes to drift.

**There is no generated `types/api.ts`.** An earlier draft generated types from
Swagger with `openapi-typescript`. It produced a thousand-line file nobody read,
had to be re-run and re-committed on every backend change, and validated nothing
at runtime. Zod gives the type and the runtime check from one declaration.

**Cache keys all live in `src/lib/queryKeys.ts`.** Guessing keys in twenty files
is how stale data survives a mutation.

```ts
export const qk = {
  me: ["me"] as const,
  grievances: (q: unknown) => ["grievances", q] as const,
  grievance: (id: string) => ["grievance", id] as const,
  messages: (id: string) => ["messages", id] as const,
  wards: ["wards"] as const,
  categories: ["categories"] as const,
  // one entry per resource, added when a screen first needs it
};
```

Add a key when a screen needs it, not before. A file of keys for screens nobody
has built is noise.

**Query defaults**, set once in `src/app/providers.tsx`:

```tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            retry: (failureCount, error) => {
              const status = axios.isAxiosError(error)
                ? error.response?.status
                : undefined;
              if (status && status < 500) return false;
              return failureCount < 1;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
```

`useState` with an initialiser, never a module-level `new QueryClient()`. A
module-level client is shared across requests on the server, which leaks one
user's cached data into another's render.

Retry is conditional rather than a flat `retry: 1`. A 403 or a 404 will never
succeed on a second attempt, so retrying only doubles the wait before the user
sees the error. Only 5xx and network failures retry.

`refetchOnWindowFocus` earns its place: if an admin changes an officer's wards
while that officer has the tab open, the officer's view corrects itself when
they click back into the window.

**The pattern every screen copies**, without exception:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/queryKeys";

export default function GrievancesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: qk.grievances(filters),
    queryFn: async () => {
      const res = await http.get("/grievances", { params: filters });
      return res.data;
    },
  });

  if (isLoading) return <Spinner label="Loading complaints" />;
  if (error) return <ErrorState message={errorMessage(error)} />;
  if (data.total === 0) return <EmptyState title="No complaints yet" action={...} />;

  return <>{data.data.map((g) => <GrievanceCard key={g.id} grievance={g} />)}</>;
}
```

Four states, every time: loading, error, empty, content. A screen missing one of
them is not finished.

Note `errorMessage(error)` rather than passing the error object. `ErrorState`
takes `message: string` deliberately. Turning an unknown failure into a sentence
is the data layer's job, and importing `errors.ts` into a presentational
primitive would couple every screen to the data layer.

## 12b. Validation with zod

One file per feature under `src/lib/schemas/`. Each exports a schema and its
inferred type. That single export is both the contract and the validator.

**Forms.** `src/lib/schemas/grievance.ts`:

```ts
import { z } from "zod";

export const createGrievanceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Please make the title at least 5 characters so officers can find it.")
    .max(120, "Please keep the title under 120 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Please describe what is wrong, where it is, and how long it has been like that."),
  categoryId: z.string().uuid("Please choose a category."),
  wardId: z.string().uuid("Please choose the ward where the problem is."),
});

export type CreateGrievanceInput = z.infer<typeof createGrievanceSchema>;
```

Every message is written for the person reading it, not for a developer. The
copy rules in Section 19 apply to validation messages as much as to buttons.

**Files.** `src/lib/schemas/attachment.ts`:

```ts
import { z } from "zod";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

export const attachmentSchema = z
  .instanceof(File, { message: "Please choose a file." })
  .refine((file) => file.size > 0, "That file is empty.")
  .refine((file) => file.size <= MAX_BYTES, "That file is too large. The limit is 5MB.")
  .refine(
    (file) => (ALLOWED as readonly string[]).includes(file.type),
    "That file type is not allowed. Use a photo or a PDF.",
  );

export const attachmentListSchema = z
  .array(attachmentSchema)
  .max(5, "You can attach up to 5 files.");
```

Client-side file checks are a courtesy, not a control. They stop a user waiting
through a doomed upload. The backend still enforces size and type on every
request, which is why the 413 and 415 sentences exist in Section 13.

**Turning a zod failure into field errors**, in `src/lib/errors.ts`:

```ts
import type { ZodError } from "zod";

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
```

This returns the same shape as `fieldErrors` in Section 13. A screen holds one
`Record<string, string>` and does not care whether it came from zod or from
Nest. `<Field error={errors.title}>` works either way.

**The rule:** validate on submit, not on every keystroke. Errors appearing while
someone is still typing their first word is hostile. After the first failed
submit, clear each field's error as it is corrected.

## 13. Error handling

The backend returns the NestJS shape:

```json
{ "statusCode": 400, "message": ["title should not be empty"], "error": "Bad Request" }
```

`message` is sometimes a string and sometimes an array. `src/lib/errors.ts`
normalises it and maps status codes to sentences.

| Status | What the user sees |
|---|---|
| 400 | The field messages, shown under the fields they belong to |
| 401 | "Your session has ended. Please sign in again." Then the cookie is cleared and they go to `/login` |
| 403 | "You do not have permission to do this." |
| 404 | "We could not find that. It may have been removed." |
| 409 | The specific conflict, rewritten in plain words per screen |
| 413 | "That file is too large. The limit is 5MB." |
| 415 | "That file type is not allowed. Use a photo or a PDF." |
| 422 | "Please check the highlighted fields." |
| 500 | "Something went wrong on our side. Please try again in a moment." |
| Network failure | "We could not reach the server. Check that it is running and try again." |

```ts
import axios from "axios";

const BY_STATUS: Record<number, string> = {
  401: "Your session has ended. Please sign in again.",
  403: "You do not have permission to do this.",
  404: "We could not find that. It may have been removed.",
  413: "That file is too large. The limit is 5MB.",
  415: "That file type is not allowed. Use a photo or a PDF.",
  422: "Please check the highlighted fields.",
  500: "Something went wrong on our side. Please try again in a moment.",
};

function serverMessages(error: unknown): string[] {
  if (!axios.isAxiosError(error)) return [];
  const message = error.response?.data?.message;
  if (typeof message === "string") return [message];
  if (Array.isArray(message)) return message.filter((m) => typeof m === "string");
  return [];
}

function sentence(text: string): string {
  const trimmed = text.trim();
  const capped = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

export function errorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong. Please try again in a moment.";
  }
  if (!error.response) {
    return "We could not reach the server. Check that it is running and try again.";
  }

  const status = error.response.status;
  if (status === 400 || status === 409) {
    const list = serverMessages(error);
    if (list.length > 0) return sentence(list[0]);
  }

  return BY_STATUS[status] ?? "Something went wrong. Please try again in a moment.";
}

export function fieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {};
  const status = error.response?.status;
  if (status !== 400 && status !== 422) return {};

  const out: Record<string, string> = {};
  for (const raw of serverMessages(error)) {
    const field = raw.split(" ")[0];
    if (field && !out[field]) out[field] = sentence(raw);
  }
  return out;
}
```

`error.response` being undefined is how axios reports a network failure, which
is why that check comes before the status lookup. Stopping Nest must produce the
network sentence, not a blank screen.

`fieldErrors` relies on class-validator putting the property name first in each
message, which is how it generates them. It is a heuristic and it fails safely:
an unmatched message falls through to the panel above the form, so nothing is
lost silently.

**Rules.**

1. **Every failed action shows something.** A button that spins and then does
   nothing is the worst bug we can ship. Either an inline panel above the form
   or a toast.
2. **Field errors go under the field**, in red, at 15px, with the input border
   turned red and `aria-invalid` set. Not in a toast where the user has to guess
   which field is wrong.
3. **The page scrolls to the first error** and focuses it.
4. **No status code, no English from the server's internals, no stack trace**
   ever reaches the screen. That rule is enforced in this one file rather than
   at twenty call sites.
5. **409 is always rewritten for its context.** "Conflict" means nothing. "A
   policy already exists for this category and priority. Edit that one instead"
   means something.

`errors.ts`, `Field`, `ErrorState` and `EmptyState` are built in T1.2 and T1.3,
before any screen. Every screen the three of you build afterwards inherits
correct error handling for free. Built late, they get retrofitted into twenty
screens by hand and will be inconsistent.

---

# PART D: DESIGN

## 14. Design direction

**The file `civicdesk-design-reference.html` sits in the repository root and is opened in a browser.** It renders every colour, every component and three complete screens exactly as they must look. It is committed to the repo so all three people see the same thing without needing to ask anyone. Section 33 covers the screens it does not render, as text wireframes.

**The rule is simple: if you are about to invent a colour, a spacing value, a font size or a component shape that is not in that file, stop and ask the lead.** Consistency across three people is worth more than any individual improvement.


CivicDesk is a public service counter, not a startup dashboard. The reference is a well made government form: calm, plainly labelled, nothing decorative, legible at arm's length on a cheap phone.

Boldness is spent in exactly one place: **the tracking code**. It is the thing a citizen actually keeps, so it is set in a boxed, letter-spaced treatment and repeated wherever the complaint appears, like a stamped docket number.

Deliberately avoided: gradient heroes, identical rounded cards floating on soft grey shadows, all-caps eyebrow labels above every heading. Structure comes from 1px borders and a coloured status rail, not from shadows.

## 15. Typography

**Public Sans**, loaded through `next/font`. It was designed for government interfaces, it is open source, and its numerals and capitals stay readable at small sizes. One family, three weights: 400, 600, 700.

```ts
import { Public_Sans } from "next/font/google";
const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "600", "700"] });
```

Body is 17px, not 16px, because many of our users are older.

| Role | Size / line height | Weight |
|---|---|---|
| Page title | 34 / 40 | 700 |
| Section title | 26 / 32 | 700 |
| Card title | 21 / 28 | 600 |
| Body | 17 / 27 | 400 |
| Secondary | 15 / 22 | 400 |
| Label and meta | 13 / 18 | 600 |

Line length never exceeds 75 characters. Forms and prose are capped at 640px wide.

## 16. The colour system

This is derived, not picked. Every choice below has a reason that can be said out loud.

### 16.1 The scheme

**Analogous cool base, complementary accent, semantic overlay.**

- **The brand hue is 211 degrees**, a cool blue. Cool hues read as calm, institutional and trustworthy, which is what a civic service should feel like. Warm hues read as urgent or commercial, which is wrong here.
- **The neutrals are not grey.** They are the same 211 hue at 6 to 12 percent saturation. Pure grey beside a blue looks dirty, because the eye reads the missing hue as a mistake. Tinting the neutrals with the brand hue makes the whole interface feel like one designed object. This single decision is what most separates a considered palette from a default one.
- **The accent is amber at 38 degrees**, the direct complement of 211. Complements sit opposite on the wheel and give the strongest hue contrast available, so amber is reserved for the one thing that must interrupt you: a missed deadline. Used anywhere else, the effect is spent.
- **The status colours are a semantic palette**, chosen by meaning and then normalised so every one lands in a narrow lightness band. If one status is darker than the others, a list looks like that status matters more, and the user reads a hierarchy nobody designed.

**Distribution follows 60 / 30 / 10.** Roughly 60 percent canvas and surface, 30 percent neutral text and borders, 10 percent primary blue, accent under 1 percent. A screen that looks noisy almost always has the 10 creeping up towards 30.

### 16.2 Primary ramp, hue 211

One hue, ten steps of lightness. A ramp is what lets you build hover, tint and disabled states without inventing a new colour.

| Token | Hex | Used for |
|---|---|---|
| `--primary-50` | `#EAF1F8` | selected row, information panel |
| `--primary-100` | `#CFE0EF` | badge fill |
| `--primary-200` | `#9DC0DE` | disabled primary button |
| `--primary-300` | `#6B9FCB` | chart series |
| `--primary-400` | `#3F7CAE` | chart series |
| `--primary-500` | `#235C8C` | link on a tinted background |
| `--primary-600` | `#123A63` | **base.** buttons, active nav, links |
| `--primary-700` | `#0D2B4A` | hover |
| `--primary-800` | `#091E35` | pressed |
| `--primary-900` | `#061524` | deep headers, rare |

### 16.3 Neutral ramp, hue 211 desaturated

| Token | Hex | Used for |
|---|---|---|
| `--n-50` | `#F4F7F9` | canvas, the page background |
| `--n-100` | `#E7EDF1` | table header, hover row |
| `--n-200` | `#D3DDE4` | **every border and divider** |
| `--n-300` | `#B3C2CD` | placeholder, disabled text |
| `--n-400` | `#8397A6` | icons |
| `--n-500` | `#55697A` | secondary text and meta |
| `--n-700` | `#2E4351` | headings on tinted panels |
| `--n-900` | `#101E27` | **body text** |
| `--surface` | `#FFFFFF` | cards, inputs, panels |

Body text is `#101E27`, not black. Pure black on white is harsh and vibrates slightly at small sizes. Quality interfaces use a very dark tinted neutral.

### 16.4 Semantic palette

Each status has a text colour and a tint for its badge. The 4px rail on the left of a grievance card uses the text colour.

| Meaning | Text | Tint | Why this hue |
|---|---|---|---|
| Open | `#2F6FA8` | `#EAF1F8` | brand family. New, not yet a problem |
| In progress | `#8A5A00` | `#FAF0DC` | warm, forward motion, someone is acting |
| Waiting for your reply | `#6B4E9E` | `#F0EBF8` | violet reads as paused and is distinct from both the warm and the cool families |
| Resolved | `#1F6B45` | `#E7F2EC` | green is the one culturally fixed meaning in this set, do not fight it |
| Reopened | `#A64A14` | `#FBEDE4` | orange sits between in progress and danger, which is exactly what a reopen is |
| Closed | `#55697A` | `#EDF1F3` | pure neutral. Finished things recede |
| Error and destructive | `#A32020` | `#FBEAEA` | red, reserved for failures and deletions only |
| Past the deadline | `#A32020` | `#FBEAEA` | the amber accent `#F0B429` may be used for the rail |

Priority: low `#55697A`, medium `#2F6FA8`, high `#8A5A00`, urgent `#A32020`.

### 16.5 Measured contrast

Every pair was computed against the WCAG formula, not judged by eye. The floor for text is 4.5 to 1.

| Pair | Ratio | Level |
|---|---|---|
| body `#101E27` on canvas `#F4F7F9` | 15.8 | AAA |
| secondary `#55697A` on white | 5.7 | AA |
| white on primary `#123A63` | 11.6 | AAA |
| white on hover `#0D2B4A` | 14.4 | AAA |
| open on its tint | 4.7 | AA |
| in progress on its tint | 5.2 | AA |
| waiting on its tint | 5.6 | AA |
| resolved on its tint | 5.6 | AA |
| reopened on its tint | 5.1 | AA |
| closed on its tint | 5.0 | AA |
| error on its tint | 6.5 | AA |

Nothing in the palette falls below the floor, including every badge. Badges are where teams normally fail, because tinted badges are usually built by eye.

### 16.6 Rules that follow from the theory

1. **Only these tokens exist.** No hex literal appears outside `globals.css`.
2. **Colour is never the only signal.** Every badge carries its label as text. Around 8 percent of men have some colour vision deficiency, and red against green is the commonest confusion, which is exactly our resolved against error pair. Take a greyscale screenshot: if every status is still readable, it passes.
3. **Saturated colour goes on small areas.** Large fills of `--primary-600` fatigue the eye. It belongs on buttons, rails and active navigation, not on whole panels.
4. **The amber accent has one job.** Overdue. If it appears on decoration, remove it.
5. **Borders carry structure, shadows do not.** `--n-200` at 1px. Shadows only on the modal overlay and the dropdown, because those genuinely float.

## 17. Shape, spacing and motion

- Radius: 8px on cards and panels, 6px on buttons and inputs, 999px on badges only.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Nothing in between.
- Content max width 1100px. Page gutter 24px on desktop, 16px on mobile.
- Motion: 150ms on hover and focus, 200ms on a modal opening. Nothing else animates. Respect `prefers-reduced-motion`.

## 18. Usability rules

Requirements, not suggestions, and each one is a visible mark.

1. Minimum tap target 44 by 44 pixels. Small icon buttons get padding until they reach it.
2. Body text never below 15px. No text lighter than `--n-500` on white.
3. **One primary action per screen.** Everything else is secondary or a plain link.
4. **Labels sit above fields and stay visible.** No placeholder used as a label. The moment a user types, a placeholder disappears and they forget what the field was.
5. Buttons say what happens: "Submit complaint", "Send reply", "Mark as resolved". Never "OK" or "Submit".
6. Forms are single column, one question per row, help text under the label.
7. Destructive actions open a confirmation that names the thing being deleted.
8. Every page has one visible `<h1>`. Every image has alt text. The focus ring is always visible and `outline: none` is never used without a replacement.
9. Nothing depends on hover. Everything is reachable with Tab.
10. Dates read as "12 Sep 2026, 3:40 PM". Relative time is allowed in addition, never alone.
11. Every empty state says what to do next and gives a button that does it.
12. Every list shows how many results there are.

## 19. Copy rules

Plain language, sentence case, no system words.

| Do not write | Write |
|---|---|
| Grievance submitted successfully | Your complaint has been received |
| SLA breach | Past the deadline |
| WAITING_ON_CITIZEN | Waiting for your reply |
| Unauthorized | Your session has ended. Please sign in again |
| Assigned officer | Officer handling this |
| CSAT rating | How was the service |
| Entity not found | We could not find that |
| Recategorize | Move to a different category |
| Escalate | Raise the priority |

---

# PART E: THE WORK

## 20. Route map

| Route | Who | Owner |
|---|---|---|
| `/` | everyone | Track 1 |
| `/about` | everyone | Track 1 |
| `/login` | signed out | Track 1 |
| `/register` | signed out | Track 1 |
| `/grievances` | all roles, different results | Track 1 |
| `/grievances/new` | citizen | Track 1 |
| `/grievances/[id]` | all roles, different content | Track 1 |
| `/notifications` | all roles | Track 3 |
| `/analytics` | admin | Track 2 |
| `/admin/departments` | admin | Track 2 |
| `/admin/wards` | admin | Track 2 |
| `/admin/categories` | admin | Track 2 |
| `/admin/sla-policies` | admin | Track 2 |
| `/admin/users` | admin | Track 2 |
| `/admin/tags` | admin | Track 3 |
| `/admin/canned-responses` | admin | Track 3 |
| `/admin/escalation-rules` | admin | Track 3 |

## 21. API coverage table

**This is the checklist the project is graded against.** Every endpoint has a screen and an owner. Copy this table into the README and tick each row as it is wired up.

Confirm the exact list against `http://localhost:3000/api` on day one. If Swagger shows an endpoint that is missing below, add a row and assign it. Nothing is left unconsumed.

### Auth and health

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| GET | `/` | API status line on `/about` | 1 |
| POST | `/auth/register` | `/register`, through `/api/session/register` | 1 |
| POST | `/auth/login` | `/login`, through `/api/session` | 1 |
| GET | `/auth/me` | `AuthProvider`, on every load | 1 |

### Users

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/users` | Add staff modal, `/admin/users` | 2 |
| GET | `/users` | Staff table with role and department filters | 2 |
| GET | `/users/:id` | Edit staff modal, loads fresh before editing | 2 |
| PATCH | `/users/:id/department` | Department selector on the staff row | 2 |
| PATCH | `/users/:id/wards` | Ward multi-select on the staff row | 2 |
| PATCH | `/users/:id/deactivate` | Deactivate button with confirmation | 2 |

### Departments

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/departments` | Add modal, `/admin/departments` | 2 |
| GET | `/departments` | Table, plus the filter dropdown on `/grievances` | 2 |
| GET | `/departments/:id` | Edit modal | 2 |
| PATCH | `/departments/:id` | Edit modal | 2 |
| DELETE | `/departments/:id` | Delete with 409 handling | 2 |

### Wards

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/wards` | Add modal, `/admin/wards` | 2 |
| GET | `/wards` | Table, submit form dropdown, list filter, staff ward selector | 2 |
| GET | `/wards/:id` | Edit modal | 2 |
| PATCH | `/wards/:id` | Edit modal | 2 |

There is no ward delete endpoint. Do not build a delete button.

### Categories

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/categories` | Add modal, `/admin/categories` | 2 |
| GET | `/categories` | Table, submit form dropdown, list filter, SLA form | 2 |
| GET | `/categories/:id` | Edit modal | 2 |
| PATCH | `/categories/:id` | Edit modal and the retire toggle | 2 |
| DELETE | `/categories/:id` | Delete with 409 handling | 2 |

### SLA policies

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/sla-policies` | Add modal, `/admin/sla-policies` | 2 |
| GET | `/sla-policies` | Table grouped by category | 2 |
| GET | `/sla-policies/:id` | Edit modal | 2 |
| PATCH | `/sla-policies/:id` | Edit modal | 2 |
| DELETE | `/sla-policies/:id` | Delete with confirmation | 2 |

### Grievances

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/grievances` | `/grievances/new` | 1 |
| GET | `/grievances` | `/grievances`, all filters and pagination | 1 |
| GET | `/grievances/:id` | `/grievances/[id]` | 1 |
| PATCH | `/grievances/:id/status` | `StatusActions` | 1 |
| PATCH | `/grievances/:id/assign` | `AssignPanel`, claim and assign | 1 |
| GET | `/grievances/:id/eligible-officers` | `AssignPanel` dropdown for admins | 1 |
| PATCH | `/grievances/:id/category` | `RecategorizePanel`, staff only | 1 |
| PATCH | `/grievances/:id/escalate` | `EscalatePanel`, staff only | 1 |
| PATCH | `/grievances/:id/tags` | `TagsPanel` edit modal | 3 |
| GET | `/grievances/:id/history` | `HistoryPanel`, staff only | 1 |

### Messages

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| GET | `/grievances/:id/messages` | `MessageThread` | 1 |
| POST | `/grievances/:id/messages` | `ReplyBox`, public and internal | 1 |

### Attachments

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/grievances/:id/attachments` | `AttachmentsPanel` upload | 3 |
| GET | `/grievances/:id/attachments` | `AttachmentsPanel` list | 3 |
| GET | `/attachments/:id` | Download link | 3 |
| DELETE | `/attachments/:id` | Delete, uploader or admin | 3 |

### Ratings

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/grievances/:id/rating` | `RatingPanel` form | 3 |
| GET | `/grievances/:id/rating` | `RatingPanel` read only view | 3 |

### Tags

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/tags` | Add modal, `/admin/tags` | 3 |
| GET | `/tags` | Catalog table, tag picker, list filter | 3 |
| PATCH | `/tags/:id` | Edit modal | 3 |
| DELETE | `/tags/:id` | Delete with confirmation | 3 |

### Canned responses

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/canned-responses` | Add modal, `/admin/canned-responses` | 3 |
| GET | `/canned-responses` | Admin table and the officer picker | 3 |
| GET | `/canned-responses/:id` | Edit modal | 3 |
| PATCH | `/canned-responses/:id` | Edit modal | 3 |
| DELETE | `/canned-responses/:id` | Delete with confirmation | 3 |

### Escalation rules

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| POST | `/escalation-rules` | Add modal, `/admin/escalation-rules` | 3 |
| GET | `/escalation-rules` | Rules table | 3 |
| GET | `/escalation-rules/:id` | Edit modal | 3 |
| PATCH | `/escalation-rules/:id` | Edit modal and the active toggle | 3 |
| DELETE | `/escalation-rules/:id` | Delete with confirmation | 3 |

### Notifications

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| GET | `/notifications` | `NotificationBell` and `/notifications` | 3 |
| PATCH | `/notifications/:id/read` | Clicking a notification | 3 |
| PATCH | `/notifications/read-all` | "Mark all as read" | 3 |

### Analytics

| Method | Path | Where it is used | Owner |
|---|---|---|---|
| GET | `/analytics/overview` | Six summary cards | 2 |
| GET | `/analytics/officers` | Officer performance table | 2 |
| GET | `/analytics/departments` | Department volume chart | 2 |
| GET | `/analytics/categories` | Category volume chart | 2 |
| GET | `/analytics/wards` | Ward volume chart | 2 |
| GET | `/analytics/sla` | Response against resolution breach panel | 2 |

## 22. The stub rule

Track 1's work must run and demo on its own even if the other two tracks are unfinished. So Track 1 commits **stub files** in its first week. A stub is a real file that renders nothing:

```tsx
// src/components/engagement/AttachmentsPanel.tsx
// STUB. Track 3 owns this file and replaces the whole body.
// Do not move this file. Do not change these props.
export default function AttachmentsPanel({ grievanceId }: { grievanceId: string }) {
  return null;
}
```

The detail page imports it and renders it. Nothing breaks. When Track 3 fills it in, the feature appears with zero changes to Track 1's pages.

Stubs committed in week one:

| Stub | Filled by |
|---|---|
| `engagement/AttachmentsPanel.tsx` | Track 3 |
| `engagement/RatingPanel.tsx` | Track 3 |
| `engagement/TagsPanel.tsx` | Track 3 |
| `engagement/NotificationBell.tsx` | Track 3 |
| `engagement/CannedResponsePicker.tsx` | Track 3 |
| every `src/app/admin/*/page.tsx` | Track 2 and Track 3 per Section 20 |
| `src/app/analytics/page.tsx` | Track 2 |
| `src/app/notifications/page.tsx` | Track 3 |

A stub page renders a `PageHeader` and one line of text saying the section is being built. Sidebar links therefore never produce a 404 during a demo.

---

## 23. Track 1

Sequential. Each task is finished before the next begins.

---

### T1.1 Repository and skeleton

**Build.** Everything in Section 10: the Next.js app, the five dependencies, the scripts, `.env.local` and `.env.example`, and every folder in Section 9 with a `.gitkeep`. Public GitHub repo `civicdesk-frontend` with all three as collaborators, branches `dev` and `main`, branch protection requiring a pull request on both. Node `.gitignore` plus `.env.local`.

Also open backend pull requests **B1** and **B4** from Section 6.

**Done when** `npm run dev` serves a page on port 3001 while Nest is running on 3000, `dev` and `main` exist on the remote, all three people can push a `feature/*` branch, and B1 and B4 are merged.

---

### T1.2 Design tokens, UI primitives, shell

**Build.** Public Sans through `next/font`. Every token from Sections 16 and 17 as CSS variables in `globals.css`, mapped into the Tailwind theme.

`src/components/ui`: `Button` (primary, secondary, danger, ghost, each with loading and disabled), `Input`, `Textarea`, `Select`, `Field` (label, help text, error, `aria-invalid`, `aria-describedby`), `Card`, `Badge`, `Modal` (focus trap, Escape closes, returns focus on close), `Table`, `Spinner`, `EmptyState`, `ErrorState`, `Pagination`, `ConfirmDialog`, `Toast` with `useToast`.

`src/components/layout`: `AppShell` (sidebar on desktop, top bar with a hamburger below 900px, hides itself on the four public routes by reading `usePathname()`), `Sidebar` (links filtered by role), `TopBar` (app name, the `NotificationBell` stub, a user menu with sign out), `PageHeader` (title, optional subtitle, one action slot), `RoleGate`.

Build a temporary `/kitchen-sink` page rendering every primitive in every state. Delete it at T1.8.

Commit **every stub from Section 22** in this task, so Tracks 2 and 3 can start.

**Done when** the kitchen sink shows all primitives including disabled, loading and error states, the shell works at 390px, every control is reachable with Tab and shows a visible focus ring, a greyscale screenshot is still fully readable, and all stubs are merged into `dev`.

**Decisions made during T1.2, all deliberate:**

- `Modal` and the mobile nav drawer are built on the native `<dialog>` element.
  Focus trap, Escape, focus restoration, scroll lock and background inertness
  come from the browser, so there is no hand-rolled focus trap in this repo.
  That is a better answer in the viva than having written one.
- `Field` wires the id, label, `aria-describedby` and `aria-invalid` through
  React context rather than props. An author writes `<Field label="Title"
  error={e}><Input /></Field>` and gets a correctly wired accessible field with
  nothing to forget. The a11y contract is enforced by construction.
- `ErrorState` takes `message: string`, not `error: unknown`. See Section 12.
- Where the design reference uses values off the Section 17 spacing scale
  (18px, 20px, 6px), the scale wins. Three people cannot hold arbitrary values
  in their heads and a 2px difference nobody can see is not worth the
  coordination cost.
- One colour added, `--danger-700`, so the danger button has a hover state.
  Without it, it is the only button in the system that does not respond to
  hover.
- Section 33.1 says an officer sees three sidebar links. They see two. The third
  would have to point at a route that does not exist.
- The `Role` union and every key in `roles.ts` and `session.ts` is **lowercase**,
  because `GET /auth/me` returns `role: "citizen"`. Uppercase keys make every
  `RoleGate` silently render nothing.
- Role comes from a hardcoded constant in `src/lib/session.ts` until T1.4.
  Deleting that file is on T1.4's Done When list.

---

### T1.3 Server layer and data layer

Two steps, one branch, one pull request.

**Step 1, the server layer.** The three route handlers and `src/proxy.ts`
exactly as in Section 11. Nothing else. This step is verified on its own before
step 2 starts, because a mistake here silently undoes the security model while
everything still appears to work.

Verify step 1 with PowerShell against port 3001, not through the UI:

```powershell
$base = "http://localhost:3001"
$body = @{ email = "citizen@example.com"; password = "..." } | ConvertTo-Json
$r = Invoke-WebRequest -Uri "$base/api/session" -Method Post -ContentType "application/json" -Body $body -SessionVariable s

# 1. the body must not contain a token
if ($r.Content -match "accessToken") { "FAIL token leaked" } else { "PASS" }

# 2. the cookie must exist and be httpOnly
$c = $s.Cookies.GetCookies($base) | Where-Object { $_.Name -eq "civicdesk_token" }
"httpOnly: $($c.HttpOnly)"

# 3. a proxied request works on the cookie alone
Invoke-RestMethod -Uri "$base/api/auth/me" -WebSession $s

# 4. the login blocklist holds. must be 404
try { Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $body -WebSession $s; "FAIL" }
catch { $_.Exception.Response.StatusCode.value__ }

# 5. query strings survive the proxy
Invoke-RestMethod -Uri "$base/api/grievances?page=1&limit=5" -WebSession $s

# 6. sign out clears the cookie. 204 then 401
Invoke-WebRequest -Uri "$base/api/session" -Method Delete -WebSession $s
try { Invoke-RestMethod -Uri "$base/api/auth/me" -WebSession $s; "FAIL" }
catch { $_.Exception.Response.StatusCode.value__ }
```

Check 4 is the one that matters most. If it returns 200 with a token in it, the
blocklist is not working and the security model is decorative.

Note that **the backend must be running**. A 500 from every `/api` route with a
404 on the blocklist and a 204 on sign-out is the signature of Nest being down:
the two calls that never touch Nest are the two that worked.

**Step 2, the data layer.** `src/lib/http.ts`, `src/lib/errors.ts`,
`src/lib/queryKeys.ts`, `src/lib/schemas/`, `src/lib/format.ts`,
`src/lib/constants.ts`, and `src/app/providers.tsx` mounted in
`src/app/layout.tsx`. Remove the local `ToastProvider` wrapper from the kitchen
sink page once the global one exists.

**Done when** `document.cookie` in the browser console does not contain the
token, the Network tab shows only requests to `/api/...` and never to port 3000,
deleting the cookie by hand and triggering a query lands the user on
`/login?next=...` rather than showing a raw error, a wrong path shows the plain
404 sentence, and stopping Nest shows the network sentence and not a blank
screen.

---

### T1.4 Authentication

**Build.** `/login`, `/register`, `src/hooks/useCurrentUser.ts`, the auth provider, `RoleGate`, sign out.

**Uses.** `POST /api/session`, `POST /api/session/register`, `DELETE /api/session`, `GET /auth/me`.

The flow: the form posts to our own session route, which sets the httpOnly cookie and returns `{ ok: true }`. The provider then calls `GET /auth/me` and caches it under `["me"]`. Everything in the app that needs to know who the user is reads that one query.

The register form has no role field. Staff accounts are created by an admin in Track 2.

After sign in, redirect by role: citizens and officers to `/grievances`, admins to `/grievances` as well, honouring the `?next=` parameter if `src/proxy.ts` set one.

Three things that will break the demo if missed: invalidate `["me"]` after sign in, clear the entire query cache on sign out so the previous user's data does not survive a role switch, and treat a 401 from `/auth/me` as signed out with a redirect rather than an error toast.

**Done when** register signs you in and lands on `/grievances`, a wrong password shows "Email or password is incorrect" and never a raw 401, a signed-out visitor to `/grievances` is sent to `/login` and returned there after signing in, sign out clears both the cookie and the cache, a refresh keeps you signed in, `document.cookie` never shows the token, and an admin deactivating an officer signs that officer out on their next click.

---

### T1.5 Grievance list

**Build.** `/grievances`, `GrievanceCard`, `GrievanceFilters`, `StatusBadge`, `PriorityBadge`, `DeadlineBadge`, `Pagination`.

**Uses.** `GET /grievances` with `status`, `priority`, `categoryId`, `departmentId`, `wardId`, `tagId`, `search`, `page`, `limit`. Plus `GET /categories`, `GET /wards`, `GET /departments` and `GET /tags` for the filter dropdowns.

One page, three roles, three result sets, because the backend scopes it. The heading changes: "My complaints" for a citizen, "Work queue" for an officer, "All complaints" for an admin. Citizens see a reduced filter set, since department and ward filters make no sense for their own list.

Card layout: a 4px left rail in the status colour, the tracking code in the boxed treatment, the title, the category and ward, status and priority badges, and the deadline as "Due in 2 days" or "Past the deadline" in red.

Filters live in the URL query string, so a filtered view survives a refresh and can be shared. Search is debounced by 300ms.

**Done when** all four states work, filters change results and survive a refresh, pagination works and shows the total, a citizen sees only their own, an officer sees only their department and covered wards, and the list is readable at 390px.

---

### T1.6 Submit a complaint

**Build.** `/grievances/new`, citizens only.

**Uses.** `GET /categories`, `GET /wards`, `POST /grievances`.

One column, five fields: title, description, category, ward, priority (optional, defaults to medium). When a category is chosen, the department it routes to appears underneath as read-only text, so the citizen sees where the complaint is going. That is INV-2 made visible and it is the best thirty seconds of the demo.

Validate in the browser first (title 5 to 120 characters, description at least 20) and still map the server's 400 messages back onto the fields, because the server is the authority and the browser check is only a courtesy.

On success, do not silently redirect. Show a confirmation screen: a large tick, "Your complaint has been received", the tracking code in the boxed treatment with a copy button, a plain sentence telling them to keep the code, and two buttons, "View my complaint" and "Report another problem".

**Done when** a citizen can submit and see the code, the department appears on category selection, server validation lands under the right fields, the button disables while sending so a double click cannot create two complaints, and an officer opening the page is told it is for citizens.

---

### T1.7 Grievance detail

The largest task in the project and the centre of the demo.

**Build.** `/grievances/[id]`, `StatusTimeline`, `MessageThread`, `ReplyBox`, `StatusActions`, `AssignPanel`, `RecategorizePanel`, `EscalatePanel`, `HistoryPanel`.

**Uses.** `GET /grievances/:id`, `GET /grievances/:id/messages`, `POST /grievances/:id/messages`, `PATCH /grievances/:id/status`, `PATCH /grievances/:id/assign`, `GET /grievances/:id/eligible-officers`, `PATCH /grievances/:id/category`, `PATCH /grievances/:id/escalate`, `GET /grievances/:id/history`.

Layout. Main column: header with the tracking code, title, status and priority; the description; then the thread. Side column on desktop, stacked below on mobile: the details panel (category, department, ward, officer handling it, submitted date, both deadlines), then `TagsPanel`, `AttachmentsPanel`, `RatingPanel`, then `HistoryPanel` for staff.

The thread shows public replies to everyone. **Internal notes appear only for officers and admins**, on a tinted background with a clear "Internal note, not visible to the citizen" label. Officers get a public and internal toggle above the reply box, with the `CannedResponsePicker` stub beside it.

`StatusActions` renders only actions the current user can take:

| Status | Citizen | Officer (assigned) | Admin |
|---|---|---|---|
| OPEN | nothing | Start work | Start work |
| IN_PROGRESS | nothing | Ask citizen for information, Mark as resolved | same |
| WAITING_ON_CITIZEN | Reply, which resumes it | Resume | Resume |
| RESOLVED | Reopen | nothing | Close |
| REOPENED | nothing | Start work | Start work |
| CLOSED | nothing | nothing | nothing |

Send the **action**, never a target status. The server owns the state machine. If it rejects a transition, show its message rather than trying to predict every rule in the browser.

`AssignPanel`: an officer sees "Claim this complaint" when it is unassigned. An admin sees a dropdown filled from `GET /grievances/:id/eligible-officers`. On 403, show "This complaint is outside your department or ward."

`RecategorizePanel`: staff only, a category dropdown with the sentence "Moving this to a different category also moves it to that category's department and recalculates the deadlines." Status must not change, so nothing in the status area may move when it saves.

`EscalatePanel`: staff only, raises the priority. Status must not change.

`HistoryPanel`: staff only, the audit trail as a plain time-ordered list with plain-English action names.

**Done when** a citizen and an officer open the same complaint and the citizen sees no internal notes and no history, an officer can claim, start, reply, ask for information and resolve end to end, a citizen can reopen a resolved complaint, a rejected transition shows a readable sentence, recategorising visibly changes the department without changing the status, the page reflows to one column at 390px, and the four engagement slots are present and render nothing.

---

### T1.8 Public pages and polish

**Build.** Landing page at `/` with four short sections explaining what CivicDesk is and two actions, "Report a problem" and "Sign in". `/about` with the project, the team, the technology, and the API status line from `GET /`. `not-found.tsx` and `error.tsx` with friendly copy and a way back. Delete `/kitchen-sink`. Write the README to Section 27.

Then a full accessibility and consistency pass across every screen the three tracks built: focus order, heading levels, alt text, tap target sizes, the greyscale check, and the four states on every screen.

**Done when** every route works signed out and signed in, Lighthouse accessibility is 95 or above on the landing page, the list and the detail page, the ten manipulation tests in Section 5.5 all pass, and the README is complete.

---

## 24. Track 2

Everything here sits behind `RoleGate` for admin and also fails with 403 if reached directly, because hiding a link is not protection.

Every CRUD screen has the same shape, so build the first one carefully and the rest are fast: a `PageHeader` with an "Add" button, a `CrudTable`, a `CrudModal` holding the create and edit form, and a `ConfirmDialog` for delete. Build `CrudTable` and `CrudModal` once in `src/components/admin` and reuse them five times.

While waiting for T1.2 and T1.3 to land, read PRD Section 5.2 and sketch the columns for each table on paper.

---

### T2.1 Departments

**Uses.** `POST /departments`, `GET /departments`, `GET /departments/:id`, `PATCH /departments/:id`, `DELETE /departments/:id`.

Columns: name, description, number of categories, number of officers. Delete returns 409 when the department still has categories or officers, so catch it and show "This department still has categories or officers. Move or remove them first." Never show a raw 409.

**Done when** create, edit and delete all work, the 409 message is a sentence, and the table is readable at 390px.

---

### T2.2 Wards

**Uses.** `POST /wards`, `GET /wards`, `GET /wards/:id`, `PATCH /wards/:id`.

Columns: name, code or description, number of officers covering it. There is no delete endpoint, because deleting a ward would orphan complaints, so there is no delete button. Put that reason in a one-line note above the table.

**Done when** create and edit work and no delete control exists anywhere.

---

### T2.3 Categories

**Uses.** `POST /categories`, `GET /categories`, `GET /categories/:id`, `PATCH /categories/:id`, `DELETE /categories/:id`.

Every category belongs to exactly one department, so the form has a required department dropdown. Include an Active toggle that sends `PATCH { isActive: false }`, with the explanation "Retiring a category hides it from citizens but keeps existing complaints intact." Delete returns 409 when the category is referenced, so catch it and point the admin at the retire toggle.

The table has a filter by department and a switch to include retired categories.

**Done when** create, edit, retire and delete work, the 409 explains the retire alternative, and a retired category disappears from the citizen submit form.

---

### T2.4 SLA policies

**Uses.** `POST /sla-policies`, `GET /sla-policies`, `GET /sla-policies/:id`, `PATCH /sla-policies/:id`, `DELETE /sla-policies/:id`.

One row per category and priority pair, with response hours and resolution hours. A duplicate pair returns 409: show "A policy already exists for this category and priority. Edit that one instead." Group the table by category so it reads as a table of targets rather than a flat list.

Add a sentence above the table: "If no policy matches a complaint, the system default applies." That is INV-4's fallback and it explains why deleting a policy is safe.

**Done when** all five operations work, the duplicate 409 is a sentence, and the table is grouped by category.

---

### T2.5 Staff management

**Uses.** `POST /users`, `GET /users`, `GET /users/:id`, `PATCH /users/:id/department`, `PATCH /users/:id/wards`, `PATCH /users/:id/deactivate`.

The table lists staff with filters for role and department and pagination. The create form makes an officer or an admin, never a citizen. Officers are created without a department and get one afterwards, which is how the backend works.

Two things must be explained in the interface, because they are the most interesting behaviour in the system:

- Beside the ward selector: "An officer only sees complaints in their department and in the wards they cover."
- In the deactivate confirmation: "Their open complaints will be released back to the queue."

Both are true because of the backend's assignment reconciliation, and demonstrating them live is worth marks. `WardMultiSelect` replaces the whole set of wards, so pre-load the current selection or the admin will wipe it by accident.

**Done when** an admin creates an officer, gives them a department and wards, and that officer immediately sees the matching complaints; deactivating an officer releases their open complaints; and a deactivated officer is signed out on their next action.

---

### T2.6 Analytics

**Uses.** `GET /analytics/overview`, `/officers`, `/departments`, `/categories`, `/wards`, `/sla`.

Top to bottom: six summary cards from overview (total, open, in progress, resolved, closed, breach rate), a bar chart of volume by department, a bar chart of volume by ward, a bar chart of volume by category, a table of officer performance (assigned, resolved, average resolution time, average rating), and a panel splitting response breaches from resolution breaches.

Rules: every number comes from the API and nothing is calculated in the browser. Charts use the primary ramp from Section 16.2 in order, never random colours. Every chart has an axis label and a title, and stays readable in greyscale. Never a pie chart for more than four slices. Every card and chart has a "No data yet" state, because early on the database will be nearly empty.

**Done when** all six endpoints are consumed, no arithmetic happens in the browser, every chart is labelled and readable in greyscale, and the page works at 390px with charts stacked.

---

## 25. Track 3

You own the stub files from Section 22 and three admin screens. **Replace a stub's contents. Do not move the file and do not change its props.**

Start with T3.1 as soon as T1.2 and T1.3 land, since it does not depend on the detail page.

---

### T3.1 Notifications

**Uses.** `GET /notifications?isRead=false&page=&limit=`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.

Two pieces. `NotificationBell` in the top bar shows an unread count, refetches every 60 seconds, and opens a panel with the five most recent items and a link to the full page. `/notifications` lists everything with an unread filter, a "Mark all as read" button, and each row linking to its complaint. Unread rows get a left accent and a heavier title.

Translate the type names: `GRIEVANCE_ASSIGNED` becomes "A complaint was assigned to you", `SLA_BREACH` becomes "A complaint passed its deadline", `NEW_REPLY` becomes "New reply on your complaint".

The endpoint returns only the caller's own notifications for every role including admin, so there is no "all notifications" view to build.

**Done when** the count is live and clears on read-all, clicking a row marks it read and navigates to the complaint, the empty state reads "You have no notifications", and the panel works at 390px.

---

### T3.2 Attachments

**Uses.** `POST /grievances/:id/attachments`, `GET /grievances/:id/attachments`, `GET /attachments/:id`, `DELETE /attachments/:id`.

`AttachmentsPanel` lists files with name, size and uploader, a download link, and a delete button for the uploader and admins. Upload is a drag and drop area that **also works as a plain "Choose file" button**, because drag and drop alone fails on phones and for older users.

State the rule before the user hits it: "Photos and PDFs up to 5MB." Validate type and size in the browser to match the backend, and when the server rejects one file, say which file and why while keeping the others.

Citizens must never be able to attach to an officer's internal note, and never see attachments on internal notes. The backend enforces both. Your job is to not render the controls in those cases.

**Done when** a photo uploads and downloads with its original filename, an oversized file and a disallowed type each explain themselves, the uploader can delete and another citizen cannot, and no attachment control appears on an internal note for a citizen.

---

### T3.3 Ratings

**Uses.** `POST /grievances/:id/rating`, `GET /grievances/:id/rating`.

`RatingPanel` has three modes. For a citizen on a resolved or closed complaint with no rating: five star buttons at least 44px each, with text labels underneath, plus an optional comment, under the heading "How was the service?". Once a rating exists: read only, visible to the citizen and to staff. For everyone else: render nothing.

Reopening retracts the rating, so after a reopen the form comes back. Invalidate the rating query when the status changes or that will not happen.

**Done when** a citizen rates once and cannot rate twice, rating an open complaint is refused with a sentence, staff can see the rating, and a reopen brings the form back.

---

### T3.4 Tags

**Uses.** `PATCH /grievances/:id/tags`, `POST /tags`, `GET /tags`, `PATCH /tags/:id`, `DELETE /tags/:id`.

`TagsPanel` shows current tags as chips, and gives staff an "Edit tags" modal with checkboxes from the catalog. Retagging replaces the whole set and **never changes the status**, so nothing in the status area may move when it saves.

`/admin/tags` is the catalog, admin only, using the same `CrudTable` and `CrudModal` Track 2 built.

**Done when** staff can retag, the status does not move, a citizen sees the chips but no edit control, and the catalog supports create, edit and delete.

---

### T3.5 Canned responses

**Uses.** `POST /canned-responses`, `GET /canned-responses`, `GET /canned-responses/:id`, `PATCH /canned-responses/:id`, `DELETE /canned-responses/:id`.

`CannedResponsePicker` is a dropdown beside the reply box. Choosing one inserts its body into the textarea, where the officer edits it before sending. It sends nothing by itself, because there is no apply endpoint and adding one would create a second write path into messages.

Officers only see templates matching their scope, which the backend already filters. `/admin/canned-responses` is the full CRUD screen with title, body, and optional department and category scope. Explain the scope in the form: "Leave the department empty to make this available to every officer."

**Done when** an officer inserts a template and edits it before sending, an officer sees only templates for their scope, and admin CRUD works.

---

### T3.6 Escalation rules

**Uses.** `POST /escalation-rules`, `GET /escalation-rules`, `GET /escalation-rules/:id`, `PATCH /escalation-rules/:id`, `DELETE /escalation-rules/:id`.

Each rule has a trigger (response overdue, resolution overdue, unassigned for N hours), a threshold in hours, an action (raise priority, notify an admin), and an active toggle.

Render the rule back as a sentence above the save button: "When a complaint is unassigned for 24 hours, notify an admin." That turns a form full of enums into something an administrator can actually verify.

Prefer the active toggle over delete and say so in the interface: "Turning a rule off keeps its history. Deleting it does not."

**Done when** create, edit, toggle and delete work, and the sentence preview updates as the form changes.

---

## 26. File ownership

| Path | Owner |
|---|---|
| `src/app/layout.tsx`, `page.tsx`, `error.tsx`, `not-found.tsx` | Track 1 |
| `src/app/about`, `login`, `register`, `grievances/**` | Track 1 |
| `src/app/api/**` | Track 1, nobody else opens these |
| `src/components/ui/**`, `layout/**`, `grievances/**` | Track 1 |
| `src/lib/**`, `src/hooks/**`, `src/app/providers.tsx`, `src/proxy.ts`, `src/app/api/**` | Track 1 |
| `globals.css` and the Tailwind theme | Track 1 |
| all pull requests on `civicdesk-backend` | Track 1 |
| `src/app/admin/{departments,wards,categories,sla-policies,users}` | Track 2 |
| `src/app/analytics` | Track 2 |
| `src/components/admin/**` | Track 2 |
| `src/app/notifications` | Track 3 |
| `src/app/admin/{tags,canned-responses,escalation-rules}` | Track 3 |
| `src/components/engagement/**` | Track 3 |

`src/lib/http.ts`, `src/lib/errors.ts` and `src/lib/queryKeys.ts` are written entirely by Track 1 in T1.3. Tracks 2 and 3 import them and call `http` directly inside their query functions. Need a new cache key or a new zod schema? Add it to `queryKeys.ts` or `src/lib/schemas/` in your own pull request, but do not change `http.ts` or the error mapping without asking.

## 27. Git workflow and schedule

Identical to the backend repository.

- Branch from `dev`. One purpose per branch. Naming: `feature/f<N>-short-name`, for example `feature/f4-auth`.
- Pull request into `dev`, **squash merge**.
- At each milestone, pull request `dev` into `main` with a **normal merge** and tag it.
- Never commit to `main` or `dev` directly. Never commit `.env.local`.
- Pull `dev` before branching, every time.
- Every pull request states what changed, which section of this plan it implements, and which of the four states were tested.

| Week | Milestone | Tag | Track 1 | Track 2 | Track 3 |
|---|---|---|---|---|---|
| 1 | Skeleton | `f0.1` | T1.1, T1.2, backend B1 and B4 | read PRD 5.2, sketch tables | read PRD 5.5 and 5.6 |
| 2 | Signed in | `f0.2` | T1.3, T1.4 | T2.1, T2.2 | T3.1 |
| 3 | Citizen flow | `f0.3` | T1.5, T1.6, backend B2 and B5 | T2.3, T2.4 | T3.2 |
| 4 | Officer flow | `f0.4` | T1.7, backend B3 and B6 | T2.5 | T3.3, T3.4 |
| 5 | Complete | `f0.5` | T1.8 | T2.6 | T3.5, T3.6 |
| 6 | Delivery | `f1.0` | testing, Figma, README, demo rehearsal, bug fixes across all tracks | | |

Every Friday: everyone pushes, the lead merges `dev` into `main` and tags it, and the whole app is run end to end on one machine by one person following the demo script in Section 30. A milestone that has not been run end to end is not a milestone.

If the term is shorter, compress weeks 5 and 6 into one and cut in this order: escalation rules screen, canned responses, tags interface, then the analytics charts while keeping the summary cards. Never cut anything in Track 1.

## 28. Testing

Manual and written down. There is no automated frontend test suite in this project, and the README says so plainly rather than implying coverage that does not exist.

**Per screen, before a pull request is opened**, the author checks all four states: loading (throttle the network in DevTools), empty (filter to something with no results), error (stop Nest, then restart it), and normal.

**The security checklist** is Section 5.5. It is run in full at week 5 and again before the demo, and the results are recorded in the README.

**The role matrix**, run once per milestone with three accounts open in three browser profiles:

| Check | Citizen | Officer | Admin |
|---|---|---|---|
| Sees only their own complaints | yes | n/a | n/a |
| Sees the department and ward queue | n/a | yes | n/a |
| Sees every complaint | no | no | yes |
| Sees internal notes | **never** | yes | yes |
| Sees the audit history | no | yes | yes |
| Sees admin navigation | no | no | yes |
| Can reach an admin URL directly | blocked | blocked | yes |

**Responsive check** at 390px, 768px and 1440px on every screen.

**Accessibility check** with Lighthouse on the landing page, the list and the detail page. Target 95 or above.

## 29. Figma deliverable

The design file is produced from the built interface, not before it, so the file provably matches what runs. This is not a shortcut, it is how a design system is documented once it exists.

**File name:** "CivicDesk Design". Five pages inside it.

**Page 1, Cover.** Project name, team members, course, date, one large screenshot.

**Page 2, Design system.** Built by hand, because this is the page that is actually marked.
- A colour wheel graphic with 211 and 38 marked and labelled as complements.
- The primary ramp and the neutral ramp as swatch rows, each chip labelled with its token name and hex.
- The semantic palette as badge components sitting on their tints, with the measured contrast ratio printed beside each.
- The type scale as a specimen, each row labelled with size, line height and weight.
- The spacing scale as bars.
- Every UI primitive in every state.
- One greyscale copy of a grievance card, proving the interface survives without colour.

**Page 3, Desktop screens** at 1440 by 1024: Landing, Sign in, Register, Complaint list as a citizen, Submit form, Submit confirmation with the tracking code, Complaint detail as a citizen, Work queue as an officer, Complaint detail as an officer showing an internal note, Categories admin, Staff admin, Analytics, Notifications.

**Page 4, Mobile screens** at 390 by 844: Landing, Submit form, Complaint list, Complaint detail, Work queue.

**Page 5, States and flows.** Four state frames: empty list, loading, a form showing two validation errors, and the permission denied page. Almost no student team includes these, and they prove the real product was designed rather than only the happy path. Then three flow diagrams made of thumbnails joined by arrows:
1. Citizen: land, register, submit, receive the code, get a reply, rate.
2. Officer: sign in, open the queue, claim, start work, ask for information, resolve.
3. Admin: sign in, create a department, create a category, create an SLA policy, assign an officer to wards, read the analytics.

**How the frames are made.** Two routes, either is acceptable.
- The design system page and the flow diagrams are built by hand in Figma. They are quick and they are the highest value pages.
- The screen frames are captured from the running app with the **html.to.design** community plugin, which imports a page as editable layers rather than a flat image. If the plugin cannot reach a local address, take full-page screenshots at both widths, place them as frames, and redraw the key components on top so the layers are real.

**Every layer is renamed.** Frames called "Frame 247" are the single thing that makes a Figma file look thrown together. Each frame gets a text note beside it saying what it is and who sees it.

## 30. README requirements

The README is read in about ninety seconds and it decides how the whole project is judged. In this order:

1. **One screenshot** of the grievance detail page at the top.
2. **One paragraph** saying what CivicDesk is.
3. **Demo accounts**, one per role, with passwords, for the seeded database.
4. **How to run it**, both repositories, exact commands, both ports, the environment variables.
5. **Architecture**, with the diagram from Section 4 and a paragraph explaining why the proxy exists and what it protects.
6. **Security**, meaning Section 5 summarised, plus the results of the ten manipulation tests.
7. **The API coverage table** from Section 21, ticked.
8. **The design system**, meaning the colour scheme reasoning from Section 16 and a link to the Figma file.
9. **Testing**, meaning what was tested manually and the honest statement that there is no automated frontend suite.
10. **Known limitations**, written plainly. Attachments are stored on local disk rather than object storage. Notifications poll rather than stream. Both are deliberate scope decisions and both should say so.

## 31. Demo script

Fifteen minutes, rehearsed, run from a seeded database. Three browser profiles open before you start.

1. **Citizen.** Register. Submit a complaint about a broken street light. Choose the category and watch the department appear. Submit and show the tracking code.
2. **Officer.** Sign in. Show that the queue contains only their department and wards. Claim the complaint. Start work. Post a public reply. Post an internal note.
3. **Citizen.** Refresh. Show the reply. **Show that the internal note is not there.** This is the strongest thirty seconds in the demo.
4. **Officer.** Ask the citizen for information, showing the status change to "Waiting for your reply" and the resolution clock pausing.
5. **Citizen.** Reply, attach a photo, and watch the complaint resume.
6. **Officer.** Resolve it.
7. **Citizen.** Receive the notification, then rate the service.
8. **Admin.** Show analytics. Create a new category. Move an officer to a different department and show their assigned complaints being released back to the queue.
9. **Security.** Run manipulation tests 1, 3, 5 and 9 from Section 5.5 live, in front of the examiner.

## 32. Definition of done

**Coverage**
- [ ] Every row in Section 21 is ticked, and the list was verified against Swagger rather than assumed.
- [ ] Backend pull requests B1 to B6 are merged.

**Security**
- [ ] The token is never readable from `document.cookie` and `localStorage` is empty.
- [ ] No `NEXT_PUBLIC_` variable exists in the project.
- [ ] No permission, eligibility, deadline or total is computed in the browser.
- [ ] All ten manipulation tests in Section 5.5 pass and the results are in the README.

**Function**
- [ ] A citizen can register, submit, track, reply, attach, reopen and rate.
- [ ] An officer can queue, claim, start, reply, note, request information, recategorise, escalate and resolve.
- [ ] An admin can manage departments, wards, categories, SLA policies, tags, canned responses, escalation rules and staff, and read analytics.
- [ ] Internal notes are invisible to citizens on every screen.

**Interface**
- [ ] Every screen handles loading, empty, error and normal.
- [ ] Every server failure becomes a sentence a non-technical person can act on, with field errors under their fields.
- [ ] Every screen works at 390px, is keyboard navigable, and scores 95 or above on Lighthouse accessibility.
- [ ] No hex, font size or spacing value appears outside `globals.css`.
- [ ] A greyscale screenshot of the list and the detail page is still fully readable.

**Delivery**
- [ ] The Figma file has all five pages, with renamed layers.
- [ ] The README has all ten items from Section 30.
- [ ] The demo script in Section 31 has been rehearsed end to end at least twice.
- [ ] `main` is tagged `f1.0`.

---

# PART G: SCREEN LAYOUTS

## 33. Every screen, drawn

`civicdesk-design-reference.html` renders the complaint list, the officer detail view and an admin CRUD screen as real HTML. The rest are drawn here. These are layout, not decoration. Colours, type and component shapes all come from the reference file.

### 33.1 The page skeleton every signed-in screen uses

Every screen inside the app is the same three parts, so they cannot drift apart:

```
+--------------------------------------------------------------+
| TopBar   CivicDesk            [bell 3]  Name · Role  [menu]   |  60px, white, 1px bottom border
+----------+---------------------------------------------------+
| Sidebar  |  PageHeader                                        |
| 210px    |    H2 title                    [ primary action ]  |
| white    |    one line of muted context                       |
| 1px      |                                                    |
| right    |  --- content, max 1100px, 24px gutter ---          |
| border   |                                                    |
|          |                                                    |
+----------+---------------------------------------------------+
```

- Sidebar links are filtered by role. A citizen sees three. An officer sees three. An admin sees ten.
- Below 900px the sidebar becomes a hamburger in the top bar and the content goes full width.
- Public pages (`/`, `/about`, `/login`, `/register`) render with no sidebar at all.
- There is exactly one `<h2>` in the PageHeader and it is the page's only title.

### 33.2 Landing, `/`

```
+--------------------------------------------------------------+
|  CivicDesk                              [About]  [Sign in]    |
+--------------------------------------------------------------+
|                                                              |
|   Report a problem in your                                   |   34px title, left aligned
|   neighbourhood.                                             |   max 18 words
|                                                              |
|   Street lights, drainage, roads and more. You get a          |   17px, max 60ch
|   tracking code and can follow it until it is fixed.         |
|                                                              |
|   [ Report a problem ]   [ Sign in ]                          |   one primary, one secondary
|                                                              |
+--------------------------------------------------------------+
|   THREE STEPS                                                |   13px label
|   +----------------+ +----------------+ +----------------+   |
|   | 1              | | 2              | | 3              |   |   three cards, 1px border
|   | Report it      | | Follow it      | | Rate it        |   |   21px card title
|   | Tell us what   | | An officer     | | Tell us how    |   |   15px body
|   | is wrong and   | | is assigned    | | it went once   |   |
|   | where.         | | and replies.   | | it is fixed.   |   |
|   +----------------+ +----------------+ +----------------+   |
+--------------------------------------------------------------+
|   Footer: About · Built for AIUB Advanced Web Technology      |
+--------------------------------------------------------------+
```

No gradient, no stock photograph, no hero image. Text and space carry it.

### 33.3 Sign in, `/login`

```
+--------------------------------------------------------------+
|  CivicDesk                                                   |
+--------------------------------------------------------------+
|                                                              |
|              +--------------------------------+              |   card, 420px wide,
|              |  Sign in                       |              |   centred, 1px border
|              |  Use the email you registered  |              |
|              |  with.                         |              |
|              |                                |              |
|              |  Email                         |              |
|              |  [__________________________]  |              |
|              |                                |              |
|              |  Password                      |              |
|              |  [__________________________]  |              |
|              |                                |              |
|              |  ! Email or password is        |              |   error panel appears
|              |    incorrect.                  |              |   above the button
|              |                                |              |
|              |  [        Sign in        ]     |              |   full width primary
|              |                                |              |
|              |  New here? Create an account   |              |
|              +--------------------------------+              |
+--------------------------------------------------------------+
```

`/register` is the same card with four fields: full name, email, password, confirm password. **No role field.** Below the button: "Already have an account? Sign in".

### 33.4 Submit a complaint, `/grievances/new`

Single column, 640px maximum. Never two columns, at any screen width.

```
  Report a problem                                              H2
  Tell us what is wrong and where. You will get a tracking code.

  Title
  A short summary, for example "Street light not working".
  [_______________________________________________]

  What is the problem?
  Describe what you saw, when, and how it affects you.
  [                                               ]
  [                                               ]
  [_______________________________________________]

  Category
  Choosing a category decides which department handles this.
  [ Street lighting                            v ]
  Goes to Public Works Department                              <- appears on selection

  Ward
  Where is the problem?
  [ Ward 7                                      v ]

  How urgent is it?
  ( ) Low   (o) Medium   ( ) High   ( ) Urgent                 <- radios, 44px targets

  [ Submit complaint ]      Cancel
```

### 33.5 Submit confirmation

Replaces the form. Does not redirect on its own.

```
              +----------------------------------------+
              |                 (v)                    |   56px green circle
              |                                        |
              |   Your complaint has been received     |   26px
              |                                        |
              |   Keep this code. You can use it to    |   17px, max 50ch
              |   ask about your complaint at any      |
              |   time.                                |
              |                                        |
              |   +--------------------------------+   |
              |   |   CD-2026-0912-4471    [copy]  |   |   the large boxed treatment
              |   +--------------------------------+   |
              |                                        |
              |   [ View my complaint ]                |
              |   [ Report another problem ]           |
              +----------------------------------------+
```

### 33.6 Complaint detail, citizen view

Same two-column frame as the officer view in the reference file, with things removed. What a citizen must **never** see is as important as what they do see.

```
  CD-2026-0912-4471   [In progress]  [Medium]

  Street light not working on Road 12                       H2

  Open ---- In progress ---- Resolved ---- Closed            timeline, current dot ringed

  +-------------------------------+  +---------------------+
  | WHAT YOU REPORTED             |  | DETAILS             |
  | The light outside house 44... |  | Category  Street... |
  +-------------------------------+  | Department Public.. |
                                     | Ward      Ward 7    |
  +-------------------------------+  | Officer   Assigned  |
  | Public Works Officer   4:10PM |  | Submitted 12 Sep    |
  | Thank you for reporting...    |  | Expected  14 Sep    |
  +-------------------------------+  +---------------------+

     ^ internal notes are NOT rendered here at all             not hidden with CSS,
     ^ no history panel                                        not returned by the API
     ^ no assign panel, no recategorise, no escalate

  +-------------------------------+  | FILES               |
  | [ write a reply ...         ] |  | pole-photo.jpg      |
  | [ Send reply ]                |  | [ Choose file ]     |
  +-------------------------------+  +---------------------+
```

When the status is RESOLVED, the citizen sees a `Reopen` button and the rating panel appears. When the status is WAITING_ON_CITIZEN, the reply box carries a line above it: "An officer has asked you a question. Replying will move this back to in progress."

### 33.7 Notifications, `/notifications`

```
  Notifications                                    [ Mark all as read ]

  [ All ] [ Unread 3 ]                                    two pill filters

  |=| A complaint was assigned to you                     unread: 3px left accent
  |=| CD-2026-0912-4471 · Street light not working        in primary-600, title at 600
  |=| 12 Sep, 4:02 PM
  ----------------------------------------------------
      New reply on your complaint                         read: no accent, title at 400
      CD-2026-0908-1180 · Overflowing drain
      11 Sep, 9:14 AM
  ----------------------------------------------------
      A complaint passed its deadline
      CD-2026-0821-0093 · Pothole outside clinic
      10 Sep, 6:00 AM
```

The bell in the top bar opens a 360px panel containing the same rows, capped at five, with "See all notifications" at the bottom.

### 33.8 Analytics, `/analytics`

```
  Analytics                                    Everything below is calculated
                                               by the server, never in the browser.

  +--------+ +--------+ +--------+ +--------+ +--------+ +--------+
  | Total  | | Open   | | In prog| | Resolv | | Closed | | Breach |    six cards
  |  142   | |   38   | |   21   | |   67   | |   16   | |  9.2%  |    34px number
  +--------+ +--------+ +--------+ +--------+ +--------+ +--------+    13px label above

  +-------------------------------+  +-------------------------------+
  | Complaints by department      |  | Complaints by ward            |
  |  Public Works  ##########  54 |  |  Ward 7  ###########  41      |    horizontal bars
  |  Sanitation    ######      31 |  |  Ward 3  ########     29      |    primary ramp in
  |  Traffic       ####        22 |  |  Ward 1  #####        18      |    order, never
  +-------------------------------+  +-------------------------------+    random colours

  +---------------------------------------------------------------+
  | Officer performance                                            |
  | NAME        ASSIGNED  RESOLVED  AVG TIME   AVG RATING          |
  | A. Rahman        24        21    31h        4.4                |
  +---------------------------------------------------------------+

  +-------------------------------+  +-------------------------------+
  | Response deadlines            |  | Resolution deadlines          |
  | Met 128   Missed 14           |  | Met 119   Missed 23           |
  +-------------------------------+  +-------------------------------+
```

Horizontal bars, not vertical, because department and ward names are long. Every card and chart has a "No data yet" state, because early in the term the database is nearly empty.

### 33.9 Modals, used by every admin screen

```
        +-------------------------------------------+
        |  Add category                        [x]  |   overlay: n-900 at 45%
        |  -------------------------------------- |    card: 520px, radius 8,
        |                                           |    shadow allowed here
        |  Name                                     |
        |  [_____________________________________]  |
        |                                           |
        |  Department                               |
        |  [ Public Works                       v]  |
        |                                           |
        |  [ ] Active                               |
        |  Retiring a category hides it from        |   explanation under the control,
        |  citizens but keeps existing complaints.  |   not in a tooltip
        |                                           |
        |  -------------------------------------- |
        |               [ Cancel ]  [ Add category ]|   actions right aligned,
        +-------------------------------------------+   primary last
```

Escape closes it. Focus is trapped inside while open and returns to the button that opened it. The delete confirmation is the same shape, names the thing being deleted in its sentence, and its primary button is the danger variant.

### 33.10 Mobile, 390px

Rules that apply to every screen, so nobody has to design mobile separately:

1. The sidebar becomes a hamburger. The top bar keeps the brand and the bell.
2. Every two-column layout stacks, main column first, side panels underneath.
3. Tables become stacked cards. A row of five columns becomes a card with five labelled lines. Never a horizontal scrollbar.
4. The filter row becomes a "Filters" button opening a sheet.
5. Buttons in a row become full width and stack vertically.
6. The page gutter drops from 24px to 16px. Nothing else about the type or spacing changes.

### 33.11 What consistency actually depends on

Track 1 builds every `ui/` primitive in T1.2, before Tracks 2 and 3 write a single screen. After that:

- Tracks 2 and 3 never write a `<button>`, an `<input>` or a `<table>` element directly. They import `Button`, `Field` and `Table`.
- Tracks 2 and 3 never write a colour, a font size or a padding value. Those are already inside the primitives.
- Every admin screen is `PageHeader` + `CrudTable` + `CrudModal` + `ConfirmDialog`, which Track 2 builds once in T2.1.

If those three rules hold, the three tracks cannot produce screens that look different from each other, because they are all assembling the same parts.
