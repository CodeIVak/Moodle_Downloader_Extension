/**
 * Utility Functions for Moodle PDF Downloader Extension
 * 
 * This file contains helper functions for managing download history,
 * formatting file names, and other utility operations.
 */

/**
 * Storage key for download history
 */
const STORAGE_KEY = 'moodle_pdf_download_history';

/**
 * Saves a download record to local storage
 * 
 * @param {string} url - The URL of the downloaded PDF
 * @param {string} fileName - The name of the downloaded file
 */
function saveDownloadHistory(url, fileName) {
    try {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const history = result[STORAGE_KEY] || [];
            const newEntry = {
                url: url,
                fileName: fileName,
                timestamp: Date.now(),
                date: new Date().toISOString()
            };
            
            // Add to beginning and limit to last 100 downloads
            history.unshift(newEntry);
            if (history.length > 100) {
                history.pop();
            }
            
            chrome.storage.local.set({ [STORAGE_KEY]: history });
        });
    } catch (error) {
        console.error('Error saving download history:', error);
    }
}

/**
 * Retrieves download history from local storage
 * 
 * @param {Function} callback - Callback function that receives the history array
 */
function getDownloadHistory(callback) {
    try {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const history = result[STORAGE_KEY] || [];
            callback(history);
        });
    } catch (error) {
        console.error('Error retrieving download history:', error);
        callback([]);
    }
}

/**
 * Clears download history
 */
function clearDownloadHistory() {
    try {
        chrome.storage.local.set({ [STORAGE_KEY]: [] });
    } catch (error) {
        console.error('Error clearing download history:', error);
    }
}

/**
 * Converts a Moodle resource view.php URL to a direct download URL
 * Tries multiple methods to get the actual file download link
 * 
 * @param {string} url - The view.php URL
 * @returns {Promise<string>} Promise that resolves to the download URL
 */
function convertViewUrlToDownload(url) {
    return new Promise((resolve) => {
        try {
            if (!url || !url.includes('/mod/resource/view.php')) {
                resolve(url); // Not a view.php URL, return as is
                return;
            }
            
            // Method 1: Try adding forcedownload parameter
            const urlObj = new URL(url);
            urlObj.searchParams.set('forcedownload', '1');
            const forcedownloadUrl = urlObj.toString();
            
            // Method 2: Try to fetch the page and extract pluginfile.php link
            // This is async, so we'll try the forcedownload method first
            // and fall back to fetching if needed
            
            // For now, use forcedownload method
            // In the future, we could fetch the page and extract the link
            console.log('[Moodle PDF Downloader] Converting view.php to download URL:', forcedownloadUrl);
            resolve(forcedownloadUrl);
            
        } catch (e) {
            console.error('Error converting view URL:', e);
            resolve(url);
        }
    });
}

/**
 * Synchronous version that adds forcedownload parameter
 * Used when we can't do async operations
 * 
 * @param {string} url - The view.php URL
 * @returns {string} The download URL with forcedownload parameter
 */
function convertViewUrlToDownloadSync(url) {
    try {
        if (!url || !url.includes('/mod/resource/view.php')) {
            return url; // Not a view.php URL, return as is
        }
        
        const urlObj = new URL(url);
        
        // Add forcedownload=1 parameter to force file download instead of viewing
        urlObj.searchParams.set('forcedownload', '1');
        
        return urlObj.toString();
    } catch (e) {
        console.error('Error converting view URL:', e);
        return url;
    }
}

/**
 * Formats a file name by removing invalid characters and truncating if too long
 * 
 * @param {string} fileName - The original file name
 * @returns {string} The formatted file name
 */
function formatFileName(fileName) {
    if (!fileName) return 'download.pdf';
    
    // Remove invalid characters for file names
    let formatted = fileName.replace(/[<>:"/\\|?*]/g, '_');
    
    // Remove HTML file extensions if present
    formatted = formatted.replace(/\.htm(l)?$/i, '');
    
    // Check if it already has a file extension
    const hasExtension = /\.\w{2,4}$/i.test(formatted);
    
    // If no extension or if it's a generic name, add .pdf
    if (!hasExtension || formatted.toLowerCase().endsWith('.html') || formatted.toLowerCase().endsWith('.htm')) {
        // Remove any existing extension that's not .pdf
        if (hasExtension && !formatted.toLowerCase().endsWith('.pdf')) {
            formatted = formatted.replace(/\.[^.]+$/, '');
        }
        formatted += '.pdf';
    }
    
    // Truncate if too long (max 200 characters)
    if (formatted.length > 200) {
        const ext = formatted.substring(formatted.lastIndexOf('.'));
        formatted = formatted.substring(0, 195) + ext;
    }
    
    return formatted;
}

/**
 * Downloads a PDF file using Chrome's download API
 * Converts view.php URLs to download URLs automatically by extracting the direct pluginfile.php link
 * 
 * @param {string} url - The URL of the PDF to download
 * @param {string} fileName - The desired file name
 * @param {Function} onComplete - Callback function called when download completes
 */
function downloadPDF(url, fileName, onComplete) {
    try {
        const formattedFileName = formatFileName(fileName);
        
        // For view.php URLs, extract the direct pluginfile.php link
        if (url.includes('/mod/resource/view.php')) {
            console.log('[Moodle PDF Downloader] Detected view.php URL, extracting direct link...');
            
            // Send message to background script to extract the direct link
            chrome.runtime.sendMessage({
                action: 'extractDirectLink',
                url: url
            }, (response) => {
                let downloadUrl = url;
                
                if (response && response.success && response.directLink) {
                    downloadUrl = response.directLink;
                    console.log('[Moodle PDF Downloader] Using extracted direct link:', downloadUrl);
                } else {
                    // Fall back to forcedownload method
                    downloadUrl = convertViewUrlToDownloadSync(url);
                    console.log('[Moodle PDF Downloader] No direct link found, using forcedownload method:', downloadUrl);
                }
                
                performDownload(downloadUrl, formattedFileName, onComplete);
            });
        } else {
            // Not a view.php URL, download directly
            performDownload(url, formattedFileName, onComplete);
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        if (onComplete) onComplete(false, error.message);
    }
}

/**
 * Gets the download folder path from storage
 * 
 * @param {Function} callback - Callback function with folder path
 */
function getDownloadFolder(callback) {
    chrome.storage.local.get(['downloadFolder'], (result) => {
        const folder = result.downloadFolder || '';
        if (callback) callback(folder);
    });
}

/**
 * Sanitizes folder name to be filesystem-safe
 * 
 * @param {string} folderName - The folder name to sanitize
 * @returns {string} Sanitized folder name
 */
function sanitizeFolderName(folderName) {
    if (!folderName) return '';
    
    // Remove invalid characters for Windows/Linux/Mac
    let sanitized = folderName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
    
    // Remove leading/trailing spaces and dots
    sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');
    
    // Limit length
    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
    }
    
    return sanitized;
}

/**
 * Performs the actual download
 * 
 * @param {string} downloadUrl - The URL to download
 * @param {string} formattedFileName - The formatted file name
 * @param {Function} onComplete - Callback function
 */
function performDownload(downloadUrl, formattedFileName, onComplete) {
    // Get folder path from storage
    getDownloadFolder((folder) => {
        let finalFileName = formattedFileName;
        
        // If folder is specified, prepend it to the filename
        if (folder && folder.trim()) {
            const sanitizedFolder = sanitizeFolderName(folder.trim());
            if (sanitizedFolder) {
                // Use forward slash for cross-platform compatibility (Chrome handles it)
                finalFileName = `${sanitizedFolder}/${formattedFileName}`;
            }
        }
        
        chrome.downloads.download({
            url: downloadUrl,
            filename: finalFileName,
            saveAs: false
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download error:', chrome.runtime.lastError);
                if (onComplete) onComplete(false, chrome.runtime.lastError.message);
            } else {
                // Save to history
                saveDownloadHistory(downloadUrl, formattedFileName);
                if (onComplete) onComplete(true, downloadId);
            }
        });
    });
}

/**
 * Formats a timestamp to a readable date string
 * 
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

