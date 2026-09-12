import {
    describe,
    expect,
    it,
} from "vitest";

import {
    Organisation,
} from "../../src/domain/entities/organisation.entity";
import {
    Permission,
} from "../../src/domain/entities/permission.entity";
import {
    Role,
} from "../../src/domain/entities/role.entity";
import {
    Session,
} from "../../src/domain/entities/session.entity";
import {
    Tenant,
} from "../../src/domain/entities/tenant.entity";
import {
    User,
} from "../../src/domain/entities/user.entity";
import {
    RecordStatus,
} from "../../src/domain/enums/record-status.enum";
import {
    SessionStatus,
} from "../../src/domain/enums/session-status.enum";
import {
    UserStatus,
} from "../../src/domain/enums/user-status.enum";

describe("Mission 004 core domain entities", () => {

    it("creates and transitions a Tenant", () => {

        const tenant =
            Tenant.create("TITAN Technologies");

        expect(tenant.id)
            .toBeTruthy();

        expect(tenant.name)
            .toBe("TITAN Technologies");

        expect(tenant.slug)
            .toBe("titan-technologies");

        expect(tenant.status)
            .toBe(RecordStatus.ACTIVE);

        tenant.suspend();

        expect(tenant.status)
            .toBe(RecordStatus.SUSPENDED);

        tenant.activate();

        expect(tenant.isActive())
            .toBe(true);

        tenant.deactivate();

        expect(tenant.status)
            .toBe(RecordStatus.INACTIVE);

        tenant.delete();

        expect(tenant.status)
            .toBe(RecordStatus.DELETED);

    });

    it("preserves Organisation tenant ownership and lifecycle", () => {

        const createdAt =
            new Date("2026-01-01T00:00:00.000Z");

        const organisation =
            new Organisation(
                "organisation-id",
                "tenant-id",
                "TITAN Organisation",
                "titan-organisation",
                RecordStatus.ACTIVE,
                createdAt,
                createdAt,
            );

        expect(organisation.tenantId)
            .toBe("tenant-id");

        organisation.suspend();

        expect(organisation.status)
            .toBe(RecordStatus.SUSPENDED);

        organisation.activate();

        expect(organisation.isActive())
            .toBe(true);

        organisation.updateDetails(
            "Updated Organisation",
            "updated-organisation",
        );

        expect(organisation.name)
            .toBe("Updated Organisation");

        expect(organisation.slug)
            .toBe("updated-organisation");

    });

    it("creates a tenant-owned User and enforces lifecycle transitions", () => {

        const user =
            User.create(
                "tenant-id",
                "organisation-id",
                "user@titan.test",
                "password-hash",
                "TITAN",
                "User",
            );

        expect(user.tenantId)
            .toBe("tenant-id");

        expect(user.status)
            .toBe(UserStatus.ACTIVE);

        expect(user.getFullName())
            .toBe("TITAN User");

        user.lock();

        expect(user.isLocked())
            .toBe(true);

        user.unlock();

        expect(user.isActive())
            .toBe(true);

        user.suspend();

        expect(user.status)
            .toBe(UserStatus.SUSPENDED);

        user.deactivate();

        expect(user.status)
            .toBe(UserStatus.INACTIVE);

    });

    it("creates and restores a tenant-owned Role", () => {

        const role =
            Role.create(
                "tenant-id",
                "Administrator",
                "Tenant administrator",
            );

        expect(role.tenantId)
            .toBe("tenant-id");

        role.rename("Platform Administrator");

        expect(role.name)
            .toBe("Platform Administrator");

        const restored =
            Role.restore(
                "role-id",
                "tenant-id",
                "Restored Role",
                null,
                new Date("2026-01-01T00:00:00.000Z"),
                new Date("2026-01-02T00:00:00.000Z"),
            );

        expect(restored.id)
            .toBe("role-id");

        expect(restored.tenantId)
            .toBe("tenant-id");

    });

    it("creates and restores a tenant-owned Permission", () => {

        const permission =
            Permission.create(
                "tenant-id",
                "users.read",
                "Read users",
                "Allows tenant user access",
            );

        expect(permission.tenantId)
            .toBe("tenant-id");

        expect(permission.getCode())
            .toBe("users.read");

        permission.rename("View users");

        expect(permission.name)
            .toBe("View users");

        const restored =
            Permission.restore(
                "permission-id",
                "tenant-id",
                "users.write",
                "Write users",
                null,
                new Date("2026-01-01T00:00:00.000Z"),
                new Date("2026-01-02T00:00:00.000Z"),
            );

        expect(restored.id)
            .toBe("permission-id");

        expect(restored.getCode())
            .toBe("users.write");

    });

    it("creates, expires and revokes a Session", () => {

        const activeSession =
            Session.create(
                "user-id",
                "session-jti",
                "refresh-token",
                new Date(Date.now() + 60_000),
            );

        expect(activeSession.status)
            .toBe(SessionStatus.ACTIVE);

        expect(activeSession.isActive())
            .toBe(true);

        expect(activeSession.isExpired())
            .toBe(false);

        activeSession.revoke();

        expect(activeSession.status)
            .toBe(SessionStatus.REVOKED);

        const expiredSession =
            new Session(
                "expired-session-id",
                "user-id",
                "expired-jti",
                "expired-refresh-token",
                SessionStatus.ACTIVE,
                new Date(Date.now() - 60_000),
                new Date(),
                new Date(),
            );

        expect(expiredSession.isExpired())
            .toBe(true);

    });

});
