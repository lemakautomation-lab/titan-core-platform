import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    NextFunction,
    Response,
} from "express";

const mocks = vi.hoisted(() => ({
    hasPermission: vi.fn(),
    recordPermissionDenied: vi.fn(),
    getContext: vi.fn(),
}));

vi.mock(
    "../../../src/infrastructure/composition/authorization.module",
    () => ({
        authorizationModule: {
            authorizationService: {
                hasPermission:
                    mocks.hasPermission,
            },
        },
    }),
);

vi.mock(
    "../../../src/infrastructure/composition/audit-log.module",
    () => ({
        auditLogModule: {
            securityEventService: {
                recordPermissionDenied:
                    mocks.recordPermissionDenied,
            },
        },
    }),
);

vi.mock(
    "../../../src/shared/context/request-context.service",
    () => ({
        requestContextService: {
            get: mocks.getContext,
        },
    }),
);

import {
    requirePermission,
} from "../../../src/middleware/authorization.middleware";

import {
    UnauthorizedException,
} from "../../../src/shared/exceptions/unauthorized.exception";

import {
    ForbiddenException,
} from "../../../src/shared/exceptions/forbidden.exception";

function request(user?: {
    userId: string;
    tenantId: string;
}) {
    return {
        user,
        method: "GET",
        originalUrl: "/protected",
        ip: "127.0.0.1",
        requestId: "request-1",
        get: vi.fn().mockReturnValue(
            "test-agent",
        ),
    };
}

describe("requirePermission", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getContext.mockReturnValue(
            undefined,
        );
        mocks.recordPermissionDenied
            .mockResolvedValue(undefined);
    });

    it("rejects a request without an authenticated principal", async () => {
        const next = vi.fn();

        await requirePermission(
            "users.read",
        )(
            request() as never,
            {} as Response,
            next as NextFunction,
        );

        expect(mocks.hasPermission)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledWith(
                expect.any(
                    UnauthorizedException,
                ),
            );
    });

    it("audits and rejects a denied permission", async () => {
        mocks.hasPermission
            .mockResolvedValue(false);

        const next = vi.fn();

        await requirePermission(
            "users.read",
        )(
            request({
                userId: "user-a",
                tenantId: "tenant-a",
            }) as never,
            {} as Response,
            next as NextFunction,
        );

        expect(mocks.hasPermission)
            .toHaveBeenCalledWith(
                "user-a",
                "tenant-a",
                "users.read",
            );

        expect(
            mocks.recordPermissionDenied,
        ).toHaveBeenCalledWith(
            "tenant-a",
            "user-a",
            "users.read",
            {
                method: "GET",
                path: "/protected",
                ipAddress: "127.0.0.1",
                userAgent: "test-agent",
                requestId: "request-1",
            },
        );

        expect(next)
            .toHaveBeenCalledWith(
                expect.any(
                    ForbiddenException,
                ),
            );
    });

    it("allows access and records the granted code in context", async () => {
        mocks.hasPermission
            .mockResolvedValue(true);

        const context = {
            security: {
                permissions: [] as string[],
            },
        };

        mocks.getContext
            .mockReturnValue(context);

        const next = vi.fn();

        await requirePermission(
            "users.read",
        )(
            request({
                userId: "user-a",
                tenantId: "tenant-a",
            }) as never,
            {} as Response,
            next as NextFunction,
        );

        expect(context.security.permissions)
            .toEqual([
                "users.read",
            ]);

        expect(
            mocks.recordPermissionDenied,
        ).not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledWith();
    });

    it("fails safely when permission resolution throws", async () => {
        const failure =
            new Error(
                "Permission resolution failed",
            );

        mocks.hasPermission
            .mockRejectedValue(failure);

        const next = vi.fn();

        await requirePermission(
            "users.read",
        )(
            request({
                userId: "user-a",
                tenantId: "tenant-a",
            }) as never,
            {} as Response,
            next as NextFunction,
        );

        expect(next)
            .toHaveBeenCalledWith(
                failure,
            );

        expect(
            mocks.recordPermissionDenied,
        ).not.toHaveBeenCalled();
    });
});
