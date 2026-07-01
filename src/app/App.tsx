import { useState, useEffect, useCallback } from "react";
import { MobileSubmissionPage } from "./components/MobileSubmissionPage";
import { DisplayPage } from "./components/DisplayPage";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export interface Message {
  id: string;
  group: string;
  message: string;
  createdAt: string;
  isAnonymous: true;
}

type View = "mobile" | "display";
type ViewSwitcherProps = {
  view: View;
  onChange: (view: View) => void;
};

const env = import.meta.env as Record<string, string | undefined>;
const envValue = (key: string) => env[key]?.trim();
const functionSlug = envValue("VITE_SUPABASE_FUNCTION_SLUG") ?? "server";
const SERVER =
  envValue("VITE_SUPABASE_FUNCTION_URL") ??
  `https://${projectId}.supabase.co/functions/v1/${functionSlug}`;
const AUTH = { Authorization: `Bearer ${publicAnonKey}` };
const DISPLAY_POLL_INTERVAL_MS = 10000;

export { SERVER, AUTH };

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `msg_${crypto.randomUUID()}`;
  }

  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function messagesAreEqual(a: Message[], b: Message[]) {
  if (a.length !== b.length) return false;

  return a.every((message, index) => {
    const next = b[index];
    return (
      message.id === next.id &&
      message.group === next.group &&
      message.message === next.message &&
      message.createdAt === next.createdAt
    );
  });
}

function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div
      className="flex shrink-0 gap-1 rounded-full px-2 py-1.5 shadow-lg"
      style={{
        background: "rgba(30, 23, 15, 0.75)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <button
        onClick={() => onChange("mobile")}
        className="px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-200"
        style={
          view === "mobile"
            ? { background: "#F4A261", color: "#fff" }
            : { color: "#F5E6D0" }
        }
      >
        ✎ 보내기
      </button>
      <button
        onClick={() => onChange("display")}
        className="px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-200"
        style={
          view === "display"
            ? { background: "#F4A261", color: "#fff" }
            : { color: "#F5E6D0" }
        }
      >
        ◉ 보기
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("mobile");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER}/messages`, { headers: AUTH });
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages((prev) => (messagesAreEqual(prev, data.messages) ? prev : data.messages));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view !== "display") return;

    setLoading(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, DISPLAY_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages, view]);

  const addMessage = async (group: string, message: string): Promise<void> => {
    const newMessage: Message = {
      id: createMessageId(),
      group,
      message,
      createdAt: new Date().toISOString(),
      isAnonymous: true,
    };
    // Optimistic update
    setMessages((prev) => [...prev, newMessage]);
    try {
      const res = await fetch(`${SERVER}/messages`, {
        method: "POST",
        headers: { ...AUTH, "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });
      if (!res.ok) {
        // Revert optimistic update on failure
        setMessages((prev) => prev.filter((m) => m.id !== newMessage.id));
        throw new Error("Failed to save");
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== newMessage.id));
      throw e;
    }
  };

  const resetMessages = async (adminPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(`${SERVER}/messages`, {
        method: "DELETE",
        headers: { ...AUTH, "X-Admin-Password": adminPassword },
      });
      if (res.ok) {
        setMessages([]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const verifyAdmin = async (adminPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(`${SERVER}/admin/verify`, {
        method: "POST",
        headers: { ...AUTH, "X-Admin-Password": adminPassword },
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const deleteMessage = async (id: string, adminPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(`${SERVER}/messages/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { ...AUTH, "X-Admin-Password": adminPassword },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((message) => message.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const viewSwitcher = <ViewSwitcher view={view} onChange={setView} />;

  return (
    <div className="size-full" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {view === "mobile" ? (
        <MobileSubmissionPage onSubmit={addMessage} viewSwitcher={viewSwitcher} />
      ) : (
        <DisplayPage
          messages={messages}
          loading={loading}
          onVerifyAdmin={verifyAdmin}
          onReset={resetMessages}
          onDeleteMessage={deleteMessage}
          viewSwitcher={viewSwitcher}
        />
      )}
    </div>
  );
}
