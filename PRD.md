# **Product Requirements Document (PRD.md)**

**Project Name:** Crosswind
**App Type / Goal:** AI-driven weather conflict detection and rescheduling system for flight training schedules
**Platform:** Web (React Dashboard + Cloud Backend)
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

| Layer                    | Tech                                 | Rationale                                      |
| ------------------------ | ------------------------------------ | ---------------------------------------------- |
| **Frontend**             | React + TypeScript + Vite            | Familiar, easy to scaffold, fast dev DX        |
| **Styling**              | TailwindCSS                          | Simple for AI to reason about layouts          |
| **Backend**              | Node.js + Express (TypeScript)       | Clean TypeScript APIs; minimal boilerplate     |
| **Database**             | PostgreSQL                           | Strong relational schema and supported locally |
| **ORM**                  | Prisma                               | Schema-based, auto-generates types             |
| **Weather API**          | WeatherAPI.com                       | Simple JSON API with clear rate limits         |
| **AI Layer**             | OpenAI SDK (gpt-4o or gpt-4-turbo)   | Natural language scheduling reasoning          |
| **Email / Notification** | Resend or Nodemailer                 | Easy integration, tested ecosystem             |
| **Deployment**           | Render (backend) + Vercel (frontend) | Simplifies hosting for solo devs               |

---

## **5. Feature Breakdown — Vertical Slices**

### **Slice 1: Weather Monitoring Service**

**User Story:**
As a scheduler, I want flights automatically checked for unsafe weather so I can cancel before students arrive.
**Acceptance Criteria:**

* System fetches weather for each active booking (hourly cron).
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

Example `.env` template:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/crosswind"
WEATHER_API_KEY="your_weatherapi_key"
OPENAI_API_KEY="your_openai_key"
EMAIL_SMTP_SERVER="smtp.gmail.com"
EMAIL_USER="noreply@crosswind.app"
EMAIL_PASS="your_email_password"
DEBUG=true
```

**Manual Setup Notification:**

* You must create a **WeatherAPI.com** account and copy your API key into `.env`.
* Create an **OpenAI API key** (under API Keys page).
* Add SMTP credentials (Gmail or Resend).

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

* Backend uses `pino` for structured logging.
* Toggle debug logs with `DEBUG=true` in `.env`.
* Store logs in `logs/app.log`.
* In dev, console logs all API requests.

---

## **11. External Setup Instructions (Manual)**

1. **Create PostgreSQL Database:**

   * Run locally using `initdb` or Docker (`docker run postgres`).
   * Update `DATABASE_URL` in `.env`.
   * Run `npx prisma migrate dev`.

2. **Configure WeatherAPI:**

   * Go to [weatherapi.com](https://www.weatherapi.com).
   * Copy API key to `.env`.

3. **Configure Email:**

   * For Gmail: enable "App Passwords" → use generated key.
   * For Resend: create domain + API key.

4. **Set up AI Provider:**

   * Use OpenAI SDK; ensure billing enabled.

---

## **12. Deployment Plan**

**Local Development:**

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (if using Docker)
docker run -d -p 5432:5432 postgres

# 3. Run Prisma migrations
npx prisma migrate dev

# 4. Start backend
npm run dev

# 5. Start frontend
npm run start
```

**Deploy:**

* Frontend → Vercel (`vercel --prod`)
* Backend → Render / Railway (`git push render main`)