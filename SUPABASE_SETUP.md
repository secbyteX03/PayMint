# How to Create Tables in Supabase

## Quick Steps to Set Up Your Database

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/aupodprsjpcnilwvmtku/sql
2. This opens the SQL Editor for your project

### Step 2: Run the SQL

Copy ALL the SQL from this file and paste it into the SQL Editor:

`apps/api/prisma/supabase_schema.sql`

Then click **Run** (or press Ctrl+Enter)

### Step 3: Verify Success

After running, you should see success messages and you can verify by:

- Going to **Database** → **Table Editor** in the left sidebar
- You should see these 4 tables:
  - ✅ `agents`
  - ✅ `services`
  - ✅ `payments`
  - ✅ `transactions`

---

## Alternative: Use Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
cd AgentPay/apps/api/prisma
supabase db push
```

But this requires your database password (not the secret key).

---

## Need Help?

If you get stuck:

1. Make sure you're logged into Supabase
2. Go to: https://supabase.com/dashboard/project/aupodprsjpcnilwvmtku/settings/database
3. Find your connection string there

The SQL will create all necessary tables with proper indexes and security policies.
