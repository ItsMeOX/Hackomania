import bcrypt from "bcrypt";
import {
  registerUser,
  loginUser,
  verifyToken,
  AuthError,
} from "@/lib/services/auth.service";

const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  passwordHash: "$2b$10$hashedpassword",
  displayName: "Test User",
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate = prisma.user.create as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("registerUser", () => {
  const validInput = {
    email: "new@example.com",
    password: "password123",
    displayName: "New User",
  };

  it("creates a user and returns user data with token", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      ...mockUser,
      email: validInput.email,
      displayName: validInput.displayName,
    });

    const result = await registerUser(validInput);

    expect(result.user.email).toBe(validInput.email);
    expect(result.user.displayName).toBe(validInput.displayName);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");
  });

  it("hashes the password before storing", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue(mockUser);

    await registerUser(validInput);

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.data.passwordHash).not.toBe(validInput.password);
    const isHashed = await bcrypt.compare(
      validInput.password,
      createCall.data.passwordHash
    );
    expect(isHashed).toBe(true);
  });

  it("throws 409 if email already exists", async () => {
    mockFindUnique.mockResolvedValue(mockUser);

    await expect(registerUser(validInput)).rejects.toThrow(AuthError);
    await expect(registerUser(validInput)).rejects.toMatchObject({
      message: "Email already registered",
      statusCode: 409,
    });
  });

  it("defaults displayName to email prefix when not provided", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ ...mockUser, displayName: "new" });

    await registerUser({ email: "new@example.com", password: "password123" });

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.data.displayName).toBe("new");
  });

  it("does not call create if email exists", async () => {
    mockFindUnique.mockResolvedValue(mockUser);

    await expect(registerUser(validInput)).rejects.toThrow();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("loginUser", () => {
  const validInput = { email: "test@example.com", password: "password123" };

  it("returns user data and token for valid credentials", async () => {
    const hashed = await bcrypt.hash(validInput.password, 10);
    mockFindUnique.mockResolvedValue({ ...mockUser, passwordHash: hashed });

    const result = await loginUser(validInput);

    expect(result.user.email).toBe(validInput.email);
    expect(result.user.id).toBe(mockUser.id);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");
  });

  it("throws 401 if user not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(loginUser(validInput)).rejects.toThrow(AuthError);
    await expect(loginUser(validInput)).rejects.toMatchObject({
      message: "Invalid email or password",
      statusCode: 401,
    });
  });

  it("throws 401 if password is wrong", async () => {
    const hashed = await bcrypt.hash("different-password", 10);
    mockFindUnique.mockResolvedValue({ ...mockUser, passwordHash: hashed });

    await expect(loginUser(validInput)).rejects.toThrow(AuthError);
    await expect(loginUser(validInput)).rejects.toMatchObject({
      message: "Invalid email or password",
      statusCode: 401,
    });
  });

  it("does not reveal whether email or password was wrong", async () => {
    mockFindUnique.mockResolvedValue(null);
    try {
      await loginUser(validInput);
    } catch (e) {
      expect((e as AuthError).message).toBe("Invalid email or password");
    }

    const hashed = await bcrypt.hash("wrong", 10);
    mockFindUnique.mockResolvedValue({ ...mockUser, passwordHash: hashed });
    try {
      await loginUser(validInput);
    } catch (e) {
      expect((e as AuthError).message).toBe("Invalid email or password");
    }
  });
});

describe("verifyToken", () => {
  it("returns user payload from a valid token", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue(mockUser);

    const { token } = await registerUser({
      email: "verify@example.com",
      password: "password123",
    });

    const payload = await verifyToken(token);

    expect(payload.id).toBe(mockUser.id);
    expect(payload.email).toBe(mockUser.email);
  });

  it("throws 401 for an invalid token", async () => {
    await expect(verifyToken("invalid.token.here")).rejects.toThrow(AuthError);
    await expect(verifyToken("invalid.token.here")).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("throws 401 for an empty string", async () => {
    await expect(verifyToken("")).rejects.toThrow(AuthError);
  });
});

describe("AuthError", () => {
  it("has correct name, message, and statusCode", () => {
    const error = new AuthError("test message", 418);
    expect(error.name).toBe("AuthError");
    expect(error.message).toBe("test message");
    expect(error.statusCode).toBe(418);
    expect(error).toBeInstanceOf(Error);
  });
});
