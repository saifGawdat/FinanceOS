import { Goal, IGoal } from "../models/Goals";

export class GoalsService {
  async create(userId: string, data: IGoal) {
    const goal = await Goal.create({
      user: userId,
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      targetDate: data.targetDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
      
    if(!goal) throw new Error("Failed to create goal");

    return goal.toObject();
  }

  async getAll(userId: string) {
    return await Goal.find({ user: userId }).lean();
  }

  async getById(userId: string, goalId: string) {
    const goal = await Goal.findOne({ user: userId, _id: goalId });

    if (!goal) throw new Error("Goal not found");

    return goal.toObject();
  }

  async update(userId: string, goalId: string, data: IGoal) {
    const updatedData = {
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      targetDate: data.targetDate,
      updatedAt: new Date(),
    };

    const goal = await Goal.findOneAndUpdate(
      { user: userId, _id: goalId },
      updatedData,
      { new: true },
    );

    if (!goal) throw new Error("Failed to update goal");

    return goal.toObject();
  }

  async delete(userId: string, goalId: string) {
    const deleted = await Goal.findOneAndDelete({
      user: userId,
      _id: goalId,
    });

    if (!deleted) throw new Error("Goal not found");
  }
}