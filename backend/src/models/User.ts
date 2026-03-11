import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  phoneNumber?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function (this: IUser) {
      return !this.googleId;
    },
    minlength: 6,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
