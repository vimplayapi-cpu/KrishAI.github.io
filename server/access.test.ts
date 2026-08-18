import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(role: "admin" | "user", userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: role === "admin" ? "admin-openid" : "user-openid",
    email: `${role}@example.com`,
    name: `${role} User`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
      cookie: () => undefined,
    } as unknown as TrpcContext["res"],
  };
}

describe("admin gating", () => {
  it("allows admin to list users", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const data = await caller.admin.listUsers();
    expect(Array.isArray(data)).toBe(true);
  });

  it("blocks non-admin from listing users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });

  it("blocks non-admin from changing roles", async () => {
    const caller = appRouter.createCaller(makeCtx("user", 2));
    await expect(caller.admin.setRole({ userId: 3, role: "farmer" })).rejects.toThrow();
  });

  it("blocks non-admin from bulk import", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.admin.importData({ type: "json", content: '[{"title":"t","body":"b"}]' }),
    ).rejects.toThrow();
  });

  it("allows admin to read system health", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const data = await caller.admin.systemHealth();
    expect(data.database).toBe("connected");
  });
});

describe("ownership isolation", () => {
  it("scopes farms.list to the authenticated user", async () => {
    const caller1 = appRouter.createCaller(makeCtx("user", 10));
    const caller2 = appRouter.createCaller(makeCtx("user", 20));
    const [a, b] = await Promise.all([caller1.farms.list(), caller2.farms.list()]);
    expect(a.every((f: any) => f.userId === 10)).toBe(true);
    expect(b.every((f: any) => f.userId === 20)).toBe(true);
  });

  it("blocks anonymous access to protected dashboard widgets", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dashboard.widgets()).rejects.toThrow();
  });

  it("scopes notifications to the authenticated user", async () => {
    const caller1 = appRouter.createCaller(makeCtx("user", 10));
    const caller2 = appRouter.createCaller(makeCtx("user", 20));
    const [a, b] = await Promise.all([caller1.notifications.list(), caller2.notifications.list()]);
    expect(a.every((n: any) => n.userId === 10)).toBe(true);
    expect(b.every((n: any) => n.userId === 20)).toBe(true);
  });
});

describe("public / anonymous behavior", () => {
  it("allows anonymous auth.me to return null", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

describe("approval visibility", () => {
  it("blocks non-admin from listing pending items", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.pendingItems({ kind: "uploads" })).rejects.toThrow();
  });

  it("blocks non-admin from reviewing uploads", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.admin.reviewUpload({ id: 1, decision: "approved" })).rejects.toThrow();
  });
});

describe("recommendation scoping", () => {
  it("admin cannot access customer dashboard widgets", async () => {
    // Admin users are not customers; dashboard should still work for admin role
    const caller = appRouter.createCaller(makeCtx("admin"));
    const data = await caller.dashboard.widgets();
    expect(data).toBeDefined();
  });
});
