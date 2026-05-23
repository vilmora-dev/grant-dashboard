# Delta Rising Foundation — Grants Platform

An internal tool for discovering and tracking grant opportunities. A Python scraper feeds grants in from federal APIs, RSS feeds, and the open web. The Laravel app gives the team a dashboard to review them, star the ones worth pursuing, and track applications over time.

---

## What's in the app

**Grants dashboard** — the main view for everyone. Shows scraped grants with filters for source, status (relevant / applied / ignored), relevance score, starred flag, and deadline. You can star a grant, mark it applied, ignore it, or leave notes. Every change is logged to an immutable audit trail.

**Config** — admins manage the initiatives (funding programs), keywords (search terms that drive the scraper), and the organization profile. Deleting an initiative detaches all its keywords so nothing orphaned ends up in the search matrix.

**Stats** — a health dashboard for the scraper pipeline. Shows daily grant counts, source breakdown, relevance score distribution, and a funnel from scraped all the way through to applied. Supports a `?days=` window.

**Team** — admins invite users, assign roles, deactivate accounts, and reset passwords. New users are prompted to set their own password on first login.

---

## Tech stack

| Layer | Technology |
|---|---|
| Language | PHP 8.3 |
| Framework | Laravel 13.7 |
| Frontend | React 18 + Inertia.js 2 |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Build | Vite 5 |
| Database | MySQL 8.0 |
| Auth | Laravel session auth (cookie-based) |
| Testing | PHPUnit 12.5 |
| Code style | Laravel Pint (PSR-12) |
| Containers | Docker Compose |

A few dependencies worth understanding:

- `tightenco/ziggy` — exports named Laravel routes to the frontend so React components can call `route('dashboard')` and friends without hardcoding URLs.
- `inertiajs/inertia-laravel` — the server-side Inertia adapter. It sends page data as JSON props instead of rendering separate HTML templates, which gives you SPA-style navigation without maintaining a standalone API.
- `@headlessui/react` — handles the accessible modals and dropdowns in the grants dashboard.

---

## Project structure

```
grants_app/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/                          — Login, confirm password, set password
│   │   │   ├── GrantController.php            — Dashboard page (server-paginated, 24/page)
│   │   │   ├── GrantDataController.php        — Grant API: data, count, patch, logs
│   │   │   ├── InitiativeController.php       — CRUD + soft-delete with keyword detachment
│   │   │   ├── KeywordController.php
│   │   │   ├── OrganizationProfileController.php
│   │   │   ├── StatsController.php
│   │   │   ├── TeamController.php
│   │   │   └── DdgSearchComboController.php
│   │   └── Middleware/
│   │       ├── ForcePasswordChange.php        — Redirects if must_change_password = true
│   │       ├── RequireFullAccess.php          — Role gate: 403 JSON or dashboard redirect
│   │       └── HandleInertiaRequests.php      — Injects shared auth.user props
│   └── Models/
│       ├── GrantUnified.php                   — Primary grant model (table: grants)
│       ├── GrantActionLog.php                 — Immutable audit log with action constants
│       ├── Initiative.php                     — Soft-delete via is_deleted flag
│       ├── Keyword.php
│       ├── OrganizationProfile.php
│       ├── DdgSearchCombo.php
│       └── User.php
├── bootstrap/app.php                          — Middleware stack, Inertia error page handler
├── database/
│   ├── factories/                             — User, GrantUnified, Initiative, Keyword
│   └── migrations/
├── resources/
│   ├── css/app.css                            — Tailwind + design tokens
│   ├── js/
│   │   ├── app.jsx                            — Inertia bootstrap
│   │   ├── Layouts/
│   │   │   ├── AppLayout.jsx                  — Authenticated shell (sticky nav, search)
│   │   │   └── GuestLayout.jsx                — Login / guest shell
│   │   └── Pages/
│   │       ├── Auth/                          — Login, ConfirmPassword, SetPassword
│   │       ├── Grants/Index.jsx               — Main dashboard
│   │       ├── Config/Index.jsx               — Initiatives, keywords, org profile
│   │       ├── Stats/Index.jsx                — Analytics dashboard
│   │       ├── Team/Index.jsx                 — Team management
│   │       ├── Error.jsx                      — Inertia 404 / 403 / 500 page
│   │       └── Welcome.jsx                    — Public landing page
│   └── views/
│       ├── app.blade.php                      — HTML shell
│       └── errors/404.blade.php               — Server-side error page (no JS)
├── routes/
│   ├── api.php                                — JSON API endpoints
│   ├── auth.php                               — Login, logout, confirm/change password
│   └── web.php                                — Inertia page routes
├── docker-compose.yml
├── vite.config.js
└── phpunit.xml
```

### How it works

Requests flow through three layers: **Browser → Laravel → MySQL**.

The browser runs a React app built by Vite. Inertia.js intercepts navigation so that clicking a link fetches the next page's props as JSON rather than reloading the page. Laravel renders the initial HTML shell from `resources/views/app.blade.php`, and Inertia takes it from there.

Every request on the server passes through the middleware stack in this order:

1. `ForcePasswordChange` — redirects to `/set-password` if the user's `must_change_password` flag is set
2. `RequireFullAccess` — blocks non-admin users from admin routes; returns 403 JSON for API requests, redirects web requests to the dashboard
3. `HandleInertiaRequests` — injects the shared `auth.user` prop into every Inertia response

Web routes live in `routes/web.php` and render Inertia pages. API routes live in `routes/api.php` and return JSON, using the same cookie-based session for authentication.

The Vite build splits vendor code into three chunks: `vendor-react` (~145 KB), `vendor-inertia` (~194 KB), and `vendor-recharts` (only loaded on the Stats page).

---

## Roles

There's no self-registration. Accounts are created by admins through the Team panel.

| Capability | `standard` | `full` |
|---|---|---|
| Grants dashboard | ✓ | ✓ |
| Star / apply / note grants | ✓ | ✓ |
| View own audit logs | ✓ | ✓ |
| View all audit logs | — | ✓ |
| Stats dashboard | — | ✓ |
| Config (initiatives, keywords, org profile) | — | ✓ |
| Team management | — | ✓ |
| POST /api/rescore | — | ✓ |

There's no email verification or forgot-password flow. Admins issue temporary passwords through the Team panel.

---

## Local setup

You'll need Docker and Docker Compose. Node 20+ and Composer are optional locally — both are available inside the containers.

**1. Copy the environment file and fill in your database credentials:**

```bash
cp .env.example .env
```

```
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
```

**2. Start the containers:**

```bash
docker compose up -d
```

This brings up four services: `php` (FPM on port 9000), `nginx` (port 8000), `mysql` (port 3306), and `node` (Vite dev server on port 5173).

**3. Install dependencies and run migrations:**

```bash
docker compose exec php composer install
docker compose exec php php artisan key:generate
docker compose exec php php artisan migrate
npm install
```

The app is available at `http://localhost:8000`. Vite's dev server runs at `http://localhost:5173` and assets are proxied through it automatically.

**4. Create the first admin account via Tinker:**

```bash
docker compose exec php php artisan tinker
```

```php
App\Models\User::create([
    'name'                => 'Your Name',
    'email'               => 'you@example.com',
    'email_verified_at'   => now(),
    'password'            => bcrypt('your-password'),
    'role'                => 'full',
    'is_active'           => true,
    'must_change_password' => false,
]);
```

After that, use the Team panel at `/team` to invite everyone else.

---

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `APP_NAME` | `Laravel` | Shown in the browser title bar |
| `APP_ENV` | `local` | `local` or `production` |
| `APP_KEY` | _(empty)_ | Generate with `php artisan key:generate` |
| `APP_DEBUG` | `true` | Set to `false` in production |
| `APP_URL` | `http://localhost` | Used in generated links |
| `DB_CONNECTION` | `sqlite` | Always set to `mysql` |
| `DB_HOST` | `mysql` | `mysql` inside Docker, `127.0.0.1` outside |
| `DB_DATABASE` | — | Database name |
| `DB_USERNAME` | — | Database user |
| `DB_PASSWORD` | — | Database password |
| `SESSION_DRIVER` | `database` | Keep as `database` |
| `SESSION_LIFETIME` | `120` | Minutes before session expires |
| `QUEUE_CONNECTION` | `database` | Keep as `database` |
| `MAIL_MAILER` | `log` | No email service — keeps output in `storage/logs` |
| `VITE_APP_NAME` | _(inherits `APP_NAME`)_ | Passed to the React frontend |

---

## Database

The app uses MySQL 8.0. The `.env.example` defaults to SQLite, but the app is built and tested against MySQL — always set `DB_CONNECTION=mysql`.

| Table | Purpose |
|---|---|
| `grants` | The main data table — unified grant records (~70 columns) |
| `grant_action_logs` | Immutable audit log — one row per field change, no `updated_at` |
| `initiatives` | Funding programs — soft-deleted via `is_deleted = true`, never hard-deleted |
| `keywords` | Search terms attached to initiatives — `initiative_id` is nulled when an initiative is deleted |
| `organization_profile` | Single-row config table used by the scraper |
| `ddg_search_combos` | Cached keyword + site combinations for the DuckDuckGo scraper |
| `search_runs` | One row per scraper execution — hit counts, timing, theme |
| `users` | Team members |
| `sessions` | Laravel database sessions |

```bash
php artisan migrate          # apply pending migrations
php artisan migrate:fresh    # wipe and re-run (loses all data)
```

---

## Running the app

### Development

```bash
docker compose up -d
```

The `node` container starts Vite automatically. Changes to JSX, CSS, and Blade files hot-reload without a full page refresh.

If you're running outside Docker, `composer dev` starts everything in one terminal — the Laravel server, queue worker, log tail, and Vite dev server all at once.

### Production build

```bash
npm run build
```

Vite writes hashed assets to `public/build/`. That directory needs to be on the server before you deploy.

---

## Running tests

Tests use a separate MySQL database so they never touch your development data. Create it once:

```bash
docker compose exec mysql mysql -u root -p -e "
  CREATE DATABASE IF NOT EXISTS grantsdb_test;
  GRANT ALL ON grantsdb_test.* TO 'your_db_user'@'%';
"
```

Then run the suite:

```bash
docker compose exec php php artisan test
# or
./vendor/bin/phpunit
```

Each test wraps in a transaction and rolls back on completion, so the test database stays clean. `phpunit.xml` forces MySQL and points at `grantsdb_test` regardless of what's in `.env`.

```
tests/
├── Unit/
│   └── GrantActionLogTest.php           — Model logic, action resolution
└── Feature/
    ├── Auth/
    │   ├── AuthenticationTest.php        — Login, inactive accounts, force-password-change gate
    │   ├── PasswordConfirmationTest.php  — Re-confirm password before sensitive actions
    │   ├── PasswordResetTest.php         — Admin reset (POST /api/team/{id}/reset-password)
    │   └── PasswordUpdateTest.php        — Self-service password change (PUT /password)
    ├── Grants/
    │   ├── GrantAuditLogTest.php         — Audit log creation on field changes
    │   └── GrantDataApiTest.php          — /api/data, /api/count, PATCH /api/grants/{id}
    ├── InitiativeKeywordTest.php         — CRUD, soft-delete, keyword detachment
    ├── OrganizationProfileTest.php       — GET/PUT /api/organization upsert logic
    ├── RequireFullAccessTest.php         — Middleware: 403 JSON vs redirect by role
    ├── StatsControllerTest.php           — All six payload keys, funnel, score buckets, run history
    └── TeamManagementTest.php            — User creation, role updates, password reset, self-lockout prevention
```

---

## The scraper

The grants dashboard is fed by a separate Python pipeline in `../my_scraper/`. The two projects share only the MySQL database — the `grants` table is the handoff point.

The scraper loads the current initiative's keywords, searches six sources in parallel (Terra Viva RSS, Grants.gov, CA Grants Portal, Simpler.Grants.gov, OpenFEMA HMA, and DuckDuckGo), scores results against the foundation's mission using a local sentence-transformer model, runs a hard discard pass, and upserts everything into `grants`.

It rotates through initiatives one per run, keeping each execution under 60 minutes for a scheduled GitHub Actions job.

```bash
cd my_scraper
python main.py
```

For development, use the test scripts — they cap at 10 results and don't advance the rotation state:

```bash
python tests/test_rss.py
python tests/test_api.py
python tests/test_ddg.py
```

The scraper has its own `.env` and its own README with the full configuration reference.

---

## License

See [LICENSE](LICENSE) for details.
