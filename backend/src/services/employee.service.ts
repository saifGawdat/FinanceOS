import { Employee, IEmployee } from "../models/Employee";
import {
  EmployeeTransaction,
  IEmployeeTransaction,
} from "../models/EmployeeTransaction";
import {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  CreateTransactionDTO,
} from "../dtos/employee.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundError, ValidationError } from "../errors";
import { MonthlySummaryService } from "./monthly-summary.service";

export class EmployeeService {
  private monthlySummaryService = new MonthlySummaryService();

  async create(userId: string, data: CreateEmployeeDTO): Promise<IEmployee> {
    if (data.salary < 0) {
      throw new ValidationError("Salary cannot be negative");
    }

    const employee = new Employee({
      user: userId,
      name: data.name,
      salary: data.salary,
      jobTitle: data.jobTitle,
      phoneNumber: data.phoneNumber,
      dateJoined: data.dateJoined || new Date(),
    });

    await employee.save();
    return employee;
  }

  async getAll(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDTO<IEmployee>> {
    const validatedPage = page < 1 ? 1 : page;
    const validatedLimit = limit < 1 ? 10 : limit > 100 ? 100 : limit;
    const skip = (validatedPage - 1) * validatedLimit;

    const totalItems = await Employee.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalItems / validatedLimit);

    const employees = await Employee.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .select("name salary jobTitle phoneNumber dateJoined isActive")
      .lean();

    return {
      data: employees as IEmployee[],
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalItems,
        itemsPerPage: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      },
    };
  }

  async getActive(userId: string): Promise<IEmployee[]> {
    return await Employee.find({ user: userId, isActive: true }).sort({
      createdAt: -1,
    });
  }

  async getById(userId: string, employeeId: string): Promise<IEmployee> {
    const employee = await Employee.findOne({ _id: employeeId, user: userId });

    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    return employee;
  }

  async update(
    userId: string,
    employeeId: string,
    data: UpdateEmployeeDTO,
  ): Promise<IEmployee> {
    const employee = await Employee.findOne({ _id: employeeId, user: userId });
    
    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    // Only allow explicit reactivation in this update if it's inactive
    if (!employee.isActive && data.isActive !== true) {
      throw new ValidationError("Cannot update inactive employee");
    }

    if (data.name !== undefined) employee.name = data.name;
    if (data.salary !== undefined) {
      if (data.salary < 0) {
        throw new ValidationError("Salary cannot be negative");
      }
      employee.salary = data.salary;
    }
    if (data.jobTitle !== undefined) employee.jobTitle = data.jobTitle;
    if (data.phoneNumber !== undefined) employee.phoneNumber = data.phoneNumber;
    if (data.dateJoined !== undefined) employee.dateJoined = data.dateJoined;
    if (data.isActive !== undefined) employee.isActive = data.isActive;

    await employee.save();
    return employee;
  }

  async delete(userId: string, employeeId: string): Promise<void> {
    const employee = await Employee.findOne({ _id: employeeId, user: userId });

    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    // Soft delete
    employee.isActive = false;
    await employee.save();

    // Trigger recalculation for current month
    const now = new Date();
    await this.monthlySummaryService.calculate(
      userId,
      now.getMonth() + 1,
      now.getFullYear(),
    );
  }

  async addTransaction(
    userId: string,
    data: CreateTransactionDTO,
  ): Promise<IEmployeeTransaction> {
    const employee = await Employee.findOne({
      _id: data.employeeId,
      user: userId,
    });

    if (!employee) {
      throw new NotFoundError("Employee not found");
    }

    if (!employee.isActive) {
      throw new ValidationError("Cannot add adjustments for inactive employee");
    }

    const transaction = new EmployeeTransaction({
      user: userId,
      employee: data.employeeId,
      type: data.type,
      amount: data.amount,
      month: data.month,
      year: data.year,
      description: data.description,
    });

    await transaction.save();
    await this.monthlySummaryService.calculate(userId, data.month, data.year);

    return transaction;
  }

  async getTransactions(
    userId: string,
    month: number,
    year: number,
  ): Promise<IEmployeeTransaction[]> {
    return await EmployeeTransaction.find({
      user: userId,
      month,
      year,
    }).populate("employee", "name");
  }

  async deleteTransaction(
    userId: string,
    transactionId: string,
  ): Promise<void> {
    const transaction = await EmployeeTransaction.findOne({
      _id: transactionId,
      user: userId,
    });

    if (!transaction) {
      throw new NotFoundError("Adjustment not found");
    }

    const { month, year } = transaction;
    await EmployeeTransaction.findByIdAndDelete(transactionId);
    await this.monthlySummaryService.calculate(userId, month, year);
  }
}
