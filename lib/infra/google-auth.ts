import { GoogleAuth } from "google-auth-library";

let authClient: Awaited<ReturnType<GoogleAuth["getClient"]>> | null = null;

export async function getGoogleAuthClient() {
  if (authClient) return authClient;

  const auth = new GoogleAuth({
    scopes: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/documents",
    ],
  });

  authClient = await auth.getClient();
  return authClient;
}
