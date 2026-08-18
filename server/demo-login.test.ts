import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { getDemoAccount, verifyPassword } from "./db";

describe("demo login", () => {
  it("stored demo hash verifies against password 123456", async () => {
    const account = await getDemoAccount("demo");
    expect(account).toBeTruthy();
    expect(account?.active).toBe(1);
    const ok = account ? verifyPassword("123456", account.passwordHash) : false;
    expect(ok).toBe(true);
    expect(verifyPassword("wrong", account!.passwordHash)).toBe(false);
  }, 60_000);

  it("hash derivation is reproducible (same params as seed)", () => {
    const password = "123456";
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256").toString("hex");
    const stored = `${salt.toString("hex")}:${hash}`;
    expect(verifyPassword(password, stored)).toBe(true);
    expect(verifyPassword("12345", stored)).toBe(false);
  }, 60_000);
});
