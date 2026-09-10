# CivicDesk

A civic grievance management system. Citizens report problems with public
services, the system routes each complaint to the department and officer
responsible, and the person who reported it can follow it until it is closed.

Built as a capstone for Advanced Web Technology at AIUB.

## Running it

Two servers. Both must be running.

**Backend**, in `https://github.com/Soumikdas3210/civicdesk-backend`:

```bash
npm install
npm run start:dev
```


Needs PostgreSQL with a database named `civicdesk` and a `.env` holding
`DATABASE_URL`, `JWT_SECRET` and the Mailtrap credentials. Runs on port 3000.
Swagger is at `http://localhost:3000/api`.

**Frontend**, in `civicdesk-frontend`:

```bash
npm install
npm run dev
```


Needs a `.env.local` containing `API_URL=http://localhost:3000`. Runs on port
3001.

**Seed data**, in `civicdesk-backend`:

```bash
npm run seed
```

Creates two departments, three wards, three categories, five SLA policies, one
admin, three officers, two citizens and eight complaints covering all six
statuses.

The seed creates rather than upserts, so it needs an empty database. To reseed,
run this first:

```sql
TRUNCATE TABLE
  attachments, audit_logs, canned_responses, categories, departments,
  escalation_rules, grievance_tags, grievances, messages, notifications,
  officer_wards, ratings, sla_policies, tags, users, wards
RESTART IDENTITY CASCADE;
```

The tracking code sequence is reset by the seed itself, because `TRUNCATE
RESTART IDENTITY` only resets sequences owned by a table and
`grievance_tracking_seq` is created by hand.

## Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@civicdesk.local | AdminPass1! |
| Officer, Water Board | karim@city.gov | OfficerPass1! |
| Officer, Electricity | fatima@city.gov | OfficerPass2! |
| Officer, one ward only | nadia@city.gov | OfficerPass3! |
| Citizen | rina@example.com | CitizenPass1! |
| Citizen | sabbir@example.com | CitizenPass2! |

## How it is put together

The browser never holds the session token. Signing in posts to `/api/session`
on the Next server, which calls the backend, takes the token out of the
response and puts it in an httpOnly cookie. Every later request goes to
`/api/...`, where a catch-all route reads that cookie and attaches the
Authorization header before forwarding to Nest. JavaScript in the page cannot
read the cookie, so an XSS bug cannot steal the session.

`src/proxy.ts` checks only that a cookie exists before letting a protected page
load. It does not validate the token. Validation happens on the server that
owns the data, on every request.

Identity comes from `GET /auth/me` and nowhere else. The token is never decoded
in the browser.

The state machine lives in the backend. `GET /grievances/:id` returns
`availableActions`, the exact set of transitions the current user may perform
right now, computed by applying the same guards `changeStatus` applies and then
asking the transition map. The frontend renders buttons from that list, so a
button that would be rejected cannot appear. Actions are sent, never target
statuses.

Data fetching is axios plus TanStack Query. Validation is zod, which gives the
type and the runtime check from one declaration. There is no generated type
layer and no wrapper function per endpoint.

## The manipulation tests

Each one proves a rule. Run them in front of the examiner.

| # | What you do | What happens |
|---|---|---|
| 1 | Sign in, run `document.cookie` in the console | The token is not there |
| 2 | Application tab, Local Storage | Empty |
| 3 | As a citizen, type `/admin/users` in the address bar | The page loads with no data. Every request behind it returns 403 |
| 4 | Un-hide a hidden admin control in DevTools and click it | A permission message, no data change |
| 5 | As a citizen, run `fetch("/api/users")` in the console | 403 from the server |
| 6 | Open another citizen's complaint by id | "We could not find that complaint", the backend's 404, not a 403 |
| 7 | As an officer, open a complaint from another department | The same 404 |
| 8 | Send an illegal action to `/status` with curl | 409 naming the status and the actor |
| 9 | Register with `"role": "admin"` in the body | 400, "property role should not exist" |
| 10 | Deactivate an officer while they are signed in, then have them click anything | Signed out immediately, and the login page explains the account is deactivated |

Test 9 is stronger than a silently ignored field: `forbidNonWhitelisted` on the
global validation pipe rejects the request outright.

## What is deliberately not here

- No officer names in the citizen's view. The thread says "Council officer".
  Resolving names would mean exposing the staff directory.
- No client-side copy of the state machine.
- No breach flags written by anything except the SLA scanner.
- No token in JavaScript-readable storage.

## Known limits

- Runs locally only. No deployment.
- The AI layer is a seam with a no-op implementation.
- An officer's ward coverage is derived by asking each ward for its officers,
  because there is no endpoint that returns it directly.