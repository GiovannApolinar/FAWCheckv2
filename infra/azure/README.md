# Azure deployment notes

This folder contains the Azure deployment assets for public pilot testing.

## What gets provisioned

- Azure Container Registry
- Azure Container Apps environment
- Azure Blob Storage with versioning and soft delete enabled
- Azure SQL Database plus the "Allow Azure Services" firewall rule
- Three Azure Container Apps:
  - `frontend` with public ingress
  - `backend` with public ingress
  - `inference` with internal ingress only

## Required GitHub configuration

Repository secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_SQL_ADMIN_LOGIN`
- `AZURE_SQL_ADMIN_PASSWORD`
- `AZURE_JWT_KEY`
- `AZURE_BOOTSTRAP_ADMIN_EMAIL`
- `AZURE_BOOTSTRAP_ADMIN_PASSWORD`
- `SMOKE_TEST_EMAIL`
- `SMOKE_TEST_PASSWORD`
- cutover only: `LEGACY_MONGODB_CONNECTION_STRING`

Repository variables:

- `AZURE_RESOURCE_GROUP`
- `AZURE_LOCATION`
- `AZURE_CONTAINER_REGISTRY_NAME`
- `AZURE_MANAGED_ENVIRONMENT_NAME`
- `AZURE_LOG_ANALYTICS_WORKSPACE_NAME`
- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_SQL_SERVER_NAME`
- `AZURE_SQL_DATABASE_NAME`
- `AZURE_FRONTEND_APP_NAME`
- `AZURE_BACKEND_APP_NAME`
- `AZURE_INFERENCE_APP_NAME`
- `AZURE_PUBLIC_APP_BASE_URL`
- `AZURE_PUBLIC_API_BASE_URL`
- optional `RUN_LEGACY_IMPORT` (`true` for the first cutover run only)
- cutover only `LEGACY_MONGODB_DATABASE_NAME`
- optional cutover overrides `LEGACY_MONGODB_USER_COLLECTION_NAME`
- optional cutover overrides `LEGACY_MONGODB_ASSESSMENT_COLLECTION_NAME`
- optional `AZURE_SQL_DATABASE_SKU_NAME`
- optional `AZURE_SQL_DATABASE_SKU_TIER`

## Deploy flow

1. Run the `Deploy Azure` workflow.
2. The workflow deploys `foundation.bicep`.
3. It builds and pushes all three container images to ACR.
4. It runs EF Core migrations against Azure SQL.
5. If `RUN_LEGACY_IMPORT=true`, it runs the one-time Mongo-to-SQL/blob migrator before app deployment.
6. It deploys the three Container Apps with `apps.bicep`.
7. It runs `scripts/smoke-test.mjs` against the public app and API URLs.

## First cutover checklist

1. Freeze writes on the legacy Mongo-backed app and take a backup.
2. Set `RUN_LEGACY_IMPORT=true` and provide the legacy Mongo secret/variables.
3. Set `SMOKE_TEST_EMAIL` and `SMOKE_TEST_PASSWORD` to the bootstrap admin account or another already-approved admin account.
4. Run `Deploy Azure` and verify the smoke test, imported logins, assessment counts, and image reads.
5. Set `RUN_LEGACY_IMPORT=false` after the one-time import succeeds so later deploys skip the legacy Mongo dependency.

## Custom domains

The Bicep templates expect known public base URLs for the frontend and backend because those values are injected into app configuration and backend CORS. Domain binding and certificate validation still require DNS work outside this repo.
