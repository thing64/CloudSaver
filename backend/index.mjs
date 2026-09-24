import {
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const RESPONSE_HEADERS = {
  "access-control-allow-headers": "content-type,authorization",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-origin": process.env.ALLOWED_ORIGIN ?? "*",
  "content-type": "application/json; charset=utf-8",
};

export const DEMO_RESOURCES = Object.freeze([
  {
    resourceId: "i-0f92bce471d8a2101",
    name: "preview-api-runner",
    service: "EC2",
    region: "us-east-1",
    finding: "Untagged instance below 2% CPU for 21 days",
    owner: "Unassigned",
    severity: "critical",
    ageDays: 94,
    dailyWaste: 18.72,
    monthlyWaste: 561.6,
    status: "idle",
    detectedAt: "2026-09-22T08:30:00.000Z",
  },
  {
    resourceId: "vol-0c75f24118ab51dd2",
    name: "legacy-orders-snapshot-volume",
    service: "EBS",
    region: "us-east-1",
    finding: "Unattached gp3 volume with no activity for 45 days",
    owner: "Platform",
    severity: "high",
    ageDays: 186,
    dailyWaste: 4.27,
    monthlyWaste: 128.1,
    status: "idle",
    detectedAt: "2026-09-21T14:12:00.000Z",
  },
  {
    resourceId: "database-2f4a70c9",
    name: "analytics-sandbox",
    service: "RDS",
    region: "us-west-2",
    finding: "Idle db.r6g.large instance with zero connections",
    owner: "Data",
    severity: "critical",
    ageDays: 67,
    dailyWaste: 24.96,
    monthlyWaste: 748.8,
    status: "idle",
    detectedAt: "2026-09-20T19:45:00.000Z",
  },
  {
    resourceId: "nat-0b8e348fe65278d16",
    name: "retired-staging-nat",
    service: "NAT Gateway",
    region: "eu-west-1",
    finding: "No processed bytes during the last 14 days",
    owner: "Core Infra",
    severity: "high",
    ageDays: 122,
    dailyWaste: 4.91,
    monthlyWaste: 147.3,
    status: "idle",
    detectedAt: "2026-09-19T11:08:00.000Z",
  },
  {
    resourceId: "eipalloc-07c5d4d130f644ac8",
    name: "Unlabeled elastic IP",
    service: "Elastic IP",
    region: "ap-southeast-1",
    finding: "Public IPv4 address is not associated with a resource",
    owner: "Unassigned",
    severity: "medium",
    ageDays: 38,
    dailyWaste: 0.12,
    monthlyWaste: 3.6,
    status: "idle",
    detectedAt: "2026-09-18T06:24:00.000Z",
  },
  {
    resourceId: "app/cloudsaver-old-alb/50dc6c495c0c9188",
    name: "cloudsaver-old-alb",
    service: "Load Balancer",
    region: "us-east-2",
    finding: "No requests or healthy targets for 30 days",
    owner: "Growth",
    severity: "high",
    ageDays: 211,
    dailyWaste: 0.83,
    monthlyWaste: 24.9,
    status: "idle",
    detectedAt: "2026-09-17T23:01:00.000Z",
  },
  {
    resourceId: "i-05d7a9ccfea8b6e91",
    name: "completed-load-test",
    service: "EC2",
    region: "eu-central-1",
    finding: "Compute-optimized instance idle after load test",
    owner: "Performance",
    severity: "high",
    ageDays: 26,
    dailyWaste: 13.44,
    monthlyWaste: 403.2,
    status: "idle",
    detectedAt: "2026-09-17T09:16:00.000Z",
  },
  {
    resourceId: "vol-09b3fc67d4104e891",
    name: "migrated-catalog-data",
    service: "EBS",
    region: "us-west-1",
    finding: "Unattached io2 volume remediated by the storage team",
    owner: "Storage",
    severity: "high",
    ageDays: 309,
    dailyWaste: 8.4,
    monthlyWaste: 252,
    status: "terminated",
    detectedAt: "2026-09-10T16:40:00.000Z",
    terminatedAt: "2026-09-16T10:22:00.000Z",
  },
]);

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: RESPONSE_HEADERS,
    body: payload === undefined ? "" : JSON.stringify(payload),
  };
}

function getRoute(event) {
  const method = (
    event?.requestContext?.http?.method ??
    event?.httpMethod ??
    ""
  ).toUpperCase();
  const rawPath =
    event?.rawPath ?? event?.requestContext?.http?.path ?? event?.path ?? "/";
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;

  return { method, path };
}

function getQueryParameters(event) {
  if (event?.queryStringParameters) {
    return event.queryStringParameters;
  }

  return Object.fromEntries(new URLSearchParams(event?.rawQueryString ?? ""));
}

function isDemoRequest(event, body) {
  const value = getQueryParameters(event).demo ?? body?.demo;
  return value === true || value === "true" || value === "1";
}

function parseBody(event) {
  if (!event?.body) {
    return {};
  }

  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

function validateResourceId(resourceId) {
  if (
    typeof resourceId !== "string" ||
    resourceId.trim().length === 0 ||
    resourceId.length > 512
  ) {
    throw new HttpError(400, "A valid resourceId is required.");
  }

  return resourceId.trim();
}

function deserializeAttribute(attribute) {
  if ("S" in attribute) return attribute.S;
  if ("N" in attribute) return Number(attribute.N);
  if ("BOOL" in attribute) return attribute.BOOL;
  if ("NULL" in attribute) return null;
  if ("L" in attribute) return attribute.L.map(deserializeAttribute);
  if ("M" in attribute) return deserializeItem(attribute.M);
  if ("SS" in attribute) return attribute.SS;
  if ("NS" in attribute) return attribute.NS.map(Number);
  return undefined;
}

function deserializeItem(item = {}) {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [
      key.charAt(0).toLowerCase() + key.slice(1),
      deserializeAttribute(value),
    ]),
  );
}

function decodeNextToken(token) {
  if (!token) return undefined;

  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    throw new HttpError(400, "The nextToken query parameter is invalid.");
  }
}

function encodeNextToken(key) {
  if (!key) return null;
  return Buffer.from(JSON.stringify(key), "utf8").toString("base64url");
}

async function listResources({ client, tableName, event }) {
  const query = getQueryParameters(event);

  if (isDemoRequest(event)) {
    return {
      items: DEMO_RESOURCES.map((resource) => ({ ...resource })),
      nextToken: null,
      source: "demo",
    };
  }

  if (!tableName) {
    throw new Error("COST_SAVINGS_TABLE is not configured.");
  }

  const requestedLimit = Number.parseInt(query.limit ?? "100", 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 100;
  const result = await client.send(
    new ScanCommand({
      TableName: tableName,
      Limit: limit,
      ExclusiveStartKey: decodeNextToken(query.nextToken),
    }),
  );

  return {
    items: (result.Items ?? []).map(deserializeItem),
    nextToken: encodeNextToken(result.LastEvaluatedKey),
    source: "dynamodb",
  };
}

async function terminateResource({ client, tableName, event }) {
  const body = parseBody(event);
  const resourceId = validateResourceId(body.resourceId);
  const terminatedAt = new Date().toISOString();

  if (isDemoRequest(event, body)) {
    const resource = DEMO_RESOURCES.find(
      (candidate) => candidate.resourceId === resourceId,
    );

    if (!resource) {
      throw new HttpError(404, "Resource was not found.");
    }

    return { ...resource, status: "terminated", terminatedAt };
  }

  if (!tableName) {
    throw new Error("COST_SAVINGS_TABLE is not configured.");
  }

  try {
    const result = await client.send(
      new UpdateItemCommand({
        TableName: tableName,
        Key: { ResourceId: { S: resourceId } },
        ConditionExpression: "attribute_exists(ResourceId)",
        UpdateExpression:
          "SET #resourceStatus = :terminated, TerminatedAt = :terminatedAt, UpdatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#resourceStatus": "Status",
        },
        ExpressionAttributeValues: {
          ":terminated": { S: "terminated" },
          ":terminatedAt": { S: terminatedAt },
          ":updatedAt": { S: terminatedAt },
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    return deserializeItem(result.Attributes);
  } catch (error) {
    if (error?.name === "ConditionalCheckFailedException") {
      throw new HttpError(404, "Resource was not found.");
    }
    throw error;
  }
}

export function createHandler({
  client = new DynamoDBClient({}),
  tableName = process.env.COST_SAVINGS_TABLE,
} = {}) {
  return async function cloudsaverHandler(event = {}) {
    const { method, path } = getRoute(event);
    const requestId =
      event?.requestContext?.requestId ??
      event?.requestContext?.http?.requestId ??
      "local";

    try {
      if (method === "OPTIONS") {
        return jsonResponse(204);
      }

      if (method === "GET" && /\/resources$/.test(path)) {
        const result = await listResources({ client, tableName, event });
        return jsonResponse(200, {
          ...result,
          generatedAt: new Date().toISOString(),
        });
      }

      if (method === "POST" && /\/resources\/terminate$/.test(path)) {
        const resource = await terminateResource({ client, tableName, event });
        return jsonResponse(200, {
          message: "Resource remediation recorded.",
          resource,
        });
      }

      return jsonResponse(404, { message: "Route not found." });
    } catch (error) {
      const statusCode =
        error instanceof HttpError ? error.statusCode : error?.statusCode ?? 500;
      const message =
        statusCode >= 500
          ? "CloudSaver could not complete the request."
          : error.message;

      console.error(
        JSON.stringify({
          level: "error",
          requestId,
          method,
          path,
          errorName: error?.name,
          errorMessage: error?.message,
        }),
      );

      return jsonResponse(statusCode, { message, requestId });
    }
  };
}

export const handler = createHandler();
