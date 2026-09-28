import { randomBytes } from "node:crypto";

import { passwordSecurity } from "../../security/bcrypt";
import { DatabaseService } from "../database/database.service";

/** Minimum tenant administration access; no delete or role/permission mutation. */
export const INITIAL_ORGANISATION_ADMINISTRATOR_PERMISSIONS = [
    "tenants.read",
    "organisations.read",
    "organisations.update",
    "users.read",
    "users.create",
    "users.update",
    "roles.read",
    "permissions.read",
] as const;

/** Internal boundary. Never expose this operation as an unauthenticated route. */
export class OrganisationProvisioningService {
    constructor(private readonly database: DatabaseService) {}

    async provision(applicationId: string) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId)) {
            throw new Error("A valid organisation application ID is required.");
        }

        // There is no applicant password in the registration snapshot. This
        // random credential is never returned or delivered; the administrator
        // sets a password through the approved flow after activation.
        const unusablePasswordHash = await passwordSecurity.hash(
            randomBytes(48).toString("base64url"),
        );

        return this.database.transaction(async tx => {
            const claimed = await tx.organisationOnboardingApplication.updateMany({
                where: { id: applicationId, status: "PAYMENT_CONFIRMED" },
                data: { status: "PROVISIONED" },
            });

            if (claimed.count !== 1) {
                const existing = await tx.organisationOnboardingApplication.findUnique({
                    where: { id: applicationId },
                });
                if (existing?.status === "PROVISIONED" &&
                    existing.provisionedTenantId &&
                    existing.provisionedOrganisationId &&
                    existing.provisionedAdministratorId &&
                    existing.provisionedPaymentAttemptId &&
                    existing.provisionedAt) {
                    return {
                        status: "PROVISIONED" as const,
                        applicationId,
                        tenantId: existing.provisionedTenantId,
                        organisationId: existing.provisionedOrganisationId,
                        administratorId: existing.provisionedAdministratorId,
                    };
                }
                throw new Error("Organisation application is not ready for provisioning.");
            }

            const application = await tx.organisationOnboardingApplication.findUniqueOrThrow({
                where: { id: applicationId },
            });
            const payment = await tx.organisationOnboardingPaymentAttempt.findFirst({
                where: {
                    applicationId,
                    status: "CONFIRMED",
                    amountMinor: application.amountMinor,
                    currency: application.currency,
                    billingInterval: application.billingInterval,
                    providerTransactionReference: { not: null },
                },
                orderBy: { confirmedAt: "asc" },
            });
            if (!payment?.confirmedAt || !payment.providerTransactionReference) {
                throw new Error("A matching verified payment is required for provisioning.");
            }

            const tenant = await tx.tenant.create({
                data: {
                    name: application.organisationName,
                    slug: application.organisationSlug,
                    status: "INACTIVE",
                },
            });
            const organisation = await tx.organisation.create({
                data: {
                    tenantId: tenant.id,
                    name: application.organisationName,
                    slug: application.organisationSlug,
                    status: "INACTIVE",
                },
            });
            const administrator = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    organisationId: organisation.id,
                    email: application.administratorEmail,
                    passwordHash: unusablePasswordHash,
                    status: "INACTIVE",
                },
            });
            // Role has no permissions until the validation/activation policy
            // explicitly assigns tenant-scoped permissions in later controls.
            const role = await tx.role.create({
                data: {
                    tenantId: tenant.id,
                    name: "Organisation Administrator",
                    description: "Initial organisation administrator; access pending activation.",
                },
            });
            await tx.userRole.create({
                data: { userId: administrator.id, roleId: role.id },
            });
            for (const code of INITIAL_ORGANISATION_ADMINISTRATOR_PERMISSIONS) {
                const permission = await tx.permission.create({
                    data: {
                        tenantId: tenant.id,
                        code,
                        name: code,
                        description: "Initial organisation administrator access.",
                    },
                });
                await tx.rolePermission.create({
                    data: {
                        tenantId: tenant.id,
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                });
            }
            await tx.organisationOnboardingApplication.update({
                where: { id: applicationId },
                data: {
                    provisionedTenantId: tenant.id,
                    provisionedOrganisationId: organisation.id,
                    provisionedAdministratorId: administrator.id,
                    provisionedPaymentAttemptId: payment.id,
                    provisionedAt: new Date(),
                },
            });
            return {
                status: "PROVISIONED" as const,
                applicationId,
                tenantId: tenant.id,
                organisationId: organisation.id,
                administratorId: administrator.id,
            };
        });
    }
}
