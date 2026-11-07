# CSDA SGPA & CGPA Calculator

A full-stack starter application for B.Sc. Computer Science with Data Analytics students.
The curriculum is intentionally **unconfigured** until the official subject list, credits,
maximum marks, eligibility and grading rules are supplied.

## Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide
- Backend: Node.js, Express, TypeScript, Mongoose, MongoDB Atlas
- Authentication: bcryptjs + JWT in HTTP-only cookies
- Tests: Vitest (calculation engine)

## Requirements
- Node.js 20+
- npm 10+
- MongoDB Atlas database or local MongoDB

## Quick start

1. Copy `server/.env.example` to `server/.env` and fill in the values.
2. Copy `client/.env.example` to `client/.env`.
3. Install dependencies and run both applications:

```bash
npm install
npm run install:all
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

For a first run, registration is open. No default or administrator account is created.

## Curriculum setup (required before calculations)
Edit `client/src/data/curriculum.ts` and `server/src/data/curriculum.ts` together.
The repository includes no invented CSDA subjects, marks, credits or official grading rules.
The sample configuration is empty, so the app displays a curriculum-not-configured state.
Use the same `CURRICULUM_VERSION` in both files.

Each subject supports:
- `id`, `semester`, `name`, optional `code`
- `category`, `maxMarks`, `credits`
- `includedInSGPA`, `includedInCGPA`
- `allowDecimalMarks`, `required`

The current calculation implementation uses the reference formula from the project brief:
`gradePoint = marks / maxMarks * 10`, `weightedPoint = gradePoint * credits`.
Replace/extend the isolated calculation service if the official university method differs.
The app does not present a semester as completed while required marks are missing.

## Security notes
- Passwords are hashed using bcrypt.
- JWT is stored only in an HTTP-only cookie, never localStorage.
- Production cookies are `Secure` and `SameSite=None` when cross-site deployment is used.
- Auth endpoints are rate-limited; Helmet and strict CORS are enabled.
- Every academic query is scoped by authenticated user ID.
- The backend ignores client-supplied credits/max marks and validates against server curriculum.
- Use a long random `JWT_SECRET`; never commit `.env`.
- For production, deploy frontend and API over HTTPS and set exact `FRONTEND_URL`.

## Deployment outline
1. Create MongoDB Atlas cluster and database `csda_calculator`.
2. Deploy `server` to a Node hosting service; set `MONGO_URI`, `JWT_SECRET`,
   `FRONTEND_URL`, `NODE_ENV=production`.
3. Deploy `client` to a static hosting service; set `VITE_API_URL` to the backend origin
   (without trailing slash).
4. Configure the backend CORS origin and cookie settings for the deployed frontend.
5. Test registration, login, profile updates, marks persistence and logout on the live URL.

This project is deployment-ready in structure; it is **not deployed** by this ZIP.

## Scripts
- `npm run dev`: run client and server concurrently
- `npm run build`: build both
- `npm test`: run calculation tests
- `npm run install:all`: install both workspaces


## Curriculum configuration (Bharathiar University CSDA 2023-24 onwards)

The six-semester curriculum visible in the supplied images has been entered into both the client and server curriculum files.

- 45 curriculum entries are configured across Semesters I-VI.
- Semester credits: 26, 22, 25, 23, 19 and 25 (grand total: 140).
- OR alternatives are represented as one elective slot each, so alternatives are not double-counted.
- Maximum marks are taken from the Total column in the supplied curriculum table.
- CIA/CEE split, examination duration and hours/week are not used by this version of the calculator.

### Important calculation note

The supplied curriculum specifies subjects, maximum marks and credits, but does not show the university's grade-point conversion bands or official SGPA/CGPA formula. The app therefore uses its existing proportional calculation (marks / maximum marks × 10, weighted by credits). Treat this as an estimate until checked against official regulations or a verified marksheet.

### Items to verify against the original PDF

1. Semester IV's Tamil/Advanced Tamil OR Non-major Elective II row appears to show CIA as “-”, CEE as 50, and Total as 100, while the semester and grand totals reconcile only if the course is treated as 50 marks. It has been configured as 50 marks.
2. Semester VI Extension Activities is included because the table assigns it 2 credits and 50 total marks. Confirm whether your college includes it in SGPA/CGPA.
3. For each OR elective slot, enter marks for the one option you actually studied; do not enter multiple alternatives.
