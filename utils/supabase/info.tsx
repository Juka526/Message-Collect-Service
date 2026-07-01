const requiredEnv = (key: string) => {
  const value = import.meta.env[key] as string | undefined;
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
};

export const projectId = requiredEnv("VITE_SUPABASE_PROJECT_ID").replace(/\s+/g, "");
export const publicAnonKey = requiredEnv("VITE_SUPABASE_ANON_KEY");
