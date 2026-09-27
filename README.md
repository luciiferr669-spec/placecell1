# PlaceCell – Student Placement System

A front-end student placement portal (HTML, CSS, JavaScript).

## Run offline
Open `index.html` in any browser. No install or server needed.
(Fonts load from Google Fonts when online; offline it falls back to system fonts.)

## Demo accounts
- Student: rahul@college.edu / 1234
- Admin: admin@college.edu / admin

## Files
- `index.html` – page structure (login, register, app shell)
- `style.css` – all styling, light/dark themes, mobile layout
- `app.js` – data, login/register, jobs, applications, admin features

## Notes
- Data is saved in the browser's localStorage. Use "Reset demo data" on the admin Students page to start fresh.
- Passwords are stored in plain text – fine for a demo, not for real use.
- Next step: replace the data layer in `app.js` with a Python + Flask + SQL backend.
