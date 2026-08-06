import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../../src/app";

import {
    createTestUser
} from "../../factories/user.factory";


describe("Authentication Login", () => {


    it("successfully authenticates a valid user", async () => {


        const {
            user,
            password
        } =
            await createTestUser();


        const response =
            await request(app)
                .post("/api/v1/auth/login")
                .send({

                    tenantId:
                        user.tenantId,

                    email:
                        user.email,

                    password,

                });


        expect(response.status)
            .toBe(200);


        expect(response.body.success)
            .toBe(true);


        expect(response.body.data)
            .toBeDefined();


    });


});
