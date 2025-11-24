/**
 * Background Service Worker for Moodle PDF Downloader Extension
 * 
 * Handles download completion events and other background tasks
 */

/**
 * Listens for download completion events
 */
chrome.downloads.onChanged.addListener((downloadDelta) => {
    if (downloadDelta.state && downloadDelta.state.current === 'complete') {
        console.log('Download completed:', downloadDelta.id);
    }
});

/**
 * Extracts the direct video file link from a videostream page
 * Opens the page in a hidden tab, extracts the video link, then closes the tab
 * 
 * @param {string} videostreamUrl - The videostream view.php URL
 * @returns {Promise<string>} Promise that resolves to the video file URL or null
 */
async function extractVideoLinkFromVideostreamPage(videostreamUrl) {
    return new Promise((resolve) => {
        console.log('[Moodle PDF Downloader] Extracting video link from:', videostreamUrl);
        
        // Open the videostream page in a hidden tab
        chrome.tabs.create({
            url: videostreamUrl,
            active: false
        }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error('[Moodle PDF Downloader] Error opening tab:', chrome.runtime.lastError);
                resolve(null);
                return;
            }
            
            // Wait for the page to load
            let checkCount = 0;
            const maxChecks = 30; // Maximum 15 seconds (30 * 500ms)
            
            const checkTab = (tabId) => {
                checkCount++;
                if (checkCount > maxChecks) {
                    console.error('[Moodle PDF Downloader] Timeout waiting for videostream page to load');
                    chrome.tabs.remove(tabId);
                    resolve(null);
                    return;
                }
                
                chrome.tabs.get(tabId, (tabInfo) => {
                    if (chrome.runtime.lastError) {
                        console.error('[Moodle PDF Downloader] Error checking tab:', chrome.runtime.lastError);
                        chrome.tabs.remove(tabId);
                        resolve(null);
                        return;
                    }
                    
                    if (tabInfo.status === 'complete') {
                        // Inject content script to extract the video link
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            function: function() {
                                // Method 1: Look for video elements with src
                                const videos = document.querySelectorAll('video, video source');
                                for (let video of videos) {
                                    let src = null;
                                    if (video.tagName === 'VIDEO') {
                                        src = video.src || video.currentSrc;
                                        if (!src) {
                                            const source = video.querySelector('source');
                                            if (source) {
                                                src = source.src || source.getAttribute('src');
                                            }
                                        }
                                    } else if (video.tagName === 'SOURCE') {
                                        src = video.src || video.getAttribute('src');
                                    }
                                    
                                    if (src && (src.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                                        src.includes('/pluginfile.php/') ||
                                        src.includes('objectstorage') ||
                                        src.includes('video_bucket') ||
                                        src.includes('oraclecloud.com'))) {
                                        return src;
                                    }
                                }
                                
                                // Method 2: Look for pluginfile.php links with video extensions
                                const pluginfileLinks = document.querySelectorAll('a[href*="/pluginfile.php/"]');
                                for (let link of pluginfileLinks) {
                                    const href = link.href;
                                    const fileName = href.toLowerCase();
                                    if (fileName.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|mp3|wav|m4a|aac|flac|wma)(\?|$)/i)) {
                                        return href;
                                    }
                                }
                                
                                // Method 2b: Look for direct video URLs in all links (Oracle Cloud, etc.)
                                const allLinks = document.querySelectorAll('a[href]');
                                for (let link of allLinks) {
                                    const href = link.href;
                                    const hrefLower = href.toLowerCase();
                                    if (hrefLower.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                                        hrefLower.includes('objectstorage') ||
                                        hrefLower.includes('video_bucket') ||
                                        hrefLower.includes('oraclecloud.com') ||
                                        (hrefLower.includes('https://') && hrefLower.match(/\/[^\/]+\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i))) {
                                        return href;
                                    }
                                }
                                
                                // Method 3: Look for video URLs in script tags or data attributes
                                const scripts = document.querySelectorAll('script');
                                for (let script of scripts) {
                                    const content = script.textContent || script.innerHTML;
                                    // Look for video URLs in script content (including Oracle Cloud)
                                    const videoUrlMatch = content.match(/(https?:\/\/[^\s"']+\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?[^\s"']*)?)/i);
                                    if (videoUrlMatch) {
                                        return videoUrlMatch[1];
                                    }
                                    
                                    // Look for Oracle Cloud Object Storage URLs
                                    const oracleCloudMatch = content.match(/(https?:\/\/[^\s"']*objectstorage[^\s"']*\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?[^\s"']*)?)/i);
                                    if (oracleCloudMatch) {
                                        return oracleCloudMatch[1];
                                    }
                                    
                                    // Look for video_bucket URLs
                                    const videoBucketMatch = content.match(/(https?:\/\/[^\s"']*video_bucket[^\s"']*\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?[^\s"']*)?)/i);
                                    if (videoBucketMatch) {
                                        return videoBucketMatch[1];
                                    }
                                    
                                    // Look for pluginfile.php URLs
                                    const pluginfileMatch = content.match(/(https?:\/\/[^\s"']*\/pluginfile\.php\/[^\s"']+\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?[^\s"']*)?)/i);
                                    if (pluginfileMatch) {
                                        return pluginfileMatch[1];
                                    }
                                    
                                    // Look for any HTTPS URL ending with video extension
                                    const anyVideoUrlMatch = content.match(/(https:\/\/[^\s"']+\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?[^\s"']*)?)/i);
                                    if (anyVideoUrlMatch) {
                                        return anyVideoUrlMatch[1];
                                    }
                                }
                                
                                // Method 4: Look for data attributes with video URLs
                                const elementsWithData = document.querySelectorAll('[data-src], [data-video-url], [data-url], [data-source]');
                                for (let element of elementsWithData) {
                                    const dataSrc = element.getAttribute('data-src') || 
                                                   element.getAttribute('data-video-url') || 
                                                   element.getAttribute('data-url') ||
                                                   element.getAttribute('data-source');
                                    if (dataSrc && (dataSrc.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                                        dataSrc.includes('/pluginfile.php/') ||
                                        dataSrc.includes('objectstorage') ||
                                        dataSrc.includes('video_bucket') ||
                                        dataSrc.includes('oraclecloud.com'))) {
                                        return dataSrc;
                                    }
                                }
                                
                                // Method 5: Look for download links or buttons
                                const downloadLinks = document.querySelectorAll('a[download], a[href*="download"], button[onclick*="download"]');
                                for (let link of downloadLinks) {
                                    let href = link.href;
                                    if (!href && link.getAttribute('onclick')) {
                                        const onclick = link.getAttribute('onclick');
                                        const urlMatch = onclick.match(/(https?:\/\/[^\s"']+)/i);
                                        if (urlMatch) {
                                            href = urlMatch[1];
                                        }
                                    }
                                    if (href && (href.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                                        href.includes('/pluginfile.php/') ||
                                        href.includes('objectstorage') ||
                                        href.includes('video_bucket') ||
                                        href.includes('oraclecloud.com'))) {
                                        return href;
                                    }
                                }
                                
                                // Method 6: Look for iframes that might contain video
                                const iframes = document.querySelectorAll('iframe[src]');
                                for (let iframe of iframes) {
                                    const iframeSrc = iframe.src;
                                    if (iframeSrc && (iframeSrc.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                                        iframeSrc.includes('/pluginfile.php/') ||
                                        iframeSrc.includes('objectstorage') ||
                                        iframeSrc.includes('video_bucket') ||
                                        iframeSrc.includes('oraclecloud.com'))) {
                                        return iframeSrc;
                                    }
                                }
                                
                                // Method 6b: Try to access iframe content (if same origin)
                                for (let iframe of iframes) {
                                    try {
                                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                        const iframeVideos = iframeDoc.querySelectorAll('video, video source');
                                        for (let video of iframeVideos) {
                                            let src = null;
                                            if (video.tagName === 'VIDEO') {
                                                src = video.src || video.currentSrc;
                                                if (!src) {
                                                    const source = video.querySelector('source');
                                                    if (source) {
                                                        src = source.src || source.getAttribute('src');
                                                    }
                                                }
                                            } else if (video.tagName === 'SOURCE') {
                                                src = video.src || video.getAttribute('src');
                                            }
                                            
                                            if (src && (src.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                                                src.includes('objectstorage') ||
                                                src.includes('video_bucket'))) {
                                                return src;
                                            }
                                        }
                                    } catch (e) {
                                        // Cross-origin iframe, skip
                                    }
                                }
                                
                                // Method 7: Look for video URLs in JSON data or configuration
                                const jsonScripts = document.querySelectorAll('script[type="application/json"], script[type="text/json"]');
                                for (let script of jsonScripts) {
                                    try {
                                        const jsonData = JSON.parse(script.textContent);
                                        // Recursively search for video URLs in JSON
                                        const findVideoInObject = (obj) => {
                                            for (let key in obj) {
                                                if (typeof obj[key] === 'string') {
                                                    if (obj[key].match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                                                        obj[key].includes('/pluginfile.php/')) {
                                                        return obj[key];
                                                    }
                                                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                                                    const result = findVideoInObject(obj[key]);
                                                    if (result) return result;
                                                }
                                            }
                                            return null;
                                        };
                                        const videoUrl = findVideoInObject(jsonData);
                                        if (videoUrl) return videoUrl;
                                    } catch (e) {
                                        // Not valid JSON, skip
                                    }
                                }
                                
                                return null;
                            }
                        }, (results) => {
                            chrome.tabs.remove(tabId); // Close the tab
                            
                            if (results && results[0] && results[0].result) {
                                const videoLink = results[0].result;
                                console.log('[Moodle PDF Downloader] Extracted video link:', videoLink);
                                resolve(videoLink);
                            } else {
                                console.log('[Moodle PDF Downloader] No video link found');
                                resolve(null);
                            }
                        });
                    } else {
                        // Wait a bit and check again
                        setTimeout(() => checkTab(tabId), 500);
                    }
                });
            };
            
            // Start checking after a short delay
            setTimeout(() => checkTab(tab.id), 1000);
        });
    });
}

/**
 * Extracts the direct pluginfile.php link from a view.php page
 * Opens the page in a hidden tab, extracts the link, then closes the tab
 * 
 * @param {string} viewUrl - The view.php URL
 * @returns {Promise<string>} Promise that resolves to the pluginfile.php URL or null
 */
async function extractDirectLinkFromViewPage(viewUrl) {
    return new Promise((resolve) => {
        console.log('[Moodle PDF Downloader] Extracting direct link from:', viewUrl);
        
        // Open the view.php page in a hidden tab
        chrome.tabs.create({
            url: viewUrl,
            active: false
        }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error('[Moodle PDF Downloader] Error opening tab:', chrome.runtime.lastError);
                resolve(null);
                return;
            }
            
            // Wait for the page to load
            let checkCount = 0;
            const maxChecks = 20; // Maximum 10 seconds (20 * 500ms)
            
            const checkTab = (tabId) => {
                checkCount++;
                if (checkCount > maxChecks) {
                    console.error('[Moodle PDF Downloader] Timeout waiting for page to load');
                    chrome.tabs.remove(tabId);
                    resolve(null);
                    return;
                }
                
                chrome.tabs.get(tabId, (tabInfo) => {
                    if (chrome.runtime.lastError) {
                        console.error('[Moodle PDF Downloader] Error checking tab:', chrome.runtime.lastError);
                        chrome.tabs.remove(tabId);
                        resolve(null);
                        return;
                    }
                    
                    if (tabInfo.status === 'complete') {
                        // Inject content script to extract the link
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            function: function() {
                                // Method 1: Look for pluginfile.php links
                                const pluginfileLinks = document.querySelectorAll('a[href*="/pluginfile.php/"]');
                                if (pluginfileLinks.length > 0) {
                                    return pluginfileLinks[0].href;
                                }
                                
                                // Method 2: Look in resource content area
                                const resourceContent = document.querySelector('.resourcecontent, .resource-content, #resource-content, .mod-resource-content');
                                if (resourceContent) {
                                    const contentLinks = resourceContent.querySelectorAll('a[href*="/pluginfile.php/"]');
                                    if (contentLinks.length > 0) {
                                        return contentLinks[0].href;
                                    }
                                }
                                
                                // Method 3: Look for iframes with pluginfile.php
                                const iframes = document.querySelectorAll('iframe[src*="pluginfile"]');
                                if (iframes.length > 0) {
                                    return iframes[0].src;
                                }
                                
                                // Method 4: Look for download buttons
                                const downloadLinks = document.querySelectorAll('a[download], a[href*="forcedownload"]');
                                if (downloadLinks.length > 0) {
                                    return downloadLinks[0].href;
                                }
                                
                                // Method 5: Look for any link with .pdf extension
                                const pdfLinks = document.querySelectorAll('a[href*=".pdf"]');
                                if (pdfLinks.length > 0) {
                                    return pdfLinks[0].href;
                                }
                                
                                return null;
                            }
                        }, (results) => {
                            chrome.tabs.remove(tabId); // Close the tab
                            
                            if (results && results[0] && results[0].result) {
                                const directLink = results[0].result;
                                console.log('[Moodle PDF Downloader] Extracted direct link:', directLink);
                                resolve(directLink);
                            } else {
                                console.log('[Moodle PDF Downloader] No direct link found');
                                resolve(null);
                            }
                        });
                    } else {
                        // Wait a bit and check again
                        setTimeout(() => checkTab(tabId), 500);
                    }
                });
            };
            
            // Start checking after a short delay
            setTimeout(() => checkTab(tab.id), 1000);
        });
    });
}


/**
 * Listen for messages from popup/utils
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractDirectLink') {
        extractDirectLinkFromViewPage(request.url)
            .then(directLink => {
                sendResponse({ success: true, directLink: directLink });
            })
            .catch(error => {
                console.error('[Moodle PDF Downloader] Error extracting link:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep message channel open for async response
    } else if (request.action === 'extractVideoLink') {
        extractVideoLinkFromVideostreamPage(request.url)
            .then(videoLink => {
                sendResponse({ success: true, videoLink: videoLink });
            })
            .catch(error => {
                console.error('[Moodle PDF Downloader] Error extracting video link:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep message channel open for async response
    }
});
