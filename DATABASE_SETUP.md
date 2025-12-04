# Database Setup Complete Guide

## ✅ Step-by-Step Setup for Vercel Postgres

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Sign in to your account

### 2. Navigate to Your Project
- Find your `bachelor-expense-manager` project
- Click on it to open

### 3. Create Postgres Database

1. **Click the "Storage" tab** (in the top navigation)
   
2. **Click "Create Database"** button
   
3. **Select "Postgres"**
   
4. **Configure your database:**
   - Database Name: `bachelor-expense-db` (or your preferred name)
   - Region: Choose the closest region to your users
     - US East: `iad1` (Washington, D.C.)
     - US West: `sfo1` (San Francisco)
     - Europe: `fra1` (Frankfurt)
     - Asia: `sin1` (Singapore)
   
5. **Click "Create"**
   - Wait 30-60 seconds for provisioning

### 4. Connect Database to Project

1. After database creation, you'll see a connection dialog
2. **Check the box** next to your project name
3. **Click "Connect"** button
4. Vercel automatically adds environment variables to your project

### 5. Verify Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Confirm these variables exist:
   - ✅ `POSTGRES_URL`
   - ✅ `POSTGRES_PRISMA_URL`
   - ✅ `POSTGRES_URL_NON_POOLING`
   - ✅ `POSTGRES_USER`
   - ✅ `POSTGRES_HOST`
   - ✅ `POSTGRES_PASSWORD`
   - ✅ `POSTGRES_DATABASE`

### 6. Redeploy Your Application

**Option A: Redeploy from Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the `⋮` (three dots) on your latest deployment
3. Select **"Redeploy"**
4. Wait for deployment to complete

**Option B: Push a New Commit** (triggers automatic deployment)
```bash
git add .
git commit -m "Add database configuration"
git push origin main
```

### 7. Test Your Application

1. Visit your live URL: https://expense-4giijs8cv-gokuls-projects-d77dfee3.vercel.app/
2. Try adding a friend (Friends tab)
3. Try adding a transaction (Transactions tab)
4. Refresh the page - your data should persist!
5. Open from another device - data should sync!

---

## 🔧 Troubleshooting

### Error: "Database error"
- **Cause**: Database not created or not connected
- **Fix**: Follow steps 1-6 above

### Error: "Failed to fetch"
- **Cause**: API routes not deployed or database not connected
- **Fix**: Redeploy the application (Step 6)

### Data Not Persisting
- **Cause**: Environment variables not set
- **Fix**: 
  1. Check Settings → Environment Variables
  2. Ensure all POSTGRES_* variables exist
  3. Redeploy if variables were just added

### "Connection pool timeout"
- **Cause**: Using wrong connection string
- **Fix**: Ensure using `POSTGRES_PRISMA_URL` for pooling

---

## 📊 What Happens After Setup

### Database Tables Created Automatically:
When you first add data, the API will create:

1. **`transactions` table**
   - id (PRIMARY KEY)
   - user_id
   - date
   - description
   - amount
   - category
   - paid_by
   - split_among (JSON)
   - created_at

2. **`friends` table**
   - id (PRIMARY KEY)
   - user_id
   - name
   - created_at
   - UNIQUE(user_id, name)

### Features You Get:
✅ Data syncs across all your devices
✅ Permanent storage (no data loss)
✅ Automatic backups by Vercel
✅ Fast performance with connection pooling
✅ Ready for multiple users
✅ Free tier includes 256 MB storage, 60 hours compute

---

## 💰 Vercel Postgres Pricing

### Hobby (Free):
- 256 MB Storage
- 60 compute hours/month
- Perfect for personal use

### Pro ($20/month):
- 512 MB Storage (+ $0.18/GB extra)
- 100 compute hours (+ $0.10/hour extra)
- For production apps

---

## 🎯 Next Steps (Optional)

### Add Authentication
To give each user their own data:
1. Install Clerk, Auth0, or NextAuth
2. Update `user_id` in API to use real user IDs
3. Add login/signup pages

### Add More Features
- Export data to CSV
- Email notifications for settlements
- Monthly expense reports
- Budget tracking
- Receipt uploads

---

## 📞 Need Help?

- Vercel Postgres Docs: https://vercel.com/docs/storage/vercel-postgres
- Vercel Support: https://vercel.com/support
- Check deployment logs in Vercel Dashboard for errors

---

## ✨ Success Checklist

- [ ] Database created in Vercel Storage
- [ ] Database connected to project
- [ ] Environment variables visible in Settings
- [ ] Application redeployed
- [ ] Can add friends successfully
- [ ] Can add transactions successfully
- [ ] Data persists after page refresh
- [ ] Data visible on different devices

Once all checked, you're all set! 🎉
