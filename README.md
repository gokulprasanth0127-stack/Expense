# 💰 Bachelor Expense Manager

A modern expense tracking application built with React and Vite, designed to help you manage shared expenses with friends.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Database**: Upstash Redis (Serverless)
- **Deployment**: Vercel
- **Charts**: Recharts
- **Icons**: Lucide React

---

## ✅ Code Updated - Now Using Upstash Redis!

This app has been converted from PostgreSQL to **Upstash Redis** for:
- ✅ Simpler setup (no connection string errors!)
- ✅ Faster performance
- ✅ Native Vercel integration
- ✅ Free tier perfect for small apps

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Create Upstash Database in Vercel (2 min)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your **expense** project
3. Click **"Storage"** tab (top navigation)
4. Click **"Create Database"**
5. Select **"Upstash"** (the green spiral icon)
6. Name it: `expense-redis`
7. Click **"Create"**

✨ **Vercel automatically adds these environment variables:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Step 2: Install Dependencies (1 min)

```bash
npm install
```

### Step 3: Deploy (2 min)

**Option A - Push to Git (Recommended):**
```bash
git add .
git commit -m "Switch to Upstash Redis"
git push
```

**Option B - Manual Deploy:**
```bash
npm run build
vercel --prod
```

---

## 🏗️ Project Structure

```
bachelor-expense-manager/
├── api/
│   ├── friends.js          # Friends management API (Redis)
│   ├── transactions.js     # Transactions API (Redis)
│   └── salary.js           # Salary management API (Redis)
├── src/
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   ├── utils/
│   │   └── api.js          # API client
│   └── assets/
├── public/
├── package.json
├── vite.config.js
└── vercel.json
```

---

## 🔧 Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bachelor-expense-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (for local testing)**
   
   Create a `.env` file:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```
   
   Get these values from: Vercel → Storage → Your Upstash DB

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📦 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## 🗄️ Database Structure

### Using Upstash Redis (Key-Value Store)

**Friends Storage:**
- Key: `user:{userId}:friends`
- Type: Redis SET
- Example: `["Alice", "Bob", "Charlie"]`

**Transactions Storage:**
- Key: `user:{userId}:transactions`
- Type: JSON Array
- Counter: `user:{userId}:transaction_counter`
- **Amount Logic**: Positive = Income, Negative = Expense

**Salary Storage:**
- Key: `user:{userId}:salary`
- Type: JSON Object
- Fields: `amount`, `receivedDate`

**Example Transaction:**
```json
{
  "id": 1,
  "date": "2024-12-05",
  "desc": "Dinner at restaurant",
  "amount": -50.00,
  "category": "Food",
  "paidBy": "Alice",
  "splitAmong": ["Alice", "Bob"]
}
```

**Example Salary:**
```json
{
  "amount": 50000,
  "receivedDate": "2024-12-01"
}
```

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration

3. **Add Upstash Database**
   - In Vercel project → Storage → Create Database
   - Select Upstash
   - Environment variables added automatically!

4. **Deploy**
   - Push to `main` branch auto-deploys
   - Or click "Deploy" in Vercel dashboard

---

## ✨ Features

- � **Salary Tracking**: Set your monthly salary and track your net balance
- 💸 **Smart Transaction Detection**: Automatically detects income vs expenses
- ✅ **Income Categories**: Mark transactions as "Salary" for automatic income tracking
- 👥 **Friend Management**: Add/remove friends easily
- 📊 **Visual Analytics**: Charts showing spending by category
- 🧮 **Balance Calculator**: Real-time balance = Salary + Income - Expenses
- 💳 **Settlement Tracking**: See who owes whom
- 🎨 **Modern UI**: Clean, responsive design with TailwindCSS
- ⚡ **Fast & Reliable**: Serverless architecture with Upstash Redis

---

## 🔍 API Endpoints

### Salary API (`/api/salary`)

**GET** - Get salary data
```
GET /api/salary?userId=default_user
Response: { "amount": 50000, "receivedDate": "2024-12-01" }
```

**POST/PUT** - Update salary
```
POST /api/salary?userId=default_user
Body: { "amount": 50000, "receivedDate": "2024-12-01" }
Response: { "amount": 50000, "receivedDate": "2024-12-01" }
```

**DELETE** - Clear salary data
```
DELETE /api/salary?userId=default_user
Response: { "message": "Salary data cleared" }
```

### Friends API (`/api/friends`)

**GET** - Get all friends
```
GET /api/friends?userId=default_user
Response: ["Alice", "Bob", "Charlie"]
```

**POST** - Add a friend
```
POST /api/friends?userId=default_user
Body: { "name": "David" }
Response: { "name": "David" }
```

**DELETE** - Remove a friend
```
DELETE /api/friends?userId=default_user&name=David
Response: { "message": "Friend deleted" }
```

### Transactions API (`/api/transactions`)

**GET** - Get all transactions
```
GET /api/transactions?userId=default_user
Response: [{ id, date, desc, amount, category, paidBy, splitAmong }]
```

**POST** - Add a transaction
```
POST /api/transactions?userId=default_user
Body: {
  "date": "2024-12-05",
  "desc": "Dinner",
  "amount": 50.00,
  "category": "Food",
  "paidBy": "Alice",
  "splitAmong": ["Alice", "Bob"]
}
```

**DELETE** - Remove a transaction
```
DELETE /api/transactions?userId=default_user&id=1
Response: { "message": "Transaction deleted" }
```

---

## 🆘 Troubleshooting

### Issue: "Module not found: @upstash/redis"
**Solution:** Run `npm install` to install dependencies.

### Issue: "Environment variables not found"
**Solution:** 
1. Make sure you created the Upstash database in Vercel → Storage
2. Check Vercel → Settings → Environment Variables
3. Redeploy your application

### Issue: "Data not persisting"
**Solution:** 
1. Verify Upstash database is created in Vercel → Storage
2. Check environment variables are set:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy the application

### Issue: Local development not working
**Solution:** 
1. Create `.env` file with Upstash credentials
2. Get credentials from Vercel → Storage → Your Database
3. Run `npm run dev` again

---

## 💰 Free Tier Limits

**Upstash Redis:**
- 10,000 commands per day (more than enough!)
- 256 MB storage
- No credit card required
- Free forever for small apps

**Vercel:**
- 100 GB bandwidth per month
- Unlimited deployments
- Automatic HTTPS
- Perfect for personal projects

---

## 📊 What Changed from PostgreSQL?

### Before (PostgreSQL/Supabase):
```javascript
// Complex connection strings
postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres

// Complex SQL queries
await sql`CREATE TABLE IF NOT EXISTS friends...`;
await sql`SELECT name FROM friends WHERE user_id = ${userId}`;
```

### After (Upstash Redis):
```javascript
// No connection string needed - just env vars!
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Simple operations
await redis.sadd('user:default:friends', 'John');
await redis.smembers('user:default:friends');
```

**Benefits:**
- ✅ No more `ENOTFOUND` errors
- ✅ Simpler code
- ✅ Faster performance
- ✅ Better for serverless

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Database by [Upstash Redis](https://upstash.com/)
- Deployed on [Vercel](https://vercel.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)

---

## 📞 Support

If you have any questions or run into issues:

1. Check the troubleshooting section above
2. Check Vercel deployment logs: Vercel → Deployments → Functions tab
3. Check Upstash dashboard: Vercel → Storage → Your Database → Open Dashboard
4. Create an issue in this repository

---

## 🎉 You're All Set!

Your expense manager is now running on modern, serverless infrastructure with zero configuration headaches. Just create the Upstash database in Vercel and deploy!

**Happy expense tracking! 💰✨**
