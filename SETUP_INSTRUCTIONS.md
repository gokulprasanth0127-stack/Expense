# Backend Setup Instructions

Your expense manager now has a PostgreSQL backend! Follow these steps to complete the setup.

## 1. Install Dependencies

First, install the required package for Vercel Postgres:

```bash
npm install @vercel/postgres
```

## 2. Create Vercel Postgres Database

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project: `bachelor-expense-manager`
3. Go to the **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name (e.g., `bachelor-expense-db`)
7. Click **Create**

## 3. Connect Database to Your Project

Vercel will automatically add the environment variables to your project. The API routes will have access to:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- And other database credentials

## 4. Deploy to Vercel

Push your changes to GitHub and Vercel will automatically deploy:

```bash
git add .
git commit -m "Add PostgreSQL backend with API routes"
git push origin main
```

## 5. Test Your App

Once deployed, your app at `https://expense-4giijs8cv-gokuls-projects-d77dfee3.vercel.app/` will:
- ✅ Store data in PostgreSQL
- ✅ Sync across all devices
- ✅ Persist data permanently
- ✅ Support multiple users (with simple user_id system)

## 6. Local Development (Optional)

To test locally:

1. Copy the environment variables from Vercel:
   - Go to **Settings** > **Environment Variables**
   - Copy all `POSTGRES_*` variables

2. Add them to `.env.local` file (already created)

3. Run development server:
```bash
npm run dev
```

## What Changed?

### New Files:
- `api/transactions.js` - API endpoint for transactions (GET, POST, DELETE)
- `api/friends.js` - API endpoint for friends (GET, POST, DELETE)
- `src/utils/api.js` - Frontend API utility functions
- `.env.local` - Environment variables template

### Updated Files:
- `src/App.jsx` - Now uses API calls instead of localStorage
  - Added loading state
  - Async operations for all CRUD actions
  - Fallback to localStorage if API fails

## Database Schema

### Transactions Table:
- `id` (SERIAL PRIMARY KEY)
- `user_id` (VARCHAR) - User identifier
- `date` (DATE) - Transaction date
- `description` (TEXT) - Description
- `amount` (DECIMAL) - Amount
- `category` (VARCHAR) - Category
- `paid_by` (VARCHAR) - Who paid
- `split_among` (TEXT) - JSON array of people
- `created_at` (TIMESTAMP)

### Friends Table:
- `id` (SERIAL PRIMARY KEY)
- `user_id` (VARCHAR) - User identifier
- `name` (VARCHAR) - Friend name
- `created_at` (TIMESTAMP)
- UNIQUE constraint on (user_id, name)

## Features:

1. **Data Persistence**: All data stored in PostgreSQL
2. **Cross-Device Sync**: Access your data from any device
3. **Automatic Backups**: Vercel handles database backups
4. **Scalable**: Can support multiple users
5. **Fast**: Uses connection pooling for performance

## Next Steps (Optional Enhancements):

1. **Add Authentication**: Integrate Clerk, Auth0, or NextAuth for real user accounts
2. **Add User Profiles**: Custom categories per user
3. **Add Data Export**: Export to CSV/Excel
4. **Add Charts**: More detailed analytics
5. **Add Notifications**: Email/SMS reminders for settlements

## Troubleshooting:

If you encounter issues:

1. Check Vercel deployment logs
2. Ensure database is properly created
3. Verify environment variables are set
4. Check browser console for API errors

For support, check the Vercel docs: https://vercel.com/docs/storage/vercel-postgres
