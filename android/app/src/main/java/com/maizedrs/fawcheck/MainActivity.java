package com.maizedrs.fawcheck;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1002;
    private static final String PREFS_NAME = "fawcheck_android";
    private static final String PREF_WEB_APP_URL = "web_app_url";

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraPhotoUri;
    private boolean showingConfigPage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        setContentView(webView);

        configureWebView();
        requestCameraPermissionIfNeeded();
        loadConfiguredUrl();
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }
        CookieManager.getInstance().setAcceptCookie(true);

        webView.addJavascriptInterface(new ConfigBridge(), "FAWCheckAndroid");
        webView.setWebViewClient(new FawCheckWebViewClient());
        webView.setWebChromeClient(new FawCheckWebChromeClient());
    }

    private void loadConfiguredUrl() {
        showingConfigPage = false;
        webView.loadUrl(getConfiguredUrl());
    }

    private String getConfiguredUrl() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String storedUrl = prefs.getString(PREF_WEB_APP_URL, null);
        if (storedUrl == null || storedUrl.trim().isEmpty()) {
            return BuildConfig.WEB_APP_URL;
        }
        return storedUrl;
    }

    private void saveConfiguredUrl(String url) {
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .edit()
                .putString(PREF_WEB_APP_URL, url)
                .apply();
    }

    private void requestCameraPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
        }
    }

    private boolean hasCameraPermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                || checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    private void showConfigPage(String reason) {
        showingConfigPage = true;
        String currentUrl = htmlEscape(getConfiguredUrl());
        String errorMessage = htmlEscape(reason);
        String html = "<!doctype html>"
                + "<html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<style>"
                + "body{font-family:sans-serif;margin:0;background:#f6f1e4;color:#17231b;}"
                + "main{padding:28px 20px;max-width:560px;margin:0 auto;}"
                + "h1{font-size:24px;margin:0 0 10px;color:#1f5c38;}"
                + "p{line-height:1.45;margin:0 0 16px;}"
                + "label{display:block;font-weight:700;margin:22px 0 8px;}"
                + "input{box-sizing:border-box;width:100%;font-size:16px;padding:12px;border:1px solid #97a390;border-radius:6px;background:white;}"
                + "button{width:100%;margin-top:12px;padding:13px 16px;border:0;border-radius:6px;background:#1f5c38;color:white;font-weight:700;font-size:16px;}"
                + ".hint{font-size:14px;color:#506052;margin-top:18px;}"
                + ".error{background:#fff3dc;border-left:4px solid #c7832f;padding:12px;margin-top:16px;}"
                + "</style></head><body><main>"
                + "<h1>FAWCheck</h1>"
                + "<p>The Android wrapper could not open the web app. Enter the deployed app URL, or use your computer's local network URL while the Next.js server is running.</p>"
                + "<div class=\"error\">" + errorMessage + "</div>"
                + "<label for=\"url\">Web app URL</label>"
                + "<input id=\"url\" value=\"" + currentUrl + "\" autocomplete=\"off\" autocapitalize=\"none\" spellcheck=\"false\">"
                + "<button onclick=\"FAWCheckAndroid.openUrl(document.getElementById('url').value)\">Open FAWCheck</button>"
                + "<p class=\"hint\">For local testing on a physical Android phone, use something like http://192.168.1.7:3000 and make sure the phone is on the same Wi-Fi.</p>"
                + "</main></body></html>";
        webView.loadDataWithBaseURL("https://fawcheck.local/", html, "text/html", "UTF-8", null);
    }

    private static String htmlEscape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode != FILE_CHOOSER_REQUEST_CODE || filePathCallback == null) {
            return;
        }

        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            results = collectSelectedUris(data);
        }

        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
        cameraPhotoUri = null;
    }

    private Uri[] collectSelectedUris(Intent data) {
        ArrayList<Uri> uris = new ArrayList<>();

        if (data == null || (data.getData() == null && data.getClipData() == null)) {
            if (cameraPhotoUri != null) {
                uris.add(cameraPhotoUri);
            }
        } else if (data.getClipData() != null) {
            for (int index = 0; index < data.getClipData().getItemCount(); index++) {
                uris.add(data.getClipData().getItemAt(index).getUri());
            }
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }

        if (uris.isEmpty()) {
            return null;
        }

        return uris.toArray(new Uri[0]);
    }

    private File createImageFile() throws IOException {
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        File imageDirectory = new File(getExternalCacheDir(), "images");
        if (!imageDirectory.exists() && !imageDirectory.mkdirs()) {
            throw new IOException("Could not create image cache directory.");
        }
        return File.createTempFile("FAWCHECK_" + timestamp + "_", ".jpg", imageDirectory);
    }

    private Intent createCameraIntent() {
        if (!hasCameraPermission()) {
            return null;
        }

        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (cameraIntent.resolveActivity(getPackageManager()) == null) {
            return null;
        }

        try {
            File photoFile = createImageFile();
            cameraPhotoUri = FileProvider.getUriForFile(
                    this,
                    BuildConfig.APPLICATION_ID + ".fileprovider",
                    photoFile
            );
            cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
            cameraIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            return cameraIntent;
        } catch (IOException error) {
            cameraPhotoUri = null;
            return null;
        }
    }

    public class ConfigBridge {
        @JavascriptInterface
        public void openUrl(String url) {
            if (!showingConfigPage) {
                return;
            }

            final String normalizedUrl = url == null ? "" : url.trim();
            if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
                runOnUiThread(() -> showConfigPage("Use a URL that starts with http:// or https://."));
                return;
            }

            saveConfiguredUrl(normalizedUrl);
            runOnUiThread(() -> {
                showingConfigPage = false;
                webView.loadUrl(normalizedUrl);
            });
        }
    }

    private class FawCheckWebViewClient extends WebViewClient {
        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && request.isForMainFrame()) {
                showConfigPage(error.getDescription().toString());
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
            super.onReceivedHttpError(view, request, errorResponse);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && request.isForMainFrame()) {
                showConfigPage("HTTP " + errorResponse.getStatusCode() + " while opening " + request.getUrl());
            }
        }
    }

    private class FawCheckWebChromeClient extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
            }
            filePathCallback = callback;

            Intent imagePickerIntent = new Intent(Intent.ACTION_GET_CONTENT);
            imagePickerIntent.addCategory(Intent.CATEGORY_OPENABLE);
            imagePickerIntent.setType("image/*");

            Intent cameraIntent = createCameraIntent();
            Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
            chooserIntent.putExtra(Intent.EXTRA_INTENT, imagePickerIntent);
            chooserIntent.putExtra(Intent.EXTRA_TITLE, getString(R.string.image_chooser_title));
            if (cameraIntent != null) {
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cameraIntent});
            }

            try {
                startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
                return true;
            } catch (Exception error) {
                filePathCallback = null;
                return false;
            }
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
                return;
            }

            runOnUiThread(() -> {
                if (hasCameraPermission()) {
                    request.grant(request.getResources());
                } else {
                    request.deny();
                }
            });
        }
    }
}
