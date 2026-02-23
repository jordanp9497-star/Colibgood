const required = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT ?? "3000"),
  supabase: {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    anonKey: process.env.SUPABASE_ANON_KEY ?? "", // optional: used for JWT verification if set
  },
} as const;
