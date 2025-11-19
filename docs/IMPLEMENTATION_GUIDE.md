# Crosswind Dashboard & Flights Alignment — Implementation Guide

This document explains how to implement the requested UX fixes for **https://crosswind.vercel.app/dashboard** and **https://crosswind.vercel.app/flights** without breaking existing behaviour. Treat it as a checklist for a future GPT‑5.1 Codex agent.

---

## 0. Prerequisites
- Work from repo root `/Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/4_Week/Crosswind`.
- Ensure `.env.local` carries `OPENAI_API_KEY` and `WEATHER_API_KEY`; both flows rely on them.
- Use `npm run dev` to validate UI, and `npm run lint` before delivery.
- When touching Prisma-backed services (`lib/services/*`), restart the dev server because of cached modules.

---

## 1. Standardise Flight Card Content
Target files:
- `components/upcoming-flights.tsx`
- `components/flights-list.tsx`
- `components/weather-alerts.tsx`
- `lib/utils.ts` (new helpers reused by all cards)

### 1.1 Add utility helpers
1. Extend `lib/utils.ts`:
   - Introduce `getCityFromCoordinates(lat, lon)` that snaps to the nearest known training city/airport. Seed it with the coordinates already in sample data (`scripts/add-sample-data.ts`, `prisma/seed.ts`) plus any production airports used today. Keep the fallback as the old lat/lon string.
   - Export `formatRouteLocations(...)` (wraps `getCityFromCoordinates` for departure/arrival and falls back to `formatShortRoute`).
   - Add `formatAircraftLabel(aircraft)` that returns `"${model} (${tailNumber})"` when both exist, otherwise falls back in a human-friendly order.
2. Update any other helper that prints weather values:
   - `formatWeatherConflictMessage` currently emits `...${visibility}mi...` (no space). Change those strings to use the `formatVisibility` helper so you automatically get `" mi"`.

### 1.2 Upcoming Flights (`components/upcoming-flights.tsx`)
1. Replace the tail-number row with `formatAircraftLabel(flight.aircraft)` so it reads `Cessna 172 (N12345)`.
2. Replace `formatShortRoute(...)` with the new `formatRouteLocations(...)` so routes show `Chicago → Seattle` instead of coordinates.
3. Inject a `Flight` row (e.g. above date/time) that prints `FL-${String(flight.id).padStart(4, '0')}` to address “weather conflicted flights don’t have flight numbers”.
4. Confirm the conflict banner copies across data parity with the Flights page (same weather message + aircraft/training level row). You can reuse the little footer from `components/flights-list.tsx`.

### 1.3 Flights page cards (`components/flights-list.tsx`)
1. Mirror the same helper usage:
   - `formatRouteLocations` for the route row.
   - `formatAircraftLabel` in the footer (and include the training level like the upcoming-flights card).
2. Fix the red background bug:
   - Update `hasWeatherConflict` so it returns `true` whenever `booking.status === 'conflict'`, even if `weatherReports` is empty. Keep the stricter check to avoid false positives when status is `scheduled`. Drive the gradient and badge colours from this new logic.
   - When `formatWeatherConflictMessage` returns `null` but status is conflict, render a fallback such as `Weather conflict detected — awaiting detailed report`.
3. Ensure `Weather Conflict:` strings use `formatVisibility` so “2.97 mi” includes the space.

### 1.4 Weather Alerts (`components/weather-alerts.tsx`)
1. In the alert grid add:
   - A “Flight” row showing the formatted flight number.
   - A “Route” row that uses `formatRouteLocations(alert.flight.departure.lat, ...)`.
   - Update the “Aircraft” row to use `formatAircraftLabel`.
2. Wherever the card header references the aircraft (`Aircraft: ...`), switch the string from tail-first to model-first.
3. Feed the card footer button props (`AI Reschedule`) the same `handleReschedule` signature but add `data-testid` parity if you plan on reusing Playwright tests.

### 1.5 Verify parity
After changes, inspect both `/dashboard` and `/flights`:
- All cards show **Flight #, Student, Date/Time, Route (city → city), Instructor, Aircraft (model first), Training Level, AI Reschedule button**.
- Weather conflict badges/cards look identical regardless of which surface renders them.

---

## 2. “AI Reschedule” Should Always Produce Suggestions
Target files:
- `lib/services/reschedule.ts`
- `lib/services/openai.ts`
- `components/reschedule-dialog.tsx`

### 2.1 Provide weather context for non-conflict flights
`buildRescheduleContext` assumes `booking.weatherReports[0]` exists. For clear-weather flights it’s `undefined`, which causes `weatherConflict.currentConditions` to be filled with zeros. Because the fallback generator (in `openAIService.generateFallbackSuggestions`) requires “future wind < current wind” and “future visibility > current visibility”, zeroed values stop every slot from qualifying.

Implementation plan:
1. Inside `buildRescheduleContext`, before you call `parseWeatherReport`, check whether `currentWeather` exists.
   - If not, call `weatherService.fetchWeatherByCoordinates` for the departure (and arrival, if available) so you have realistic metrics. Use this live fetch to build a synthetic `currentWeather` object that marks `isSafe = true` and `violatedMinimums = []`.
   - Store that raw weather data in the context so you can log why suggestions were generated even for safe flights.
2. Continue to call `fetchSevenDayForecast` and `generateMockAvailableSlots` as today.

### 2.2 Make fallback suggestions resilient
1. Update `generateFallbackSuggestions` in `lib/services/openai.ts`:
   - When `weatherConflict.currentConditions.windSpeed` is `0`, treat it as “no baseline” and skip the wind comparison in the filter. Same for visibility values ≤ 0.
   - If `goodWeatherSlots` ends up empty after filtering, fall back to the first 3 `mockAvailableSlots` so UI always receives suggestions.
2. Ensure each fallback returns a `reason` that explains why the slot was picked even though there was no conflict (“Opportunity to optimise schedule despite safe current weather.”) so product understands why AI is suggesting alternatives.

### 2.3 Front-end UX
1. In `components/reschedule-dialog.tsx`, keep the “No suggestions available” state, but only show it when the API literally returns an empty array *and* `isGenerating` has finished.
2. Update the debug logs or toast copy so QA can tell whether the lack of suggestions was caused by API errors vs. no available slots.

---

## 3. Route Strings — Use City Names Everywhere
Target files:
- `lib/utils.ts` (helpers from §1.1)
- `components/upcoming-flights.tsx`
- `components/flights-list.tsx`
- `components/weather-alerts.tsx`
- Any other components that read `formatShortRoute` (use `rg "formatShortRoute"` to be safe).

Implementation plan:
1. Create `lib/geo.ts` (or embed in `lib/utils.ts` if you prefer) that exports `KNOWN_LOCATIONS` — an array of `{ name, lat, lon }`.
   - Use values already sprinkled through fixtures (e.g., San Francisco 37.77, Seattle 47.45, Chicago 41.88). Optionally add bounding boxes or tolerance to cover both departure and arrival.
2. Implement `getCityFromCoordinates` to find the closest record within ~0.5° lat/lon or ~40 km using haversine math.
3. `formatRouteLocations` should:
   - Resolve both cities.
   - Prefer `"City → City"` when both exist.
   - Fall back to `"City → 37.66,-122.15"` if one side can’t be resolved.
   - As a last resort, keep the old latitude/longitude string.
4. Replace all existing `formatShortRoute` usages with the new function.

---

## 4. Weather Conflict Visual Bugs on `/flights`
Target files:
- `components/flights-list.tsx`
- `lib/utils.ts`

Implementation plan:
1. Fix the inconsistent red background (see §1.3). Also reuse the `hasWeatherConflict` helper from `components/upcoming-flights.tsx` — consider exporting a shared predicate (e.g., `lib/flight.ts` with `isWeatherConflict(booking)`).
2. When the red banner text is generated via `formatWeatherConflictMessage`, make sure the string uses `formatVisibility`/`formatWeatherNumber` so “mi” gains the missing space.
3. Extend the banner to show the flight number just like the other cards if it doesn’t already.

---

## 5. Weather Corridor Checks
Target files:
- `lib/services/weatherMonitor.ts`
- `lib/services/weather.ts` (optional helper)
- Database impact: Each additional weather sample still writes to `weather_reports`.

Implementation plan:
1. Add a helper (inside `weatherMonitor.ts`) such as `generateCorridorWaypoints(departureLat, departureLon, arrivalLat, arrivalLon, segments = 3)` that returns evenly spaced coordinates between departure and arrival.
   - Skip if arrival coords are `null`.
2. Inside `checkAllUpcomingBookings`, after fetching departure/arrival weather:
   - Loop through each waypoint, call `weatherService.fetchWeatherByCoordinates`, run `WeatherMinimumsService.evaluateWeatherSafety`, and persist a `weatherReport` row with `location` like `corridor-1`.
   - Collect `violatedMinimums` from these intermediate checks. If any report is unsafe, mark `isOverallSafe = false` and update the booking status to `conflict` (same as existing flow).
3. Update the `result.details` payload so monitoring logs specify whether the conflict came from departure/arrival/corridor. This makes debugging easier.
4. Consider adding throttling (`await this.delay(750)`) inside the corridor loop to stay under WeatherAPI’s rate limit.
5. Because more reports are created, ensure `app/api/alerts/route.ts` (which grabs `weatherReports[0]`) still points to the latest record. Keep the `orderBy` clause as `desc` so corridor reports don’t starve the departure record; if necessary, filter for `location = 'departure'` when building UI data.

---

## 6. Active Weather Alerts — Aircraft Label + Flight Numbers
Target files:
- `components/weather-alerts.tsx`

Implementation plan:
1. Update the JSX where “Aircraft:” is rendered to call `formatAircraftLabel(alert.flight.aircraft)`, giving `Cessna 172 (N12345)`.
2. Add a “Flight” badge/row so conflicts clearly mention `FL-####`.
3. Reuse the shared route + aircraft helpers so Weather Alerts cards remain in sync with Upcoming Flights / Flights page.

---

## 7. Validation & Regression Tests
1. **Frontend smoke**: `npm run dev`, then manually visit `/dashboard` and `/flights`. Confirm:
   - Flight cards across both pages show identical field order.
   - “AI Reschedule” returns at least one suggestion for a flight with `status !== 'conflict'`.
   - The weather alert list respects the new aircraft text.
2. **Automated**:
   - `npm run lint` to catch TS/ESLint errors.
   - Existing Playwright specs in `tests/reschedule-dialog.spec.ts` rely on data-testid attributes; ensure those still exist and update selectors if necessary.
3. **Data sanity**: Run `scripts/add-sample-data.ts` (if needed) so QA has both conflict and non-conflict flights to verify card uniformity.

---

## 8. Deployment Notes
- Corridor checks add extra WeatherAPI calls. Monitor usage (WeatherAPI free tier = 1M calls/month) and consider batching or caching if thresholds are exceeded.
- If `formatRouteLocations` introduces new bundles, tree-shake unused helpers and keep the function pure to avoid Next.js RSC warnings.
- After merging, redeploy via Vercel; environment variables are already consumed via `process.env`.

This plan should give a future agent clear guidance to ship the requested UX and weather-monitoring updates safely. No code changes were made here. Use it as your execution outline.
