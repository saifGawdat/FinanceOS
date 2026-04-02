import axios from "./axios";

export const getGoals = async () => { 
    const response = await axios.get("/goals");
    return response.data;
}

export const getGoalById = async (id) => {
    const response = await axios.get(`/goals/${id}`);
    return response.data;
};

export const createGoal = async (goal) => { 
    const response = await axios.post("/goals", goal);
    return response.data;
}

export const updateGoal = async (id, goal) => { 
    const response = await axios.put(`/goals/${id}`, goal);
    return response.data;
}

export const deleteGoal = async (id) => { 
    const response = await axios.delete(`/goals/${id}`);
    return response.data;
}