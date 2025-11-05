# Troubleshooting: FileUtils Import Error

## Problem
Still getting FileUtils import errors even after adding dependency declaration to plugin.xml:

```
error: cannot find symbol
import org.apache.cordova.file.FileUtils;
```

## Root Cause Analysis

The error occurs because:
1. **FileTransfer.java** (line 836) expects to find a FileUtils plugin via `pm.getPlugin("File")`
2. **FileTransfer.java** (line 49) imports `org.apache.cordova.file.FileUtils` 
3. The **cordova-plugin-file-compatible** provides this class and registers as "File"
4. However, the file-compatible plugin is not properly installed in your main Cordova app

## Immediate Solution

The key issue is that both plugins need to be installed in your **main Cordova application**, not just in this plugin workspace. The dependency declaration in plugin.xml helps, but for local development you need to manually install both plugins.

### Step 1: Go to Your Main Cordova App Directory
```bash
cd /Users/avifainfotech/Desktop/Github/godial/godial-app-enterprise-v2/cordova
```

### Step 2: Remove and Reinstall Plugins in Correct Order
```bash
# Remove both plugins if already installed
cordova plugin remove cordova-plugin-file-transfer-compatible
cordova plugin remove cordova-plugin-file-compatible

# Install file plugin FIRST (this provides FileUtils class)
cordova plugin add /Users/avifainfotech/Desktop/Github/godial/cordova-plugin-file-compatible

# Then install file-transfer plugin (this depends on FileUtils)
cordova plugin add /Users/avifainfotech/Desktop/Github/godial/cordova-plugin-file-transfer-compatible
```

### Step 3: Verify Plugin Installation
```bash
cordova plugin list
```

You should see both:
- cordova-plugin-file-compatible
- cordova-plugin-file-transfer-compatible

### Step 4: Clean and Rebuild
```bash
# Clean the platform
cordova clean android

# Remove and re-add platform to ensure clean build
cordova platform remove android
cordova platform add android

# Build
cordova build android
```

## Why This Fixes It

1. **Plugin Registration**: cordova-plugin-file-compatible registers as feature name "File" in your app
2. **Class Availability**: FileUtils.java becomes available in the classpath
3. **Plugin Manager Access**: `pm.getPlugin("File")` in FileTransfer.java can now find the FileUtils plugin
4. **Build Order**: Cordova compiles dependencies before dependents

## Verification

After following the steps above, check that:

1. **No compilation errors**: The "cannot find symbol" error should be gone
2. **Plugin listing**: Both plugins appear in `cordova plugin list`
3. **Feature registration**: Look for both "File" and "FileTransfer" features in your app's config.xml
4. **FileUtils.java presence**: The file should exist in your platforms/android directory

## If Still Not Working

If the issue persists:

1. **Check plugin.xml syntax**: Ensure the dependency declaration is correct
2. **Verify paths**: Make sure you're using absolute paths for local plugins
3. **Check Cordova version**: Ensure compatibility with cordova-android >= 12.0.0
4. **Manual verification**: Check if FileUtils.java exists in platforms/android/app/src/main/java/org/apache/cordova/file/

## Alternative: Use Git URLs

If local installation continues to have issues, you can try installing directly from GitHub:

```bash
cordova plugin add https://github.com/go-dial/cordova-plugin-file-compatible.git
cordova plugin add https://github.com/go-dial/cordova-plugin-file-transfer-compatible.git
```