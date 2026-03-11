import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User, IUser } from "../models/User";
import {
  RegisterDTO,
  LoginDTO,
  GoogleLoginDTO,
  AuthResponseDTO,
} from "../dtos/auth.dto";
import { NotFoundError, UnauthorizedError, ConflictError } from "../errors";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponseDTO> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = new User({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    await user.save();

    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO> {
    const user = await User.findOne({ email: data.email });
    if (!user || !user.password) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  }

  async googleLogin(data: GoogleLoginDTO): Promise<AuthResponseDTO> {
    const ticket = await client.verifyIdToken({
      idToken: data.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedError("Invalid Google token");
    }

    const { name, email, sub: googleId } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = new User({
        name: name!,
        email: email!,
        googleId,
      });
      await user.save();
    }

    const token = this.generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  }

  async getMe(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async updateProfile(
    userId: string,
    data: { phoneNumber?: string; name?: string },
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
    if (data.name !== undefined) user.name = data.name;
    await user.save();
    const updated = await User.findById(userId).select("-password");
    return updated!;
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    console.log(
      `Account deletion requested for user: ${user.email} (ID: ${user._id})`,
    );
    await User.findByIdAndDelete(userId);
    console.log(`Account successfully deleted for user: ${user.email}`);
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  }
}
