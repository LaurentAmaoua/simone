import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
import { defineConfig } from "@snaplet/seed/config";
import postgres from "postgres";

export default defineConfig({
  adapter: () => {
    const client = postgres(
      "postgresql://postgres.nveturzuplczgglzkxrt:zVpZtzgvWDZZRr787Mcr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres",
    );
    return new SeedPostgres(client);
  },
});
