
import React, { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import "./App.css";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Education",
  "Bills",
  "Health",
  "Entertainment",
  "Salary",
  "Other",
];

const currencies = {
  INR: { symbol: "₹", name: "Indian Rupee" },
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
};

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const localDate = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const formatMoney = (amount, currency) =>
  `${currencies[currency]?.symbol || "₹"}${Number(
    amount || 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatMonth = (month) => {
  if (!month) return "Selected month";

  return new Date(`${month}-15T12:00:00`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = readStorage("pennywise_transactions", []);
    return Array.isArray(saved) ? saved : [];
  });

  const [income, setIncome] = useState(() =>
    readStorage("pennywise_income", "")
  );

  const [currency, setCurrency] = useState(() => {
    const saved = readStorage("pennywise_currency", "INR");
    return currencies[saved] ? saved : "INR";
  });

  const [budget, setBudget] = useState(() =>
    readStorage("pennywise_budget", "")
  );

  const [profileName, setProfileName] = useState(() =>
    readStorage("pennywise_profile_name", "")
  );

  const [profileEmail, setProfileEmail] = useState(() =>
    readStorage("pennywise_profile_email", "")
  );

  const [selectedMonth, setSelectedMonth] = useState(() =>
    localDate().slice(0, 7)
  );

  const [selectedYear, setSelectedYear] = useState(() =>
    String(new Date().getFullYear())
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [transactionMessage, setTransactionMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [form, setForm] = useState(() => ({
    title: "",
    amount: "",
    type: "expense",
    category: "Food",
    date: localDate(),
  }));

  // Save data in localStorage
  useEffect(() => {
    localStorage.setItem(
      "pennywise_transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("pennywise_income", JSON.stringify(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem("pennywise_currency", JSON.stringify(currency));
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("pennywise_budget", JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem(
      "pennywise_profile_name",
      JSON.stringify(profileName)
    );
  }, [profileName]);

  useEffect(() => {
    localStorage.setItem(
      "pennywise_profile_email",
      JSON.stringify(profileEmail)
    );
  }, [profileEmail]);

  // Monthly calculations
  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (item) =>
          typeof item.date === "string" &&
          item.date.startsWith(selectedMonth)
      ),
    [transactions, selectedMonth]
  );

  const totalExpenses = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const extraIncome = monthlyTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalIncome = Number(income || 0) + extraIncome;
  const balance = totalIncome - totalExpenses;

  const budgetAmount = Number(budget || 0);
  const budgetRemaining = budgetAmount - totalExpenses;

  const spentPercentage =
    budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

  // Monthly category breakdown
  const categoryTotals = useMemo(() => {
    const totals = {};

    monthlyTransactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        const category = categories.includes(item.category)
          ? item.category
          : "Other";

        totals[category] =
          (totals[category] || 0) + Number(item.amount || 0);
      });

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [monthlyTransactions]);

  // Transaction search and filter
  const visibleTransactions = useMemo(
    () =>
      monthlyTransactions
        .filter((item) => {
          const title = String(item.title || "").toLowerCase();
          const matchesSearch = title.includes(search.toLowerCase());
          const matchesFilter =
            filter === "all" || item.type === filter;

          return matchesSearch && matchesFilter;
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [monthlyTransactions, search, filter]
  );

  const expenseCount = monthlyTransactions.filter(
    (item) => item.type === "expense"
  ).length;

  // Keep selected year synchronized with selected month.
  const handleMonthChange = (event) => {
    const month = event.target.value;

    if (!month) return;

    setSelectedMonth(month);
    setSelectedYear(month.slice(0, 4));
    setTransactionMessage("");

    setForm((previous) => ({
      ...previous,
      date: `${month}-01`,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setTransactionMessage("");
  };

  // Add a transaction with validation
  const handleSubmit = (event) => {
    event.preventDefault();
    setTransactionMessage("");

    const amount = Number(form.amount);

    if (!form.title.trim()) {
      setTransactionMessage("Please enter a transaction name.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setTransactionMessage("Enter an amount greater than zero.");
      return;
    }

    if (!isValidDate(form.date)) {
      setTransactionMessage("Please select a valid calendar date.");
      return;
    }

    if (!["income", "expense"].includes(form.type)) {
      setTransactionMessage("Please select a valid transaction type.");
      return;
    }

    const transactionMonth = form.date.slice(0, 7);
    const transactionYear = form.date.slice(0, 4);

    const newTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: form.title.trim(),
      amount,
      type: form.type,
      category: form.category,
      date: form.date,
    };

    setTransactions((previous) => [newTransaction, ...previous]);

    // Keep monthly and yearly reports in sync.
    setSelectedMonth(transactionMonth);
    setSelectedYear(transactionYear);

    setForm({
      title: "",
      amount: "",
      type: "expense",
      category: "Food",
      date: `${transactionMonth}-01`,
    });

    setTransactionMessage("Transaction added successfully.");
  };

  const deleteTransaction = (id) => {
    setTransactions((previous) =>
      previous.filter((item) => item.id !== id)
    );

    setTransactionMessage("Transaction deleted successfully.");
  };

  // Profile validation
  const saveProfile = (event) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (!profileName.trim()) {
      setProfileError("Please enter your name.");
      return;
    }

    if (
      profileEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim())
    ) {
      setProfileError("Please enter a valid email address.");
      return;
    }

    const cleanName = profileName.trim();
    const cleanEmail = profileEmail.trim();

    setProfileName(cleanName);
    setProfileEmail(cleanEmail);

    localStorage.setItem(
      "pennywise_profile_name",
      JSON.stringify(cleanName)
    );

    localStorage.setItem(
      "pennywise_profile_email",
      JSON.stringify(cleanEmail)
    );

    setProfileMessage("Profile saved successfully.");
  };

  // =====================================
  // YEARLY EXPENSE REPORT
  // =====================================

  const yearlyTransactions = useMemo(
    () =>
      transactions.filter(
        (item) =>
          typeof item.date === "string" &&
          item.date.startsWith(`${selectedYear}-`)
      ),
    [transactions, selectedYear]
  );

  const yearlyExpenses = yearlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const yearlyExtraIncome = yearlyTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Projected, not historical actual, income.
  const yearlyIncome = Number(income || 0) * 12 + yearlyExtraIncome;
  const yearlyBalance = yearlyIncome - yearlyExpenses;

  const yearlyMonthlyData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;

        const expenses = yearlyTransactions
          .filter(
            (item) =>
              item.date.startsWith(month) && item.type === "expense"
          )
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        return {
          month,
          label: new Date(`${month}-15T12:00:00`).toLocaleDateString(
            "en-IN",
            { month: "short" }
          ),
          expenses,
        };
      }),
    [yearlyTransactions, selectedYear]
  );

  const highestSpendingMonth = yearlyMonthlyData.reduce(
    (highest, item) =>
      item.expenses > highest.expenses ? item : highest,
    yearlyMonthlyData[0]
  );

  const yearlyCategoryTotals = useMemo(() => {
    const totals = {};

    yearlyTransactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        const category = categories.includes(item.category)
          ? item.category
          : "Other";

        totals[category] =
          (totals[category] || 0) + Number(item.amount || 0);
      });

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [yearlyTransactions]);

  const availableYears = Array.from(
    new Set([
      String(new Date().getFullYear()),
      ...transactions
        .filter((item) => typeof item.date === "string")
        .map((item) => item.date.slice(0, 4)),
    ])
  ).sort((a, b) => Number(b) - Number(a));

  const monthLabel = formatMonth(selectedMonth);
  const currencySymbol = currencies[currency].symbol;

  return (
    <div className="app-shell">
      <Header profileName={profileName} />

      <main className="dashboard">
        {/* Monthly overview */}
        <section className="welcome-row" id="overview">
          <div>
            <p className="eyebrow">YOUR MONEY, YOUR CONTROL</p>
            <h2>{monthLabel} money report</h2>
            <p className="muted">Your spending, in one place.</p>
          </div>

          <div className="report-controls">
            <label className="currency-picker">
              <span>Report month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
              />
            </label>

            <label className="currency-picker">
              <span>Display currency (no conversion)</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {Object.entries(currencies).map(([code, item]) => (
                  <option key={code} value={code}>
                    {code} — {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <p className="panel-footnote">
          Changing the display currency changes the symbol only. Amounts are
          not converted between currencies.
        </p>

        {/* Summary cards */}
        <section className="summary-grid">
          <article className="balance-card">
            <div className="card-heading">
              <span>Available balance</span>
              <span className="round-icon">↗</span>
            </div>

            <h3>{formatMoney(balance, currency)}</h3>

            <p>
              {balance < 0
                ? "Expenses are above your recorded income."
                : "Your remaining money for this month."}
            </p>

            <div className="balance-bottom">
              <span>Income − Expenses</span>
              <span>{monthlyTransactions.length} transactions</span>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon income-icon">↓</div>
            <p>Total income</p>
            <h3 className="income-text">
              {formatMoney(totalIncome, currency)}
            </h3>
            <span className="summary-note">
              Regular income + extra income
            </span>
          </article>

          <article className="summary-card">
            <div className="summary-icon expense-icon">↑</div>
            <p>Total expenses</p>
            <h3 className="expense-text">
              {formatMoney(totalExpenses, currency)}
            </h3>
            <span className="summary-note">
              {expenseCount} expenses this month
            </span>
          </article>
        </section>

        {/* Income and budget */}
        <section className="content-grid">
          <article className="panel income-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">PLAN YOUR MONTH</p>
                <h3>Income &amp; budget</h3>
              </div>
              <span className="heading-icon">{currencySymbol}</span>
            </div>

            <label htmlFor="monthly-income">
              Regular monthly income
            </label>

            <div className="income-input-wrap">
              <span>{currencySymbol}</span>
              <input
                id="monthly-income"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 25000"
                value={income}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "" || Number(value) >= 0) {
                    setIncome(value);
                  }
                }}
              />
            </div>

            <label className="budget-label" htmlFor="monthly-budget">
              Monthly spending limit
            </label>

            <div className="income-input-wrap">
              <span>{currencySymbol}</span>
              <input
                id="monthly-budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 10000"
                value={budget}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "" || Number(value) >= 0) {
                    setBudget(value);
                  }
                }}
              />
            </div>

            <div className="spending-heading">
              <span>Monthly budget used</span>
              <strong>
                {budgetAmount > 0
                  ? `${spentPercentage.toFixed(0)}%`
                  : "—"}
              </strong>
            </div>

            <div
              className="progress-track"
              role="progressbar"
              aria-label="Monthly budget used"
              aria-valuenow={Math.round(Math.min(spentPercentage, 100))}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                className={`progress-fill ${
                  budgetAmount > 0 && totalExpenses > budgetAmount
                    ? "progress-over"
                    : ""
                }`}
                style={{
                  width: `${Math.min(spentPercentage, 100)}%`,
                }}
              />
            </div>

            {budgetAmount > 0 ? (
              <p
                className={`budget-status ${
                  budgetRemaining < 0 ? "budget-warning" : ""
                }`}
              >
                {budgetRemaining < 0
                  ? `Over budget by ${formatMoney(
                      Math.abs(budgetRemaining),
                      currency
                    )}`
                  : `${formatMoney(
                      budgetRemaining,
                      currency
                    )} remaining in your budget`}
              </p>
            ) : (
              <p className="panel-footnote">
                Set a spending limit to track your budget.
              </p>
            )}
          </article>

          {/* Add transaction */}
          <article className="panel form-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">KEEP IT UPDATED</p>
                <h3>Add a transaction</h3>
              </div>
              <span className="heading-icon">＋</span>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="transaction-title">
                Transaction name
              </label>

              <input
                id="transaction-title"
                name="title"
                type="text"
                placeholder="e.g. Lunch with friends"
                maxLength="60"
                value={form.title}
                onChange={handleChange}
              />

              <div className="form-two-columns">
                <div>
                  <label htmlFor="transaction-amount">Amount</label>
                  <input
                    id="transaction-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="transaction-type">Type</label>
                  <select
                    id="transaction-type"
                    name="type"
                    value={form.type}
                    onChange={(event) => {
                      const type = event.target.value;

                      setForm((previous) => ({
                        ...previous,
                        type,
                        category: type === "income" ? "Salary" : "Food",
                      }));

                      setTransactionMessage("");
                    }}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="form-two-columns">
                <div>
                  <label htmlFor="transaction-category">Category</label>
                  <select
                    id="transaction-category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="transaction-date">Date</label>
                  <input
                    id="transaction-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {transactionMessage && (
                <p
                  className="form-message"
                  role="status"
                  aria-live="polite"
                >
                  {transactionMessage}
                </p>
              )}

              <button className="primary-button" type="submit">
                + Add transaction
              </button>
            </form>
          </article>
        </section>

        {/* Monthly category breakdown */}
        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">WHERE YOUR MONEY GOES</p>
              <h3>Spending by category</h3>
            </div>
          </div>

          {categoryTotals.length === 0 ? (
            <p className="muted">
              Add expenses to see your category breakdown.
            </p>
          ) : (
            <div className="category-list">
              {categoryTotals.map(([category, amount], index) => {
                const percentage =
                  totalExpenses > 0
                    ? (amount / totalExpenses) * 100
                    : 0;

                return (
                  <div className="category-item" key={category}>
                    <div className="category-item-heading">
                      <span>
                        <span
                          className={`category-dot category-color-${
                            index % 5
                          }`}
                        />
                        {category}
                      </span>
                      <strong>{formatMoney(amount, currency)}</strong>
                    </div>

                    <div
                      className="progress-track category-track"
                      role="progressbar"
                      aria-label={`${category} spending`}
                      aria-valuenow={Math.round(percentage)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <div
                        className={`progress-fill category-fill-${
                          index % 5
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p>{percentage.toFixed(1)}% of monthly expenses</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Yearly report */}
        <section className="panel yearly-report-panel" id="yearly-report">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">A BIGGER PICTURE</p>
              <h3>Yearly expense report</h3>
              <p className="muted">
                Review your spending throughout the year.
              </p>
            </div>

            <label className="currency-picker">
              <span>Report year</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="summary-grid">
            <article className="summary-card">
              <div className="summary-icon income-icon">↓</div>
              <p>Projected yearly income</p>
              <h3 className="income-text">
                {formatMoney(yearlyIncome, currency)}
              </h3>
              <span className="summary-note">
                Current monthly income × 12 + recorded extra income
              </span>
            </article>

            <article className="summary-card">
              <div className="summary-icon expense-icon">↑</div>
              <p>Total yearly expenses</p>
              <h3 className="expense-text">
                {formatMoney(yearlyExpenses, currency)}
              </h3>
              <span className="summary-note">
                Recorded expenses in {selectedYear}
              </span>
            </article>

            <article className="summary-card">
              <div className="summary-icon">{currencySymbol}</div>
              <p>Projected yearly balance</p>
              <h3
                className={
                  yearlyBalance < 0 ? "expense-text" : "income-text"
                }
              >
                {formatMoney(yearlyBalance, currency)}
              </h3>
              <span className="summary-note">
                Projected income − recorded expenses
              </span>
            </article>
          </div>

          <div className="content-grid" style={{ marginTop: "24px" }}>
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">MONTH BY MONTH</p>
                  <h3>Expense comparison</h3>
                </div>
              </div>

              {/* Scrollable wrapper keeps all 12 months on one row */}
              <div
                style={{
                  overflowX: "auto",
                  width: "100%",
                  marginTop: "20px",
                  paddingBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, minmax(55px, 1fr))",
                    gap: "18px 10px",
                    minWidth: "780px",
                  }}
                >
                  {yearlyMonthlyData.map((item) => {
                    const maxExpenses = Math.max(
                      ...yearlyMonthlyData.map((month) => month.expenses),
                      1
                    );

                    return (
                      <button
                        key={item.month}
                        type="button"
                        title={`${item.label}: ${formatMoney(
                          item.expenses,
                          currency
                        )}`}
                        onClick={() => {
                          setSelectedMonth(item.month);
                          setSelectedYear(item.month.slice(0, 4));

                          setForm((previous) => ({
                            ...previous,
                            date: `${item.month}-01`,
                          }));

                          setTransactionMessage("");

                          document
                            .getElementById("overview")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }}
                        style={{
                          border: 0,
                          background: "transparent",
                          cursor: "pointer",
                          color: "inherit",
                          padding: "0 2px",
                          minWidth: 0,
                          fontFamily: "inherit",
                        }}
                      >
                        <div
                          style={{
                            height: "120px",
                            display: "flex",
                            alignItems: "end",
                            justifyContent: "center",
                            borderBottom: "1px solid #e5e9e6",
                          }}
                        >
                          <div
                            style={{
                              width: "26px",
                              maxWidth: "75%",
                              minHeight: "3px",
                              height: `${
                                (item.expenses / maxExpenses) * 100
                              }%`,
                              background: "#2f855a",
                              borderRadius: "5px 5px 0 0",
                            }}
                          />
                        </div>

                        <span
                          style={{ display: "block", marginTop: "7px" }}
                        >
                          {item.label}
                        </span>

                        <span
                          style={{
                            display: "block",
                            fontSize: "11px",
                            marginTop: "4px",
                          }}
                        >
                          {formatMoney(item.expenses, currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="panel-footnote">
                Select a month to view it in your monthly dashboard.
              </p>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">YEARLY HIGHLIGHTS</p>
                  <h3>Spending summary</h3>
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <p className="muted">Highest-spending month</p>
                <h3>
                  {highestSpendingMonth.expenses > 0
                    ? `${highestSpendingMonth.label} ${selectedYear}`
                    : "No expenses recorded"}
                </h3>
                <p className="expense-text">
                  {formatMoney(highestSpendingMonth.expenses, currency)}
                </p>
              </div>

              <div style={{ marginTop: "22px" }}>
                <p className="muted">Average monthly expenses</p>
                <h3>{formatMoney(yearlyExpenses / 12, currency)}</h3>
              </div>

              <div style={{ marginTop: "22px" }}>
                <p className="muted">Transactions recorded</p>
                <h3>{yearlyTransactions.length}</h3>
              </div>
            </article>
          </div>

          <article className="panel" style={{ marginTop: "24px" }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">WHERE YOUR MONEY WENT</p>
                <h3>Yearly category breakdown</h3>
              </div>
            </div>

            {yearlyCategoryTotals.length === 0 ? (
              <p className="muted">
                No expenses recorded for {selectedYear}.
              </p>
            ) : (
              <div className="category-list">
                {yearlyCategoryTotals.map(([category, amount], index) => {
                  const percentage =
                    yearlyExpenses > 0
                      ? (amount / yearlyExpenses) * 100
                      : 0;

                  return (
                    <div className="category-item" key={category}>
                      <div className="category-item-heading">
                        <span>
                          <span
                            className={`category-dot category-color-${
                              index % 5
                            }`}
                          />
                          {category}
                        </span>
                        <strong>{formatMoney(amount, currency)}</strong>
                      </div>

                      <div
                        className="progress-track category-track"
                        role="progressbar"
                        aria-label={`${category} yearly spending`}
                        aria-valuenow={Math.round(percentage)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        <div
                          className={`progress-fill category-fill-${
                            index % 5
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p>{percentage.toFixed(1)}% of yearly expenses</p>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>

        {/* Transaction history */}
        <section className="panel transactions-panel" id="transactions">
          <div className="transactions-heading">
            <div>
              <p className="eyebrow">YOUR MONEY ACTIVITY</p>
              <h3>Transactions</h3>
              <p className="muted">
                {monthLabel} · {visibleTransactions.length} entries shown
              </p>
            </div>
          </div>

          <div className="transaction-tools">
            <input
              type="search"
              aria-label="Search transactions"
              placeholder="Search transactions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              aria-label="Filter transactions"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All transactions</option>
              <option value="income">Income only</option>
              <option value="expense">Expenses only</option>
            </select>
          </div>

          {visibleTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">↗</div>
              <h4>No transactions found</h4>
              <p>
                Add a transaction for {monthLabel}, or change your search.
              </p>
            </div>
          ) : (
            <div className="transaction-list">
              {visibleTransactions.map((item) => (
                <article className="transaction-row" key={item.id}>
                  <div className="transaction-symbol">
                    {item.type === "income" ? "↓" : "↑"}
                  </div>

                  <div className="transaction-details">
                    <strong>{item.title}</strong>
                    <span>
                      {item.category} · {item.date}
                    </span>
                  </div>

                  <div className="transaction-value">
                    <strong
                      className={
                        item.type === "income"
                          ? "income-text"
                          : "expense-text"
                      }
                    >
                      {item.type === "income" ? "+" : "−"}
                      {formatMoney(item.amount, currency)}
                    </strong>
                    <span>
                      {item.type === "income" ? "Income" : "Expense"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="delete-button"
                    aria-label={`Delete ${item.title}`}
                    title="Delete transaction"
                    onClick={() => deleteTransaction(item.id)}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Profile */}
        <section className="panel profile-panel" id="profile">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR ACCOUNT DETAILS</p>
              <h3>My Profile</h3>
              <p className="muted">
                Personalize your PennyWise experience.
              </p>
            </div>

            <div className="large-profile-avatar">
              {profileName.trim().charAt(0).toUpperCase() || "U"}
            </div>
          </div>

          <form className="profile-form" onSubmit={saveProfile}>
            <div>
              <label htmlFor="profile-name">Full name</label>
              <input
                id="profile-name"
                type="text"
                placeholder="Enter your name"
                maxLength="60"
                value={profileName}
                onChange={(event) => {
                  setProfileName(event.target.value);
                  setProfileMessage("");
                  setProfileError("");
                }}
              />
            </div>

            <div>
              <label htmlFor="profile-email">Email address</label>
              <input
                id="profile-email"
                type="email"
                placeholder="Enter your email"
                value={profileEmail}
                onChange={(event) => {
                  setProfileEmail(event.target.value);
                  setProfileMessage("");
                  setProfileError("");
                }}
              />
            </div>

            <div>
              <label htmlFor="profile-currency">
                Preferred display currency
              </label>
              <select
                id="profile-currency"
                value={currency}
                onChange={(event) => {
                  setCurrency(event.target.value);
                  setProfileMessage("");
                }}
              >
                {Object.entries(currencies).map(([code, item]) => (
                  <option key={code} value={code}>
                    {code} — {item.name}
                  </option>
                ))}
              </select>
            </div>

            <button className="primary-button" type="submit">
              Save profile
            </button>

            <p className="profile-privacy">
              Your profile is saved locally in this browser. There is no
              account authentication or server connection.
            </p>

            {profileError && (
              <p className="form-message form-error" role="alert">
                {profileError}
              </p>
            )}

            {profileMessage && (
              <p
                className="form-message form-success"
                role="status"
                aria-live="polite"
              >
                {profileMessage}
              </p>
            )}
          </form>
        </section>

        <footer className="app-footer">
          <span>PennyWise</span>
          <span>Make every rupee count.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
