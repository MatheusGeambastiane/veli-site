const fallbackAppUrl = "http://localhost:3000";
const fallbackHotsiteLoginPath = "/student-portal/auth/login/";

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || fallbackAppUrl,
  apiUrl: "/api/backend",
  hotsiteLoginPath:
    process.env.NEXT_PUBLIC_HOTSITE_LOGIN_PATH || fallbackHotsiteLoginPath,
};
