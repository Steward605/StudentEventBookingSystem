# Student Event Booking System

## Setup and Usage Guide

### Prerequisites

- Node.js 18 or newer.
- npm.

Node.js 18 or newer is recommended because the backend external weather route uses the built-in `fetch()` API.

### Installation and setup

From the project root folder (StudentEventBookingSystem/):

```bash
npm install
npm run install:all
```

### Backend environment setup

Create a backend environment file from the example file.

```bash
cd backend
cp .env.example .env
```

The `backend/.env.example` file shows the environment variables required by the backend. The real `backend/.env` file stores local development values and should not be committed or submitted with real secrets.

The backend requires a JWT secret before it can issue and verify login tokens. Generate a secure local JWT secret with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated value into `backend/.env` as the `JWT_SECRET` value:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost,capacitor://localhost
PUBLIC_ASSET_BASE_URL=http://localhost:5000
JWT_SECRET=paste_the_generated_secret_here
DB_FILE=./data/student_event_booking_system.sqlite
```

The `JWT_SECRET` value should be different for each local development environment. The same backend environment must keep using the same value while existing login tokens are expected to remain valid. If the JWT secret is changed, existing tokens will no longer verify and users will need to log in again.

The `backend/.env.example` file should only contain placeholders and safe development defaults, for example:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost,capacitor://localhost
PUBLIC_ASSET_BASE_URL=http://localhost:5000
JWT_SECRET=replace_with_a_long_random_secret_for_local_development
DB_FILE=./data/student_event_booking_system.sqlite
```

### Frontend environment setup

The frontend uses `http://localhost:5000/api` by default. If the backend runs at another address, create a frontend environment file from the example file:

```bash
cd frontend
cp .env.example .env
```

Then update the API base URL:

```env
VITE_API_URL=http://localhost:5000/api
```

### Running the application

From the project root folder:

```bash
npm run dev
```

This starts both servers:

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000` |

The backend health check is available at:

```text
GET http://localhost:5000/api/health
```

### Running frontend and backend separately

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

### Demo accounts

The backend seeds venues, demo events, and the following accounts automatically when it starts with an empty database:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@email.com` | `Admin123!` |
| Verified Student | `student@email.com` | `Student123!` |
| Pending Verification Student | `pending@student.com` | `Student123!` |

Admin can:
- verify/reject students
- create, edit, and delete admin-managed events
- view dashboard statistics, all users, and all bookings
- create and delete user accounts
- remove cancelled booking records

Verified students can:
- open /organiser
- create their own events
- select a venue
- publish or save as draft
- edit/cancel only their own events
- view attendees for their own events

Other students can:
- browse published events
- book/join published events
- not host events until verified

If an older database file already exists, the seed data will not be inserted again. To regenerate the default seed data during development, stop the backend server and delete the local SQLite database files inside `backend/data/`, then restart the backend.

### Useful npm scripts
Run these commands from the project root unless stated otherwise:

| Command | Purpose |
|---|---|
| `npm install` | Install root development dependencies. |
| `npm run install:all` | Install frontend and backend dependencies. |
| `npm run dev` | Run frontend and backend together. |
| `npm run dev:frontend` | Run only the frontend development server. |
| `npm run dev:backend` | Run only the backend development server. |
| `npm run build` | Build the frontend for production. |
| `npm run start` | Start the backend using Node.js. |

### Troubleshooting

#### Backend fails with “JWT_SECRET is missing”

Create `backend/.env` from `backend/.env.example`, generate a JWT secret with the Node.js command shown in the backend environment setup section, paste the generated value into `JWT_SECRET`, and restart the backend server.

#### Login returns “Invalid email or password.”

Use the seeded demo accounts listed in this README. The default demo emails are `admin@email.com` and `student@email.com`.

If the credentials still fail, an older SQLite database may already exist. Stop the backend, delete the local database files inside `backend/data/`, and restart the backend so the seed users are recreated.

#### Frontend cannot connect to backend

Check that both servers are running:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

Also check that `CLIENT_ORIGIN` in `backend/.env` matches the frontend URL.

If the frontend is hosted somewhere other than `http://localhost:5173`, also check that `VITE_API_URL` in `frontend/.env` points to the backend API base URL.

#### Port already in use

Change the backend `PORT` value in `backend/.env`, or stop the process already using port `5000`.

## Project Documentation

### System overview

Student Event Booking System is a full-stack event discovery and booking web application for the project of COS30043 Interface Design and Development. The application uses a Vue 3 frontend, an Express.js REST API backend, and a SQLite database to support event browsing, user authentication, booking management, venue-aware event hosting, student organiser workflows, and admin management.

Student Event Booking System separates the user interface from the backend service:

```text
Vue 3 frontend  →  RESTful API requests  →  Express.js backend  →  SQLite database
```

The frontend runs as a single-page application and communicates with the backend through JSON-based API requests. The backend handles authentication, database access, validation, bookings, event data, venue data, profile updates, student verification, dashboard statistics, local image assets, and external weather data.

### Technical stack

| Technical area | Technology | Purpose in Student Event Booking System |
|---|---|---|
| Frontend framework | Vue.js 3 | Builds the browser-based user interface using reusable components and reactive data binding. |
| Frontend build tool | Vite | Runs the development server and builds the frontend for production. |
| Client-side routing | Vue Router 4 | Manages navigation between application pages without full page reloads. |
| Client-side state management | Pinia | Stores shared frontend state such as authentication, events, and bookings. |
| UI and responsive layout | Bootstrap 5 | Provides grid layout, spacing utilities, forms, buttons, and responsive design support. |
| Custom styling | CSS | Defines application-specific layout, cards, colours, spacing, and responsive refinements. |
| Progressive web app support | vite-plugin-pwa | Generates the web app manifest and app icons for installable browser/mobile experiences. |
| Backend runtime | Node.js | Runs the backend JavaScript application outside the browser. |
| Backend web framework | Express.js | Provides REST API routes for authentication, users, events, bookings, venues, statistics, organiser tools, and external data. |
| Database | SQLite | Stores users, venues, events, and bookings in a local relational database file. |
| Database driver | better-sqlite3 | Allows the Express backend to run SQL queries against the SQLite database. |
| Authentication | JSON Web Token (JWT) | Maintains authenticated user sessions between frontend and backend requests. |
| Password hashing | bcryptjs | Hashes user passwords before storage and verifies passwords during login. |
| Environment configuration | dotenv | Loads backend configuration values from environment variables. |
| Cross-origin access | cors | Allows the Vue frontend and Express backend to communicate during local development. |
| Request logging | morgan | Logs backend HTTP requests during development. |
| Development process management | concurrently, nodemon | Runs frontend and backend together and restarts the backend after file changes. |

### Main features

- Public landing page with featured events.
- Event listing with search, category filtering, free-event filtering, availability filtering, pagination, and summary counts.
- Event detail pages with event capacity, accessibility notes, and weather context.
- User registration and login.
- JWT-based authenticated sessions.
- Student verification status for organiser access.
- Student booking events with seat quantity and attendee details.
- Booking history with cancellation support.
- User dashboard with booking and event statistics.
- Profile viewing and editing.
- Admin dashboard with event, booking, and user management.
- Admin student verification, user creation, and user deletion.
- Admin event creation, editing, deletion, draft/published/cancelled statuses, and all-event views.
- Admin booking review, filtering, cancellation, and cancelled-record removal.
- Verified-student organiser dashboard for hosting events.
- Organiser event creation, venue selection, venue capacity checks, venue clash checks, drafts, publishing, cancellation, and attendee lists.
- Public venue data for event hosting forms.
- Protected frontend routes and protected backend API endpoints.
- Responsive layout for desktop, tablet, and mobile screen sizes.

### Application pages

| Page | Route | Access |
|---|---|---|
| Landing page | `/` | Public |
| Event listing page | `/events` | Public |
| Event detail page | `/events/:id` | Public |
| Booking page | `/events/:id/book` | Students |
| Login page | `/login` | Guests only |
| Registration page | `/register` | Guests only |
| User dashboard page | `/dashboard` | Students |
| Booking history page | `/history` | Students |
| Profile page | `/profile` | Logged-in users |
| Organiser dashboard page | `/organiser` | Verified students |
| Organiser create event page | `/organiser/events/create` | Verified students |
| Organiser edit event page | `/organiser/events/:id/edit` | Verified students who own the event |
| Organiser attendees page | `/organiser/events/:id/attendees` | Verified students who own the event |
| Admin dashboard page | `/admin` | Admin only |
| Admin manage events page | `/admin/events` | Admin only |
| Admin create event page | `/admin/events/create` | Admin only |
| Admin edit event page | `/admin/events/:id/edit` | Admin only |
| Admin bookings page | `/admin/bookings` | Admin only |
| Admin users page | `/admin/users` | Admin only |
| Legacy create event redirect | `/events/create` | Redirects to `/admin/events/create` |
| Not found page | Any unmatched route | Public |

### Project structure

```text
StudentEventBookingSystem/
├── package.json
├── README.md
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── assets/
│       ├── components/
│       ├── router/
│       ├── services/
│       ├── stores/
│       ├── utils/
│       └── views/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env.example
│   ├── data/
│   ├── public/
│   └── src/
│       ├── db/
│       ├── middleware/
│       ├── routes/
│       └── utils/
```

### Backend API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Check whether the backend API is running. |
| POST | `/api/auth/register` | Public | Create a student account. |
| POST | `/api/auth/login` | Public | Login and receive a JWT token. |
| GET | `/api/users/me` | Logged-in users | Retrieve the current user profile. |
| PUT | `/api/users/me` | Logged-in users | Update the current user profile. |
| GET | `/api/users/all` | Admin only | List users with role, verification, search, summary, and optional pagination. |
| POST | `/api/users` | Admin only | Create a student or admin account. |
| PATCH | `/api/users/:id/verification` | Admin only | Update a student verification status. |
| DELETE | `/api/users/:id` | Admin only | Delete a user account while keeping at least one admin. |
| GET | `/api/events` | Public | List, search, filter, and paginate published events. Admins can include all statuses. |
| GET | `/api/events/:id` | Public | Retrieve details for one event. Unpublished events are visible only to admins or the owning organiser. |
| POST | `/api/events` | Admin only | Create a new event. |
| PUT | `/api/events/:id` | Admin only | Update an existing event through the API. |
| DELETE | `/api/events/:id` | Admin only | Delete an existing event through the API. |
| GET | `/api/bookings` | Logged-in users | Retrieve the current user's bookings. |
| GET | `/api/bookings/all` | Admin only | Retrieve all bookings with search, status filtering, summary, and optional pagination. |
| POST | `/api/bookings` | Students | Create a booking for an event. |
| DELETE | `/api/bookings/:id` | Logged-in users | Cancel a booking by changing its status to cancelled. Admins can cancel any booking. |
| DELETE | `/api/bookings/:id/record` | Admin only | Permanently remove a cancelled booking record. |
| GET | `/api/stats/overview` | Logged-in users | Retrieve dashboard statistics. |
| GET | `/api/stats/admin-overview` | Admin only | Retrieve admin dashboard statistics and recent bookings. |
| GET | `/api/venues` | Public | List active venues for organiser event forms. |
| GET | `/api/venues/:id` | Public | Retrieve one active venue. |
| GET | `/api/my-events` | Verified students | List events hosted by the current student. |
| GET | `/api/my-events/:id` | Verified students | Retrieve one hosted event owned by the current student. |
| POST | `/api/my-events` | Verified students | Create a hosted event using an active venue. |
| PUT | `/api/my-events/:id` | Verified students | Update a hosted event owned by the current student. |
| DELETE | `/api/my-events/:id` | Verified students | Cancel a hosted event owned by the current student. |
| GET | `/api/my-events/:id/attendees` | Verified students | List attendees for a hosted event owned by the current student. |
| GET | `/api/external/weather` | Public | Retrieve weather context for an event city using Open-Meteo. |

### Database

The backend uses SQLite through `better-sqlite3`. The default database file is:

```text
backend/data/student_event_booking_system.sqlite
```

The database contains four main tables:

| Table | Purpose |
|---|---|
| `users` | Stores user accounts, roles, profile details, and hashed passwords. |
| `venues` | Stores active campus venues, rooms, capacities, facilities, accessibility notes, and venue images. |
| `events` | Stores event details such as category, location, date, time, capacity, price, organiser, accessibility notes, venue links, status, and owner. |
| `bookings` | Stores user bookings, reserved seat counts, attendee details, booking references, and booking status. |

Foreign key support is enabled so bookings remain linked to valid users and events.

### Authentication and authorisation

- Passwords are hashed with `bcryptjs` before being stored.
- Successful login returns a JWT token.
- The backend signs JWT tokens using the `JWT_SECRET` value from `backend/.env`.
- Admin JWT tokens expire after 15 minutes, while student JWT tokens expire after 8 hours.
- The frontend stores the token and user details in `localStorage`.
- Protected Vue routes redirect unauthenticated users to the login page.
- Protected Express routes check the JWT token before returning private data.
- Admin-only routes require the authenticated user to have the `admin` role.
- Organiser routes require a `student` role with `verification_status` set to `verified`.

### External weather data

The event detail page can display current weather information for the event city. The frontend requests weather data from the backend, and the backend retrieves the location and weather information from Open-Meteo.

```text
GET /api/external/weather?city=Kuching
```

If the weather service is unavailable, the event page still loads and displays a weather-unavailable message.
