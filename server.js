const express = require("express");
const session = require("express-session");
const path = require("path");

// Basic env-based credentials; set TRAINER_USER and TRAINER_PASS in your environment.
const TRAINER_USER = process.env.TRAINER_USER || "trainer@example.com";
const TRAINER_PASS = process.env.TRAINER_PASS || "change-me-now";
const SESSION_SECRET = process.env.SESSION_SECRET || "replace-this-secret";
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production"
    }
  })
);

// Simple auth gate
function requireAuth(req, res, next) {
  if (req.session && req.session.user === TRAINER_USER) return next();
  return res.redirect("/login");
}

app.get("/login", (req, res) => {
  if (req.session && req.session.user === TRAINER_USER) {
    return res.redirect("/app");
  }

  res.send(`
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Login</title>
      <style>
        body { font-family: sans-serif; background:#f4f6fb; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
        .card { background:white; padding:24px; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,0.08); width:100%; max-width:360px; }
        h1 { margin:0 0 12px 0; font-size:1.25rem; }
        label { display:block; margin:12px 0 4px; font-weight:600; }
        input { width:100%; padding:10px; border-radius:8px; border:1px solid #d1d5db; font-size:1rem; }
        button { margin-top:16px; width:100%; padding:12px; background:#2563eb; color:white; border:none; border-radius:8px; font-size:1rem; cursor:pointer; }
        .muted { color:#6b7280; font-size:0.9rem; margin-top:8px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Trainer Login</h1>
        <form method="post" action="/login">
          <label for="username">Email</label>
          <input id="username" name="username" type="email" autocomplete="username" required>
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required>
          <button type="submit">Sign In</button>
          <p class="muted">Use your trainer credentials. Set them via TRAINER_USER / TRAINER_PASS env vars.</p>
        </form>
      </div>
    </body>
    </html>
  `);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === TRAINER_USER && password === TRAINER_PASS) {
    req.session.user = TRAINER_USER;
    return res.redirect("/app");
  }
  return res.status(401).send("Unauthorized");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Protect the designer at /app
app.use("/app", requireAuth, express.static(path.join(__dirname)));
app.get("/", (_req, res) => res.redirect("/app"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Trainer app running on http://localhost:${port}`);
});
