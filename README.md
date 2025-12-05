# 🏠 BachEx - Bachelor Expense Manager

A modern, full-stack expense management application designed for bachelors and roommates to track shared expenses, split bills, and manage group finances efficiently.

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-Latest-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-cyan)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Database Configuration](#-database-configuration)
- [Authentication System](#-authentication-system)
- [Data Migration](#-data-migration)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 💰 Expense Management
- **Add Transactions** - Record income and expenses with smart category detection
- **Split Bills** - Equal split or custom amount splits between friends
- **Category Tracking** - 25+ pre-defined categories with custom category support
- **Transaction History** - View, edit, and delete transactions

### 👥 Friend Management
- **Add Friends** - Manage your roommates and friends
- **Balance Tracking** - Real-time calculation of who owes whom
- **Settlement View** - Clear overview of all pending balances

### 📊 Analytics & Insights
- **Dashboard** - Beautiful charts showing spending patterns
- **Pie Chart** - Spending breakdown by category
- **Line Chart** - Spending trends over time
- **Bar Charts** - Top categories and friend balances
- **Recent Activity** - Quick view of latest transactions

### 💵 Salary Management
- **Monthly Salary** - Track your income
- **Balance Calculation** - Automatic net balance calculation
- **Financial Summary** - Overview of salary, expenses, and balance

### 🥚 Egg Tracker (Bonus Feature!)
- Track egg consumption and costs
- Split egg expenses among friends

### 🔐 Multi-User Authentication
- **Secure Registration** - Email and password-based signup
- **Login System** - JWT-based authentication
- **User Profiles** - Personal data isolation per user
- **Session Management** - 7-day token expiry
- **Data Migration** - Migrate existing data to new accounts

---

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Recharts** - Beautiful, composable charts
- **Lucide React** - Modern icon library
- **js-cookie** - Cookie management

### Backend
- **Vercel Serverless Functions** - API endpoints
- **Upstash Redis** - Serverless Redis database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

### Deployment
- **Vercel** - Continuous deployment from GitHub
- **GitHub** - Version control

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js >= 18.x
npm or yarn
Git
Vercel Account (for deployment)
Upstash Account (for Redis database)
```

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/gokulprasanth0127-stack/Expense.git
cd bachelor-expense-manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```bash
# Upstash Redis Configuration
expense_KV_REST_API_URL="your-upstash-redis-url"
expense_KV_REST_API_TOKEN="your-upstash-redis-token"

# JWT Secret for Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

4. **Run development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔧 Environment Setup

### Required Environment Variables

#### Local Development (`.env.local`)
```bash
# Upstash Redis
expense_KV_REST_API_URL="https://your-redis-endpoint.upstash.io"
expense_KV_REST_API_TOKEN="your-redis-token"

# JWT Secret
JWT_SECRET="your-random-secret-key-min-32-characters"
```

#### Production (Vercel Dashboard)
Add these in **Vercel Dashboard → Your Project → Settings → Environment Variables**:

| Name | Value | Environments |
|------|-------|--------------|
| `expense_KV_REST_API_URL` | Your Upstash Redis REST URL | Production, Preview, Development |
| `expense_KV_REST_API_TOKEN` | Your Upstash Redis Token | Production, Preview, Development |
| `JWT_SECRET` | Strong random secret (64+ chars) | Production, Preview, Development |

---

## 💾 Database Configuration

### Upstash Redis Setup

1. **Create Upstash Account**
   - Go to [upstash.com](https://upstash.com)
   - Sign up for a free account

2. **Create Redis Database**
   - Click "Create Database"
   - Choose a name (e.g., `bachelor-expense-db`)
   - Select region closest to your users
   - Click "Create"

3. **Get Credentials**
   - Click on your database
   - Copy `UPSTASH_REDIS_REST_URL` → use as `expense_KV_REST_API_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN` → use as `expense_KV_REST_API_TOKEN`

### Data Structure

```javascript
// User Data
users:{userId} → { id, email, name, createdAt }
users:{userId}:password → bcrypt hash
user:email:{email} → userId

// User-Specific Data
user:{userId}:transactions → array of transactions
user:{userId}:friends → set of friend names
user:{userId}:salary → { amount, receivedDate }
user:{userId}:transaction_counter → counter for transaction IDs
```

---

## 🔐 Authentication System

### How It Works

1. **Registration**
   - User provides name, email, and password
   - Password is hashed using bcrypt (10 salt rounds)
   - User data stored in Redis
   - JWT token generated with 7-day expiry

2. **Login**
   - User provides email and password
   - System verifies credentials
   - Returns JWT token on success

3. **Protected Routes**
   - All API endpoints require `Authorization: Bearer <token>` header
   - Token verified on each request
   - User data isolated per userId

### API Endpoints

#### Register New User
```bash
POST /api/auth?action=register
Content-Type: application/json

{
  "name": "Your Name",
  "email": "your@email.com",
  "password": "YourPassword123"
}
```

#### Login
```bash
POST /api/auth?action=login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "YourPassword123"
}
```

#### Get Current User
```bash
GET /api/auth?action=me
Authorization: Bearer <your-jwt-token>
```

#### Logout
```bash
POST /api/auth?action=logout
Authorization: Bearer <your-jwt-token>
```

---

## 📦 Data Migration

### Migrating Existing Data to New User

If you have existing data under `default_user` and want to migrate to a new account:

1. **Register/Login** to your new account
2. **Migration Banner** will appear automatically
3. **Click "Migrate My Data"** button
4. All data will be copied to your account:
   - ✅ Transactions
   - ✅ Friends
   - ✅ Salary data
   - ✅ Transaction counters

### Manual Migration (API)
```bash
POST /api/migrate
Authorization: Bearer <your-jwt-token>
```

---

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - Go to **Settings → Environment Variables**
   - Add all required variables (see [Environment Setup](#-environment-setup))
   - Make sure to select all environments: Production, Preview, Development

4. **Deploy**
   - Vercel will automatically deploy on every push to main
   - Initial deployment takes 2-3 minutes

5. **Access Your App**
   - Your app will be available at: `https://your-project.vercel.app`

---

## 📁 Project Structure

```
bachelor-expense-manager/
├── api/                          # Vercel Serverless Functions
│   ├── auth.js                   # Authentication endpoints
│   ├── transactions.js           # Transaction CRUD
│   ├── friends.js                # Friends management
│   ├── salary.js                 # Salary management
│   └── migrate.js                # Data migration
├── src/
│   ├── components/               # React components
│   │   ├── Login.jsx             # Login page
│   │   └── Register.jsx          # Registration page
│   ├── contexts/
│   │   └── AuthContext.jsx       # Authentication context
│   ├── utils/
│   │   └── api.js                # API utility functions
│   ├── App.jsx                   # Main application
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── public/                       # Static assets
├── .env.local                    # Local environment variables
├── package.json                  # Dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # TailwindCSS config
└── vercel.json                   # Vercel configuration
```

---

## 📚 API Documentation

### Transactions API

#### Get All Transactions
```bash
GET /api/transactions
Authorization: Bearer <token>
```

#### Create Transaction
```bash
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-05",
  "desc": "Groceries from DMart",
  "amount": -500,
  "category": "Groceries",
  "paidBy": "Me",
  "splitAmong": ["Me", "Rahul", "Amit"]
}
```

#### Delete Transaction
```bash
DELETE /api/transactions?id=123
Authorization: Bearer <token>
```

### Friends API

#### Get All Friends
```bash
GET /api/friends
Authorization: Bearer <token>
```

#### Add Friend
```bash
POST /api/friends
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Rahul"
}
```

#### Delete Friend
```bash
DELETE /api/friends?name=Rahul
Authorization: Bearer <token>
```

### Salary API

#### Get Salary
```bash
GET /api/salary
Authorization: Bearer <token>
```

#### Update Salary
```bash
POST /api/salary
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "receivedDate": "2025-12-01"
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **401 Unauthorized Error**
- **Cause**: Missing or invalid JWT token
- **Solution**: Make sure you're logged in and token is being sent in headers

#### 2. **Redis Connection Error**
- **Cause**: Invalid Upstash credentials
- **Solution**: Double-check environment variables in `.env.local` and Vercel

#### 3. **npm Install Fails**
- **Cause**: Temporary npm registry issues
- **Solution**: Wait 2-3 minutes and try again, or clear npm cache:
```bash
npm cache clean --force
npm install
```

#### 4. **Deployment Fails**
- **Cause**: Missing environment variables
- **Solution**: Add all required variables in Vercel dashboard

#### 5. **Data Not Showing**
- **Cause**: Not authenticated or wrong user
- **Solution**: Logout and login again, or use migration feature

### Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Verify environment variables are set correctly
4. Ensure Upstash Redis database is active

---

## 🎯 Features Roadmap

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Profile picture upload
- [ ] Export data to CSV/PDF
- [ ] Mobile app (React Native)
- [ ] Recurring transactions
- [ ] Budget limits and alerts
- [ ] Multi-currency support
- [ ] Dark mode

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Gokul Prasanth**
- GitHub: [@gokulprasanth0127-stack](https://github.com/gokulprasanth0127-stack)
- Email: gokul0127@gmail.com

---

## 🙏 Acknowledgments

- Built with ❤️ for bachelors managing shared expenses
- Special thanks to Upstash for serverless Redis
- Icons by Lucide
- Charts by Recharts

---

## 📝 Notes

### Balance Calculation Logic

The app calculates balances using this logic:

```javascript
Net Balance = Salary + Income - Total Paid Out + Money You Owe to Others
```

**Why add "Money You Owe"?**
- When someone else pays for your share, you still have that cash
- It's added back to your balance because you haven't spent it yet
- When you settle the debt, then it gets deducted

**Example:**
- Salary: ₹50,000
- You paid: ₹10,000
- Friend paid ₹3,000, your share: ₹1,000
- Balance: ₹50,000 - ₹10,000 + ₹1,000 = ₹41,000
  (You have ₹41,000 cash in hand, but owe friend ₹1,000)

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
git push origin main
```

---

**Happy Expense Tracking! 💰📊**
