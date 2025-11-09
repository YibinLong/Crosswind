# **Crosswind - Task List**

**Status Legend:** ⬜ Not Started | 🟦 In Progress | ✅ Done | ❌ Blocked

---

## **PHASE 1: PROJECT SETUP & DATABASE** ✅

### **Epic 1.1: Environment Setup & Dependencies** ✅

**Story:** Configure development environment and install backend dependencies

- ✅ **Task 1.1.1:** Install backend dependencies (Prisma, OpenAI SDK, nodemailer/AWS SES SDK, node-cron)
  - Install `@prisma/client`, `prisma` (dev)
  - Install `openai` SDK for AI rescheduling
  - Install `nodemailer` for email (dev) or `@aws-sdk/client-ses` for production
  - Install `node-cron` for scheduled tasks
  - Install `bcrypt` and `jsonwebtoken` for authentication
  - Install `zod` for validation (already in package.json)

- ✅ **Task 1.1.2:** Create `.env` file with all required environment variables
  - Add `DATABASE_URL` for PostgreSQL connection
  - Add `WEATHER_API_KEY` (WeatherAPI.com)
  - Add `OPENAI_API_KEY`
  - Add `EMAIL_SMTP_SERVER`, `EMAIL_USER`, `EMAIL_PASS` (dev)
  - Add `AWS_SES_REGION`, `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY` (prod)
  - Add `NEXTAUTH_SECRET` and `NEXTAUTH_URL` for authentication
  - Add `DEBUG=true` for development

- ✅ **Task 1.1.3:** Add `.env` to `.gitignore` and create `.env.example` template

**Acceptance:** All dependencies installed, `.env` configured, environment variables documented

---

### **Epic 1.2: Database Setup with Prisma** ✅

**Story:** Set up PostgreSQL database and create schema using Prisma

- ✅ **Task 1.2.1:** Set up local PostgreSQL database
  - Option A: Install PostgreSQL locally on macOS (`brew install postgresql`)
  - Option B: Run PostgreSQL via Docker (`docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=crosswind postgres`)
  - Verify connection works

- ✅ **Task 1.2.2:** Initialize Prisma in the project
  - Run `npx prisma init`
  - Configure `prisma/schema.prisma` with PostgreSQL provider

- ✅ **Task 1.2.3:** Create Prisma schema models based on PRD.md requirements
  - Create `Student` model (id, name, email, phone, trainingLevel, createdAt, updatedAt)
  - Create `Instructor` model (id, name, email, phone, createdAt, updatedAt)
  - Create `Aircraft` model (id, tailNumber, model, status, createdAt, updatedAt)
  - Create `Booking` model (id, studentId, instructorId, aircraftId, scheduledDate, departureLat, departureLon, arrivalLat, arrivalLon, status, createdAt, updatedAt)
  - Create `WeatherReport` model (id, bookingId, windKts, windGustKts, visibility, ceilingFt, condition, temperature, isSafe, violatedMinimums, createdAt)
  - Create `RescheduleSuggestion` model (id, bookingId, proposedDate, proposedTime, weatherSummary, confidence, reason, selected, createdAt)
  - Create `AuditLog` model (id, bookingId, action, performedBy, details, createdAt)
  - Set up proper relationships (foreign keys, relations)

- ✅ **Task 1.2.4:** Run initial Prisma migration
  - Run `npx prisma migrate dev --name init`
  - Verify tables are created in PostgreSQL

- ✅ **Task 1.2.5:** Generate Prisma Client
  - Run `npx prisma generate`
  - Test database connection with a simple query

- ✅ **Task 1.2.6:** Create database seed file with mock data
  - Create `prisma/seed.ts` with sample students, instructors, aircraft, and bookings
  - Add seed script to `package.json`
  - Run `npx prisma db seed` to populate test data

**Acceptance:** Database is running, schema is migrated, Prisma Client generated, seed data loaded successfully

---

## **PHASE 2: BACKEND API ROUTES & SERVER ACTIONS** ⬜

### **Epic 2.1: Authentication System** ⬜

**Story:** Implement user authentication for login and signup

- ⬜ **Task 2.1.1:** Create user authentication utilities
  - Create `lib/auth.ts` with password hashing (bcrypt) and JWT token generation/verification
  - Create `lib/session.ts` for session management

- ⬜ **Task 2.1.2:** Create API route for user signup
  - Create `app/api/auth/signup/route.ts`
  - Validate email/password with Zod
  - Hash password with bcrypt
  - Create user in database (extend Student or create separate User model)
  - Return JWT token

- ⬜ **Task 2.1.3:** Create API route for user login
  - Create `app/api/auth/login/route.ts`
  - Validate credentials
  - Compare hashed passwords
  - Return JWT token on success

- ⬜ **Task 2.1.4:** Create authentication middleware
  - Create `lib/middleware/auth.ts` to verify JWT tokens
  - Protect authenticated routes

- ⬜ **Task 2.1.5:** Connect login/signup pages to authentication API
  - Update `app/login/page.tsx` to call login API
  - Update `app/signup/page.tsx` to call signup API
  - Handle authentication errors and display messages
  - Redirect to dashboard on successful login

**Acceptance:** Users can sign up, log in, and access protected routes with JWT authentication

---

### **Epic 2.2: Flight Booking CRUD Operations** ⬜

**Story:** Create API endpoints for managing flight bookings

- ⬜ **Task 2.2.1:** Create API route to fetch all bookings
  - Create `app/api/bookings/route.ts` (GET method)
  - Return all bookings with related student, instructor, aircraft data
  - Add optional query filters (status, date range, student)

- ⬜ **Task 2.2.2:** Create API route to create a new booking
  - Create `app/api/bookings/route.ts` (POST method)
  - Validate booking data with Zod schema
  - Check for scheduling conflicts
  - Create booking in database
  - Return created booking

- ⬜ **Task 2.2.3:** Create API route to get a single booking by ID
  - Create `app/api/bookings/[id]/route.ts` (GET method)
  - Include related data (student, instructor, aircraft, weather reports, reschedule suggestions)

- ⬜ **Task 2.2.4:** Create API route to update a booking
  - Create `app/api/bookings/[id]/route.ts` (PATCH method)
  - Validate update data
  - Update booking status or details
  - Log action in AuditLog

- ⬜ **Task 2.2.5:** Create API route to cancel/delete a booking
  - Create `app/api/bookings/[id]/route.ts` (DELETE method)
  - Soft delete or update status to "cancelled"
  - Log cancellation in AuditLog

**Acceptance:** Full CRUD operations for bookings work via API routes

---

### **Epic 2.3: Students, Instructors, and Aircraft APIs** ⬜

**Story:** Create API endpoints for managing students, instructors, and aircraft

- ⬜ **Task 2.3.1:** Create API routes for students
  - Create `app/api/students/route.ts` (GET all, POST create)
  - Create `app/api/students/[id]/route.ts` (GET one, PATCH update, DELETE delete)

- ⬜ **Task 2.3.2:** Create API routes for instructors
  - Create `app/api/instructors/route.ts` (GET all, POST create)
  - Create `app/api/instructors/[id]/route.ts` (GET one, PATCH update, DELETE delete)

- ⬜ **Task 2.3.3:** Create API routes for aircraft
  - Create `app/api/aircraft/route.ts` (GET all, POST create)
  - Create `app/api/aircraft/[id]/route.ts` (GET one, PATCH update, DELETE delete)

**Acceptance:** API endpoints for students, instructors, and aircraft are functional

---

## **PHASE 3: WEATHER INTEGRATION & CONFLICT DETECTION** ⬜

### **Epic 3.1: WeatherAPI.com Integration** ⬜

**Story:** Integrate with WeatherAPI.com to fetch real-time weather data

- ⬜ **Task 3.1.1:** Create weather service module
  - Create `lib/services/weather.ts`
  - Implement function to fetch weather by coordinates (lat, lon)
  - Parse WeatherAPI.com JSON response
  - Extract: visibility, wind speed, wind gust, ceiling, condition, temperature
  - Handle API errors and rate limiting

- ⬜ **Task 3.1.2:** Create weather minimums evaluation logic
  - Create `lib/services/weatherMinimums.ts`
  - Implement function to check if weather is safe for a given training level
  - Use `WEATHER_MINIMUMS` from `lib/types.ts`
  - Return boolean `isSafe` and array of `violatedMinimums`

- ⬜ **Task 3.1.3:** Create API route to manually check weather for a booking
  - Create `app/api/weather/check/[bookingId]/route.ts`
  - Fetch booking with coordinates
  - Fetch weather for departure and arrival
  - Evaluate against training level minimums
  - Return weather data and safety status

- ⬜ **Task 3.1.4:** Test weather API integration
  - Test with various coordinates
  - Test error handling (invalid API key, rate limit)
  - Verify safety logic works correctly for different training levels

**Acceptance:** Weather data can be fetched for any location and correctly evaluated against training level minimums

---

### **Epic 3.2: Automated Weather Monitoring Service** ⬜

**Story:** Create a background service that monitors weather for all upcoming flights

- ⬜ **Task 3.2.1:** Create weather monitoring service
  - Create `lib/services/weatherMonitor.ts`
  - Implement function to check all upcoming bookings (next 48 hours)
  - For each booking, fetch weather and evaluate safety
  - If unsafe, update booking status to "conflict"
  - Create `WeatherReport` record in database
  - Track which bookings were checked to avoid duplicates

- ⬜ **Task 3.2.2:** Create API endpoint to trigger weather check (for testing)
  - Create `app/api/weather/monitor/route.ts` (POST method)
  - Call weather monitoring service
  - Return results (number of bookings checked, conflicts detected)

- ⬜ **Task 3.2.3:** Set up cron job for automated monitoring (development)
  - Create `lib/cron/weatherCheck.ts`
  - Use `node-cron` to schedule hourly weather checks
  - Initialize cron job when server starts
  - Add logging to track execution

- ⬜ **Task 3.2.4:** Test automated weather monitoring
  - Create test bookings with known weather conditions
  - Manually trigger weather check via API
  - Verify conflicts are detected and database is updated
  - Verify cron job runs on schedule

**Acceptance:** Weather is automatically checked for all upcoming flights every hour, conflicts are detected and logged

---

## **PHASE 4: AI RESCHEDULING SYSTEM** ⬜

### **Epic 4.1: OpenAI Integration for Rescheduling** ⬜

**Story:** Use OpenAI to generate intelligent reschedule suggestions

- ⬜ **Task 4.1.1:** Create OpenAI service module
  - Create `lib/services/openai.ts`
  - Initialize OpenAI client with API key
  - Create function to generate reschedule suggestions
  - Build prompt with: flight details, student training level, weather conflict, available time slots
  - Request 3 alternative date/time options from GPT-4

- ⬜ **Task 4.1.2:** Create reschedule suggestion logic
  - Create `lib/services/reschedule.ts`
  - For a conflicted booking, gather context:
    - Student training level and weather minimums
    - Current weather forecast for next 7 days
    - Instructor and aircraft availability (mock for MVP)
  - Call OpenAI service with context
  - Parse AI response into structured reschedule options
  - Save suggestions to `RescheduleSuggestion` table

- ⬜ **Task 4.1.3:** Create API route to generate AI reschedule suggestions
  - Create `app/api/bookings/[id]/reschedule/route.ts` (POST method)
  - Validate that booking exists and has a conflict
  - Call reschedule service
  - Return generated suggestions

- ⬜ **Task 4.1.4:** Create API route to confirm a reschedule suggestion
  - Create `app/api/bookings/[id]/reschedule/confirm/route.ts` (POST method)
  - Accept suggestion ID
  - Update booking with new date/time
  - Mark suggestion as `selected`
  - Update booking status to "confirmed"
  - Log action in AuditLog

- ⬜ **Task 4.1.5:** Test AI rescheduling system
  - Create test scenarios with different training levels
  - Verify AI generates appropriate suggestions
  - Test edge case: no suitable slots available (AI should recommend manual rescheduling)
  - Verify suggestions are saved and can be confirmed

**Acceptance:** AI generates 3 valid reschedule options for conflicted flights, and users can confirm a suggestion

---

## **PHASE 5: NOTIFICATION SYSTEM** ⬜

### **Epic 5.1: Email Notification Service** ⬜

**Story:** Send email notifications when weather conflicts are detected

- ⬜ **Task 5.1.1:** Create email service module (development)
  - Create `lib/services/email.ts`
  - Set up nodemailer with SMTP credentials for development
  - Create email templates for:
    - Weather conflict alert
    - Reschedule confirmation
    - Flight reminder
  - Implement function to send emails

- ⬜ **Task 5.1.2:** Create AWS SES email service (production)
  - Create `lib/services/emailSES.ts`
  - Set up AWS SES SDK client
  - Implement same email sending function using SES
  - Add conditional logic to use nodemailer in dev, SES in production

- ⬜ **Task 5.1.3:** Integrate email notifications with weather monitoring
  - Update `lib/services/weatherMonitor.ts`
  - When conflict is detected, send email to student and instructor
  - Include flight details and weather issue in email
  - Add link to dashboard to view reschedule options

- ⬜ **Task 5.1.4:** Integrate email notifications with reschedule confirmation
  - Update reschedule confirmation API route
  - Send confirmation email to student and instructor
  - Include new flight details

- ⬜ **Task 5.1.5:** Test email notifications
  - Test in development with nodemailer (Gmail or test service)
  - Verify emails are sent when conflicts are detected
  - Verify emails are sent when reschedules are confirmed
  - Test with AWS SES in staging environment

**Acceptance:** Email notifications are sent for weather conflicts and reschedule confirmations

---

### **Epic 5.2: In-App Notifications** ⬜

**Story:** Display real-time notifications in the dashboard

- ⬜ **Task 5.2.1:** Create notification data model (if needed)
  - Add `Notification` model to Prisma schema (optional)
  - Or use existing data to populate UI alerts

- ⬜ **Task 5.2.2:** Create API route to fetch active alerts
  - Create `app/api/alerts/route.ts`
  - Return all bookings with status "conflict"
  - Include weather report and student details
  - Format data for `WeatherAlerts` component

- ⬜ **Task 5.2.3:** Connect WeatherAlerts component to API
  - Update `components/weather-alerts.tsx`
  - Replace mock data with API call
  - Use `useEffect` and state to fetch and display alerts
  - Add loading and error states

**Acceptance:** Dashboard displays real-time weather alerts from the database

---

## **PHASE 6: FRONTEND-BACKEND INTEGRATION** ⬜

### **Epic 6.1: Connect Dashboard Components to Backend** ⬜

**Story:** Replace all mock data in frontend components with real API data

- ⬜ **Task 6.1.1:** Connect QuickStats component
  - Update `components/quick-stats.tsx`
  - Create API route `app/api/dashboard/stats/route.ts`
  - Fetch: total flights, active conflicts, resolved count, avg reschedule time
  - Display real data in QuickStats

- ⬜ **Task 6.1.2:** Connect UpcomingFlights component
  - Update `components/upcoming-flights.tsx`
  - Fetch bookings from `/api/bookings?status=confirmed&upcoming=true`
  - Display real flight data
  - Add loading skeleton

- ⬜ **Task 6.1.3:** Connect RecentActivity component
  - Update `components/recent-activity.tsx`
  - Create API route `app/api/activity/route.ts` to fetch recent audit logs
  - Display real activity feed

- ⬜ **Task 6.1.4:** Connect FlightsList component
  - Update `components/flights-list.tsx`
  - Fetch all bookings from `/api/bookings`
  - Implement search and filter functionality
  - Connect "View Details" and "Reschedule" buttons to real data

- ⬜ **Task 6.1.5:** Connect BookFlightDialog to API
  - Update `components/book-flight-dialog.tsx`
  - Fetch real students, instructors, aircraft from APIs
  - On submit, POST to `/api/bookings`
  - Show success/error toast
  - Refresh flights list after successful booking

- ⬜ **Task 6.1.6:** Connect RescheduleDialog to AI API
  - Update `components/reschedule-dialog.tsx`
  - On dialog open, POST to `/api/bookings/[id]/reschedule` to generate AI suggestions
  - Display loading state while AI generates options
  - On confirm, POST to `/api/bookings/[id]/reschedule/confirm`
  - Show success toast and refresh data

**Acceptance:** All dashboard components display real data from the backend

---

### **Epic 6.2: Connect Analytics Page** ⬜

**Story:** Build analytics data endpoints and connect to charts

- ⬜ **Task 6.2.1:** Create analytics API routes
  - Create `app/api/analytics/overview/route.ts` for high-level metrics
  - Create `app/api/analytics/performance/route.ts` for performance chart data
  - Create `app/api/analytics/weather-impact/route.ts` for weather impact data

- ⬜ **Task 6.2.2:** Connect AnalyticsOverview component
  - Update `components/analytics-overview.tsx`
  - Fetch real metrics from API
  - Display with loading states

- ⬜ **Task 6.2.3:** Connect PerformanceCharts component
  - Update `components/performance-charts.tsx`
  - Fetch chart data from API
  - Populate recharts with real data

- ⬜ **Task 6.2.4:** Connect WeatherImpactAnalysis component
  - Update `components/weather-impact-analysis.tsx`
  - Fetch weather impact data from API
  - Display real analysis

**Acceptance:** Analytics page displays real metrics and charts from the database

---

## **PHASE 7: LOGGING & AUDIT TRAIL** ⬜

### **Epic 7.1: Implement Audit Logging** ⬜

**Story:** Log all important actions for compliance and debugging

- ⬜ **Task 7.1.1:** Create audit log service
  - Create `lib/services/auditLog.ts`
  - Implement function to create audit log entries
  - Log: booking created, booking cancelled, conflict detected, reschedule suggested, reschedule confirmed

- ⬜ **Task 7.1.2:** Integrate audit logging into all API routes
  - Add audit log calls to booking CRUD operations
  - Add audit log calls to weather monitoring
  - Add audit log calls to reschedule operations
  - Include user ID (if authenticated), timestamp, action details

- ⬜ **Task 7.1.3:** Create activity feed API
  - Create `app/api/activity/route.ts`
  - Return recent audit logs with related data
  - Support pagination

**Acceptance:** All important actions are logged in the AuditLog table and can be queried

---

### **Epic 7.2: Structured Logging with Pino** ⬜

**Story:** Implement structured logging for debugging and monitoring

- ⬜ **Task 7.2.1:** Install and configure Pino logger
  - Install `pino` and `pino-pretty` (dev)
  - Create `lib/logger.ts` with Pino configuration
  - Set log level based on `DEBUG` environment variable

- ⬜ **Task 7.2.2:** Add logging to all services
  - Add info logs for successful operations
  - Add error logs with stack traces for failures
  - Add debug logs for important state changes
  - Log API requests and responses

- ⬜ **Task 7.2.3:** Configure log output
  - In development: use `pino-pretty` for readable console logs
  - In production: output JSON logs for CloudWatch

**Acceptance:** All services log important events, errors are captured with context

---

## **PHASE 8: EXTERNAL SERVICE SETUP GUIDES** ⬜

### **Epic 8.1: WeatherAPI.com Setup** ⬜

**Story:** Document how to set up WeatherAPI.com account

- ⬜ **Task 8.1.1:** Create setup guide for WeatherAPI.com
  - Document steps to create account at weatherapi.com
  - Document how to get API key
  - Document free tier limits (1M calls/month)
  - Document how to add key to `.env.local`
  - Test API key works

**Acceptance:** Clear documentation for setting up WeatherAPI.com account

---

### **Epic 8.2: OpenAI API Setup** ⬜

**Story:** Document how to set up OpenAI API account

- ⬜ **Task 8.2.1:** Create setup guide for OpenAI
  - Document steps to create OpenAI account
  - Document how to get API key from platform.openai.com
  - Document pricing for GPT-4 (important for budget)
  - Document how to set usage limits
  - Document how to add key to `.env.local`
  - Test API key works

**Acceptance:** Clear documentation for setting up OpenAI API account

---

### **Epic 8.3: Amazon SES Setup (Production)** ⬜

**Story:** Document how to set up AWS SES for sending emails

- ⬜ **Task 8.3.1:** Create setup guide for AWS SES
  - Document steps to create AWS account
  - Document how to set up SES in a region (e.g., us-east-1)
  - Document how to verify sender email address or domain
  - Document how to request production access (sandbox vs production)
  - Document how to create IAM user with SES permissions
  - Document how to get access key and secret key
  - Document how to add credentials to AWS environment variables
  - Test sending email via SES

**Acceptance:** Clear documentation for setting up AWS SES for production emails

---

### **Epic 8.4: Amazon RDS PostgreSQL Setup (Production)** ⬜

**Story:** Document how to set up RDS PostgreSQL for production database

- ⬜ **Task 8.4.1:** Create setup guide for Amazon RDS
  - Document steps to create RDS PostgreSQL instance
  - Document configuration: instance type, storage, backup settings
  - Document how to configure security groups for access
  - Document how to get connection string
  - Document how to run Prisma migrations against RDS (`npx prisma migrate deploy`)
  - Document how to set `DATABASE_URL` in production environment

**Acceptance:** Clear documentation for provisioning and connecting to RDS PostgreSQL

---

## **PHASE 9: AWS DEPLOYMENT SETUP** ⬜

### **Epic 9.1: AWS Amplify Hosting Setup** ⬜

**Story:** Deploy Next.js app to AWS Amplify Hosting

- ⬜ **Task 9.1.1:** Create deployment guide for AWS Amplify
  - Document steps to create Amplify app in AWS console
  - Document how to connect GitHub repository
  - Document build settings for Next.js
  - Document how to add environment variables in Amplify
  - Document how to configure custom domain (optional)

- ⬜ **Task 9.1.2:** Configure environment variables in Amplify
  - Add all production environment variables:
    - `DATABASE_URL` (RDS connection string)
    - `WEATHER_API_KEY`
    - `OPENAI_API_KEY`
    - `AWS_SES_REGION`, `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`
    - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

- ⬜ **Task 9.1.3:** Test deployment
  - Push code to GitHub
  - Verify Amplify auto-builds and deploys
  - Test app in production URL
  - Verify API routes work
  - Verify database connection works

**Acceptance:** Next.js app is deployed to AWS Amplify and accessible via URL

---

### **Epic 9.2: AWS EventBridge + Lambda for Cron Jobs** ⬜

**Story:** Set up scheduled weather monitoring in production using AWS Lambda

- ⬜ **Task 9.2.1:** Create Lambda function for weather monitoring
  - Create separate Lambda function with Node.js runtime
  - Package weather monitoring logic from `lib/services/weatherMonitor.ts`
  - Include Prisma Client and dependencies
  - Set environment variables (DATABASE_URL, WEATHER_API_KEY, etc.)

- ⬜ **Task 9.2.2:** Create EventBridge rule for hourly execution
  - Create EventBridge rule with cron expression (`cron(0 * * * ? *)` for hourly)
  - Configure rule to trigger Lambda function
  - Test rule triggers Lambda successfully

- ⬜ **Task 9.2.3:** Alternative: Create API endpoint to trigger weather check
  - Create protected API route in Next.js app
  - Configure EventBridge to invoke Next.js API route instead of Lambda
  - This keeps all code in one place (simpler for solo developer)

- ⬜ **Task 9.2.4:** Document cron setup
  - Document steps to create EventBridge rule
  - Document steps to create and deploy Lambda (if using Lambda approach)
  - Document steps to configure EventBridge to invoke API endpoint (if using API approach)

**Acceptance:** Weather monitoring runs automatically every hour in production

---

### **Epic 9.3: AWS Secrets Manager (Optional)** ⬜

**Story:** Store sensitive credentials in AWS Secrets Manager instead of environment variables

- ⬜ **Task 9.3.1:** Create setup guide for Secrets Manager
  - Document how to create secrets in AWS Secrets Manager
  - Document how to store: DATABASE_URL, API keys, SES credentials
  - Document how to grant Lambda/Amplify permissions to read secrets
  - Document how to update code to fetch secrets at runtime

- ⬜ **Task 9.3.2:** Implement secrets fetching (optional)
  - Update `lib/config.ts` to fetch secrets from AWS Secrets Manager in production
  - Keep environment variables for development

**Acceptance:** (Optional) Secrets are stored securely in AWS Secrets Manager

---

## **PHASE 10: TESTING & QUALITY ASSURANCE** ⬜

### **Epic 10.1: API Endpoint Testing** ⬜

**Story:** Test all API routes for correctness and error handling

- ⬜ **Task 10.1.1:** Test authentication endpoints
  - Test signup with valid/invalid data
  - Test login with correct/incorrect credentials
  - Test protected routes with/without valid JWT

- ⬜ **Task 10.1.2:** Test booking CRUD endpoints
  - Test creating bookings with valid/invalid data
  - Test fetching bookings with filters
  - Test updating booking status
  - Test deleting bookings

- ⬜ **Task 10.1.3:** Test weather and reschedule endpoints
  - Test weather check for various coordinates
  - Test weather monitoring service
  - Test AI reschedule generation
  - Test reschedule confirmation

- ⬜ **Task 10.1.4:** Test error handling
  - Test all endpoints with invalid inputs
  - Verify proper error messages and status codes
  - Test database connection errors
  - Test external API failures (Weather API, OpenAI)

**Acceptance:** All API endpoints tested and working correctly

---

### **Epic 10.2: Integration Testing** ⬜

**Story:** Test end-to-end workflows

- ⬜ **Task 10.2.1:** Test complete booking workflow
  - Create a new booking via UI
  - Verify it appears in dashboard
  - Verify it's stored in database correctly

- ⬜ **Task 10.2.2:** Test complete conflict detection workflow
  - Create a booking with known bad weather
  - Trigger weather check
  - Verify conflict is detected
  - Verify email notification is sent
  - Verify alert appears in dashboard

- ⬜ **Task 10.2.3:** Test complete reschedule workflow
  - Open reschedule dialog for a conflicted flight
  - Verify AI generates suggestions
  - Confirm a suggestion
  - Verify booking is updated
  - Verify confirmation email is sent
  - Verify audit log is created

- ⬜ **Task 10.2.4:** Test analytics and reporting
  - Verify dashboard stats are accurate
  - Verify analytics charts display correct data
  - Verify activity feed shows recent actions

**Acceptance:** All major workflows tested end-to-end successfully

---

### **Epic 10.3: Performance & Load Testing** ⬜

**Story:** Ensure the system can handle expected load

- ⬜ **Task 10.3.1:** Test weather monitoring performance
  - Create 50+ bookings
  - Run weather monitoring service
  - Measure execution time
  - Verify no API rate limits hit
  - Optimize batch processing if needed

- ⬜ **Task 10.3.2:** Test database query performance
  - Test queries with larger datasets
  - Add database indexes if needed
  - Verify response times are acceptable (<500ms for API routes)

- ⬜ **Task 10.3.3:** Test AI reschedule performance
  - Measure time to generate reschedule suggestions
  - Verify OpenAI API calls are efficient
  - Add timeout handling for slow responses

**Acceptance:** System performs well with realistic data volumes

---

## **PHASE 11: DOCUMENTATION & FINAL TOUCHES** ⬜

### **Epic 11.1: Developer Documentation** ⬜

**Story:** Create comprehensive documentation for developers

- ⬜ **Task 11.1.1:** Create/update README.md
  - Add project description and features
  - Add tech stack overview
  - Add local development setup instructions
  - Add database setup and seeding instructions
  - Add API documentation (routes and endpoints)
  - Add deployment instructions

- ⬜ **Task 11.1.2:** Create API documentation
  - Document all API routes with request/response examples
  - Use JSDoc comments or create separate API.md file
  - Document authentication requirements

- ⬜ **Task 11.1.3:** Create setup guides
  - Create `docs/SETUP_WEATHER_API.md`
  - Create `docs/SETUP_OPENAI.md`
  - Create `docs/SETUP_AWS_SES.md`
  - Create `docs/SETUP_AWS_DEPLOYMENT.md`

- ⬜ **Task 11.1.4:** Create `.env.example` file
  - List all required environment variables with placeholder values
  - Add comments explaining each variable

**Acceptance:** Clear, comprehensive documentation for setting up and running the project

---

### **Epic 11.2: Code Quality & Cleanup** ⬜

**Story:** Ensure code is clean, well-organized, and follows best practices

- ⬜ **Task 11.2.1:** Run linter and fix issues
  - Run `npm run lint`
  - Fix all linter errors
  - Fix linter warnings where appropriate

- ⬜ **Task 11.2.2:** Add TypeScript strict checks
  - Enable strict mode in `tsconfig.json` if not already
  - Fix any type errors
  - Remove any `any` types

- ⬜ **Task 11.2.3:** Remove unused code and files
  - Remove commented-out code
  - Remove unused imports
  - Remove test files or move to proper test directory

- ⬜ **Task 11.2.4:** Add error boundaries and fallbacks
  - Add error boundaries to key UI components
  - Add loading states to all async operations
  - Add empty states for all lists

**Acceptance:** Code is clean, well-typed, and follows Next.js best practices

---

### **Epic 11.3: Demo Video Preparation** ⬜

**Story:** Prepare for demo video recording

- ⬜ **Task 11.3.1:** Create demo script
  - Outline key features to demonstrate
  - Create realistic demo data
  - Plan demo flow: booking → conflict → AI reschedule → confirmation

- ⬜ **Task 11.3.2:** Set up demo environment
  - Seed database with good demo data
  - Test all workflows work smoothly
  - Prepare screenshots or slides if needed

- ⬜ **Task 11.3.3:** Record demo video (5-10 minutes)
  - Show flight creation
  - Show weather conflict detection
  - Show AI-generated reschedule suggestions
  - Show notification/confirmation flow
  - Show analytics dashboard

**Acceptance:** Demo video showcases all core features clearly

---

## **PHASE 12: DEPLOYMENT & PRODUCTION LAUNCH** ⬜

### **Epic 12.1: Production Deployment** ⬜

**Story:** Deploy to production AWS environment

- ⬜ **Task 12.1.1:** Deploy database to AWS RDS
  - Provision RDS PostgreSQL instance
  - Run migrations: `npx prisma migrate deploy`
  - Seed initial data if needed

- ⬜ **Task 12.1.2:** Deploy Next.js app to AWS Amplify
  - Configure Amplify with GitHub repo
  - Set all environment variables
  - Deploy and verify build succeeds

- ⬜ **Task 12.1.3:** Set up AWS SES for email notifications
  - Verify sender email/domain
  - Test sending emails from production

- ⬜ **Task 12.1.4:** Set up EventBridge + Lambda for cron jobs
  - Deploy Lambda or configure API endpoint trigger
  - Set cron schedule for hourly weather checks
  - Test execution and verify CloudWatch logs

- ⬜ **Task 12.1.5:** Configure monitoring and alerts
  - Set up CloudWatch alarms for errors
  - Set up CloudWatch alarms for high costs (optional)
  - Test error reporting

**Acceptance:** Full application is deployed to AWS and running in production

---

### **Epic 12.2: Production Testing & Validation** ⬜

**Story:** Test production deployment thoroughly

- ⬜ **Task 12.2.1:** Test production URLs and authentication
  - Access production URL
  - Test signup and login
  - Verify JWT tokens work

- ⬜ **Task 12.2.2:** Test production workflows
  - Create a real booking
  - Trigger weather check (wait for cron or manually trigger)
  - Verify emails are sent
  - Test AI reschedule
  - Verify all features work as expected

- ⬜ **Task 12.2.3:** Monitor logs and performance
  - Check CloudWatch logs for errors
  - Verify no critical errors
  - Monitor database performance
  - Monitor API response times

**Acceptance:** Production system is fully functional and stable

---

## **BONUS FEATURES (Post-MVP)** ⬜

### **Epic 13.1: Advanced Features (Optional)** ⬜

**Story:** Additional features to enhance the MVP

- ⬜ **Task 13.1.1:** Add push notifications (browser notifications)
- ⬜ **Task 13.1.2:** Add SMS notifications via AWS SNS or Twilio
- ⬜ **Task 13.1.3:** Add more detailed weather forecasting (7-day forecast)
- ⬜ **Task 13.1.4:** Add instructor availability management
- ⬜ **Task 13.1.5:** Add flight corridor weather checks (mid-route waypoints)
- ⬜ **Task 13.1.6:** Add multi-tenant support (multiple flight schools)
- ⬜ **Task 13.1.7:** Add mobile-responsive improvements
- ⬜ **Task 13.1.8:** Add unit tests with Jest/Vitest
- ⬜ **Task 13.1.9:** Add E2E tests with Playwright or Cypress

**Acceptance:** (Optional) Enhanced features implemented and tested

---

## **Summary Statistics**

**Total Epics:** 24  
**Total Tasks:** 150+  
**Estimated Timeline:** 4-6 weeks (solo developer, full-time)

**Critical Path:**
1. Database setup (Phase 1)
2. Authentication & Booking APIs (Phase 2)
3. Weather integration (Phase 3)
4. AI rescheduling (Phase 4)
5. Frontend integration (Phase 6)
6. AWS deployment (Phase 9)

**Dependencies:**
- Phase 2 depends on Phase 1 (database must exist)
- Phase 3 depends on Phase 2 (needs booking data)
- Phase 4 depends on Phase 3 (needs weather data)
- Phase 6 depends on Phases 2-5 (needs all backend APIs)
- Phase 9 depends on Phases 1-8 (needs complete application)

---

## **Notes for Implementation**

### **Why Each Phase Matters:**

1. **Phase 1 (Database):** This is the foundation. Without a properly structured database, nothing else can work. Prisma makes it easy to define your schema and generates TypeScript types automatically, which helps catch errors early.

2. **Phase 2 (API Routes):** Next.js API routes handle your backend logic. Each route is a serverless function that connects your frontend to your database. The CRUD operations here let you create, read, update, and delete data.

3. **Phase 3 (Weather):** This is a core feature. You're calling an external API (WeatherAPI.com) to get real weather data, then comparing it against safety rules based on pilot training level. The cron job automates this check every hour.

4. **Phase 4 (AI):** This uses OpenAI's GPT model to intelligently suggest new flight times. You give the AI context (weather forecast, student level, availability) and it returns natural language suggestions that you parse and save.

5. **Phase 5 (Notifications):** When bad weather is detected, you need to alert students/instructors. Email is the primary method (SMTP in dev, AWS SES in production).

6. **Phase 6 (Integration):** This connects your beautiful frontend to the backend you built. Replace mock data with real API calls using `fetch` or a library like `axios`.

7. **Phase 7 (Logging):** Audit logs track every important action for compliance and debugging. Structured logging (Pino) helps you debug issues in production.

8. **Phases 8-9 (Setup & Deployment):** These phases guide you through setting up external services (Weather API, OpenAI, AWS) and deploying to production. AWS Amplify makes Next.js deployment easy, and EventBridge handles the cron jobs.

9. **Phase 10 (Testing):** Testing ensures your app works correctly before users see it. Test each API route, then test complete user flows end-to-end.

10. **Phase 11 (Documentation):** Good documentation helps future developers (including yourself) understand and maintain the code.

### **Key Concepts Explained Simply:**

- **API Route**: A file in `app/api/` that handles HTTP requests (GET, POST, etc.) and returns JSON responses.
- **Prisma**: A tool that manages your database schema and generates a TypeScript client to query the database safely.
- **Server Action**: An alternative to API routes in Next.js 14+, allows you to run server code directly from components.
- **Cron Job**: A scheduled task that runs automatically at set intervals (e.g., every hour).
- **JWT (JSON Web Token)**: A secure way to authenticate users. When they log in, you give them a token they send with each request.
- **Middleware**: Code that runs before your API routes to check authentication, log requests, etc.
- **Seed Data**: Fake data you put in your database for testing during development.
- **Environment Variables**: Secret keys and configuration stored in `.env.local` that shouldn't be in your code.

### **Recommended Order to Work:**

1. Start with Phase 1 (get database working)
2. Do Phase 2 Task 2.2 (basic booking CRUD)
3. Do Phase 6 Task 6.1.5 (connect book flight dialog) - this gives you a working feature to test
4. Continue with Weather (Phase 3)
5. Add AI (Phase 4)
6. Finish frontend integration (Phase 6)
7. Add authentication last (Phase 2.1) - or use a simple hardcoded user initially
8. Deploy (Phase 9)

This way you'll have working features you can see and test as you go, which is more motivating than building all backend first!

