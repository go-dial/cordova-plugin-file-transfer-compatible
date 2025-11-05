# Fix for FileUtils Import Issue

## Problem

The cordova-plugin-file-transfer-compatible was failing to build on Android with the following error:

```
error: cannot find symbol
import org.apache.cordova.file.FileUtils;
                              ^
  symbol:   class FileUtils
  location: package org.apache.cordova.file
```

## Root Cause

The FileTransfer.java file was trying to import `org.apache.cordova.file.FileUtils` but there was no dependency declared on the cordova-plugin-file-compatible plugin in the plugin.xml file.

## Solution

Added a dependency declaration in plugin.xml:

```xml
<dependency id="cordova-plugin-file-compatible" />
```

This tells Cordova that this plugin depends on the cordova-plugin-file-compatible plugin, which provides the FileUtils class that FileTransfer needs.

## Files Modified

- `/plugin.xml` - Added dependency declaration

## Why This Fixes It

1. The dependency ensures that cordova-plugin-file-compatible is installed before cordova-plugin-file-transfer-compatible
2. This makes the FileUtils class available in the classpath during compilation
3. Both plugins use the same package name `org.apache.cordova.file`, so the import works correctly

## Usage

To use this plugin, you should install both:

```bash
cordova plugin add cordova-plugin-file-compatible
cordova plugin add cordova-plugin-file-transfer-compatible
```

The dependency declaration will ensure they are loaded in the correct order.
