# **Product Requirements Document (PRD.md)**

**Project Name:** Crosswind
**App Type / Goal:** AI-driven weather conflict detection and rescheduling system for flight training schedules
**Platform:** Web (Next.js App Router + Server Components on AWS)
**Constraints:** Use TypeScript (frontend + backend). PostgreSQL for data. WeatherAPI.com for weather.
**Special Notes:** Must support AI-assisted reasoning for rescheduling based on pilot training level.

---

## **1. Project Summary**

Build **Crosswind**, a web-based flight scheduling assistant for **Flight Schedule Pro**, that automatically detects **weather conflicts** in scheduled flight lessons and uses **AI** to generate optimal **rescheduling suggestions**. The app continuously monitors weather conditions at **departure, arrival, and flight corridor points**, notifies affected users, and recommends reschedules that consider **training level**, **availability**, and **safety minimums**.

**MVP scope:**
A. Automated weather conflict detection
B. AI-powered rescheduling
C. Notification + dashboard system

---

## **2. Core Goals**

* Users can view upcoming flights with real-time weather risk indicators.
* Users receive automatic alerts for weather conflicts (email + in-app).
* AI generates 3 valid rescheduling options per cancelled flight.
* Admins can view all conflicts, actions, and statuses in a dashboard.
* All cancellations and reschedules are logged in the database.

---

## **3. Non-Goals**

* No mobile or offline support in MVP.
* No payment, billing, or instructor payroll tracking.
* No flight performance analytics or maintenance tracking.
* No multi-tenant or multi-school support (single org only).

---

## **4. Tech Stack (Solo-AI Friendly)**

| Layer                    | Tech                                                                 | Rationale                                                         |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Frontend**             | Next.js (App Router) + TypeScript                                    | Unified SSR/SSG, routing, and bundling; excellent DX              |
| **Styling**              | TailwindCSS                                                          | Fast, composable UI                                               |
| **Backend**              | Next.js API Routes + Server Actions (Node.js/TypeScript)             | No separate Express service required for MVP                      |
| **Database**             | PostgreSQL (Amazon RDS in prod, local Postgres in dev)               | Strong relational schema, managed option on AWS                   |
| **ORM**                  | Prisma                                                                | Schema-first, typed client                                        |
| **Weather API**          | WeatherAPI.com                                                        | Simple JSON API with clear rate limits                            |
| **AI Layer**             | OpenAI SDK (gpt-4o or gpt-4-turbo)                                   | Natural language scheduling reasoning                             |
| **Email / Notification** | Amazon SES (or Resend for dev)                                       | Reliable email on AWS                                             |
| **Deployment**           | AWS (Amplify Hosting or CloudFront + Lambda/Edge; API via Lambda)    | Host Next.js on AWS; cron via EventBridge; logs in CloudWatch     |

---

## **5. Feature Breakdown — Vertical Slices**

### **Slice 1: Weather Monitoring Service**

**User Story:**
As a scheduler, I want flights automatically checked for unsafe weather so I can cancel before students arrive.
**Acceptance Criteria:**

* System fetches weather for each active booking (hourly cron: EventBridge in prod; node-cron in dev).
* Detects unsafe conditions per training level.
* Flags conflict in database.
  **Data Model Notes:**
* Uses `flights`, `students`, `weather_reports` tables.
  **Edge Cases & Errors:**
* Missing coordinates → skip with warning.
* API limit hit → exponential backoff + retry queue.

---

### **Slice 2: Conflict Detection + Notification**

**User Story:**
As a student or instructor, I want real-time notifications when weather makes my flight unsafe.
**Acceptance Criteria:**

* Detects conflict and sends email + dashboard alert.
* Marks booking as “pending reschedule.”
  **Data Model Notes:**
* Update `status` to “conflict.”
  **Edge Cases:**
* Email fails → retry in 5 min.
* Duplicate alerts → suppress with cache lock.

---

### **Slice 3: AI Rescheduling Assistant**

**User Story:**
As a student, I want AI to suggest 3 alternate flight times that fit my training schedule and weather minimums.
**Acceptance Criteria:**

* Uses OpenAI to generate 3 valid reschedule options.
* Writes results to `reschedule_suggestions` table.
* Considers weather, pilot rating, and availability.
  **Data Model Notes:**
* `students.trainingLevel` drives weather logic.
  **Edge Cases:**
* No clear-weather slots found → fallback “manual reschedule needed.”
* AI token limit → batch requests.

---

### **Slice 4: Dashboard View**

**User Story:**
As an admin, I want a dashboard showing current conflicts and status of reschedules.
**Acceptance Criteria:**

* Display all upcoming flights, status badges (OK / Conflict / Rescheduled).
* Live updates every 60s via polling or WebSocket.
  **Edge Cases:**
* Empty data → show placeholder UI.
* API timeout → show cached results.

---

### **Slice 5: Audit Log & Metrics**

**User Story:**
As an operations manager, I want to see performance stats like conflicts detected and average reschedule time.
**Acceptance Criteria:**

* Log every cancellation, reschedule, and confirmation.
* Compute metrics nightly.
  **Edge Cases:**
* Missing timestamps → skip from averages.

---

## **6. Data Schema (Prisma)**

```prisma
model Student {
  id             Int      @id @default(autoincrement())
  name           String
  email          String
  phone          String?
  trainingLevel  String
  bookings       Booking[]
}

model Booking {
  id              Int      @id @default(autoincrement())
  studentId       Int
  scheduledDate   DateTime
  departureLat    Float
  departureLon    Float
  status          String   @default("scheduled")
  student         Student  @relation(fields: [studentId], references: [id])
}

model WeatherReport {
  id          Int      @id @default(autoincrement())
  bookingId   Int
  windKts     Float
  visibility  Float
  ceilingFt   Int
  condition   String
  createdAt   DateTime @default(now())
}

model RescheduleSuggestion {
  id            Int      @id @default(autoincrement())
  bookingId     Int
  optionText    String
  createdAt     DateTime @default(now())
}
```

---

## **8. .env Setup**

Example `.env.local` template (for Next.js dev):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/crosswind"
WEATHER_API_KEY="your_weatherapi_key"
OPENAI_API_KEY="your_openai_key"
EMAIL_SMTP_SERVER="smtp.gmail.com" # or use SES variables below
EMAIL_USER="noreply@crosswind.app"
EMAIL_PASS="your_email_password"
# For Amazon SES (recommended in prod):
AWS_SES_REGION="us-east-1"
AWS_SES_ACCESS_KEY_ID="your_key"
AWS_SES_SECRET_ACCESS_KEY="your_secret"
DEBUG=true
```

**Manual Setup Notification:**

* You must create a **WeatherAPI.com** account and copy your API key into `.env.local`.
* Create an **OpenAI API key** (under API Keys page).
* Add email credentials: for dev use Gmail/Resend; for prod use **Amazon SES**.
* On AWS, store secrets in **AWS Secrets Manager** or **SSM Parameter Store** and load them as environment variables for the runtime (Amplify/Lambda).

---

## **9. .gitignore**

```gitignore
# Node / TypeScript
node_modules/
dist/
.env
.env.*
*.log
*.tsbuildinfo

# OS
.DS_Store

# Editor
.vscode/
.idea/
```

---

## **10. Debugging & Logging**

* Server code (API routes/server actions) uses `pino` for structured logging.
* Toggle debug logs with `DEBUG=true` in `.env.local`.
* In dev, Next.js logs requests to console; optionally write to `logs/app.log`.
* In AWS, ship server logs to **CloudWatch Logs**.

---

## **11. External Setup Instructions (Manual)**

1. **Create PostgreSQL Database:**

   * Dev: run locally using `initdb` or Docker (`docker run -d -p 5432:5432 postgres`).
   * Prod: provision **Amazon RDS for PostgreSQL**.
   * Update `DATABASE_URL` in `.env.local` (dev) and in AWS environment.
   * Run `npx prisma migrate dev` (dev) and `prisma migrate deploy` (prod CI/CD).

2. **Configure WeatherAPI:**

   * Go to [weatherapi.com](https://www.weatherapi.com).
   * Copy API key to `.env.local` (dev) and to AWS Secrets/Parameters (prod).

3. **Configure Email:**

   * Dev: Gmail App Passwords or Resend.
   * Prod: **Amazon SES** (verify domain/sender, create IAM credentials or use execution role).

4. **Set up AI Provider:**

   * Use OpenAI SDK; ensure billing enabled.

5. **Set up Scheduling (Cron):**

   * Dev: use `node-cron` task or manual trigger endpoint.
   * Prod (AWS): create an **EventBridge** scheduled rule that invokes a Lambda to run the weather check logic (can share code with Next.js API or be a small separate worker).

---

## **12. Deployment Plan**

**Local Development (Next.js single app):**

```bash
# 1. Install dependencies
npm install  # or: pnpm install

# 2. Start PostgreSQL (if using Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=crosswind postgres

# 3. Run Prisma migrations and generate client
npx prisma migrate dev
npx prisma generate

# 4. Start Next.js (frontend + API routes)
npm run dev
```

**Deploy to AWS (pick one approach):**

*Option A — AWS Amplify Hosting (simplest):*
* Connect Git repo to **AWS Amplify Hosting**.
* Amplify detects Next.js, builds, and deploys SSR/ISR automatically.
* Configure environment variables and secrets in Amplify.
* Use **RDS PostgreSQL** and **SES**.
* For cron jobs, add an **EventBridge** rule + **Lambda** that runs the weather check logic (invoke an internal endpoint or share library code).

*Option B — CloudFront + Lambda@Edge / API Gateway + Lambda (fine-grained control):*
* Build Next.js with output suitable for serverless (e.g., via Serverless/SST or Next.js serverless target).
* Serve static assets via **S3 + CloudFront**.
* Deploy SSR handlers and API routes to **Lambda (or Lambda@Edge)** behind **API Gateway**/CloudFront.
* Provision **RDS PostgreSQL**, configure **Secrets Manager**/**SSM** params, and set environment for Lambdas.
* Schedule cron via **EventBridge** to a worker Lambda for weather checks.

Database migrations in CI/CD:
* Run `prisma migrate deploy` against RDS as part of release.