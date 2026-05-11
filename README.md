# Student Event Booking System

## Setup and Usage Guide

### Prerequisites

- Node.js 18 or newer.
- npm.

Node.js 18 or newer is recommended because the backend external weather route uses the built-in `fetch()` API.

### Installation and setup

From the project root folder:

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
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=paste_the_generated_secret_here
DB_FILE=./data/eventhive.sqlite
```

The `JWT_SECRET` value should be different for each local development environment. The same backend environment must keep using the same value while existing login tokens are expected to remain valid. If the JWT secret is changed, existing tokens will no longer verify and users will need to log in again.

The `backend/.env.example` file should only contain placeholders and safe development defaults, for example:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret_for_local_development
DB_FILE=./data/eventhive.sqlite
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

The database seeds the following accounts automatically when the backend starts with an empty database:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@email.com` | `Admin123!` |
| Verified Student | `student@email.com` | `Student123!` |
| Pending Verification Student | `pending@student.com` | `Student123!` |

Admin can:
- verify/reject students
- create/edit/delete public events
- view all users and bookings

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

#### Port already in use

Change the backend `PORT` value in `backend/.env`, or stop the process already using port `5000`.

## Project Documentation

### System overview

Student Event Booking System is a full-stack event discovery and booking web application for the project of COS30043 Interface Design and Development. The application uses a Vue 3 frontend, an Express.js REST API backend, and a SQLite database to support event browsing, user authentication, booking management, and admin event creation.

Student Event Booking System separates the user interface from the backend service:

```text
Vue 3 frontend  →  RESTful API requests  →  Express.js backend  →  SQLite database
```

The frontend runs as a single-page application and communicates with the backend through JSON-based API requests. The backend handles authentication, database access, validation, bookings, event data, profile updates, dashboard statistics, and external weather data.

### Technical stack

| Technical area | Technology | Purpose in Student Event Booking System |
|---|---|---|
| Frontend framework | Vue.js 3 | Builds the browser-based user interface using reusable components and reactive data binding. |
| Frontend build tool | Vite | Runs the development server and builds the frontend for production. |
| Client-side routing | Vue Router 4 | Manages navigation between application pages without full page reloads. |
| Client-side state management | Pinia | Stores shared frontend state such as authentication, events, and bookings. |
| UI and responsive layout | Bootstrap 5 | Provides grid layout, spacing utilities, forms, buttons, and responsive design support. |
| Custom styling | CSS | Defines application-specific layout, cards, colours, spacing, and responsive refinements. |
| Backend runtime | Node.js | Runs the backend JavaScript application outside the browser. |
| Backend web framework | Express.js | Provides REST API routes for authentication, users, events, bookings, statistics, and external data. |
| Database | SQLite | Stores users, events, and bookings in a local relational database file. |
| Database driver | better-sqlite3 | Allows the Express backend to run SQL queries against the SQLite database. |
| Authentication | JSON Web Token (JWT) | Maintains authenticated user sessions between frontend and backend requests. |
| Password hashing | bcryptjs | Hashes user passwords before storage and verifies passwords during login. |
| Environment configuration | dotenv | Loads backend configuration values from environment variables. |
| Cross-origin access | cors | Allows the Vue frontend and Express backend to communicate during local development. |
| Request logging | morgan | Logs backend HTTP requests during development. |
| Development process management | concurrently, nodemon | Runs frontend and backend together and restarts the backend after file changes. |

### Main features

- Public landing page with featured events.
- Event listing with search, category filtering, and free-event filtering.
- Event detail pages with event capacity, accessibility notes, and weather context.
- User registration and login.
- JWT-based authenticated sessions.
- Student booking events with seat quantity and attendee details.
- Booking history with cancellation support.
- User dashboard with booking and event statistics.
- Profile viewing and editing.
- Admin-only event creation.
- Protected frontend routes and protected backend API endpoints.
- Responsive layout for desktop, tablet, and mobile screen sizes.

### Application pages

| Page | Route | Access |
|---|---|---|
| Landing page | `/` | Public |
| Event listing page | `/events` | Public |
| Event detail page | `/events/:id` | Public |
| Booking page | `/events/:id/book` | Logged-in users |
| Login page | `/login` | Guests only |
| Registration page | `/register` | Guests only |
| User dashboard page | `/dashboard` | Logged-in users |
| Booking history page | `/history` | Logged-in users |
| Profile page | `/profile` | Logged-in users |
| Create event page | `/events/create` | Admin only |
| Not found page | Any unmatched route | Public |

### Project structure

```text
StudentEventBookingSystem/
├── package.json
├── README.md
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
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
| GET | `/api/events` | Public | List, search, and filter events. |
| GET | `/api/events/:id` | Public | Retrieve details for one event. |
| POST | `/api/events` | Admin only | Create a new event. |
| PUT | `/api/events/:id` | Admin only | Update an existing event through the API. |
| DELETE | `/api/events/:id` | Admin only | Delete an existing event through the API. |
| GET | `/api/bookings` | Logged-in users | Retrieve the current user's bookings. |
| POST | `/api/bookings` | Logged-in users | Create a booking for an event. |
| DELETE | `/api/bookings/:id` | Logged-in users | Cancel a booking by changing its status to cancelled. |
| GET | `/api/stats/overview` | Logged-in users | Retrieve dashboard statistics. |
| GET | `/api/external/weather` | Public | Retrieve weather context for an event city using Open-Meteo. |

### Database

The backend uses SQLite through `better-sqlite3`. The default database file is:

```text
backend/data/eventhive.sqlite
```

The database contains three main tables:

| Table | Purpose |
|---|---|
| `users` | Stores user accounts, roles, profile details, and hashed passwords. |
| `events` | Stores event details such as category, location, date, time, capacity, price, organiser, and accessibility notes. |
| `bookings` | Stores user bookings, reserved seat counts, attendee details, booking references, and booking status. |

Foreign key support is enabled so bookings remain linked to valid users and events.

### Authentication and authorisation

- Passwords are hashed with `bcryptjs` before being stored.
- Successful login returns a JWT token.
- The backend signs JWT tokens using the `JWT_SECRET` value from `backend/.env`.
- The frontend stores the token and user details in `localStorage`.
- Protected Vue routes redirect unauthenticated users to the login page.
- Protected Express routes check the JWT token before returning private data.
- Admin-only routes require the authenticated user to have the `admin` role.

### External weather data

The event detail page can display current weather information for the event city. The frontend requests weather data from the backend, and the backend retrieves the location and weather information from Open-Meteo.

```text
GET /api/external/weather?city=Kuching
```

If the weather service is unavailable, the event page still loads and displays a weather-unavailable message.
