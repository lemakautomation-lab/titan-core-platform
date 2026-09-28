const baseUrl = import.meta.env.VITE_API_BASE_URL;

if (!baseUrl) {
  throw new Error("VITE_API_BASE_URL is not configured");
}

export interface OrganisationPlan {
  id: string;
  code: string;
  name: string;
  amountMinor: number;
  currency: string;
  billingInterval: "MONTHLY" | "ANNUALLY";
}

export interface OrganisationApplication {
  id: string;
  administratorEmail: string;
  status: string;
}

async function publicRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}/organisation-onboarding${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const organisationOnboarding = {
  plans: () => publicRequest<{ plans: OrganisationPlan[] }>("/plans"),
  register: (request: { requestId: string; organisationName: string; administratorEmail: string; planId: string }) =>
    publicRequest<{ application: OrganisationApplication }>("/register", "POST", request),
  verifyEmail: (token: string) =>
    publicRequest<{ applicationId: string; status: string }>("/verify-email", "POST", { token }),
  requestSetup: (applicationId: string, administratorEmail: string) =>
    publicRequest<{ message: string }>("/request-administrator-setup", "POST", { applicationId, administratorEmail }),
  completeSetup: (token: string, newPassword: string) =>
    publicRequest<{ status: string }>("/complete-administrator-setup", "POST", { token, newPassword }),
};
