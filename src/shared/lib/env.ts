const fallbackAppUrl = "http://localhost:3000";
const fallbackHotsiteLoginPath = "/student-portal/auth/login/";

export const publicEnv = {
  platformUrl: process.env.NEXT_PUBLIC_PLATFORM_URL || "https://aluno.escolaveli.com",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || fallbackAppUrl,
  apiUrl: "/api/backend",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  hotsiteLoginPath:
    process.env.NEXT_PUBLIC_HOTSITE_LOGIN_PATH || fallbackHotsiteLoginPath,
};
