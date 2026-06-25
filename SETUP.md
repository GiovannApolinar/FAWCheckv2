# Development Set-up

FAWCheck is composed of three local services:

- Next.js frontend in `src/`
- ASP.NET Core backend API in `maize-drs-backend/`
- Python inference API in `maize-api/`

## Prerequisites

- Git
- Node.js 20 or later, with npm
- .NET SDK 9.0 or later
- Python 3.11 or later, with pip
- SQL Server, SQL Server LocalDB, or Azure SQL for backend data storage
- Android Studio, Android SDK, Gradle, and an Android phone only if testing the Android WebView wrapper
- IDE: Visual Studio Code, Visual Studio 2022, or Android Studio

## Test Files

The project includes these test files:

- Frontend smoke test: `scripts/smoke-test.mjs`
- Python inference tests: `maize-api/tests/test_app.py`
- Backend tests:
  - `maize-drs-backend.Tests/AssessmentApiIntegrationTests.cs`
  - `maize-drs-backend.Tests/RuleScoringServiceTests.cs`
  - `maize-drs-backend.Tests/FusionServiceTests.cs`
  - `maize-drs-backend.Tests/LegacyImportIntegrationTests.cs`

## Instructions

1. Install the required interpreters and SDKs:

   - Node.js: https://nodejs.org/
   - .NET SDK 9.0: https://dotnet.microsoft.com/download
   - Python: https://www.python.org/downloads/
   - SQL Server Developer or Express: https://www.microsoft.com/sql-server/sql-server-downloads
   - Android Studio: https://developer.android.com/studio

2. Clone the repository and open the project folder:

   ```powershell
   git clone <repository-url>
   cd maize-drs
   ```

3. Configure local environment variables.

   Create or edit `.env.local` in the project root:

   ```text
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5268
   ```

   Configure the backend using environment variables or `maize-drs-backend/appsettings.Development.json`.
   At minimum, set a SQL connection string, JWT settings, admin account, and inference URL:

   ```powershell
   $env:ConnectionStrings__Default="Server=(localdb)\MSSQLLocalDB;Database=MaizeDrs;Trusted_Connection=True;TrustServerCertificate=True"
   $env:Database__Provider="SqlServer"
   $env:Database__AutoMigrate="true"
   $env:Jwt__Key="replace-with-a-long-local-development-signing-key"
   $env:Jwt__Issuer="http://localhost:5268"
   $env:Jwt__Audience="http://localhost:3000"
   $env:Auth__BootstrapAdminEmail="admin@example.com"
   $env:Auth__BootstrapAdminPassword="ChangeMe123!"
   $env:BlobStorage__Provider="InMemory"
   $env:Inference__BaseUrl="http://localhost:5000"
   $env:Inference__PredictPath="/predict"
   ```

4. Install frontend packages from the project root:

   ```powershell
   npm install
   ```

5. Install Python inference packages:

   ```powershell
   cd maize-api
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   cd ..
   ```

6. Restore backend packages and apply database migrations:

   ```powershell
   cd maize-drs-backend
   dotnet tool restore
   dotnet restore
   dotnet tool run dotnet-ef database update
   cd ..
   ```

7. Run the Python inference API in one terminal:

   ```powershell
   cd maize-api
   .\.venv\Scripts\Activate.ps1
   python app.py
   ```

   Default inference endpoint:

   ```text
   http://localhost:5000/predict
   ```

8. Run the ASP.NET Core backend API in a second terminal:

   ```powershell
   cd maize-drs-backend
   dotnet run --launch-profile http
   ```

   Default backend URL:

   ```text
   http://localhost:5268
   ```

9. Run the Next.js frontend in a third terminal:

   ```powershell
   npm run dev
   ```

   Open the app at:

   ```text
   http://localhost:3000
   ```

10. Log in using the bootstrap admin account configured earlier:

    ```text
    Email: admin@example.com
    Password: ChangeMe123!
    ```

## Running Tests

Run the backend tests:

```powershell
dotnet test maize-drs-backend.Tests/maize-drs-backend.Tests.csproj
```

Run the Python inference tests:

```powershell
cd maize-api
.\.venv\Scripts\Activate.ps1
python -m pytest tests -q
cd ..
```

Run the frontend production build check:

```powershell
npm run build
```

Run the frontend smoke test after the app is running:

```powershell
node scripts/smoke-test.mjs
```

## Android Phone Testing

The Android project is a WebView wrapper around the running web app. Start the frontend on a URL reachable by the phone, such as the computer's Wi-Fi IP address.

Build a debug APK:

```powershell
cd android
gradle --no-daemon :app:assembleDebug -PwebAppUrl=http://<computer-ip-address>:3000
cd ..
```

The APK can also be built from Android Studio by opening the `android/` folder and running the `app` debug build.

Install the generated APK on an Android phone:

```powershell
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Binary Download

No public binary download link is included in this repository. For Android testing, build the debug APK locally from the `android/` folder. The generated file is:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For deployment, Dockerfiles are available for the frontend, backend, and Python inference API, and Azure infrastructure templates are available in `infra/azure/`.
