import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended for KrishAI Hub roles.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "farmer",
    "student",
    "researcher",
    "professional",
    "business",
    "admin",
    "user",
  ])
    .default("farmer")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Agricultural profile attached to a user account. */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userType: varchar("userType", { length: 32 }),
  fullName: varchar("fullName", { length: 200 }),
  email: varchar("email", { length: 320 }),
  mobile: varchar("mobile", { length: 20 }),
  language: varchar("language", { length: 32 }).default("en"),
  state: varchar("state", { length: 100 }),
  district: varchar("district", { length: 100 }),
  village: varchar("village", { length: 200 }),
  pincode: varchar("pincode", { length: 10 }),

  // ---- Farmer profile ----
  farmingExperienceYears: int("farmingExperienceYears"),
  farmOwnerStatus: varchar("farmOwnerStatus", { length: 50 }),
  soilType: varchar("soilType", { length: 100 }),
  rainfallType: varchar("rainfallType", { length: 50 }),
  growingSeason: varchar("growingSeason", { length: 100 }),
  irrigationAccess: varchar("irrigationAccess", { length: 50 }),
  cropsOfInterest: json("cropsOfInterest"),
  /** Auto-tagged region/climate zone derived from location (e.g. arid, semi-arid, humid). */
  regionTags: json("regionTags"),
  aboutMe: text("aboutMe"),

  // ---- Student profile ----
  age: int("age"),
  universityName: varchar("universityName", { length: 300 }),
  enrollmentYear: int("enrollmentYear"),
  degreeLevel: varchar("degreeLevel", { length: 50 }),
  courseName: varchar("courseName", { length: 300 }),
  subjects: json("subjects"),
  researchArea: varchar("researchArea", { length: 300 }),
  graduationYear: int("graduationYear"),
  purpose: varchar("purpose", { length: 100 }),

  // Raw structured onboarding answers (kept for 360 admin view + reprocessing).
  onboardingAnswers: json("onboardingAnswers"),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Farms owned by a user. */
export const farms = mysqlTable("farms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  state: varchar("state", { length: 100 }),
  district: varchar("district", { length: 100 }),
  village: varchar("village", { length: 200 }),
  farmSize: text("farmSize"),
  soilType: varchar("soilType", { length: 100 }),
  irrigation: varchar("irrigation", { length: 100 }),
  farmingMethod: varchar("farmingMethod", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Crops tracked on a farm with lifecycle stage. */
export const crops = mysqlTable("crops", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmId: int("farmId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  variety: varchar("variety", { length: 200 }),
  stage: mysqlEnum("stage", [
    "land_preparation",
    "sowing",
    "germination",
    "vegetative",
    "flowering",
    "fruiting",
    "maturity",
    "harvest",
    "post_harvest",
  ])
    .default("land_preparation")
    .notNull(),
  plantedAt: timestamp("plantedAt"),
  expectedHarvestAt: timestamp("expectedHarvestAt"),
  area: text("area"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Disease scan analyses uploaded by users. */
export const diseaseAnalyses = mysqlTable("diseaseAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  crop: varchar("crop", { length: 200 }),
  result: json("result"),
  confidence: int("confidence"),
  images: json("images"),
  savedReport: boolean("savedReport").default(false).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** AI conversations. */
export const aiConversations = mysqlTable("aiConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 300 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** AI messages within a conversation. */
export const aiMessages = mysqlTable("aiMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content"),
  sources: json("sources"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Generated reports. */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "crop",
    "disease",
    "farm",
    "weather",
    "market",
    "research",
  ]).notNull(),
  title: varchar("title", { length: 300 }),
  body: text("body"),
  aiGenerated: boolean("aiGenerated").default(true).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("approved").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Uploaded files (photos, scan images, research docs). */
export const uploadedFiles = mysqlTable("uploadedFiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmId: int("farmId"),
  category: varchar("category", { length: 50 }),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 400 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size"),
  /** Admin approval workflow: uploaded items start pending until an admin reviews them. */
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Knowledge base documents (RAG corpus). */
export const knowledgeDocs = mysqlTable("knowledgeDocs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 400 }).notNull(),
  body: text("body"),
  source: varchar("source", { length: 400 }),
  organization: varchar("organization", { length: 200 }),
  crop: varchar("crop", { length: 200 }),
  topic: varchar("topic", { length: 200 }),
  state: varchar("state", { length: 100 }),
  language: varchar("language", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Agricultural products database. */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  targetCrops: text("targetCrops"),
  targetProblems: text("targetProblems"),
  caution: text("caution"),
  source: varchar("source", { length: 300 }),
});

/** In-app notifications. */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body"),
  category: varchar("category", { length: 50 }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Research paper bookmarks. */
export const savedPapers = mysqlTable("savedPapers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  url: text("url"),
  doi: varchar("doi", { length: 200 }),
  note: text("note"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** System settings managed by admin. */
export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Cached weather snapshots. */
export const weatherCache = mysqlTable("weatherCache", {
  id: int("id").autoincrement().primaryKey(),
  locationKey: varchar("locationKey", { length: 200 }).notNull().unique(),
  data: json("data"),
  provider: varchar("provider", { length: 50 }),
  fetchedAt: timestamp("fetchedAt").notNull(),
});

/** Cached mandi price snapshots. */
export const marketCache = mysqlTable("marketCache", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 200 }).notNull().unique(),
  data: json("data"),
  provider: varchar("provider", { length: 50 }),
  fetchedAt: timestamp("fetchedAt").notNull(),
});

/** Audit logs for security events. */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 200 }),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiseaseAnalysis = typeof diseaseAnalyses.$inferSelect;

/** Demo password-auth account (demo / 123456). The app exposes a local
 * password login gate so anyone can access it with the demo credentials. */
export const demoAccounts = mysqlTable("demoAccounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** Links to the users row used when this demo account signs in. */
  userId: int("userId").notNull(),
  /** Which role the demo user last selected at login (farmer | student). Admin stays admin regardless. */
  lastSelectedRole: mysqlEnum("lastSelectedRole", ["farmer", "student", "admin"]).default("farmer").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DemoAccount = typeof demoAccounts.$inferSelect;
