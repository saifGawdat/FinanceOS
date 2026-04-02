export const queryKeys = {
  // Expenses Entity
  expenses: {
    all: ["expenses"],
    list: (filters) => ["expenses", "list", filters],
    categories: (month, year) => ["expenses", "categories", month, year],
    uniqueCategories: ["expenses", "uniqueCategories"],
  },
  
  // Income Entity
  income: {
    all: ["income"],
    list: (filters) => ["income", "list", filters],
    categories: (month, year) => ["income", "categories", month, year],
    uniqueCategories: ["income", "uniqueCategories"],
  },

  // Monthly Summaries (Dashboards)
  monthlySummary: {
    all: ["monthlySummary"],
    detail: (month, year) => ["monthlySummary", "detail", month, year],
  },

  // Goals Entity
  goals: {
    all: ["goals"],
    list: (filters) => ["goals", "list", filters],
    detail: (id) => ["goals", "detail", id],
  },
};