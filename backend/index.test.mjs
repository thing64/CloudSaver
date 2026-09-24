import assert from "node:assert/strict";
import test from "node:test";

import { DEMO_RESOURCES, createHandler } from "./index.mjs";

const handler = createHandler({
  client: {
    send() {
      throw new Error("Demo requests must not call DynamoDB.");
    },
  },
  tableName: "test-table",
});

function event(method, path, options = {}) {
  return {
    requestContext: {
      requestId: "request-test-123",
      http: { method, path },
    },
    rawPath: path,
    ...options,
  };
}

test("GET /resources returns rich demo findings", async () => {
  const response = await handler(
    event("GET", "/resources", {
      queryStringParameters: { demo: "true" },
    }),
  );
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(body.source, "demo");
  assert.equal(body.items.length, DEMO_RESOURCES.length);
  assert.ok(body.items.some((resource) => resource.service === "RDS"));
  assert.ok(body.items.every((resource) => resource.monthlyWaste >= 0));
});

test("POST /resources/terminate returns an updated demo resource", async () => {
  const target = DEMO_RESOURCES.find(
    (resource) => resource.status === "idle",
  );
  const response = await handler(
    event("POST", "/resources/terminate", {
      queryStringParameters: { demo: "true" },
      body: JSON.stringify({ resourceId: target.resourceId }),
    }),
  );
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(body.resource.resourceId, target.resourceId);
  assert.equal(body.resource.status, "terminated");
  assert.match(body.resource.terminatedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("POST /resources/terminate validates the request body", async () => {
  const response = await handler(
    event("POST", "/resources/terminate", {
      body: JSON.stringify({}),
    }),
  );

  assert.equal(response.statusCode, 400);
  assert.equal(
    JSON.parse(response.body).message,
    "A valid resourceId is required.",
  );
});

test("unknown routes return a JSON 404 response", async () => {
  const response = await handler(event("GET", "/health"));

  assert.equal(response.statusCode, 404);
  assert.equal(JSON.parse(response.body).message, "Route not found.");
});
