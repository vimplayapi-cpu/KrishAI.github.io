import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiConversations,
  aiMessages,
  auditLogs,
  crops,
  demoAccounts,
  diseaseAnalyses,
  farms,
  knowledgeDocs,
  marketCache,
  notifications,
  products,
  reports,
  savedPapers,
  systemSettings,
  uploadedFiles,
  userProfiles,
  users,
  weatherCache,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      const value = user[field];
      if (value === undefined) continue;
      const normalized = value ?? null;
      (values as any)[field] = normalized;
      updateSet[field] = normalized;
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---------- Profiles ----------
export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return res[0];
}

export async function upsertProfile(
  userId: number,
  data: Partial<typeof userProfiles.$inferInsert>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getProfile(userId);
  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
    return getProfile(userId);
  }
  await db.insert(userProfiles).values({ userId, ...data });
  return getProfile(userId);
}

// ---------- Farms ----------
export async function listFarms(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(farms).where(eq(farms.userId, userId)).orderBy(desc(farms.createdAt));
}

export async function getFarm(userId: number, farmId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db
    .select()
    .from(farms)
    .where(and(eq(farms.id, farmId), eq(farms.userId, userId)))
    .limit(1);
  return res[0];
}

export async function createFarm(userId: number, data: {
  name: string; state?: string; district?: string; village?: string;
  farmSize?: string; soilType?: string; irrigation?: string; farmingMethod?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(farms).values({ userId, ...data });
  const res = await db.select().from(farms).where(eq(farms.userId, userId)).orderBy(desc(farms.id)).limit(1);
  return res[0];
}

export async function updateFarm(userId: number, farmId: number, data: Partial<typeof farms.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(farms).set(data).where(and(eq(farms.id, farmId), eq(farms.userId, userId)));
  return getFarm(userId, farmId);
}



export async function deleteFarm(userId: number, farmId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(farms).where(and(eq(farms.id, farmId), eq(farms.userId, userId)));
}

// ---------- Crops ----------
export async function listCrops(userId: number, farmId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crops).where(and(eq(crops.userId, userId), eq(crops.farmId, farmId))).orderBy(desc(crops.createdAt));
}

function cWhere(userId: number, farmId: number) {
  return and(eq(crops.userId, userId), eq(crops.farmId, farmId));
}

export async function createCrop(userId: number, farmId: number, data: {
  name: string; variety?: string; stage?: any; plantedAt?: Date;
  expectedHarvestAt?: Date; area?: string; notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(crops).values({ userId, farmId, ...data });
  const res = await db.select().from(crops).where(eq(crops.userId, userId)).orderBy(desc(crops.id)).limit(1);
  return res[0];
}

export async function updateCrop(userId: number, cropId: number, farmId: number, data: Partial<typeof crops.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(crops).set(data).where(and(eq(crops.id, cropId), eq(crops.userId, userId), eq(crops.farmId, farmId)));
  const res = await db.select().from(crops).where(and(eq(crops.id, cropId), eq(crops.userId, userId))).limit(1);
  return res[0];
}

export async function deleteCrop(userId: number, cropId: number, farmId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(crops).where(and(eq(crops.id, cropId), eq(crops.userId, userId), eq(crops.farmId, farmId)));
}

// ---------- Disease analyses ----------
export async function listDiseaseAnalyses(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(diseaseAnalyses)
    .where(eq(diseaseAnalyses.userId, userId))
    .orderBy(desc(diseaseAnalyses.createdAt))
    .limit(limit);
}

export async function createDiseaseAnalysis(userId: number, data: {
  crop?: string; result?: unknown; confidence?: number; images?: unknown; savedReport?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(diseaseAnalyses).values({ userId, ...data });
  const res = await db.select().from(diseaseAnalyses).where(eq(diseaseAnalyses.userId, userId)).orderBy(desc(diseaseAnalyses.id)).limit(1);
  return res[0];
}

export async function getDiseaseAnalysis(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db
    .select()
    .from(diseaseAnalyses)
    .where(and(eq(diseaseAnalyses.id, id), eq(diseaseAnalyses.userId, userId)))
    .limit(1);
  return res[0];
}

// ---------- AI conversations ----------
export async function listConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiConversations).where(eq(aiConversations.userId, userId)).orderBy(desc(aiConversations.updatedAt));
}

export async function createConversation(userId: number, title?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(aiConversations).values({ userId, title });
  const res = await db.select().from(aiConversations).where(eq(aiConversations.userId, userId)).orderBy(desc(aiConversations.id)).limit(1);
  return res[0];
}

export async function getConversation(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId)))
    .limit(1);
  return res[0];
}

export async function getMessages(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(aiMessages)
    .where(and(eq(aiMessages.conversationId, conversationId), eq(aiMessages.userId, userId)))
    .orderBy(aiMessages.id);
}

export async function addMessage(conversationId: number, userId: number, role: "user" | "assistant", content: string, sources?: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(aiMessages).values({ conversationId, userId, role, content, sources });
  // touch conversation
  await db.update(aiConversations).set({ updatedAt: new Date() }).where(eq(aiConversations.id, conversationId));
}

// ---------- Reports ----------
export async function listReports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
}

export async function createReport(userId: number, data: { type: any; title?: string; body?: string; aiGenerated?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(reports).values({ userId, ...data });
  const res = await db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.id)).limit(1);
  return res[0];
}

export async function getReport(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(reports).where(and(eq(reports.id, id), eq(reports.userId, userId))).limit(1);
  return res[0];
}

export async function deleteReport(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(reports).where(and(eq(reports.id, id), eq(reports.userId, userId)));
}

// ---------- Uploaded files ----------
export async function listUploadedFiles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(uploadedFiles).where(eq(uploadedFiles.userId, userId)).orderBy(desc(uploadedFiles.createdAt));
}

export async function createUploadedFile(userId: number, data: {
  farmId?: number; category?: string; url: string; fileKey: string; mimeType?: string; size?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(uploadedFiles).values({ userId, ...data });
  const res = await db.select().from(uploadedFiles).where(eq(uploadedFiles.userId, userId)).orderBy(desc(uploadedFiles.id)).limit(1);
  return res[0];
}

// ---------- Knowledge (RAG) ----------
export async function searchKnowledge(query: string, opts?: { crop?: string; topic?: string }) {
  const db = await getDb();
  if (!db) return [];
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 8);
  if (words.length === 0) return [];
  const conds = words.map((w) =>
    or(like(knowledgeDocs.title, `%${w}%`), like(knowledgeDocs.body, `%${w}%`)),
  );
  const where = opts?.crop ? and(or(...conds), eq(knowledgeDocs.crop, opts.crop)) : or(...conds);
  return db.select().from(knowledgeDocs).where(where).limit(8);
}

// ---------- Products ----------
export async function searchProducts(query?: string, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conds = [];
  if (query) {
    const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
    conds.push(
      or(
        ...words.map((w) =>
          or(like(products.name, `%${w}%`), like(products.description, `%${w}%`), like(products.targetCrops, `%${w}%`), like(products.targetProblems, `%${w}%`)),
        ),
      ),
    );
  }
  if (category) conds.push(eq(products.category, category));
  const where = conds.length > 0 ? and(...conds) : undefined;
  return db.select().from(products).where(where).limit(40);
}

// ---------- Notifications ----------
export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function createNotification(userId: number, data: { title: string; body?: string; category?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, ...data });
}

export async function markNotificationRead(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}

// ---------- Saved papers ----------
export async function listSavedPapers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedPapers).where(eq(savedPapers.userId, userId)).orderBy(desc(savedPapers.createdAt));
}

export async function savePaper(userId: number, data: { title: string; url?: string; doi?: string; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(savedPapers).values({ userId, ...data });
  return listSavedPapers(userId);
}

export async function deleteSavedPaper(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(savedPapers).where(and(eq(savedPapers.id, id), eq(savedPapers.userId, userId)));
}

// ---------- Weather / market cache ----------
export async function getCachedWeather(locationKey: string, maxAgeMinutes = 60) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(weatherCache).where(eq(weatherCache.locationKey, locationKey)).limit(1);
  const row = res[0];
  if (!row) return undefined;
  const ageMin = (Date.now() - row.fetchedAt.getTime()) / 60000;
  if (ageMin > maxAgeMinutes) return { ...row, stale: true };
  return { ...row, stale: false };
}

export async function setCachedWeather(locationKey: string, data: unknown, provider: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(weatherCache)
    .values({ locationKey, data: data as any, provider, fetchedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { data: data as any, provider, fetchedAt: new Date() } });
}

export async function getCachedMarket(key: string, maxAgeMinutes = 240) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(marketCache).where(eq(marketCache.key, key)).limit(1);
  const row = res[0];
  if (!row) return undefined;
  const ageMin = (Date.now() - row.fetchedAt.getTime()) / 60000;
  if (ageMin > maxAgeMinutes) return { ...row, stale: true };
  return { ...row, stale: false };
}

export async function setCachedMarket(key: string, data: unknown, provider: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(marketCache)
    .values({ key, data: data as any, provider, fetchedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { data: data as any, provider, fetchedAt: new Date() } });
}

// ---------- Settings ----------
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return res[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(systemSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

// ---------- Audit ----------
export async function logAudit(userId: number | null, action: string, resource?: string, detail?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ userId, action, resource, detail }).catch(() => {});
}

// ---------- Admin ----------
export async function listUsers(limit = 50, offset = 0, role?: string) {
  const db = await getDb();
  if (!db) return [];
  const where = role ? eq(users.role, role as any) : undefined;
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const res = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(res[0]?.count ?? 0);
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ role: role as any }).where(eq(users.id, userId));
}

export async function deleteUserAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(aiMessages).where(eq(aiMessages.userId, userId));
  await db.delete(aiConversations).where(eq(aiConversations.userId, userId));
  await db.delete(crops).where(eq(crops.userId, userId));
  await db.delete(farms).where(eq(farms.userId, userId));
  await db.delete(diseaseAnalyses).where(eq(diseaseAnalyses.userId, userId));
  await db.delete(reports).where(eq(reports.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(savedPapers).where(eq(savedPapers.userId, userId));
  await db.delete(uploadedFiles).where(eq(uploadedFiles.userId, userId));
  await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

export async function listAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// ---------- Password accounts ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const digest = crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256");
  return `${salt.toString("hex")}:${digest.toString("hex")}`;
}

export async function createPasswordAccount(input: {
  username: string;
  password: string;
  name: string;
  email?: string;
  role: "farmer" | "student";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: demoAccounts.id }).from(demoAccounts).where(eq(demoAccounts.username, input.username)).limit(1);
  if (existing.length > 0) throw new Error("Username is already registered");

  const openId = `local:${input.username}:${crypto.randomUUID()}`;
  await db.insert(users).values({
    openId,
    name: input.name,
    email: input.email ?? null,
    loginMethod: "password",
    role: input.role,
  });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Unable to create user account");
  await db.insert(demoAccounts).values({
    username: input.username,
    passwordHash: hashPassword(input.password),
    userId: user.id,
    lastSelectedRole: input.role,
    active: 1,
  });
  await upsertProfile(user.id, {
    userType: input.role,
    fullName: input.name,
    email: input.email ?? undefined,
    onboardingComplete: false,
  });
  return user;
}

// ---------- Demo account (password auth) ----------
export async function getDemoAccount(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(demoAccounts).where(eq(demoAccounts.username, username)).limit(1);
  return res[0];
}

export async function setDemoSelectedRole(userId: number, role: "farmer" | "student" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(demoAccounts).set({ lastSelectedRole: role }).where(eq(demoAccounts.userId, userId));
}

export async function countDemoAccounts() {
  const db = await getDb();
  if (!db) return 0;
  const res = await db.select({ c: count() }).from(demoAccounts);
  return Number(res[0]?.c ?? 0);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return res[0];
}

/** Password hash format: <hex-salt>:<hex-pbkdf2-sha256> (600k iterations). */
export function verifyPassword(password: string, passwordHash: string): boolean {
  const parts = passwordHash.split(":");
  if (parts.length !== 2) return false;
  const salt = Buffer.from(parts[0]!, "hex");
  const expected = parts[1]!;
  const computed = crypto.pbkdf2Sync(password, salt, 600000, 32, "sha256").toString("hex");
  return computed.length === expected.length && crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(expected, "hex"),
  );
}

export async function auditLog(userId: number | null, action: string, resource?: string, detail?: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({ userId, action, resource: resource ?? null, detail: detail ?? null });
  } catch (error) {
    console.warn("[Database] Failed to write audit log", error);
  }
}

// ---------- Admin: 360 customer view ----------
export type User360 = {
  user: Awaited<ReturnType<typeof getUserById>>;
  profile: Awaited<ReturnType<typeof getProfile>>;
  farms: Awaited<ReturnType<typeof listFarms>>;
  crops: Awaited<ReturnType<typeof listCropsForAdmin>>;
  scans: Awaited<ReturnType<typeof listDiseaseAnalyses>>;
  conversations: Awaited<ReturnType<typeof listConversations>>;
  reports: Awaited<ReturnType<typeof listReports>>;
  files: Awaited<ReturnType<typeof listUploadedFiles>>;
  papers: Awaited<ReturnType<typeof listSavedPapers>>;
  notifications: Awaited<ReturnType<typeof listNotifications>>;
  audit: Awaited<ReturnType<typeof listUserAudit>>;
};

export async function listCropsForAdmin(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crops).where(eq(crops.userId, userId)).orderBy(desc(crops.createdAt)).limit(100);
}

export async function listUserAudit(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(100);
}

export async function getUser360(userId: number): Promise<User360 | undefined> {
  const user = await getUserById(userId);
  if (!user) return undefined;
  const [profile, farms, crops, scans, conversations, reports, files, papers, notifications, audit] =
    await Promise.all([
      getProfile(userId),
      listFarms(userId),
      listCropsForAdmin(userId),
      listDiseaseAnalyses(userId, 20),
      listConversations(userId),
      listReports(userId),
      listUploadedFiles(userId),
      listSavedPapers(userId),
      listNotifications(userId),
      listUserAudit(userId),
    ]);
  return { user, profile, farms, crops, scans, conversations, reports, files, papers, notifications, audit };
}

export type RoleCounts = { total: number; farmer: number; student: number; admin: number; other: number };
export async function getRoleCounts(): Promise<RoleCounts> {
  const db = await getDb();
  if (!db) return { total: 0, farmer: 0, student: 0, admin: 0, other: 0 };
  const res = await db
    .select({ role: users.role, count: sql<number>`count(*)` })
    .from(users)
    .groupBy(users.role);
  const counts: RoleCounts = { total: 0, farmer: 0, student: 0, admin: 0, other: 0 };
  for (const row of res) {
    counts.total += Number(row.count);
    if (row.role === "farmer") counts.farmer += Number(row.count);
    else if (row.role === "student") counts.student += Number(row.count);
    else if (row.role === "admin") counts.admin += Number(row.count);
    else counts.other += Number(row.count);
  }
  return counts;
}

export async function countPendingApprovals(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await Promise.all([
    db.select({ c: count() }).from(uploadedFiles).where(eq(uploadedFiles.status, "pending")),
    db.select({ c: count() }).from(diseaseAnalyses).where(eq(diseaseAnalyses.status, "pending")),
    db.select({ c: count() }).from(savedPapers).where(eq(savedPapers.status, "pending")),
  ]);
  return rows.reduce((sum, r) => sum + Number(r[0]?.c ?? 0), 0);
}

export async function countFlaggedUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const res = await db.select({ c: count() }).from(users).where(eq(users.role, "suspended" as any));
  return Number(res[0]?.c ?? 0);
}

// ---------- Approvals ----------
export async function listPendingItems(kind: "uploads" | "scans" | "papers") {
  const db = await getDb();
  if (!db) return [];
  if (kind === "uploads") return db.select().from(uploadedFiles).where(eq(uploadedFiles.status, "pending")).orderBy(desc(uploadedFiles.createdAt)).limit(50);
  if (kind === "scans") return db.select().from(diseaseAnalyses).where(eq(diseaseAnalyses.status, "pending")).orderBy(desc(diseaseAnalyses.createdAt)).limit(50);
  return db.select().from(savedPapers).where(eq(savedPapers.status, "pending")).orderBy(desc(savedPapers.createdAt)).limit(50);
}

export async function listAllUploads(limit = 50, offset = 0, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const where = status && status !== "all" ? eq(uploadedFiles.status, status as any) : undefined;
  return db.select().from(uploadedFiles).where(where).orderBy(desc(uploadedFiles.createdAt)).limit(limit).offset(offset);
}

export async function reviewUpload(id: number, status: "approved" | "rejected", reviewedBy: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(uploadedFiles)
    .set({ status, reviewedBy, reviewNote: note ?? null, reviewedAt: new Date() })
    .where(eq(uploadedFiles.id, id));
}

export async function reviewAnalysis(id: number, status: "approved" | "rejected", reviewedBy: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(diseaseAnalyses).set({ status, reviewedBy, reviewNote: note ?? null }).where(eq(diseaseAnalyses.id, id));
}

export async function reviewPaper(id: number, status: "approved" | "rejected", reviewedBy: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(savedPapers).set({ status, reviewedBy, reviewNote: note ?? null }).where(eq(savedPapers.id, id));
}

// ---------- Feature flags & governance ----------
export type FeatureFlags = {
  featureScan: boolean;
  featureAdvisor: boolean;
  featureMarkets: boolean;
  featureResearch: boolean;
  featureReports: boolean;
  featureAdvisory: boolean;
  maintenanceBanner: string;
  announcement: string;
};
export const DEFAULT_FLAGS: FeatureFlags = {
  featureScan: true,
  featureAdvisor: true,
  featureMarkets: true,
  featureResearch: true,
  featureReports: true,
  featureAdvisory: true,
  maintenanceBanner: "",
  announcement: "",
};
export const FLAG_KEYS = Object.keys(DEFAULT_FLAGS) as (keyof FeatureFlags)[];

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const flags: FeatureFlags = { ...DEFAULT_FLAGS };
  for (const key of FLAG_KEYS) {
    const value = await getSetting(key);
    if (value !== null) {
      if (key === "maintenanceBanner" || key === "announcement") flags[key] = value as string;
      else flags[key] = value === "true";
    }
  }
  return flags;
}

export async function setFeatureFlag(key: string, value: string | boolean) {
  await setSetting(key, String(value));
  await logAudit(null, "admin.setFeatureFlag", key, String(value));
}
