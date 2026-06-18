const fallbackAppUrl = "http://localhost:3000";
const fallbackApiUrl = "http://localhost:8000";
const fallbackHotsiteLoginPath = "/student-portal/auth/login/";

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || fallbackAppUrl,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || fallbackApiUrl,
  hotsiteLoginPath:
    process.env.NEXT_PUBLIC_HOTSITE_LOGIN_PATH || fallbackHotsiteLoginPath,
};
