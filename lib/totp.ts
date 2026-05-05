import { generateSecret, generateURI, verifySync } from "otplib";

export function generateTOTPSecret(): string {
  return generateSecret();
}

export function generateTOTPKeyUri(secret: string, email: string, issuer = "SMM Pro"): string {
  return generateURI({
    strategy: "totp",
    issuer,
    label: email,
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const result = verifySync({
      strategy: "totp",
      secret,
      token: token.replace(/\s/g, ""),
      epochTolerance: 1,
    });
    return result.valid;
  } catch {
    return false;
  }
}
