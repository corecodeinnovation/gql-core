import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";

describe("GraphQL endpoint (smoke)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("responde la query projects del schema stub", () => {
    return request(app.getHttpServer() as App)
      .post("/graphql")
      .send({ query: "{ projects { id name } }" })
      .expect(200)
      .expect((res) => {
        const body = res.body as { errors?: unknown; data?: { projects?: unknown } };
        expect(body.errors).toBeUndefined();
        expect(body.data?.projects).toEqual([]);
      });
  });
});
