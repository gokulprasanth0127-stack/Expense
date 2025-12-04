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
  Calendar
} from 'lucide-react';
import { transactionsAPI, friendsAPI } from './utils/api';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // --- State Management ---
  const [friends, setFriends] = useState([]);
  const [categories] = useState([
    'Rent', 'EMI', 'Wifi', 'Recharge', 'Groceries', 'Snacks', 'Gym', 'Help',
    'Public Transport', 'Fuel', 'Vehicle Maintenance', 'Tea/Coffee', 'Dinner',
    'Lunch', 'Breakfast', 'Clothing', 'Movies', 'Sports', 'Medicine', 'Eggs',
    'HouseHold Things', 'Split', 'Cash ATM', 'Invest', 'Settle'
  ]);
  const [transactions, setTransactions] = useState([]);

  // Load data from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [friendsData, transactionsData] = await Promise.all([
          friendsAPI.getAll(),
          transactionsAPI.getAll()
        ]);
        setFriends(friendsData.length > 0 ? friendsData : ['Rahul', 'Amit', 'Sneha']);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to localStorage if API fails
        const savedFriends = localStorage.getItem('node_friends');
        const savedTransactions = localStorage.getItem('node_transactions');
        if (savedFriends) setFriends(JSON.parse(savedFriends));
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Core Calculation Logic ---
  const summary = useMemo(() => {
    let totalSpentByMe = 0; 
    let totalPaidOut = 0;   
    const balances = {};
    friends.forEach(f => balances[f] = 0);

    transactions.forEach(t => {
      const splitCount = t.splitAmong.length;
      const amountPerPerson = t.amount / splitCount;

      if (t.paidBy === 'Me') totalPaidOut += t.amount;
      if (t.splitAmong.includes('Me')) totalSpentByMe += amountPerPerson;

      // Settlement Logic
      t.splitAmong.forEach(person => {
        if (person === t.paidBy) return; 

        // I paid, person owes me
        if (t.paidBy === 'Me' && person !== 'Me') {
          balances[person] = (balances[person] || 0) + amountPerPerson;
        }
        // Person paid, I owe person
        else if (person === t.paidBy && t.splitAmong.includes('Me')) {
           balances[person] = (balances[person] || 0) - amountPerPerson;
        }
      });
    });

    return { totalSpentByMe, totalPaidOut, balances };
  }, [transactions, friends]);

  const categoryData = useMemo(() => {
    const data = {};
    transactions.forEach(t => {
      if (t.splitAmong.includes('Me')) {
        const myShare = t.amount / t.splitAmong.length;
        data[t.category] = (data[t.category] || 0) + myShare;
      }
    });
    return Object.keys(data).map(key => ({ name: key, value: Math.round(data[key]) }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const timelineData = useMemo(() => {
    const data = {};
    transactions.forEach(t => {
      if (t.splitAmong.includes('Me')) {
        const myShare = t.amount / t.splitAmong.length;
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

  const topCategoriesData = useMemo(() => {
    return categoryData.slice(0, 5);
  }, [categoryData]);

  const chartColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

  // --- Views ---

  const Dashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">My Total Expense</p>
              <h3 className="text-3xl font-bold">₹{summary.totalSpentByMe.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 text-xs text-indigo-100 flex items-center gap-1">
            <CheckCircle size={12} />
            <span>Based on your share of bills</span>
          </div>
        </Card>

        <Card className="p-6">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">Total Cash Paid</p>
              <h3 className="text-3xl font-bold text-slate-800">₹{summary.totalPaidOut.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg">
              <DollarSign size={24} className="text-slate-600" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Actual money that left your wallet</p>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
             <p className="text-slate-500 text-sm font-medium">Net Balances</p>
             <ArrowRightLeft size={20} className="text-slate-400" />
          </div>
          <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar">
            {Object.entries(summary.balances).map(([friend, amount]) => (
              <div key={friend} className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">{friend}</span>
                <span className={`font-bold ${amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {amount >= 0 ? '+' : ''}{Math.round(amount)}
                </span>
              </div>
            ))}
            {Object.keys(summary.balances).length === 0 && <span className="text-slate-400 text-xs">Add friends to track balances</span>}
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Spending by Category */}
        <Card className="p-6 h-96 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No expenses recorded yet
            </div>
          )}
        </Card>

        {/* Line Chart - Spending Trend */}
        <Card className="p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Spending Trend</h3>
            <TrendingUp size={20} className="text-indigo-600" />
          </div>
          {timelineData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`₹${value}`, 'Spent']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
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
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No timeline data yet
            </div>
          )}
        </Card>

        {/* Bar Chart - Top Categories */}
        <Card className="p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Top 5 Categories</h3>
            <Calendar size={20} className="text-emerald-600" />
          </div>
          {topCategoriesData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategoriesData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    width={100}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`₹${value}`, 'Total']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No category data yet
            </div>
          )}
        </Card>

        <Card className="p-6 h-96 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {[...transactions].reverse().slice(0, 10).map(t => (
              <div key={t.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                    {t.category.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{t.desc}</p>
                    <p className="text-xs text-slate-500 flex gap-2">
                       <span>{t.date}</span>
                       <span>•</span>
                       <span>{t.paidBy === 'Me' ? 'You paid' : `${t.paidBy} paid`}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-slate-800">₹{t.amount}</span>
                  <span className="text-xs text-slate-400">
                    {t.splitAmong.includes('Me') ? `My Share: ₹${(t.amount/t.splitAmong.length).toFixed(0)}` : 'Not involved'}
                  </span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Table size={48} className="mb-2 opacity-20" />
                  <p>No transactions found</p>
               </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  const TransactionManager = () => {
    const [form, setForm] = useState({
      date: new Date().toISOString().split('T')[0],
      desc: '',
      amount: '',
      category: categories[0] || 'General',
      paidBy: 'Me',
      splitAmong: ['Me']
    });

    const handleSubmit = async () => {
      if (!form.desc || !form.amount) return;
      try {
        const transactionData = {
          date: form.date,
          desc: form.desc,
          amount: Number.parseFloat(form.amount),
          category: form.category,
          paidBy: form.paidBy,
          splitAmong: form.splitAmong
        };
        const newTrans = await transactionsAPI.create(transactionData);
        setTransactions([...transactions, newTrans]);
        setForm({ ...form, desc: '', amount: '' }); // Keep date/cat/split same for speed
      } catch (error) {
        console.error('Failed to add transaction:', error);
        alert('Failed to add transaction. Please try again.');
      }
    };

    const toggleSplit = (person) => {
      if (form.splitAmong.includes(person)) {
        if (form.splitAmong.length > 1) setForm(p => ({ ...p, splitAmong: p.splitAmong.filter(x => x !== person) }));
      } else {
        setForm(p => ({ ...p, splitAmong: [...p.splitAmong, person] }));
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="text-indigo-600" size={20}/> New Transaction
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Details</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <input type="text" placeholder="Description (e.g. Groceries)" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-2" />
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400">₹</span>
                  <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full pl-7 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-medium" />
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
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Split Amongst</label>
                 <div className="flex flex-wrap gap-2">
                    {['Me', ...friends].map(p => (
                      <button key={p} onClick={() => toggleSplit(p)} className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.splitAmong.includes(p) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300'}`}>
                        {p}
                      </button>
                    ))}
                 </div>
              </div>

              <Button onClick={handleSubmit} className="w-full justify-center mt-4">Add Expense</Button>
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
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 text-slate-500 whitespace-nowrap">{t.date}</td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{t.desc}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Badge color="slate">{t.category}</Badge>
                            <span>by {t.paidBy}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-xs max-w-[120px] truncate" title={t.splitAmong.join(', ')}>
                           {t.splitAmong.length === (friends.length + 1) ? <Badge color="green">Everyone</Badge> : t.splitAmong.join(', ')}
                        </td>
                        <td className="p-4 text-right font-mono font-medium text-slate-700">₹{t.amount}</td>
                        <td className="p-4 text-right">
                          <button onClick={async () => {
                            try {
                              await transactionsAPI.delete(t.id);
                              setTransactions(transactions.filter(x => x.id !== t.id));
                            } catch (error) {
                              console.error('Failed to delete transaction:', error);
                              alert('Failed to delete transaction. Please try again.');
                            }
                          }} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">No transactions recorded.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>
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

  const SettlementView = () => (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8">
         <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Final Settlements</h2>
            <p className="text-slate-500">The net amount everyone owes or is owed.</p>
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
                    <button className="text-xs text-indigo-600 hover:underline mt-1 font-medium">Mark Settled</button>
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Navigation Sidebar */}
      <nav className="bg-white border-r border-slate-200 w-full md:w-20 lg:w-64 flex-shrink-0 flex flex-row md:flex-col justify-between md:justify-start z-10 sticky top-0 h-auto md:h-screen">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-100">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
             B
           </div>
           <span className="hidden lg:block font-bold text-xl text-slate-800 tracking-tight">BachEx</span>
        </div>
        
        <div className="flex-1 p-2 space-y-1 flex flex-row md:flex-col justify-around overflow-x-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'transactions', icon: Table, label: 'Transactions' },
            { id: 'friends', icon: Users, label: 'Friends' },
            { id: 'settlements', icon: Calculator, label: 'Settlements' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col lg:flex-row items-center lg:gap-3 p-3 lg:px-4 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                ? 'bg-indigo-50 text-indigo-600 font-medium' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={22} className={`transition-transform duration-200 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[10px] lg:text-sm mt-1 lg:mt-0 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-80px)] md:h-screen">
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
            {activeTab === 'friends' && <FriendsManager />}
            {activeTab === 'settlements' && <SettlementView />}
          </>
        )}
      </main>
    </div>
  );
}