/*
 * Example usage of cordova-plugin-file-transfer-compatible
 * Demonstrates SAF URI uploads and traditional file uploads
 */

// Example 1: Traditional file upload (unchanged)
function uploadTraditionalFile() {
    var ft = new FileTransfer();
    var fileURL = cordova.file.dataDirectory + "test.txt";
    var uploadURL = "https://your-server.com/upload";

    var options = {
        fileKey: "file",
        fileName: "test.txt",
        mimeType: "text/plain",
        params: {
            description: "Traditional file upload"
        }
    };

    ft.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
            var percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            console.log("Upload progress: " + percentage + "%");
        }
    };

    ft.upload(fileURL, uploadURL, function(result) {
        console.log("Traditional upload successful:", result.response);
    }, function(error) {
        console.error("Traditional upload failed:", error.code);
    }, options);
}

// Example 2: SAF image upload
function uploadImageFromSAF() {
    SafManager.pickImages(false, function(imageUri) {
        console.log("User selected image:", imageUri);
        
        var ft = new FileTransfer();
        var uploadURL = "https://your-server.com/upload/image";
        
        var options = {
            fileKey: "image"
            // fileName and mimeType will be auto-detected from SAF URI
        };
        
        ft.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
                var percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                updateProgressBar(percentage);
            }
        };
        
        ft.upload(imageUri, uploadURL, function(result) {
            console.log("SAF image upload successful");
            console.log("Server response:", result.response);
            hideProgressBar();
        }, function(error) {
            console.error("SAF image upload failed:", error);
            hideProgressBar();
        }, options);
        
    }, function(error) {
        console.log("User cancelled image selection");
    });
}

// Example 3: SAF audio upload with file info
function uploadAudioWithInfo() {
    SafManager.pickAudio(false, function(audioUri) {
        console.log("User selected audio:", audioUri);
        
        // Get file information first
        SafManager.getFileInfo(audioUri, function(fileInfo) {
            console.log("Audio file details:");
            console.log("  Name:", fileInfo.name);
            console.log("  Size:", (fileInfo.size / 1024 / 1024).toFixed(2) + " MB");
            console.log("  Type:", fileInfo.mimeType);
            
            var ft = new FileTransfer();
            var uploadURL = "https://your-server.com/upload/audio";
            
            var options = {
                fileKey: "audio",
                fileName: fileInfo.name,
                mimeType: fileInfo.mimeType,
                params: {
                    originalSize: fileInfo.size,
                    originalName: fileInfo.name,
                    uploadedBy: "mobile-app"
                }
            };
            
            ft.upload(audioUri, uploadURL, function(result) {
                console.log("Audio upload successful");
                showSuccessMessage("Audio uploaded: " + fileInfo.name);
            }, function(error) {
                console.error("Audio upload failed:", error);
                showErrorMessage("Upload failed: " + error.source);
            }, options);
            
        }, function(error) {
            console.error("Failed to get audio file info:", error);
        });
    }, function(error) {
        console.log("User cancelled audio selection");
    });
}

// Example 4: Multiple file upload from SAF
function uploadMultipleFiles() {
    SafManager.openDocumentPicker(['image/*', 'video/*', 'audio/*'], true, function(uris) {
        console.log("User selected", uris.length, "files");
        
        var uploadQueue = [];
        var completedUploads = 0;
        var totalFiles = uris.length;
        
        // Process each selected file
        uris.forEach(function(uri, index) {
            SafManager.getFileInfo(uri, function(fileInfo) {
                uploadQueue.push({
                    uri: uri,
                    info: fileInfo,
                    index: index
                });
                
                // Start upload
                uploadSingleFile(uploadQueue[uploadQueue.length - 1]);
            });
        });
        
        function uploadSingleFile(fileData) {
            var ft = new FileTransfer();
            var uploadURL = "https://your-server.com/upload/multiple";
            
            var options = {
                fileKey: "file",
                fileName: fileData.info.name,
                mimeType: fileData.info.mimeType,
                params: {
                    batchId: Date.now(),
                    fileIndex: fileData.index,
                    totalFiles: totalFiles
                }
            };
            
            ft.upload(fileData.uri, uploadURL, function(result) {
                completedUploads++;
                console.log("File " + (fileData.index + 1) + " uploaded:", fileData.info.name);
                
                if (completedUploads === totalFiles) {
                    console.log("All files uploaded successfully!");
                    showSuccessMessage("All " + totalFiles + " files uploaded");
                }
            }, function(error) {
                console.error("File upload failed:", fileData.info.name, error);
                showErrorMessage("Failed to upload: " + fileData.info.name);
            }, options);
        }
        
    }, function(error) {
        console.log("User cancelled multiple file selection");
    });
}

// Example 5: Robust upload with retry mechanism
function uploadWithRetry(fileUri, maxRetries) {
    maxRetries = maxRetries || 3;
    var retryCount = 0;
    
    function attemptUpload() {
        var ft = new FileTransfer();
        var uploadURL = "https://your-server.com/upload";
        
        var options = {
            fileKey: "file",
            params: {
                retryAttempt: retryCount + 1
            }
        };
        
        ft.upload(fileUri, uploadURL, function(result) {
            console.log("Upload successful on attempt", retryCount + 1);
            showSuccessMessage("File uploaded successfully");
        }, function(error) {
            retryCount++;
            console.error("Upload attempt", retryCount, "failed:", error.code);
            
            if (retryCount < maxRetries) {
                console.log("Retrying upload in 2 seconds...");
                setTimeout(attemptUpload, 2000);
            } else {
                console.error("Upload failed after", maxRetries, "attempts");
                showErrorMessage("Upload failed after " + maxRetries + " attempts");
            }
        }, options);
    }
    
    attemptUpload();
}

// Example 6: Download to SAF location (requires user to select save location)
function downloadToUserLocation() {
    var downloadURL = "https://your-server.com/files/sample.pdf";
    
    // Let user choose where to save the file
    SafManager.createDocument("sample.pdf", "application/pdf", function(saveUri) {
        console.log("User chose save location:", saveUri);
        
        var ft = new FileTransfer();
        
        ft.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
                var percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                console.log("Download progress:", percentage + "%");
            }
        };
        
        // Download to temporary location first
        var tempPath = cordova.file.cacheDirectory + "temp_download.pdf";
        
        ft.download(downloadURL, tempPath, function(entry) {
            console.log("Download completed to temp location");
            
            // Copy from temp location to user-selected SAF location
            SafManager.copyToSaf(tempPath, saveUri, function(success) {
                if (success) {
                    console.log("File saved to user-selected location");
                    showSuccessMessage("File downloaded and saved");
                    
                    // Clean up temp file
                    entry.remove();
                } else {
                    console.error("Failed to save to user location");
                    showErrorMessage("Download completed but save failed");
                }
            }, function(error) {
                console.error("Failed to copy to SAF location:", error);
            });
            
        }, function(error) {
            console.error("Download failed:", error);
            showErrorMessage("Download failed");
        });
        
    }, function(error) {
        console.log("User cancelled save location selection");
    });
}

// Helper functions for UI feedback
function updateProgressBar(percentage) {
    console.log("Progress: " + percentage + "%");
    // Update your UI progress bar here
}

function hideProgressBar() {
    console.log("Progress complete");
    // Hide your UI progress bar here
}

function showSuccessMessage(message) {
    console.log("Success: " + message);
    // Show success notification to user
}

function showErrorMessage(message) {
    console.error("Error: " + message);
    // Show error notification to user
}

// Initialize on device ready
document.addEventListener('deviceready', function() {
    console.log('cordova-plugin-file-transfer-compatible ready');
    
    // Example usage buttons
    // uploadTraditionalFile();
    // uploadImageFromSAF();
    // uploadAudioWithInfo();
    // uploadMultipleFiles();
}, false);