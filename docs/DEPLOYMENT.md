# Deployment Guide: Supabase + Vercel (Free Tier)

This guide covers deploying the AgentPay app using **only Supabase** (for database + backend) and **Vercel** (for frontend).

## Architecture

```
┌─────────────┐     ┌──────────────┐
│   Vercel    │────▶│   Supabase   │
│  (Frontend) │     │  (Database)  │
└─────────────┘     │  (Edge Fn)   │
                    └──────────────┘
```

---

## Part 1: Supabase Setup (Database + API)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: AgentPay
   - **Database Password**: Your password (remember it!)
4. Wait for project to initialize (~2 minutes)

### Step 2: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `apps/api/prisma/schema.sql` and run it
3. Run any additional SQL files if needed (add_columns.sql, etc.)

### Step 3: Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public** key (under "Project API keys")

---

## Part 2: Vercel Setup (Frontend)

### Step 1: Deploy Frontend

1. Push your code to GitHub (include `vercel.json`)
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your GitHub repository

### Step 2: Configure Environment Variables

In Vercel dashboard, add these variables:

| Variable                                       | Value                                                       |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Your Supabase Project URL                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Your Supabase anon key                                      |
| `NEXT_PUBLIC_API_URL`                          | Leave as is (or set to empty - we'll use Supabase directly) |
| `NEXT_PUBLIC_STELLAR_NETWORK`                  | testnet                                                     |

### Step 3: Deploy

Click **Deploy**!

---

## Part 3: Update Frontend Code

The current frontend expects a separate Express API. You'll need to modify it to call Supabase directly or create Supabase Edge Functions.

### Option A: Use Supabase Client (Recommended)

Update `apps/web/src/lib/supabase.ts` to use the Supabase client directly:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Then update API calls in your components to use Supabase directly.

---

## Part 4: Alternative - Deploy API on Render (Free)

If you want a full backend, deploy the Express API to **Render**:

### Step 1: Push to GitHub

Make sure your API code is on GitHub.

### Step 2: Create Render Service

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node dist/index.js`

### Step 3: Add Environment Variables

Add these in Render:

- `DATABASE_URL` - Your Supabase connection string (get from Supabase → Settings → Connection)
- `NODE_ENV` - production
- `PORT` - 3001
- `STELLAR_NETWORK` - testnet

### Step 4: Update Vercel

Update `NEXT_PUBLIC_API_URL` in Vercel to your Render URL (e.g., `https://agentpay-api.onrender.com`)

---

## Summary: Free Tier Costs

| Service      | Free Tier Limits                          |
| ------------ | ----------------------------------------- |
| **Supabase** | 500MB DB, 2 Edge Functions, 2GB bandwidth |
| **Vercel**   | 100GB bandwidth, 100 build minutes/month  |
| **Render**   | 750 hours/month, 1 free service           |

All **free** for personal projects!

---

## Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run SQL schema in Supabase SQL Editor
- [ ] Get Supabase URL and anon key
- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Add environment variables in Vercel
- [ ] Test the app!

For a fully working backend, also deploy to Render using the steps in Part 4.
