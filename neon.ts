import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Lakebase Postgres
  branch: (branch) => {
    if (branch.isDefault) {
      return {};
    }
    if (!branch.exists) {
      return { ttl: "7d" };
    }
    return {};
  },
});
