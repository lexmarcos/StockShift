import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export async function sign(
  payload: {},
  secret: string,
  expiration: { expiresIn: number | string | Date }
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);

  return new SignJWT({ payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiration.expiresIn)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(new TextEncoder().encode(secret));
}

export async function verify(token: string, secret: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

  return payload;
}
