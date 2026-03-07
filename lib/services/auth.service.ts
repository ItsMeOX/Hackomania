import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import type { RegisterInput, LoginInput } from "@/lib/validators/auth.validator";

const SALT_ROUNDS = 10;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);
const JWT_ISSUER = "hackomania";
const JWT_EXPIRATION = "7d";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AuthError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName ?? input.email.split("@")[0],
    },
  });

  const token = await generateToken(user);

  return {
    user: { id: user.id, email: user.email, displayName: user.displayName },
    token,
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!user) {
    throw new AuthError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password", 401);
  }

  const token = await generateToken(user);

  return {
    user: { id: user.id, email: user.email, displayName: user.displayName },
    token,
  };
}

export async function verifyToken(token: string): Promise<AuthUser> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
    });
    return payload as unknown as AuthUser;
  } catch {
    throw new AuthError("Invalid or expired token", 401);
  }
}

async function generateToken(user: {
  id: string;
  email: string;
  displayName: string | null;
}): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
