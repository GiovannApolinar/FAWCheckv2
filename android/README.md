# FAWCheck Android APK

This folder contains a lightweight Android WebView wrapper for the FAWCheck web app.

The debug APK built in this workspace is:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

By default, the APK opens the web app URL compiled into `BuildConfig.WEB_APP_URL`. If the URL is unreachable, the app shows a small configuration screen where you can enter a different `http://` or `https://` URL.

For local phone testing, run the frontend on your computer's network interface and build the APK with your computer's Wi-Fi IP address:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT="$env:LOCALAPPDATA\Android\Sdk"
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
& "$env:USERPROFILE\.gradle\wrapper\dists\gradle-7.6.3-all\aocdy2d2z8kodnny3rsumj8i8\gradle-7.6.3\bin\gradle.bat" --no-daemon :app:assembleDebug -PwebAppUrl=http://192.168.1.7:3000
```

For a release-like APK, rebuild with the deployed HTTPS URL:

```powershell
& "$env:USERPROFILE\.gradle\wrapper\dists\gradle-7.6.3-all\aocdy2d2z8kodnny3rsumj8i8\gradle-7.6.3\bin\gradle.bat" --no-daemon :app:assembleDebug -PwebAppUrl=https://your-deployed-app.example.com
```

This is a debug-signed APK for direct testing. Publishing to Google Play requires a release build signed with a private release key.
