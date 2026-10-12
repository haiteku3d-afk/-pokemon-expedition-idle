import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const players = sqliteTable("players", {
 userId: text("user_id").primaryKey(),
 state: text("state").notNull(),
 revision: integer("revision").notNull().default(0),
 updatedAt: integer("updated_at").notNull(),
 lastOp: text("last_op"),
 lastResult: text("last_result"),
});
