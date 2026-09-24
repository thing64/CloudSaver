# CloudSaver

CloudSaver is a serverless FinOps control plane that surfaces idle AWS
infrastructure, quantifies avoidable spend, and records remediation actions.

## Architecture

```text
frontend/  React, Vite, Tailwind CSS, Recharts
backend/   AWS SAM, API Gateway HTTP API, Lambda, DynamoDB
```

The browser reads findings from `GET /resources` and records a remediation
through `POST /resources/terminate`. The demo flow is enabled with
`?demo=true`; it returns deterministic sample findings without accessing
DynamoDB.

The Lambda intentionally has DynamoDB permissions only. The terminate endpoint
updates CloudSaver's finding state and does not receive broad permissions to
delete AWS infrastructure. Production resource deletion should be implemented
as a separately approved workflow with service-specific, least-privilege roles.

## Local development

Requirements:

- Node.js 20 or newer
- AWS SAM CLI for local emulation and deployment

Install and build the frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
npm run build
```

Set `VITE_API_BASE_URL` in `.env.local` to the `ApiUrl` output from the backend
stack. `VITE_DEMO_MODE=true` keeps the API in deterministic demonstration mode.

Install and test the backend:

```bash
cd backend
npm install
npm test
sam validate --lint --template template.yaml
```

Run the API locally after installing the SAM CLI:

```bash
cd backend
sam build
sam local start-api
```

## Deployment

Deploy the backend with a restrictive frontend origin:

```bash
cd backend
sam build
sam deploy --guided --parameter-overrides AllowedOrigin=https://app.example.com
```

For a production deployment, set `VITE_DEMO_MODE=false`, configure
`VITE_API_BASE_URL`, add an API Gateway authorizer, and place destructive cloud
actions behind an approval workflow. The included table uses on-demand billing,
server-side encryption, point-in-time recovery, and retained data resources.
