# WeatherApp — student project notes

Hey, this is my weather dashboard app I built for college / portfolio. You can sign up, log in with email OTP (two steps), save cities, and see live weather from OpenWeatherMap. The UI is dark + glassy because I like that vibe.

## What it does (in plain English)

- **Sign up / Sign in** with email + password, then a **6-digit OTP** lands in your inbox (Gmail app password or Brevo — see below).
- **Forgot password** = same idea, OTP then set a new password.
- **Dashboard** = current weather, 5-day-ish forecast, air quality, sunrise/sunset, saved cities, search.

Stack: **Next.js 14 (App Router)**, **TypeScript**, **MongoDB + Mongoose**, **JWT in HTTP-only cookie**, **Tailwind**.

## Before you run it

1. Clone / unzip the project, then in the folder run:

```bash
npm install
npm run dev
```

2. Create a file named **`.env.local`** in the project root (same level as `package.json`). Never commit this file — it’s in `.gitignore`.

Fill in these variables:

| Variable | What it’s for |
|----------|----------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for signing cookies (I used `openssl rand -base64 32` once) |
| `OPENWEATHER_API_KEY` | Free key from [openweathermap.org](https://openweathermap.org/api) |
| `EMAIL_USER` + `EMAIL_PASS` | Gmail address + **App Password** (2FA on Google → App passwords) |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; on Vercel use your real site URL |

**Optional — Brevo instead of Gmail:** if you add `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` (verified sender in Brevo), the app will use Brevo first; otherwise it uses Gmail.

Generate a JWT secret quickly:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

MongoDB Atlas: remember to allow network access (for class projects people often use `0.0.0.0/0` — fine for learning, not ideal for real production).

## Deploying on Vercel (step by step)

These steps assume your project is already working locally with `.env.local`.

### 1. Put the code on GitHub

- Create a new repo on GitHub (empty, no README required).
- In your project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Import the project in Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in (GitHub login is easiest).
2. **Add New… → Project** (or **Import**).
3. Pick your GitHub repo and click **Import**.
4. Vercel should auto-detect **Next.js**. Leave **Build Command** as `npm run build` and **Output** as default. Click **Deploy** once to see if the build passes (it may fail until env vars are set — that is OK).

### 3. Add environment variables

In the Vercel project: **Settings → Environment Variables**, add each variable for **Production** (and **Preview** if you want preview deploys to work too):

| Name | Notes |
|------|--------|
| `MONGODB_URI` | Same string as local Atlas URI |
| `JWT_SECRET` | Same long secret as local |
| `OPENWEATHER_API_KEY` | Same as local |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail app password path, **or** `BREVO_API_KEY` + `BREVO_SENDER_EMAIL` |
| `NEXTAUTH_URL` | Your live site URL, e.g. `https://your-project.vercel.app` (no trailing slash) |

After saving variables, go to **Deployments → … on the latest deployment → Redeploy** so the new env is picked up.

### 4. MongoDB Atlas for production

In Atlas → **Network Access**, allow **`0.0.0.0/0`** (any IP) so Vercel’s serverless IPs can connect. For a real production app you would narrow this later.

### 5. Custom domain (optional)

**Settings → Domains** → add your domain and follow DNS instructions from Vercel. Then set `NEXTAUTH_URL` to that domain (e.g. `https://weather.yourschool.edu`).

### 6. CLI alternative

```bash
npm i -g vercel
vercel login
cd path/to/weather-app
vercel          # link project, first preview deploy
vercel env add MONGODB_URI
# repeat for each variable — choose Production when prompted
vercel --prod   # production deploy
```

`vercel.json` in this repo only sets the **region** (`bom1` = Mumbai). All secrets stay in the Vercel dashboard, not in the repo.

## Folder map (so I don’t forget)

- `app/login` — login, register, OTP screen  
- `app/dashboard` — main weather UI  
- `app/api/auth/*` — register, OTP, verify, forgot/reset, logout, `me`  
- `app/api/weather` — proxy to OpenWeather (needs login cookie)  
- `lib/email.ts` — sends OTP HTML (Gmail or Brevo)  
- `models/User.ts` — user + OTP fields  

## If something breaks

- **No OTP** → check spam; check Gmail app password or Brevo key; check `EMAIL_USER` / `EMAIL_PASS`.
- **Mongo errors** → URI correct? IP allowlist in Atlas?
- **City not found** → try `City, Country` or a spelling OpenWeather likes.
- **401 on login** → wrong password or email not registered; email is stored lowercase.

---

Built with lots of coffee and Stack Overflow. Good luck with your demo / submission.
