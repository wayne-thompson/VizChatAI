import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  llmProvider: varchar("llm_provider").default("openai"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Visualizations schema - adding project grouping field
export const visualizations = pgTable("visualizations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  projectGroup: text("project_group"), // Groups related visualizations together
  title: text("title"),
  description: text("description"),
  imageBase64: text("image_base64").notNull(),
  initialSummary: text("initial_summary"),
  analysis: jsonb("analysis"),
  insights: text("insights").array(),
  shareId: text("share_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
});

export const insertVisualizationSchema = createInsertSchema(visualizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Chat messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  visualizationId: integer("visualization_id").references(() => visualizations.id).notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Chart specification types for the Create feature
export type ChartDataPoint = {
  name: string;
  value: number;
  [key: string]: string | number;
};

export type ChartSpec = {
  type: "bar" | "pie" | "line" | "area";
  title: string;
  data: ChartDataPoint[];
  xAxisKey?: string;
  dataKeys?: string[];
  colors?: string[];
};

// Generated visualizations schema - for the Create feature
export const generatedVisualizations = pgTable("generated_visualizations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  sourceImageBase64: text("source_image_base64").notNull(), // Original screenshot
  styleReferenceBase64: text("style_reference_base64"), // Optional style reference
  prompt: text("prompt"), // User's prompt for customization
  generatedImages: jsonb("generated_images").$type<string[]>(), // Legacy: base64 images (deprecated)
  chartSpecs: jsonb("chart_specs").$type<ChartSpec[]>(), // New: structured chart specifications
  shareId: text("share_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedVisualizationSchema = createInsertSchema(generatedVisualizations).omit({
  id: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type Visualization = typeof visualizations.$inferSelect;
export type InsertVisualization = z.infer<typeof insertVisualizationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type GeneratedVisualization = typeof generatedVisualizations.$inferSelect;
export type InsertGeneratedVisualization = z.infer<typeof insertGeneratedVisualizationSchema>;
