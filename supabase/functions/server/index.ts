import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

if (Deno.env.get("ENABLE_REQUEST_LOGS") === "true") {
  app.use("*", logger(console.log));
}

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOriginPatterns = (Deno.env.get("ALLOWED_ORIGIN_PATTERNS") ?? "")
  .split(",")
  .map((pattern) => pattern.trim())
  .filter(Boolean)
  .map((pattern) => {
    try {
      return new RegExp(pattern);
    } catch (e) {
      console.log("Ignoring invalid ALLOWED_ORIGIN_PATTERNS entry:", pattern, e);
      return null;
    }
  })
  .filter((pattern): pattern is RegExp => Boolean(pattern));

const isAllowedOrigin = (origin: string) =>
  allowedOrigins.includes(origin) ||
  allowedOriginPatterns.some((pattern) => pattern.test(origin));

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return "";
      return isAllowedOrigin(origin) ? origin : "";
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Password"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const MESSAGES_TABLE = "messages_213c66c3";
const routePrefixes = ["", "/make-server-213c66c3", "/server"];

type MessageRow = {
  id: string;
  group_name: string;
  message: string;
  created_at: string;
  is_anonymous: boolean;
};

type MessagePayload = {
  id?: string;
  group?: string;
  message?: string;
  createdAt?: string;
  isAnonymous?: boolean;
};

const supabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

const toClientMessage = (row: MessageRow) => ({
  id: row.id,
  group: row.group_name,
  message: row.message,
  createdAt: row.created_at,
  isAnonymous: row.is_anonymous,
});

const isAdminRequest = (c: any) => {
  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  return Boolean(adminPassword) && c.req.header("X-Admin-Password") === adminPassword;
};

const healthHandler = (c: any) => {
  return c.json({ status: "ok" });
};

const getMessagesHandler = async (c: any) => {
  try {
    const { data, error } = await supabase()
      .from(MESSAGES_TABLE)
      .select("id, group_name, message, created_at, is_anonymous")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return c.json({ messages: (data ?? []).map(toClientMessage) });
  } catch (e) {
    console.log("Error fetching messages:", e);
    return c.json({ messages: [] });
  }
};

const postMessageHandler = async (c: any) => {
  try {
    const msg = (await c.req.json()) as MessagePayload;
    const group = msg.group?.trim();
    const message = msg.message?.trim();

    if (!msg.id || !group || !message) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const { error } = await supabase().from(MESSAGES_TABLE).insert({
      id: msg.id,
      group_name: group,
      message,
      created_at: msg.createdAt ?? new Date().toISOString(),
      is_anonymous: true,
    });

    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log("Error posting message:", e);
    return c.json({ error: "Failed to save message" }, 500);
  }
};

const verifyAdminHandler = (c: any) => {
  if (!isAdminRequest(c)) {
    return c.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, 401);
  }

  return c.json({ success: true });
};

const deleteMessagesHandler = async (c: any) => {
  if (!isAdminRequest(c)) {
    return c.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, 401);
  }

  try {
    const { error } = await supabase().from(MESSAGES_TABLE).delete().neq("id", "");
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log("Error resetting messages:", e);
    return c.json({ error: "Failed to reset messages" }, 500);
  }
};

const deleteMessageHandler = async (c: any) => {
  if (!isAdminRequest(c)) {
    return c.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, 401);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing message id" }, 400);
  }

  try {
    const { error } = await supabase().from(MESSAGES_TABLE).delete().eq("id", id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    console.log("Error deleting message:", e);
    return c.json({ error: "Failed to delete message" }, 500);
  }
};

for (const prefix of routePrefixes) {
  app.get(`${prefix}/health`, healthHandler);
  app.get(`${prefix}/messages`, getMessagesHandler);
  app.post(`${prefix}/messages`, postMessageHandler);
  app.post(`${prefix}/admin/verify`, verifyAdminHandler);
  app.delete(`${prefix}/messages/:id`, deleteMessageHandler);
  app.delete(`${prefix}/messages`, deleteMessagesHandler);
}

Deno.serve(app.fetch);
