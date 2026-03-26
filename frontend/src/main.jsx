import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Strict Configuration for Financial System (Zero Staleness)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always refetch in background for accuracy
      refetchOnWindowFocus: true, // Auto-sync when user returns to tab
      retry: 1, // Only retry once before showing error
    },
  },
});

// Global AI Refresh Bridge:
// The AI assistant dispatches a "refreshData" custom event after mutating data.
// This single listener invalidates ALL React Query caches so every active page
// (Expenses, Income, Dashboard, ProfitSummary) updates instantly.
window.addEventListener("refreshData", () => {
  queryClient.invalidateQueries();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="en">
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
