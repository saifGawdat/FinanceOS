# Implement TanStack Query Caching - Strict Financial Profile

The goal is to implement React Query to optimize data fetching, reduce prop drilling, and improve dashboard performance. Since this is a financial system, data accuracy must be perfect. Stale cache could cause users to make bad financial decisions based on outdated numbers. 

## User Review Required
> [!IMPORTANT]
> Because of financial exactness requirements, all `useQuery` configurations will run with `staleTime: 0`. This means React Query will immediately mark data as stale and re-fetch it in the background on window focus and component mount. However, we still gain significant performance benefits because React Query will cache the data to show an immediate UI while the background fetch occurs, and will deduplicate simultaneous requests across multiple components.

## Proposed Changes

### Setup & Infrastructure

#### [MODIFY] package.json
Install required packages via `npm install @tanstack/react-query @tanstack/react-query-devtools`

#### [NEW] frontend/src/api/queryKeys.js
Create a central query key factory to prevent invalidation typos entirely.
```javascript
export const queryKeys = {
  expenses: {
    all: ['expenses'],
    list: (filters) => ['expenses', 'list', filters],
    categories: (month, year) => ['expenses', 'categories', month, year],
    uniqueCategories: ['expenses', 'uniqueCategories'],
  },
  income: {
    // ...
  },
  monthlySummary: {
    // ...
  }
}
```

#### [MODIFY] frontend/src/main.jsx
Wrap the root tree in `<QueryClientProvider>` configured with a strict, accuracy-first `QueryClient`:
```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Never trust old data silently
      refetchOnWindowFocus: true, // Immediate fresh data when user tabs back
      retry: 1, // Only retry once before showing error to prevent masking API failures
    },
  },
})
```

#### [NEW] frontend/src/hooks/queries/
Create dedicated hooks wrapping the exact API calls from `frontend/src/api/`. These will contain the `invalidateQueries` logic tied directly to mutations.

- `useExpense.js` (hooks: `useGetExpenses`, `useAddExpense`, `useDeleteExpense`) -> After add or delete, instantly calls `queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })` and potentially `queryKeys.monthlySummary.all`.
- `useIncome.js` (hooks: `useGetIncome`, `useAddIncome`, etc.)
- `useMonthlySummary.js` (hook for Dashboard ProfitSummary)

### Page Refactoring

#### [MODIFY] frontend/src/pages/Dashboard/Expense.jsx
- Remove manual `useState` for `expenses`, `userCategories`, `loading`, `paginationLoading`.
- Remove manual `useEffect` to fetch data.
- Replace with `useGetExpenses({ month, year, page: currentPage, limit: itemsPerPage })`.
- Replace manual POSTs and tracking `isSubmitting` with `addExpenseMutation.mutate()`.

#### [MODIFY] frontend/src/pages/Dashboard/Income.jsx
- Same refactor as Expense.jsx.

#### [MODIFY] frontend/src/pages/Dashboard/ProfitSummary.jsx
- Refactor the dashboard summaries to use the custom query hooks.

## Verification Plan

### Automated Tests
Run standard linting and build checks to ensure the application continues to compile effectively:
- `npm run lint`

### Manual Verification
1. Add a new expense on the **Expense page**.
2. Immediately observe the Expense List update without a full-page loading spinner. 
3. Switch to the **ProfitSummary / Dashboard** to ensure the new expense subtraction is instantly reflected in the numbers via the query invalidation we set up.
4. Verify pagination loading behaves smoothly on Expense list.
5. Use Redux/React Query DevTools (the flower icon in the corner) to examine cache states and prove absolutely no duplicate network spans fire when navigating.
