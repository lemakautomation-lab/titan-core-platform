import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrganisationSignupPage from "./OrganisationSignupPage";
import OrganisationVerificationPage from "./OrganisationVerificationPage";
import OrganisationAdministratorSetupPage from "./OrganisationAdministratorSetupPage";

vi.mock("./organisation-onboarding.api", () => ({
  organisationOnboarding: {
    plans: vi.fn(), register: vi.fn(), verifyEmail: vi.fn(), completeSetup: vi.fn(),
  },
}));
import { organisationOnboarding } from "./organisation-onboarding.api";
const api = vi.mocked(organisationOnboarding);
afterEach(() => vi.clearAllMocks());

describe("organisation onboarding public flow", () => {
  it("registers with an offered plan and shows verification without offering payment or access", async () => {
    api.plans.mockResolvedValue({ plans: [{ id: "plan-1", code: "ORG", name: "Organisation", amountMinor: 12000, currency: "ZAR", billingInterval: "MONTHLY" }] });
    api.register.mockResolvedValue({ application: { id: "application-1", administratorEmail: "admin@example.com", status: "PENDING_VERIFICATION" } });
    render(<MemoryRouter><OrganisationSignupPage /></MemoryRouter>);
    await screen.findByRole("option", { name: /Organisation/ });
    fireEvent.change(screen.getByLabelText("Organisation name"), { target: { value: "Example Club" } });
    fireEvent.change(screen.getByLabelText("Administrator email"), { target: { value: "admin@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Register organisation" }));
    await screen.findByRole("heading", { name: "Check your email" });
    expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ planId: "plan-1", administratorEmail: "admin@example.com", requestId: expect.any(String) }));
    expect(screen.getByText(/registration does not activate access/)).toBeInTheDocument();
    expect(screen.getByText(/Application ID:/)).toHaveTextContent("application-1");
  });

  it("only confirms payment pending when verification returns that state", async () => {
    api.verifyEmail.mockResolvedValue({ applicationId: "application-1", status: "PENDING_PAYMENT" });
    render(<MemoryRouter initialEntries={["/verify?token=secret"]}><OrganisationVerificationPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Verify email" }));
    await waitFor(() => expect(screen.getByText(/Access is not active yet/)).toBeInTheDocument());
    expect(api.verifyEmail).toHaveBeenCalledWith("secret");
  });

  it("does not submit administrator setup without matching passwords", async () => {
    render(<MemoryRouter initialEntries={["/setup?token=secret"]}><OrganisationAdministratorSetupPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "StrongPassword123" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "DifferentPassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete administrator setup" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(api.completeSetup).not.toHaveBeenCalled();
  });
});
