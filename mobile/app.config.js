require("dotenv").config();

const appJson = require("./app.json");

module.exports = {
  ...appJson.expo,
  name: appJson.expo.name,
  slug: appJson.expo.slug,
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    eas: appJson.expo.extra?.eas,
  },
};
