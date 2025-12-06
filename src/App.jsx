import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  LayoutDashboard, 
  Table, 
  Users, 
  Calculator, 
  Plus, 
  Trash2, 
  ArrowRightLeft,
  DollarSign,
  Wallet,
  CheckCircle,
  TrendingUp,
  Calendar,
  Edit,
  LogOut,
  User
} from 'lucide-react';
import { transactionsAPI, friendsAPI, salaryAPI } from './utils/api';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';

// --- Shared UI Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    ghost: "text-slate-500 hover:bg-slate-100"
  };
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 active:scale-95 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-700"
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-bold ${colors[color] || colors.slate}`}>{children}</span>;
};

// --- Main Application ---

export default function App() {
  const { user, loading: authLoading, logout, isAuthenticated, token } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [migrating, setMigrating] = useState(false);
  
  // --- State Management ---
  const [friends, setFriends] = useState([]);
  const [categories, setCategories] = useState([
    'Salary', 'Rent', 'EMI', 'Wifi', 'Recharge', 'Groceries', 'Snacks', 'Gym', 'Help',
    'Public Transport', 'Fuel', 'Vehicle Maintenance', 'Tea/Coffee', 'Dinner',
    'Lunch', 'Breakfast', 'Clothing', 'Movies', 'Sports', 'Medicine', 'Eggs',
    'HouseHold Things', 'Split', 'Cash ATM', 'Invest', 'Settle'
  ]);
  const [transactions, setTransactions] = useState([]);
  const [salary, setSalary] = useState({ amount: 0, receivedDate: null, previousBalance: 0 });
  const [eggRecords, setEggRecords] = useState([]);

  // Load data from backend on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [friendsData, transactionsData, salaryData] = await Promise.all([
          friendsAPI.getAll(),
          transactionsAPI.getAll(),
          salaryAPI.get()
        ]);
        setFriends(friendsData.length > 0 ? friendsData : ['Rahul', 'Amit', 'Sneha']);
        setTransactions(transactionsData);
        setSalary(salaryData);
        
        // Show migration banner if no data found
        if (transactionsData.length === 0 && friendsData.length === 0 && (!salaryData || salaryData.amount === 0)) {
          setShowMigrationBanner(true);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // If unauthorized, logout
        if (error.message.includes('Unauthorized')) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  // Migration function
  const handleMigrateData = async () => {
    if (!confirm('This will copy all data from default_user to your account. Continue?')) {
      return;
    }

    setMigrating(true);
    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Migration failed');
      }

      alert(`✅ Migration successful!\n\nMigrated:\n- ${result.migrated.transactions} transactions\n- ${result.migrated.friends} friends\n- Salary: ${result.migrated.salary ? 'Yes' : 'No'}`);
      
      setShowMigrationBanner(false);
      
      // Reload data
      const [friendsData, transactionsData, salaryData] = await Promise.all([
        friendsAPI.getAll(),
        transactionsAPI.getAll(),
        salaryAPI.get()
      ]);
      setFriends(friendsData);
      setTransactions(transactionsData);
      setSalary(salaryData);
    } catch (error) {
      console.error('Migration failed:', error);
      alert('❌ Migration failed: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  // --- Core Calculation Logic ---
  const summary = useMemo(() => {
    let totalSpentByMe = 0; 
    let totalPaidOut = 0;
    let totalIncome = 0;
    let totalOwedToMe = 0; // Money friends owe me (reduces my cash)
    let totalIOwe = 0; // Money I owe friends (I still have this cash)
    const balances = {};
    friends.forEach(f => balances[f] = 0);

    transactions.forEach(t => {
      const splitCount = t.splitAmong.length;
      const isIncome = t.amount > 0; // Positive = income, Negative = expense
      const amountPerPerson = Math.abs(t.amount) / splitCount;

      if (isIncome) {
        // Income transaction
        if (t.splitAmong.includes('Me')) totalIncome += amountPerPerson;
      } else {
        // Expense transaction
        if (t.paidBy === 'Me') totalPaidOut += Math.abs(t.amount);
        if (t.splitAmong.includes('Me')) totalSpentByMe += amountPerPerson;
      }

      // Skip balance calculation for income
      if (isIncome) return;

      // Settlement Logic
      if (t.paidBy === 'Me') {
        // I paid - everyone in split (except me) owes me
        t.splitAmong.forEach(person => {
          if (person !== 'Me') {
            balances[person] = (balances[person] || 0) + amountPerPerson;
            totalOwedToMe += amountPerPerson;
          }
        });
      } else {
        // Friend paid - if I'm in the split, I owe them
        if (t.splitAmong.includes('Me')) {
          balances[t.paidBy] = (balances[t.paidBy] || 0) - amountPerPerson;
          totalIOwe += amountPerPerson;
        }
      }
    });

    // Calculate balance: Previous month balance + Salary + Income - Money I actually paid out
    // Settlement amounts are NOT included until marked as settled
    const previousBalance = salary.previousBalance || 0;
    const netBalance = previousBalance + salary.amount + totalIncome - totalPaidOut;

    return { totalSpentByMe, totalPaidOut, totalIncome, balances, netBalance, totalOwedToMe, totalIOwe, previousBalance };
  }, [transactions, friends, salary]);

  const categoryData = useMemo(() => {
    const data = {};
    transactions.forEach(t => {
      // Only include expenses (negative amounts) in category breakdown
      if (t.splitAmong.includes('Me') && t.amount < 0) {
        const myShare = Math.abs(t.amount) / t.splitAmong.length;
        data[t.category] = (data[t.category] || 0) + myShare;
      }
    });
    return Object.keys(data).map(key => ({ name: key, value: Math.round(data[key]) }))
      .sort((a, b) => b.value - a.value)
      .filter(item => item.value > 0); // Remove zero values
  }, [transactions]);

  const timelineData = useMemo(() => {
    const data = {};
    transactions.forEach(t => {
      // Only include expenses (negative amounts) in timeline
      if (t.splitAmong.includes('Me') && t.amount < 0) {
        const myShare = Math.abs(t.amount) / t.splitAmong.length;
        data[t.date] = (data[t.date] || 0) + myShare;
      }
    });
    return Object.keys(data)
      .sort()
      .slice(-30) // Last 30 days
      .map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: Math.round(data[date])
      }));
  }, [transactions]);

  const friendBalancesData = useMemo(() => {
    return Object.entries(summary.balances)
      .map(([name, balance]) => ({
        name,
        owesYou: balance > 0 ? Math.round(balance) : 0,
        youOwe: balance < 0 ? Math.round(Math.abs(balance)) : 0 // Use absolute value for side-by-side bars
      }))
      .filter(item => item.owesYou > 0 || item.youOwe > 0); // Filter using positive values
  }, [summary.balances]);

  const topCategoriesData = useMemo(() => {
    return categoryData.slice(0, 6); // Top 6 categories
  }, [categoryData]);

  // Monthly breakdown calculation
  const monthlyStatements = useMemo(() => {
    const monthlyData = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          income: 0,
          expenses: 0,
          myExpenseShare: 0
        };
      }
      
      const isIncome = t.amount > 0;
      const amountPerPerson = Math.abs(t.amount) / t.splitAmong.length;
      
      if (isIncome && t.splitAmong.includes('Me')) {
        monthlyData[monthKey].income += amountPerPerson;
      } else if (!isIncome) {
        if (t.paidBy === 'Me') {
          monthlyData[monthKey].expenses += Math.abs(t.amount);
        }
        if (t.splitAmong.includes('Me')) {
          monthlyData[monthKey].myExpenseShare += amountPerPerson;
        }
      }
    });
    
    // Convert to array and sort by month
    const sortedMonths = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Calculate running balances
    let runningBalance = salary.previousBalance || 0;
    const statements = sortedMonths.map((month) => {
      const monthlySalary = salary.amount || 0;
      const startingBalance = runningBalance;
      // Balance = Starting + Salary + Income - Money I paid out
      const endingBalance = startingBalance + monthlySalary + month.income - month.expenses;
      
      // Update running balance for next month
      runningBalance = endingBalance;
      
      return {
        ...month,
        salary: monthlySalary,
        startingBalance: startingBalance,
        endingBalance: endingBalance,
        savings: endingBalance // Savings = Ending Balance
      };
    });
    
    return statements;
  }, [transactions, salary]);

  const chartColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

  // --- Views ---

  const Dashboard = () => (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-lg shadow-emerald-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-xs md:text-sm font-medium mb-1">Current Balance</p>
              <h3 className="text-2xl md:text-3xl font-bold">₹{summary.netBalance.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet size={20} className="text-white md:w-6 md:h-6" />
            </div>
          </div>
          <div className="mt-3 md:mt-4 text-xs text-emerald-100 flex items-center gap-1">
            <CheckCircle size={12} />
            <span>Salary + Income - Paid Out</span>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-xs md:text-sm font-medium mb-1">Monthly Salary</p>
              <h3 className="text-2xl md:text-3xl font-bold">₹{salary.amount.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp size={20} className="text-white md:w-6 md:h-6" />
            </div>
          </div>
          <div className="mt-3 md:mt-4 text-xs text-indigo-100 flex items-center gap-1">
            <Calendar size={12} />
            <span className="truncate">{salary.receivedDate ? `Received on ${salary.receivedDate}` : 'Not set'}</span>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-lg shadow-amber-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100 text-xs md:text-sm font-medium mb-1">Total Income</p>
              <h3 className="text-2xl md:text-3xl font-bold">₹{summary.totalIncome.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp size={20} className="text-white md:w-6 md:h-6" />
            </div>
          </div>
          <div className="mt-3 md:mt-4 text-xs text-amber-100 flex items-center gap-1">
            <CheckCircle size={12} />
            <span>Additional earnings</span>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">Total Expenses</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800">₹{summary.totalSpentByMe.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg">
              <DollarSign size={20} className="text-slate-600 md:w-6 md:h-6" />
            </div>
          </div>
          <p className="mt-3 md:mt-4 text-xs text-slate-400">Your share of bills</p>
        </Card>
      </div>

      {/* Pending Settlements Banner */}
      {(summary.totalOwedToMe > 0 || summary.totalIOwe > 0) && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft size={20} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Pending Settlements</h4>
                <p className="text-sm text-slate-600">
                  {summary.totalOwedToMe > 0 && `₹${summary.totalOwedToMe.toFixed(2)} owed to you`}
                  {summary.totalOwedToMe > 0 && summary.totalIOwe > 0 && ' • '}
                  {summary.totalIOwe > 0 && `₹${summary.totalIOwe.toFixed(2)} you owe`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  💡 These amounts are not in your balance yet. Click "Settle Up" after money is exchanged.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('settlement')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
            >
              Settle Up
            </button>
          </div>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pie Chart - Spending by Category */}
        <Card className="p-6 flex flex-col" style={{ minHeight: '400px' }}>
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
            <span>Spending by Category</span>
            <span className="text-sm font-normal text-slate-500">₹{categoryData.reduce((sum, cat) => sum + cat.value, 0).toFixed(0)} total</span>
          </h3>
          {categoryData.length > 0 ? (
            <div className="flex-1 flex gap-6">
              {/* Pie Chart on Left */}
              <div className="flex-1" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      label={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [`₹${value}`, 'Amount']}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Category List on Right */}
              <div className="w-40 space-y-2 overflow-y-auto max-h-80 custom-scrollbar pr-2">
                {categoryData.map((item, index) => {
                  const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-700 text-sm truncate">{item.name}</div>
                        <div className="text-xs text-slate-500">₹{item.value} • {percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <DollarSign size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">No expenses recorded yet</p>
              <p className="text-xs mt-1">Add transactions to see breakdown</p>
            </div>
          )}
        </Card>

        {/* Line Chart - Spending Trend */}
        <Card className="p-6 flex flex-col" style={{ minHeight: '400px' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Spending Trend</h3>
            <TrendingUp size={20} className="text-indigo-600" />
          </div>
          {timelineData.length > 0 ? (
            <div className="flex-1" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`₹${value}`, 'Spent']}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      fontSize: '12px',
                      backgroundColor: 'white'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <TrendingUp size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">No timeline data yet</p>
              <p className="text-xs mt-1">Add expenses to see trends</p>
            </div>
          )}
        </Card>
      </div>

      {/* Second Row of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Bar Chart - Top Categories */}
        <Card className="p-6 flex flex-col" style={{ minHeight: '400px' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Top Categories</h3>
            <Calendar size={20} className="text-violet-600" />
          </div>
          {topCategoriesData.length > 0 ? (
            <div className="flex-1" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategoriesData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12 }} 
                    stroke="#64748b"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    width={75}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`₹${value}`, 'Spent']}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      backgroundColor: 'white'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#6366f1"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <Calendar size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">No category data yet</p>
              <p className="text-xs mt-1">Start tracking expenses</p>
            </div>
          )}
        </Card>

        {/* Bar Chart - Friend Balances */}
        <Card className="p-6 flex flex-col" style={{ minHeight: '400px' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Friend Balances</h3>
            <ArrowRightLeft size={20} className="text-emerald-600" />
          </div>
          {friendBalancesData.length > 0 ? (
            <div className="flex-1" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={friendBalancesData} layout="vertical" margin={{ left: 60, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12 }} 
                    stroke="#64748b"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    width={55}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => {
                      const absValue = Math.abs(value);
                      return [
                        `₹${absValue}`, 
                        name === 'youOwe' ? 'You Owe' : 'Owes You'
                      ];
                    }}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      backgroundColor: 'white'
                    }}
                  />
                  <Bar 
                    dataKey="youOwe" 
                    fill="#ef4444"
                    radius={[8, 0, 0, 8]}
                    name="You Owe"
                  />
                  <Bar 
                    dataKey="owesYou" 
                    fill="#10b981"
                    radius={[0, 8, 8, 0]}
                    name="Owes You"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <CheckCircle size={48} className="mb-2 opacity-20 text-green-400" />
              <p className="text-sm font-medium">All settled up!</p>
              <p className="text-xs mt-1">No pending balances</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
          {[...transactions].reverse().slice(0, 15).map(t => {
            const isIncome = t.amount > 0;
            return (
              <div key={t.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                      isIncome ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {t.category.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{t.desc}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{t.date}</span>
                      <span>•</span>
                      <span>{t.paidBy === 'Me' ? 'You paid' : `${t.paidBy} paid`}</span>
                      {t.splitAmong.length > 1 && (
                        <>
                          <span>•</span>
                          <span>Split with {t.splitAmong.filter(p => p !== t.paidBy).join(', ')}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`block text-lg font-bold ${isIncome ? 'text-green-600' : 'text-slate-800'}`}>
                    {isIncome ? '+' : ''}₹{Math.abs(t.amount)}
                  </span>
                  {t.splitAmong.includes('Me') && t.splitAmong.length > 1 && (
                    <span className="text-xs text-slate-400">
                      My Share: ₹{(Math.abs(t.amount)/t.splitAmong.length).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Table size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm mt-2">Start adding expenses to track your spending</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const TransactionManager = () => {
    const [form, setForm] = useState({
      date: new Date().toISOString().split('T')[0],
      desc: '',
      amount: '',
      category: categories[0] || 'General',
      paidBy: 'Me',
      splitAmong: ['Me'],
      splitType: 'equal', // 'equal' or 'custom'
      customSplits: {}, // { personName: amount }
      transactionType: 'expense' // 'income' or 'expense'
    });

    const [editingId, setEditingId] = useState(null);
    const [showEggTracker, setShowEggTracker] = useState(false);
    const [eggForm, setEggForm] = useState({
      dateBought: new Date().toISOString().split('T')[0],
      boughtBy: 'Me',
      eggsEaten: '',
      pricePerEgg: ''
    });

    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    // Smart category detection based on description keywords
    const detectCategory = (description) => {
      const desc = description.toLowerCase();
      
      // Category detection patterns
      const categoryPatterns = {
        'Salary': ['salary', 'income', 'wage', 'payment received'],
        'Rent': ['rent', 'house rent', 'room rent', 'apartment'],
        'EMI': ['emi', 'loan', 'installment', 'equated'],
        'Wifi': ['wifi', 'internet', 'broadband', 'fiber'],
        'Recharge': ['recharge', 'mobile recharge', 'prepaid', 'top up', 'topup'],
        'Groceries': ['grocery', 'groceries', 'vegetables', 'fruits', 'market', 'supermarket', 'dmart', 'reliance fresh', 'big bazaar'],
        'Snacks': ['snack', 'snacks', 'chips', 'biscuit', 'chocolate', 'candy'],
        'Gym': ['gym', 'fitness', 'workout', 'exercise', 'membership'],
        'Help': ['help', 'maid', 'cleaning', 'servant', 'domestic help'],
        'Public Transport': ['bus', 'metro', 'train', 'auto', 'rickshaw', 'public transport', 'uber', 'ola', 'rapido'],
        'Fuel': ['fuel', 'petrol', 'diesel', 'gas', 'cng'],
        'Vehicle Maintenance': ['service', 'repair', 'maintenance', 'bike service', 'car service', 'oil change', 'tyre'],
        'Tea/Coffee': ['tea', 'coffee', 'chai', 'cafe', 'starbucks', 'ccd'],
        'Dinner': ['dinner', 'supper', 'night meal', 'restaurant dinner'],
        'Lunch': ['lunch', 'afternoon meal', 'restaurant lunch'],
        'Breakfast': ['breakfast', 'morning meal', 'brunch'],
        'Clothing': ['clothes', 'clothing', 'shirt', 'pant', 'shoes', 'dress', 'fashion', 'wear'],
        'Movies': ['movie', 'cinema', 'film', 'theatre', 'pvr', 'inox', 'netflix', 'prime', 'hotstar'],
        'Sports': ['sport', 'sports', 'cricket', 'football', 'badminton', 'equipment'],
        'Medicine': ['medicine', 'medical', 'pharmacy', 'drug', 'tablet', 'doctor', 'hospital', 'health'],
        'Eggs': ['egg', 'eggs', 'dozen eggs'],
        'HouseHold Things': ['household', 'home', 'utensil', 'bucket', 'furniture', 'appliance'],
        'Split': ['split', 'shared', 'divided'],
        'Cash ATM': ['atm', 'cash', 'withdraw', 'withdrawal'],
        'Invest': ['invest', 'investment', 'stock', 'mutual fund', 'sip', 'savings']
      };

      // Check each category pattern
      for (const [category, keywords] of Object.entries(categoryPatterns)) {
        for (const keyword of keywords) {
          if (desc.includes(keyword)) {
            return category;
          }
        }
      }

      // Default to current category if no match
      return form.category;
    };

    // Handle description change with auto-detection
    const handleDescriptionChange = (description) => {
      const detectedCategory = detectCategory(description);
      setForm(prev => ({
        ...prev,
        desc: description,
        category: detectedCategory
      }));
    };

    const handleEdit = (transaction) => {
      setEditingId(transaction.id);
      setForm({
        date: transaction.date,
        desc: transaction.desc,
        amount: Math.abs(transaction.amount).toString(),
        category: transaction.category,
        paidBy: transaction.paidBy,
        splitAmong: transaction.splitAmong,
        splitType: transaction.splitType || 'equal',
        customSplits: transaction.customSplits || {},
        transactionType: transaction.amount > 0 ? 'income' : 'expense'
      });
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
      setEditingId(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        desc: '',
        amount: '',
        category: categories[0] || 'General',
        paidBy: 'Me',
        splitAmong: ['Me'],
        splitType: 'equal',
        customSplits: {},
        transactionType: 'expense'
      });
    };

    const handleSubmit = async () => {
      if (!form.desc || !form.amount) return;
      try {
        // Convert amount based on transaction type
        const amountValue = Number.parseFloat(form.amount);
        const finalAmount = form.transactionType === 'income' ? Math.abs(amountValue) : -Math.abs(amountValue);
        
        const transactionData = {
          date: form.date,
          desc: form.desc,
          amount: finalAmount,
          category: form.category,
          paidBy: form.paidBy,
          splitAmong: form.splitAmong,
          splitType: form.splitType,
          customSplits: form.splitType === 'custom' ? form.customSplits : null
        };

        if (editingId) {
          // Update existing transaction
          await transactionsAPI.delete(editingId);
          const updatedTrans = await transactionsAPI.create(transactionData);
          setTransactions(transactions.map(t => t.id === editingId ? updatedTrans : t));
          setEditingId(null);
        } else {
          // Create new transaction
          const newTrans = await transactionsAPI.create(transactionData);
          setTransactions([...transactions, newTrans]);
        }
        
        setForm({ 
          date: new Date().toISOString().split('T')[0],
          desc: '', 
          amount: '', 
          category: categories[0] || 'General',
          paidBy: 'Me',
          splitAmong: ['Me'],
          splitType: 'equal',
          customSplits: {},
          transactionType: 'expense'
        });
      } catch (error) {
        console.error('Failed to save transaction:', error);
        alert('Failed to save transaction. Please try again.');
      }
    };

    const toggleSplit = (person) => {
      if (form.splitAmong.includes(person)) {
        if (form.splitAmong.length > 1) {
          const newSplitAmong = form.splitAmong.filter(x => x !== person);
          const newCustomSplits = { ...form.customSplits };
          delete newCustomSplits[person];
          setForm(p => ({ ...p, splitAmong: newSplitAmong, customSplits: newCustomSplits }));
        }
      } else {
        setForm(p => ({ ...p, splitAmong: [...p.splitAmong, person] }));
      }
    };

    const handleCustomSplitChange = (person, value) => {
      setForm(p => ({
        ...p,
        customSplits: { ...p.customSplits, [person]: Number.parseFloat(value) || 0 }
      }));
    };

    const handleAddEgg = () => {
      if (!eggForm.eggsEaten || !eggForm.pricePerEgg) return;
      const totalPrice = Number.parseFloat(eggForm.eggsEaten) * Number.parseFloat(eggForm.pricePerEgg);
      const newEgg = {
        id: Date.now(),
        dateBought: eggForm.dateBought,
        boughtBy: eggForm.boughtBy,
        eggsEaten: Number.parseFloat(eggForm.eggsEaten),
        pricePerEgg: Number.parseFloat(eggForm.pricePerEgg),
        totalPrice: totalPrice
      };
      setEggRecords([...eggRecords, newEgg]);
      setEggForm({ ...eggForm, eggsEaten: '', pricePerEgg: '' });
    };

    const handleAddCategory = () => {
      if (!newCategory || categories.includes(newCategory)) return;
      setCategories([...categories, newCategory]);
      setNewCategory('');
    };

    const handleRemoveCategory = (cat) => {
      if (categories.length <= 1) return;
      setCategories(categories.filter(c => c !== cat));
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Top Buttons */}
        <div className="flex gap-2">
          <Button onClick={() => setShowEggTracker(!showEggTracker)} variant="secondary">
            {showEggTracker ? 'Hide' : 'Show'} Egg Tracker 🥚
          </Button>
          <Button onClick={() => setShowCategoryManager(!showCategoryManager)} variant="secondary">
            Manage Categories
          </Button>
        </div>

        {/* Category Manager */}
        {showCategoryManager && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Manage Categories</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-1 p-2 border border-slate-300 rounded-lg"
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full">
                  <span className="text-sm">{cat}</span>
                  <button onClick={() => handleRemoveCategory(cat)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Egg Tracker */}
        {showEggTracker && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">🥚 Egg Tracker</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              <input
                type="date"
                value={eggForm.dateBought}
                onChange={e => setEggForm({...eggForm, dateBought: e.target.value})}
                className="p-2 border border-slate-300 rounded-lg"
              />
              <select
                value={eggForm.boughtBy}
                onChange={e => setEggForm({...eggForm, boughtBy: e.target.value})}
                className="p-2 border border-slate-300 rounded-lg"
              >
                {['Me', ...friends].map(p => <option key={p}>{p}</option>)}
              </select>
              <input
                type="number"
                value={eggForm.eggsEaten}
                onChange={e => setEggForm({...eggForm, eggsEaten: e.target.value})}
                placeholder="Eggs eaten"
                className="p-2 border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                value={eggForm.pricePerEgg}
                onChange={e => setEggForm({...eggForm, pricePerEgg: e.target.value})}
                placeholder="Price per egg"
                className="p-2 border border-slate-300 rounded-lg"
              />
              <Button onClick={handleAddEgg} className="w-full">Add</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Bought By</th>
                    <th className="p-2 text-right">Eggs Eaten</th>
                    <th className="p-2 text-right">Price/Egg</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {eggRecords.map(egg => (
                    <tr key={egg.id} className="border-t">
                      <td className="p-2">{egg.dateBought}</td>
                      <td className="p-2">{egg.boughtBy}</td>
                      <td className="p-2 text-right">{egg.eggsEaten}</td>
                      <td className="p-2 text-right">₹{egg.pricePerEgg.toFixed(2)}</td>
                      <td className="p-2 text-right font-bold">₹{egg.totalPrice.toFixed(2)}</td>
                      <td className="p-2">
                        <button
                          onClick={() => setEggRecords(eggRecords.filter(e => e.id !== egg.id))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {eggRecords.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-slate-400">No egg records yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="text-indigo-600" size={20}/> 
              {editingId ? 'Edit Transaction' : 'New Transaction'}
            </h3>
            
            {editingId && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <span className="text-sm text-amber-800">Editing transaction...</span>
                <button onClick={handleCancelEdit} className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                  Cancel
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Details</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <input 
                  type="text" 
                  placeholder="Description (e.g. Groceries from DMart)" 
                  value={form.desc} 
                  onChange={e => handleDescriptionChange(e.target.value)} 
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-2" 
                />
                
                {/* Amount with Income/Expense Toggle */}
                <div className="flex gap-2 mb-2">
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setForm({...form, transactionType: 'expense'})}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${form.transactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-600'}`}
                    >
                      - Expense
                    </button>
                    <button
                      onClick={() => setForm({...form, transactionType: 'income'})}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${form.transactionType === 'income' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-600'}`}
                    >
                      + Income
                    </button>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-400">₹</span>
                    <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full pl-7 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-medium" />
                  </div>
                </div>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Paid By</label>
                 <div className="flex flex-wrap gap-2">
                    {['Me', ...friends].map(p => (
                      <button key={p} onClick={() => setForm({...form, paidBy: p})} className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.paidBy === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                        {p}
                      </button>
                    ))}
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Split Type</label>
                 <div className="flex gap-2 mb-2">
                   <button
                     onClick={() => setForm({...form, splitType: 'equal', customSplits: {}})}
                     className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${form.splitType === 'equal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                   >
                     Equal Split
                   </button>
                   <button
                     onClick={() => setForm({...form, splitType: 'custom'})}
                     className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${form.splitType === 'custom' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                   >
                     Custom Split
                   </button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {['Me', ...friends].map(p => (
                      <button key={p} onClick={() => toggleSplit(p)} className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.splitAmong.includes(p) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300'}`}>
                        {p}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Custom Split Amounts */}
              {form.splitType === 'custom' && form.splitAmong.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Custom Amounts</label>
                  <div className="space-y-2">
                    {form.splitAmong.map(person => (
                      <div key={person} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600 w-20">{person}:</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={form.customSplits[person] || ''}
                          onChange={e => handleCustomSplitChange(person, e.target.value)}
                          className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    ))}
                    <div className="text-xs text-slate-500 mt-2">
                      Total: ₹{Object.values(form.customSplits).reduce((sum, val) => sum + (val || 0), 0).toFixed(2)} 
                      {form.amount && ` / ₹${form.amount}`}
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleSubmit} className="w-full justify-center mt-4">
                {editingId ? 'Update Transaction' : 'Add Transaction'}
              </Button>
            </div>
          </Card>
        </div>

        {/* List View */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Split</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map(t => {
                      const isIncome = t.amount > 0;
                      return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 text-slate-500 whitespace-nowrap">{t.date}</td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800 flex items-center gap-2">
                            {t.desc}
                            {isIncome && <Badge color="green">Income</Badge>}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Badge color="slate">{t.category}</Badge>
                            <span>by {t.paidBy}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-xs max-w-[120px] truncate" title={t.splitAmong.join(', ')}>
                           {t.splitAmong.length === (friends.length + 1) ? <Badge color="green">Everyone</Badge> : t.splitAmong.join(', ')}
                        </td>
                        <td className={`p-4 text-right font-mono font-medium ${isIncome ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {isIncome ? '+' : ''}₹{Math.abs(t.amount)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(t)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1 hover:bg-indigo-50 rounded"
                              title="Edit transaction"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  await transactionsAPI.delete(t.id);
                                  setTransactions(transactions.filter(x => x.id !== t.id));
                                } catch (error) {
                                  console.error('Failed to delete transaction:', error);
                                  alert('Failed to delete transaction. Please try again.');
                                }
                              }} 
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                              title="Delete transaction"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                    {transactions.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">No transactions recorded.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>
      </div>
      </div>
    );
  };

  const SalaryManager = () => {
    const [salaryForm, setSalaryForm] = useState({
      amount: salary.amount || '',
      receivedDate: salary.receivedDate || new Date().toISOString().split('T')[0],
      previousBalance: salary.previousBalance || 0
    });
    const [carryForward, setCarryForward] = useState(false);

    const handleUpdateSalary = async () => {
      if (!salaryForm.amount) return;
      try {
        const newPreviousBalance = carryForward ? summary.netBalance : salaryForm.previousBalance;
        
        const updatedSalary = await salaryAPI.update(
          Number.parseFloat(salaryForm.amount),
          salaryForm.receivedDate,
          newPreviousBalance
        );
        setSalary(updatedSalary);
        setCarryForward(false);
        alert(`Salary updated successfully!${carryForward ? '\n\nPrevious balance of ₹' + summary.netBalance.toFixed(2) + ' carried forward.' : ''}`);
      } catch (error) {
        console.error('Failed to update salary:', error);
        alert('Failed to update salary. Please try again.');
      }
    };

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
        <Card className="p-8">
           <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Salary Management</h2>
              <p className="text-slate-500 text-sm mt-1">Track your monthly income to calculate your balance</p>
           </div>

           <div className="space-y-6">
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Salary</label>
               <div className="relative">
                 <span className="absolute left-4 top-4 text-slate-400 text-lg">₹</span>
                 <input
                   type="number"
                   value={salaryForm.amount}
                   onChange={e => setSalaryForm({...salaryForm, amount: e.target.value})}
                   placeholder="Enter your salary amount"
                   className="w-full pl-10 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm text-lg font-mono"
                 />
               </div>
             </div>

             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Received Date</label>
               <input
                 type="date"
                 value={salaryForm.receivedDate}
                 onChange={e => setSalaryForm({...salaryForm, receivedDate: e.target.value})}
                 className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
               />
             </div>

             {/* Carryforward Option */}
             {summary.netBalance > 0 && (
               <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                 <label className="flex items-start gap-3 cursor-pointer">
                   <input
                     type="checkbox"
                     checked={carryForward}
                     onChange={e => setCarryForward(e.target.checked)}
                     className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                   />
                   <div className="flex-1">
                     <p className="font-semibold text-indigo-900">Carry forward current balance</p>
                     <p className="text-sm text-indigo-700 mt-1">
                       Add your current balance of <span className="font-bold">₹{summary.netBalance.toFixed(2)}</span> to next month's starting balance.
                       {carryForward && (
                         <span className="block mt-2 text-indigo-800">
                           ✓ New starting balance: ₹{(summary.netBalance + Number.parseFloat(salaryForm.amount || 0)).toFixed(2)}
                         </span>
                       )}
                     </p>
                   </div>
                 </label>
               </div>
             )}

             <Button onClick={handleUpdateSalary} className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200">
               {carryForward ? 'Update & Carry Forward' : 'Update Salary'}
             </Button>
           </div>

           {salary.amount > 0 && (
             <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
               <h3 className="text-sm font-semibold text-slate-700 mb-4">Financial Summary</h3>
               <div className="space-y-3">
                 {summary.previousBalance > 0 && (
                   <div className="flex justify-between items-center">
                     <span className="text-slate-600">Previous Balance</span>
                     <span className="font-bold text-indigo-600">₹{summary.previousBalance.toFixed(2)}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center">
                   <span className="text-slate-600">Current Salary</span>
                   <span className="font-bold text-emerald-600">₹{salary.amount.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-slate-600">Total Expenses</span>
                   <span className="font-bold text-red-600">-₹{summary.totalSpentByMe.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-slate-600">Additional Income</span>
                   <span className="font-bold text-emerald-600">+₹{summary.totalIncome.toFixed(2)}</span>
                 </div>
                 <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                   <span className="text-slate-800 font-semibold">Net Balance</span>
                   <span className={`font-bold text-xl ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                     ₹{summary.netBalance.toFixed(2)}
                   </span>
                 </div>
               </div>
             </div>
           )}
        </Card>
      </div>
    );
  };

  const FriendsManager = () => {
    const [name, setName] = useState('');
    
    const handleAddFriend = async () => {
      if (!name || friends.includes(name)) return;
      try {
        await friendsAPI.create(name);
        setFriends([...friends, name]);
        setName('');
      } catch (error) {
        console.error('Failed to add friend:', error);
        alert(error.message || 'Failed to add friend. Please try again.');
      }
    };

    const handleDeleteFriend = async (friendName) => {
      try {
        await friendsAPI.delete(friendName);
        setFriends(friends.filter(x => x !== friendName));
      } catch (error) {
        console.error('Failed to delete friend:', error);
        alert('Failed to delete friend. Please try again.');
      }
    };

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
        <Card className="p-8">
           <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Manage Squad</h2>
              <p className="text-slate-500 text-sm mt-1">Add your bachelor pad roommates or friends you split bills with.</p>
           </div>

           <div className="flex gap-3 mb-8">
             <input 
               type="text" 
               value={name}
               onChange={e => setName(e.target.value)}
               placeholder="Enter friend's name"
               className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
               onKeyDown={e => {
                 if (e.key === 'Enter' && name) {
                   handleAddFriend();
                 }
               }}
             />
             <Button onClick={handleAddFriend}>Add</Button>
           </div>

           <div className="space-y-3">
             {friends.map(f => (
               <div key={f} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:border-indigo-200 transition-all">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm">
                     {f.charAt(0)}
                   </div>
                   <span className="font-medium text-slate-700">{f}</span>
                 </div>
                 <button 
                   onClick={() => handleDeleteFriend(f)}
                   className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-white transition-all"
                 >
                   <Trash2 size={18} />
                 </button>
               </div>
             ))}
             {friends.length === 0 && <p className="text-center text-slate-400 py-4">It's lonely here. Add someone!</p>}
           </div>
        </Card>
      </div>
    );
  };

  const SettlementView = () => {
    const handleMarkSettled = async (friendName, amount) => {
      const isOwed = amount >= 0;
      const absAmount = Math.abs(amount);
      
      if (!confirm(`Mark ₹${absAmount.toFixed(2)} ${isOwed ? 'received from' : 'paid to'} ${friendName} as settled?`)) {
        return;
      }

      try {
        // Create a settlement transaction
        const settlementTransaction = {
          date: new Date().toISOString().split('T')[0],
          desc: `Settlement with ${friendName}`,
          amount: isOwed ? absAmount : -absAmount, // Positive if they paid you, negative if you paid them
          category: 'Settle',
          paidBy: isOwed ? friendName : 'Me',
          splitAmong: ['Me'],
          splitType: 'equal'
        };

        const newTrans = await transactionsAPI.create(settlementTransaction);
        setTransactions([...transactions, newTrans]);
        
        alert(`✅ Settlement recorded!\n₹${absAmount.toFixed(2)} ${isOwed ? 'received from' : 'paid to'} ${friendName}`);
      } catch (error) {
        console.error('Failed to record settlement:', error);
        alert('Failed to record settlement. Please try again.');
      }
    };

    return (
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="p-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Final Settlements</h2>
            <p className="text-slate-500">Click "Mark Settled" after receiving/paying money to update your balance</p>
          </div>

          <div className="grid gap-4">
            {Object.entries(summary.balances).map(([person, amount]) => {
              const isOwed = amount >= 0;
              const val = Math.abs(amount);
              if (val < 1) return null; // Skip settled

              return (
                <div key={person} className="flex items-center justify-between p-5 bg-white border border-slate-100 shadow-sm rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isOwed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {person.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{person}</h4>
                      <p className={`text-sm font-medium ${isOwed ? 'text-green-600' : 'text-red-500'}`}>
                        {isOwed ? 'Owes you' : 'You owe'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block text-2xl font-bold ${isOwed ? 'text-green-600' : 'text-red-500'}`}>
                      ₹{val.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => handleMarkSettled(person, amount)}
                      className="text-xs text-indigo-600 hover:underline mt-1 font-medium"
                    >
                      Mark Settled
                    </button>
                  </div>
                </div>
              );
            })}
            {Object.values(summary.balances).every(v => Math.abs(v) < 1) && (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">All Settled Up!</h3>
                <p className="text-slate-500">No debts found between you and your friends.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const MonthlyStatements = () => {
    console.log('MonthlyStatements rendering, statements count:', monthlyStatements.length);
    return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-4 md:p-8">
         <div className="text-center mb-8">
            <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Monthly Statements</h2>
            <p className="text-slate-500">Track your financial progress month by month</p>
         </div>

         {monthlyStatements.length > 0 ? (
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead className="bg-slate-50 text-slate-600 font-semibold">
                 <tr>
                   <th className="p-3 md:p-4 text-left rounded-tl-lg">Month</th>
                   <th className="p-3 md:p-4 text-right">Starting</th>
                   <th className="p-3 md:p-4 text-right">Salary</th>
                   <th className="p-3 md:p-4 text-right">Income</th>
                   <th className="p-3 md:p-4 text-right">Expenses</th>
                   <th className="p-3 md:p-4 text-right">Ending</th>
                   <th className="p-3 md:p-4 text-right rounded-tr-lg">Savings</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {monthlyStatements.map((statement, index) => (
                   <tr key={statement.month} className="hover:bg-slate-50 transition-colors">
                     <td className="p-3 md:p-4 font-medium text-slate-800">
                       {statement.monthName}
                     </td>
                     <td className="p-3 md:p-4 text-right font-mono text-slate-600">
                       ₹{statement.startingBalance.toFixed(0)}
                     </td>
                     <td className="p-3 md:p-4 text-right font-mono text-emerald-600 font-semibold">
                       +₹{statement.salary.toFixed(0)}
                     </td>
                     <td className="p-3 md:p-4 text-right font-mono text-emerald-500">
                       {statement.income > 0 ? `+₹${statement.income.toFixed(0)}` : '-'}
                     </td>
                     <td className="p-3 md:p-4 text-right font-mono text-red-600 font-semibold">
                       -₹{statement.expenses.toFixed(0)}
                     </td>
                     <td className="p-3 md:p-4 text-right font-mono font-bold text-slate-800">
                       ₹{statement.endingBalance.toFixed(0)}
                     </td>
                     <td className={`p-3 md:p-4 text-right font-mono font-bold ${statement.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {statement.savings >= 0 ? '+' : ''}₹{statement.savings.toFixed(0)}
                     </td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="bg-indigo-50 font-bold">
                 <tr>
                   <td className="p-3 md:p-4 text-slate-800">Total</td>
                   <td className="p-3 md:p-4 text-right text-slate-600">-</td>
                   <td className="p-3 md:p-4 text-right font-mono text-emerald-600">
                     +₹{monthlyStatements.reduce((sum, s) => sum + s.salary, 0).toFixed(0)}
                   </td>
                   <td className="p-3 md:p-4 text-right font-mono text-emerald-500">
                     +₹{monthlyStatements.reduce((sum, s) => sum + s.income, 0).toFixed(0)}
                   </td>
                   <td className="p-3 md:p-4 text-right font-mono text-red-600">
                     -₹{monthlyStatements.reduce((sum, s) => sum + s.expenses, 0).toFixed(0)}
                   </td>
                   <td className="p-3 md:p-4 text-right font-mono text-indigo-800">
                     ₹{monthlyStatements[monthlyStatements.length - 1]?.endingBalance.toFixed(0) || 0}
                   </td>
                   <td className={`p-3 md:p-4 text-right font-mono ${
                     monthlyStatements.reduce((sum, s) => sum + s.savings, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                   }`}>
                     {monthlyStatements.reduce((sum, s) => sum + s.savings, 0) >= 0 ? '+' : ''}₹{monthlyStatements.reduce((sum, s) => sum + s.savings, 0).toFixed(0)}
                   </td>
                 </tr>
               </tfoot>
             </table>
           </div>
         ) : (
           <div className="text-center py-12">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Calendar size={32} className="text-slate-400" />
             </div>
             <p className="text-slate-400">No monthly data available yet. Add transactions to see your monthly breakdown.</p>
           </div>
         )}

         {/* Summary Cards */}
         {monthlyStatements.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
             <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
               <p className="text-sm text-emerald-700 font-medium mb-1">Total Saved</p>
               <p className="text-2xl font-bold text-emerald-800">
                 ₹{monthlyStatements.reduce((sum, s) => sum + s.savings, 0).toFixed(0)}
               </p>
             </div>
             <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200">
               <p className="text-sm text-indigo-700 font-medium mb-1">Avg Monthly Expense</p>
               <p className="text-2xl font-bold text-indigo-800">
                 ₹{(monthlyStatements.reduce((sum, s) => sum + s.expenses, 0) / monthlyStatements.length).toFixed(0)}
               </p>
             </div>
             <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
               <p className="text-sm text-amber-700 font-medium mb-1">Months Tracked</p>
               <p className="text-2xl font-bold text-amber-800">
                 {monthlyStatements.length}
               </p>
             </div>
           </div>
         )}
      </Card>
    </div>
  );
  };

  // Show auth loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!isAuthenticated) {
    return showRegister ? (
      <Register onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              B
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">BachEx</h1>
              <p className="text-xs text-slate-500">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Desktop Navigation Sidebar */}
        <nav className="hidden md:flex bg-white border-r border-slate-200 w-20 lg:w-72 flex-shrink-0 flex-col z-10">
          {/* Header with Logo and User Info */}
          <div className="border-b border-slate-100">
            {/* Logo Section */}
            <div className="p-4 lg:p-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                B
              </div>
              <div className="hidden lg:block">
                <h1 className="font-bold text-xl text-slate-800 tracking-tight">BachEx</h1>
                <p className="text-xs text-slate-500">Expense Manager</p>
              </div>
            </div>
            
            {/* User Profile Section - Desktop */}
            <div className="hidden lg:block px-4 pb-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg transition-all border border-slate-200 hover:border-red-200 font-medium text-sm shadow-sm"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu - Desktop */}
          <div className="flex-1 p-3 lg:p-4 space-y-2 flex flex-col overflow-y-auto">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'transactions', icon: Table, label: 'Transactions' },
              { id: 'monthly', icon: Calendar, label: 'Monthly' },
              { id: 'salary', icon: Wallet, label: 'Salary' },
              { id: 'friends', icon: Users, label: 'Friends' },
              { id: 'settlements', icon: Calculator, label: 'Settlements' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start lg:gap-3 p-3 lg:px-4 lg:py-3 rounded-xl transition-all duration-200 group relative ${
                  activeTab === item.id 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 font-semibold shadow-sm border border-indigo-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {activeTab === item.id && (
                  <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
                )}
                <item.icon 
                  size={22} 
                  className={`transition-transform duration-200 ${
                    activeTab === item.id ? 'scale-110' : 'group-hover:scale-105'
                  }`} 
                />
                <span className="text-[10px] lg:text-sm mt-1 lg:mt-0 font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 shadow-lg">
          <div className="flex justify-around items-center px-2 py-2 safe-bottom">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
              { id: 'transactions', icon: Table, label: 'Trans' },
              { id: 'monthly', icon: Calendar, label: 'Monthly' },
              { id: 'salary', icon: Wallet, label: 'Salary' },
              { id: 'friends', icon: Users, label: 'Friends' },
              { id: 'settlements', icon: Calculator, label: 'Settle' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                  activeTab === item.id 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-slate-500'
                }`}
              >
                <item.icon 
                  size={22} 
                  className={`transition-transform duration-200 ${
                    activeTab === item.id ? 'scale-110' : ''
                  }`} 
                />
                <span className="text-[10px] font-medium mt-1">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-8">
        {/* Migration Banner */}
        {showMigrationBanner && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6 shadow-lg animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  🎉 Welcome to your new account!
                </h3>
                <p className="text-white/90 text-sm mb-4">
                  We noticed you don't have any data yet. Would you like to migrate your existing production data to this account?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleMigrateData}
                    disabled={migrating}
                    className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {migrating ? 'Migrating...' : '✨ Migrate My Data'}
                  </button>
                  <button
                    onClick={() => setShowMigrationBanner(false)}
                    className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowMigrationBanner(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 capitalize tracking-tight">{activeTab}</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your bachelor expenses efficiently.</p>
          </div>
          <div className="hidden md:block">
            <Badge color="blue">{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Badge>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading your data...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <TransactionManager />}
            {activeTab === 'monthly' && <MonthlyStatements />}
            {activeTab === 'salary' && <SalaryManager />}
            {activeTab === 'friends' && <FriendsManager />}
            {activeTab === 'settlements' && <SettlementView />}
          </>
        )}
      </main>
      </div>
    </div>
  );
}