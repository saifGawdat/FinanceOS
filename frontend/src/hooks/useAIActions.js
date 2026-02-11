import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export const useAIActions = () => {
  const navigate = useNavigate();

  const handleAction = async (action) => {
    console.log("AI Action Triggered:", action);

    if (action.type === "function_call") {
      const { name, args } = action;

      switch (name) {
        case "navigate": {
          const route =
            args.page === "dashboard" ? "/dashboard" : `/${args.page}`;
          navigate(route);
          return `Navigated to ${args.page}`;
        }

        case "add_transaction":
          try {
            const endpoint = args.type === "income" ? "/income" : "/expense";
            const payload = {
              title: args.title,
              amount: Number(args.amount),
              category: args.category,
              date: args.date || new Date().toISOString().split("T")[0],
              description: args.description || "",
            };
            await API.post(endpoint, payload);

            // Wait a small bit for backend summaries to update
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("refreshData"));
            }, 300);

            return `Successfully added ${args.type}: ${args.title} for ${args.amount}`;
          } catch (error) {
            console.error("Error adding transaction via AI:", error);
            return `Failed to add ${args.type}. Error: ${error.message}`;
          }

        default:
          return `Unknown action: ${name}`;
      }
    }

    return null;
  };

  return { handleAction };
};
