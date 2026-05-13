import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: object, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
