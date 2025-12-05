# Balance Calculation Explained 💰

## How Your Current Balance Works

### Formula:
```
Current Balance = Salary + Additional Income - Your Share of Expenses
```

### Example Scenario:

**Your Setup:**
- Monthly Salary: ₹30,000
- Friends: Rahul, Amit, Sneha

**Transactions:**

1. **Rent Payment** (Split 4 ways)
   - Total: ₹12,000
   - Paid by: You
   - Split among: You, Rahul, Amit, Sneha
   - Your share: ₹3,000
   - Current Balance: ₹30,000 - ₹3,000 = ₹27,000

2. **Groceries** (Split 2 ways)
   - Total: ₹2,000
   - Paid by: Rahul
   - Split among: You, Rahul
   - Your share: ₹1,000
   - Current Balance: ₹27,000 - ₹1,000 = ₹26,000

3. **Freelance Income** (Income transaction)
   - Amount: +₹5,000
   - Current Balance: ₹26,000 + ₹5,000 = ₹31,000

**Final Current Balance: ₹31,000**

---

## How Friend Balances Work

### Friend Balance Calculation:

**For Rent (You paid ₹12,000, split 4 ways):**
- Each person's share: ₹3,000
- Rahul owes you: +₹3,000
- Amit owes you: +₹3,000
- Sneha owes you: +₹3,000

**For Groceries (Rahul paid ₹2,000, split 2 ways):**
- Each person's share: ₹1,000
- You owe Rahul: -₹1,000

**Net Friend Balances:**
```
Rahul:  +₹3,000 (rent) - ₹1,000 (groceries) = +₹2,000 (Rahul owes you)
Amit:   +₹3,000 (rent)                      = +₹3,000 (Amit owes you)
Sneha:  +₹3,000 (rent)                      = +₹3,000 (Sneha owes you)
```

---

## Dashboard Visualizations

### 1. Current Balance Card (Green)
Shows your actual available money after all expenses

### 2. Friend Balances Card
Quick list:
- Rahul: +₹2,000 owes
- Amit: +₹3,000 owes
- Sneha: +₹3,000 owes

### 3. Friend Balances Chart (Bar Chart)
Visual representation:
```
Rahul  |████████ (Green: ₹2,000)
Amit   |████████████ (Green: ₹3,000)
Sneha  |████████████ (Green: ₹3,000)
```

**Green bars** = They owe you money
**Red bars** = You owe them money

---

## What Reduces Your Current Balance?

✅ **Things that REDUCE your balance:**
- Your share of split expenses
- Expenses where you're included in split
- Personal expenses (only you in split)

❌ **Things that DON'T reduce your balance:**
- Friends' shares of split expenses (they owe you)
- Expenses you're not part of

---

## Settlement Example

If friends pay you back:
```
Before:
- Current Balance: ₹31,000
- Rahul owes: +₹2,000

After Rahul pays you:
- Add income transaction: "Payment from Rahul" +₹2,000
- Current Balance: ₹31,000 + ₹2,000 = ₹33,000
- Rahul owes: ₹0 (settled)
```

---

## Quick Reference

| Metric | What it Shows | Color |
|--------|---------------|-------|
| Current Balance | Money you actually have | 🟢 Green |
| Monthly Salary | Your income | 🔵 Blue |
| Total Expenses | Your share of all expenses | ⚪ Gray |
| Friend +ve balance | They owe you | 🟢 Green |
| Friend -ve balance | You owe them | 🔴 Red |

---

## Tips for Managing Balances

1. **Add salary** at the beginning of each month
2. **Record expenses** as they happen
3. **Use custom splits** for unequal sharing
4. **Mark payments** as income when friends pay you back
5. **Check Friend Balances chart** to see who needs to pay
