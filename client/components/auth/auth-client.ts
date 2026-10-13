
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.50.0.1:8000"
).replace(/\/$/, "");

export const ACCESS_TOKEN_KEY = "codekadai_access_token";
export const REFRESH_TOKEN_KEY = "codekadai_refresh_token";

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

function readTokens() {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function requestRefresh(
  refreshToken: string
): Promise<boolean> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    clearTokens();
    return false;
  }

  if (!response.ok) {
    throw new Error(`Refresh failed (${response.status}).`);
  }

  const data = (await response.json()) as Partial<AuthTokens>;

  if (
    typeof data.access_token !== "string" ||
    typeof data.refresh_token !== "string"
  ) {
    throw new Error("Refresh API did not return both tokens.");
  }

  saveTokens(data as AuthTokens);
  return true;
}

export async function hasValidSession(): Promise<boolean> {
  const tokens = readTokens();

  if (!tokens) return false;

  const verifyAccessToken = (accessToken: string) =>
    fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

  let response = await verifyAccessToken(tokens.accessToken);

  if (response.ok) return true;

  if (response.status !== 401) {
    throw new Error(
      `Session verification failed (${response.status}).`
    );
  }

  // Access token expired or rejected. Try refreshing the session.
  const refreshed = await requestRefresh(tokens.refreshToken);

  if (!refreshed) return false;

  const updatedTokens = readTokens();

  if (!updatedTokens) return false;

  response = await verifyAccessToken(updatedTokens.accessToken);

  if (response.ok) return true;

  if (response.status === 401) {
    clearTokens();
    return false;
  }

  throw new Error(
    `Session verification failed (${response.status}).`
  );
}

export async function logout(): Promise<void> {
  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null;

  try {
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
        cache: "no-store",
      });
    }
  } finally {
    clearTokens();
  }
}
