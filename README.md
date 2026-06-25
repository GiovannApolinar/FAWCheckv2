# FAWCheck (maize-drs)

FAWCheck is a web application for Fall Armyworm foliar damage assessment in maize. It combines a Next.js frontend, an ASP.NET Core backend API, and a Python inference service running a fine-tuned Keras model.

## Quick Start

> Run all three services simultaneously — each in its own terminal.

### Prerequisites

#### Windows

```powershell
winget install OpenJS.NodeJS.LTS       # Node.js 20+
winget install Microsoft.DotNet.SDK.9  # .NET SDK 9.0+
winget install Python.Python.3.11      # Python 3.11+
```

SQL Server: download **SQL Server Express** (free) from [microsoft.com/sql-server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads). During setup, note your connection string — typically:
```
Server=localhost\SQLEXPRESS;Database=MaizeDRS;Trusted_Connection=True;TrustServerCertificate=True;
```

#### Linux / WSL

**Node.js 20+ via nvm**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

**.NET SDK 9.0+ via apt**
```bash
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O /tmp/ms.deb
sudo dpkg -i /tmp/ms.deb && sudo apt-get update
sudo apt-get install -y dotnet-sdk-9.0
```

**Python 3.11+**
```bash
sudo apt install python3.11 python3.11-venv python3-pip
```

**SQL Server via Docker (recommended)**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" \
  -p 1433:1433 --name sql-server \
  -d mcr.microsoft.com/mssql/server:2022-latest
# Connection string: Server=localhost,1433;Database=MaizeDRS;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;
```

---

### 1. Clone and configure

```bash
git clone <repo-url>
cd <repo-name>
cp .env.example .env.local
```

Edit `.env.local` — minimum required:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5268
```

### 2. Start the Python inference API — Terminal 1

```bash
cd maize-api
python3 -m venv .venv
```

```bash
# Windows:
.venv\Scripts\activate

# Linux / WSL:
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
python app.py
# Inference running at http://localhost:5000
```

### 3. Start the ASP.NET Core backend — Terminal 2

Set required environment variables in your shell (or a local `dev-env.sh`):

```bash
# Windows (PowerShell):
$env:ConnectionStrings__Default="<sql-connection-string>"
$env:Jwt__Key="<any-random-32+-char-string>"   # each developer uses their own — does NOT need to match teammates
$env:Auth__BootstrapAdminEmail="admin@example.com"
$env:Auth__BootstrapAdminPassword="<strong-password>"

# Linux / WSL (bash):
export ConnectionStrings__Default="<sql-connection-string>"
export Jwt__Key="<any-random-32+-char-string>"
export Auth__BootstrapAdminEmail="admin@example.com"
export Auth__BootstrapAdminPassword="<strong-password>"
```

> `BlobStorage__Provider` defaults to `InMemory` and `Inference__BaseUrl` defaults to `http://localhost:5000` — no extra config needed for local development.

```bash
cd maize-drs-backend
dotnet tool restore
dotnet restore
dotnet tool run dotnet-ef database update
dotnet run --launch-profile http
# Backend running at http://localhost:5268
```

### 4. Start the Next.js frontend — Terminal 3

```bash
# From repo root
npm install
npm run dev
# Frontend running at http://localhost:3000
```

### First-time login

1. Open [http://localhost:3000](http://localhost:3000) and register an account.
2. The bootstrap admin (`Auth__BootstrapAdminEmail`) is automatically approved on first run.
3. Log in as admin and approve other pending accounts via the admin panel.

---

## Architecture Overview

- **Frontend** (`src/`) — Next.js 15, React 19, Tailwind CSS, TensorFlow.js
- **Backend** (`maize-drs-backend/`) — ASP.NET Core 9, Entity Framework Core, SQL Server, Azure Blob Storage
- **Inference** (`maize-api/`) — Python Flask, Keras fine-tuned model

Request flow:
1. Frontend submits assessments to `POST /api/assessment/evaluate-save`.
2. Backend computes rule score, calls Python `/predict`, stores the image in Blob storage, and saves record metadata in SQL.
3. Frontend reads records from backend (`GET /api/assessment`, `GET /api/assessment/{id}`).
4. Detail views return an authenticated backend image route (`GET /api/assessment/{id}/image`).

## Backend Config Reference

Full list of supported backend settings:

```text
ConnectionStrings__Default=<sql-connection-string>
Database__Provider=SqlServer
Database__AutoMigrate=true
Jwt__Key=<jwt-signing-key>
Jwt__Issuer=https://api.example.com
Jwt__Audience=https://app.example.com
Auth__BootstrapAdminEmail=admin@example.com
Auth__BootstrapAdminPassword=<strong-admin-password>
BlobStorage__Provider=InMemory                        # or AzureBlob for production
BlobStorage__ConnectionString=<azure-blob-connection-string>
BlobStorage__ContainerName=assessment-images
Inference__BaseUrl=http://localhost:5000
Inference__PredictPath=/predict
Cors__AllowedOrigins=<comma-separated-origins>
```

## Python Inference API Config

Optional environment overrides:

```text
FAWCHECK_MODEL_PATH=maize-api/models/fawcheck_finetuned.keras
FAWCHECK_LABEL_MAP_PATH=maize-api/models/label_map.json
```

## Authentication Notes

- New sign-ups create pending accounts through `POST /api/auth/register` and must be approved by an admin before they can log in.
- The first admin account is bootstrapped from `Auth:BootstrapAdminEmail` and `Auth:BootstrapAdminPassword`.
- Approved users log in through `POST /api/auth/login`; pending users receive a `403` with a `pending_approval` status.
- Admins review sign-ups through `GET /api/admin/users/pending` and approve them with `POST /api/admin/users/{id}/approve`.
- The frontend stores the JWT in browser storage and mirrors it into an HTTP-only `token` cookie for route protection.
- Assessment images are protected by bearer auth and streamed from `GET /api/assessment/{id}/image`.

## Test Commands

```bash
# Backend build
dotnet build maize-drs-backend/maize-drs-backend.csproj

# Backend tests
dotnet test maize-drs-backend.Tests/maize-drs-backend.Tests.csproj

# Frontend type/build check
npm run build

# Inference tests
python -m pytest maize-api/tests -q
```

## Azure Deployment

- Dockerfiles are included for the frontend, backend, and inference services.
- GitHub Actions workflows live under `.github/workflows/`.
- Azure Bicep templates live under `infra/azure/`.
- See `infra/azure/README.md` for required GitHub secrets, variables, and deployment flow.

## Main API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login |
| GET | `/api/admin/users/pending` | List pending users |
| POST | `/api/admin/users/{id}/approve` | Approve user |
| POST | `/api/assessment/evaluate-save` | Submit assessment |
| GET | `/api/assessment` | List assessments |
| GET | `/api/assessment/{id}` | Assessment detail |
| GET | `/api/assessment/{id}/image` | Stream assessment image |
| DELETE | `/api/assessment/{id}` | Delete assessment |
| GET | `/api/assessment/export/csv` | Export CSV |
| POST | `/api/assessment/submit` | Legacy payload alias |

## Legacy Mongo Cutover

The first production cutover can import legacy Mongo users and assessments into SQL + Blob storage while preserving existing passwords.

```text
LEGACY_MONGODB_CONNECTION_STRING=<legacy-mongo-connection-string>
LEGACY_MONGODB_DATABASE_NAME=MaizeDRS
LEGACY_MONGODB_USER_COLLECTION_NAME=Users
LEGACY_MONGODB_ASSESSMENT_COLLECTION_NAME=Assessments
```

```bash
ConnectionStrings__Default="<sql-connection-string>" \
Database__Provider=SqlServer \
BlobStorage__Provider=AzureBlob \
BlobStorage__ConnectionString="<azure-blob-connection-string>" \
BlobStorage__ContainerName=assessment-images \
LEGACY_MONGODB_CONNECTION_STRING="<legacy-mongo-connection-string>" \
LEGACY_MONGODB_DATABASE_NAME=MaizeDRS \
dotnet run --project maize-drs-backend.Migrator/maize-drs-backend.Migrator.csproj --configuration Release
```

## Public Testing Notes

- Testers access the deployed app through a public HTTPS link.
- Android browsers may expose an install prompt or an `Install app` menu action.
- iPhone and iPad users install via the browser share sheet → `Add to Home Screen`.
