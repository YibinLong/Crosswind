# Crosswind

AI-driven weather conflict detection and rescheduling system for flight training schedules.

## Overview

Crosswind is a web-based flight scheduling assistant for **Flight Schedule Pro** that automatically detects weather conflicts in scheduled flight lessons and uses AI to generate optimal rescheduling suggestions. The system continuously monitors weather conditions at departure, arrival, and flight corridor points, notifies affected users, and recommends reschedules that consider training level, availability, and safety minimums.

## Features

### Core Features
- **Automated Weather Monitoring**: Continuously checks weather conditions for all scheduled flights
- **Intelligent Conflict Detection**: Evaluates weather against pilot training level safety requirements
- **AI-Powered Rescheduling**: Uses OpenAI to generate 3 optimal reschedule options per conflicted flight
- **Real-time Notifications**: Email alerts and in-app dashboard notifications for weather conflicts
- **Interactive Dashboard**: Live status updates and analytics for flight operations
- **Audit Trail**: Complete logging of all weather events and reschedule actions

### Weather Intelligence
- Training-level specific weather minimums (Student Pilot, Private Pilot, Instrument Rated)
- Real-time weather data from WeatherAPI.com
- Automated hourly monitoring with configurable alerts
- Weather impact analytics and reporting

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 (App Router) + TypeScript | Modern React framework with SSR/SSG |
| **Styling** | TailwindCSS | Utility-first CSS framework |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | PostgreSQL + Prisma ORM | Relational database with type-safe queries |
| **Weather API** | WeatherAPI.com | Real-time weather data |
| **AI Layer** | OpenAI SDK | Intelligent rescheduling suggestions |
| **Email** | AWS SES (Production) / SMTP (Development) | Reliable email notifications |
| **Deployment** | AWS (Amplify Hosting + RDS) | Scalable cloud infrastructure |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (local or Docker)
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Crosswind
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration (see Environment Setup below).

4. **Set up the database**
   ```bash
   # Start PostgreSQL (Docker example)
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=crosswind postgres

   # Run migrations and generate client
   npx prisma migrate dev
   npx prisma generate

   # Seed with sample data (optional)
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crosswind"

# External APIs
WEATHER_API_KEY="your_weatherapi_key"        # Get from weatherapi.com
OPENAI_API_KEY="your_openai_key"              # Get from platform.openai.com

# Email Configuration (Development)
EMAIL_SMTP_SERVER="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Email Configuration (Production - AWS SES)
AWS_SES_REGION="us-east-1"
AWS_SES_ACCESS_KEY_ID="your_aws_access_key"
AWS_SES_SECRET_ACCESS_KEY="your_aws_secret_key"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Development
DEBUG=true
```

### External Service Setup

#### 1. WeatherAPI.com
1. Sign up at [weatherapi.com](https://www.weatherapi.com)
2. Get your API key from the dashboard
3. Add it to `WEATHER_API_KEY` in `.env.local`
4. Free tier: 1 million calls/month

#### 2. OpenAI API
1. Create account at [OpenAI](https://platform.openai.com)
2. Navigate to API Keys section
3. Generate new API key
4. Add it to `OPENAI_API_KEY` in `.env.local`
5. Enable billing for GPT-4 access

#### 3. Email Service

**Development (Gmail):**
1. Enable 2-factor authentication
2. Generate App Password for your Google account
3. Use App Password in `EMAIL_PASS`

**Production (AWS SES):**
1. Set up AWS account
2. Create SES identity (email or domain)
3. Verify sender email/domain
4. Request production access (out of sandbox)
5. Create IAM user with SES permissions

## Project Structure

```
Crosswind/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (backend)
│   ├── dashboard/         # Main dashboard page
│   ├── flights/           # Flight management pages
│   └── analytics/         # Analytics and reports
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── weather-alerts.tsx
│   ├── flights-list.tsx
│   ├── reschedule-dialog.tsx
│   └── ...
├── lib/                   # Utility libraries
│   ├── services/         # Business logic services
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Sample data seeding
└── public/               # Static assets
```

## Key Workflows

### 1. Flight Creation & Weather Monitoring
1. Flight is scheduled through the dashboard
2. Automated hourly weather check evaluates conditions
3. Weather data is fetched for departure/arrival locations
4. Safety minimums are checked based on pilot training level
5. Conflicts trigger email notifications and dashboard alerts

### 2. AI-Powered Rescheduling
1. When a conflict is detected, system calls OpenAI API
2. AI receives: flight details, weather forecast, pilot level, availability
3. AI generates 3 optimal reschedule options with reasoning
4. Suggestions are saved and presented in the dashboard
5. User confirms a suggestion, updating the booking

### 3. Training Level Weather Minimums
- **Student Pilot**: Clear skies, visibility > 5mi, winds < 10kt
- **Private Pilot**: Visibility > 3mi, ceiling > 1000ft
- **Instrument Rated**: IMC acceptable (no thunderstorms/icing)

## Development Commands

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Database
npx prisma studio        # Open database browser
npx prisma migrate dev    # Run migrations in development
npx prisma migrate deploy # Deploy migrations in production
npx prisma generate       # Generate Prisma Client
npx prisma db seed        # Seed database with sample data
```

## Deployment

### AWS Deployment (Recommended)

1. **Database Setup (RDS)**
   ```bash
   # Create PostgreSQL instance on AWS RDS
   # Configure security groups for access
   # Update DATABASE_URL in production
   npx prisma migrate deploy
   ```

2. **Application Deployment (Amplify)**
   ```bash
   # Connect GitHub repo to AWS Amplify
   # Configure build settings for Next.js
   # Add production environment variables
   # Deploy and test
   ```

3. **Cron Jobs (EventBridge)**
   ```bash
   # Create EventBridge rule for hourly execution
   # Configure to trigger weather monitoring API
   # Set up CloudWatch logging
   ```

### Environment-Specific Notes

- **Development**: Uses local PostgreSQL, Gmail SMTP, node-cron
- **Production**: Uses AWS RDS, Amazon SES, EventBridge Lambda

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking

### Weather & AI
- `POST /api/weather/check/[bookingId]` - Manual weather check
- `POST /api/weather/monitor` - Trigger weather monitoring
- `POST /api/bookings/[id]/reschedule` - Generate AI suggestions
- `POST /api/bookings/[id]/reschedule/confirm` - Confirm reschedule

### Data
- `GET /api/students` - Manage students
- `GET /api/instructors` - Manage instructors
- `GET /api/aircraft` - Manage aircraft
- `GET /api/analytics/*` - Analytics endpoints

## Testing

### Manual Testing Checklist
- [ ] Weather API integration returns valid data
- [ ] Safety logic correctly flags unsafe conditions
- [ ] AI generates 3 valid reschedule options
- [ ] Email notifications are sent for conflicts
- [ ] Dashboard displays live alerts
- [ ] Reschedules are logged correctly
- [ ] Background monitoring runs hourly

### Test Scenarios
1. **Weather Conflict Flow**
   - Create booking with known bad weather
   - Verify conflict detection
   - Check email notification
   - Test AI rescheduling
   - Confirm reschedule

2. **Training Level Logic**
   - Test with Student Pilot (strictest limits)
   - Test with Private Pilot (moderate limits)
   - Test with Instrument Rated (most flexible)

## Contributing

1. Follow the existing code style (TypeScript, TailwindCSS)
2. Add types for new features
3. Update database schema with Prisma migrations
4. Add audit logging for important actions
5. Test both development and production email services

## Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Test connection
npx prisma db pull
```

**Weather API Errors**
- Verify API key is correct and active
- Check rate limits (1M calls/month free)
- Test API manually: `curl "http://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=London"`

**Email Not Sending**
- Development: Check Gmail App Password setup
- Production: Verify SES identity is verified and out of sandbox
- Check AWS credentials and permissions

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## License

This project is part of the Flight Schedule Pro AI Solutions program.

## Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the comprehensive task list in `TASK_LIST.md`
3. Refer to the technical requirements in `PRD.md`