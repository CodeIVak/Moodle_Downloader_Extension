/**
 * Content Script for Moodle PDF Downloader Extension
 * 
 * This script runs in the context of Moodle course pages and is responsible
 * for scanning and identifying PDF links on the page.
 */

/**
 * Checks if we're on a Moodle resource view page
 * 
 * @returns {boolean} True if we're on a resource view page
 */
function isResourceViewPage() {
    return window.location.href.includes('/mod/resource/view.php');
}

/**
 * Checks if we're on a Moodle video recording page (BIU blocks/video)
 * 
 * @returns {boolean} True if we're on a video recording page
 */
function isVideoRecordingPage() {
    return window.location.href.includes('/blocks/video/viewvideo_biu.php');
}

/**
 * Finds the download link on a resource view page
 * On resource view pages, the actual file download link is usually a pluginfile.php link
 * 
 * @returns {Array<Object>} Array of PDF link objects found on the resource page
 */
function findResourceViewPDFLinks() {
    const pdfLinks = new Map();
    
    console.log('[Moodle PDF Downloader] Detected resource view page, searching for download links...');
    
    // Method 1: Look for pluginfile.php links (most common)
    const pluginfileLinks = document.querySelectorAll('a[href*="/pluginfile.php/"]');
    pluginfileLinks.forEach(link => {
        const href = link.href;
        let fileName = extractFileName(link, href);
        if (!fileName || fileName.length === 0) {
            // Try to get from page title or resource name
            const pageTitle = document.querySelector('h1, .page-title, .resource-title');
            if (pageTitle) {
                fileName = pageTitle.textContent.trim();
            }
            if (!fileName) {
                fileName = 'Resource File';
            }
        }
        
        // Ensure .pdf extension if not present and not another extension
        if (!fileName.toLowerCase().endsWith('.pdf') && 
            !fileName.toLowerCase().match(/\.\w{2,4}$/)) {
            fileName = fileName.replace(/\.htm(l)?$/i, '') + '.pdf';
        }
        
        pdfLinks.set(href, {
            url: href,
            name: fileName,
            type: 'resource_download'
        });
        console.log('[Moodle PDF Downloader] Found resource download link:', href);
    });
    
    // Method 2: Look for download buttons or links with download attribute
    const downloadLinks = document.querySelectorAll('a[download], button[onclick*="download"], .download-link, [class*="download"] a');
    downloadLinks.forEach(link => {
        if (link.href && link.href !== window.location.href) {
            let fileName = extractFileName(link, link.href);
            if (!fileName) {
                const pageTitle = document.querySelector('h1, .page-title, .resource-title');
                if (pageTitle) {
                    fileName = pageTitle.textContent.trim();
                }
                if (!fileName) {
                    fileName = 'Resource File';
                }
            }
            
            pdfLinks.set(link.href, {
                url: link.href,
                name: fileName,
                type: 'resource_download'
            });
            console.log('[Moodle PDF Downloader] Found download button/link:', link.href);
        }
    });
    
    // Method 3: Look in resource content area
    const resourceContent = document.querySelector('.resourcecontent, .resource-content, #resource-content, .mod-resource-content');
    if (resourceContent) {
        const contentLinks = resourceContent.querySelectorAll('a[href]');
        contentLinks.forEach(link => {
            const href = link.href;
            if (href.includes('/pluginfile.php/') || 
                href.toLowerCase().includes('.pdf') ||
                href.includes('forcedownload')) {
                let fileName = extractFileName(link, href);
                if (!fileName) {
                    const pageTitle = document.querySelector('h1, .page-title, .resource-title');
                    if (pageTitle) {
                        fileName = pageTitle.textContent.trim();
                    }
                    if (!fileName) {
                        fileName = 'Resource File';
                    }
                }
                
                pdfLinks.set(href, {
                    url: href,
                    name: fileName,
                    type: 'resource_download'
                });
                console.log('[Moodle PDF Downloader] Found link in resource content:', href);
            }
        });
    }
    
    // Method 4: Look for embedded PDF viewers or iframes
    const iframes = document.querySelectorAll('iframe[src*=".pdf"], iframe[src*="pluginfile"], iframe[src*="resource"]');
    iframes.forEach(iframe => {
        if (iframe.src) {
            let fileName = 'Resource File';
            const pageTitle = document.querySelector('h1, .page-title, .resource-title');
            if (pageTitle) {
                fileName = pageTitle.textContent.trim();
            }
            
            pdfLinks.set(iframe.src, {
                url: iframe.src,
                name: fileName,
                type: 'resource_iframe'
            });
            console.log('[Moodle PDF Downloader] Found PDF iframe:', iframe.src);
        }
    });
    
    return Array.from(pdfLinks.values());
}

/**
 * Scans the page for PDF links using multiple detection methods
 * Supports direct PDF links, Moodle pluginfile.php links, and resource view links
 * 
 * @returns {Array<Object>} Array of objects containing PDF link information
 *                          Each object has: {url: string, name: string, type: string}
 */
function findPDFLinks() {
    // Special handling for resource view pages
    if (isResourceViewPage()) {
        const resourceLinks = findResourceViewPDFLinks();
        if (resourceLinks.length > 0) {
            console.log('[Moodle PDF Downloader] Found', resourceLinks.length, 'links on resource view page');
            return resourceLinks;
        }
        // If no specific links found, continue with general search
    }
    
    const pdfLinks = new Map(); // Use Map to avoid duplicates while preserving order
    const links = document.querySelectorAll('a[href]');
    
    console.log('[Moodle PDF Downloader] Scanning page for PDF links...');
    console.log('[Moodle PDF Downloader] Found', links.length, 'total links');

    links.forEach((link, index) => {
        const href = link.href;
        const linkText = link.textContent.trim();
        const linkHTML = link.outerHTML.toLowerCase();
        const linkElement = link;
        
        // Skip empty or invalid hrefs
        if (!href || href === '#' || href === 'javascript:void(0)') {
            return;
        }

        // Extract file name from various sources
        let fileName = extractFileName(linkElement, href);
        if (!fileName || fileName.length === 0) {
            fileName = 'PDF File';
        }

        // 1. Direct PDF links (ends with .pdf or contains .pdf in path)
        if (href.toLowerCase().includes('.pdf') && 
            (href.toLowerCase().endsWith('.pdf') || href.toLowerCase().includes('.pdf?'))) {
            pdfLinks.set(href, {
                url: href,
                name: fileName,
                type: 'direct'
            });
            console.log('[Moodle PDF Downloader] Found direct PDF:', href);
        }
        
        // 2. Moodle pluginfile.php links - Include ALL of them (Moodle uses this for files)
        else if (href.includes('/pluginfile.php/')) {
            // Check for explicit PDF indicators first
            const hasPDFIndicator = linkHTML.includes('fa-file-pdf') || 
                                   linkHTML.includes('file-pdf') ||
                                   linkHTML.includes('fileicon') ||
                                   linkElement.querySelector('.fa-file-pdf') ||
                                   linkElement.querySelector('[class*="pdf"]') ||
                                   linkElement.querySelector('[class*="fileicon"]');
            
            // Also check parent elements for file icons
            const parent = linkElement.parentElement;
            const hasParentPDFIndicator = parent && (
                parent.querySelector('.fa-file-pdf') ||
                parent.querySelector('[class*="pdf"]') ||
                parent.className.toLowerCase().includes('pdf')
            );
            
            // On resource view pages, include ALL pluginfile.php links
            if (isResourceViewPage()) {
                pdfLinks.set(href, {
                    url: href,
                    name: fileName,
                    type: 'pluginfile'
                });
                console.log('[Moodle PDF Downloader] Found pluginfile on resource page:', href);
            }
            // Include all pluginfile.php links (they're usually files)
            // But prioritize those with PDF indicators
            else if (hasPDFIndicator || hasParentPDFIndicator || 
                linkText.toLowerCase().includes('pdf') ||
                fileName.toLowerCase().includes('.pdf')) {
                pdfLinks.set(href, {
                    url: href,
                    name: fileName,
                    type: 'pluginfile'
                });
                console.log('[Moodle PDF Downloader] Found pluginfile PDF:', href);
            } else {
                // Include all pluginfile.php links as potential PDFs
                // Moodle uses pluginfile.php for all file types
                pdfLinks.set(href, {
                    url: href,
                    name: fileName,
                    type: 'pluginfile_potential'
                });
                console.log('[Moodle PDF Downloader] Found potential pluginfile:', href);
            }
        }
        
        // 3. Moodle resource view links (mod/resource/view.php) - Include ALL
        else if (href.includes('/mod/resource/view.php') || 
                 href.includes('/mod/resource/view.php?id=')) {
            // Try to find the direct pluginfile.php link in the same container
            let directLink = null;
            
            // Check parent and sibling elements for pluginfile.php links
            const parent = linkElement.parentElement;
            if (parent) {
                // Look for pluginfile.php links in parent
                const parentPluginLinks = parent.querySelectorAll('a[href*="/pluginfile.php/"]');
                if (parentPluginLinks.length > 0) {
                    directLink = parentPluginLinks[0].href;
                    console.log('[Moodle PDF Downloader] Found pluginfile.php in parent:', directLink);
                }
                
                // Check grandparent
                const grandparent = parent.parentElement;
                if (grandparent && !directLink) {
                    const grandparentPluginLinks = grandparent.querySelectorAll('a[href*="/pluginfile.php/"]');
                    if (grandparentPluginLinks.length > 0) {
                        directLink = grandparentPluginLinks[0].href;
                        console.log('[Moodle PDF Downloader] Found pluginfile.php in grandparent:', directLink);
                    }
                }
            }
            
            // Check for PDF indicators
            const hasPDFIndicator = linkHTML.includes('fa-file-pdf') || 
                                   linkHTML.includes('file-pdf') ||
                                   linkElement.querySelector('.fa-file-pdf') ||
                                   linkElement.querySelector('[class*="pdf"]');
            
            // Check parent elements
            const hasParentPDFIndicator = parent && (
                parent.querySelector('.fa-file-pdf') ||
                parent.querySelector('[class*="pdf"]')
            );
            
            // Ensure filename has .pdf extension
            if (fileName && !fileName.toLowerCase().endsWith('.pdf') && 
                !fileName.toLowerCase().endsWith('.html') && 
                !fileName.toLowerCase().endsWith('.htm')) {
                // Remove any existing extension and add .pdf
                fileName = fileName.replace(/\.[^.]+$/, '') + '.pdf';
            } else if (!fileName || fileName.length === 0) {
                fileName = 'Resource.pdf';
            }
            
            // If we found a direct pluginfile.php link, use it instead
            if (directLink) {
                pdfLinks.set(directLink, {
                    url: directLink,
                    name: fileName,
                    type: 'pluginfile'
                });
                console.log('[Moodle PDF Downloader] Using direct pluginfile.php link instead of view.php');
            } else {
                // Include resource view links - will try to convert to download URL
                pdfLinks.set(href, {
                    url: href,
                    name: fileName,
                    type: 'resource'
                });
                console.log('[Moodle PDF Downloader] Found resource PDF:', href, '-> will try to convert to download URL');
            }
        }
        
        // 4. Check for data attributes or aria-labels that indicate PDF
        const ariaLabel = linkElement.getAttribute('aria-label') || '';
        const title = linkElement.getAttribute('title') || '';
        const dataType = linkElement.getAttribute('data-type') || '';
        
        if ((ariaLabel.toLowerCase().includes('pdf') || 
             title.toLowerCase().includes('pdf') ||
             dataType.toLowerCase().includes('pdf')) && href) {
            pdfLinks.set(href, {
                url: href,
                name: fileName || ariaLabel || title,
                type: 'metadata'
            });
            console.log('[Moodle PDF Downloader] Found PDF via metadata:', href);
        }
        
        // 5. Check for file download links (forcedownload parameter)
        try {
            const urlObj = new URL(href);
            if (urlObj.searchParams.has('forcedownload') || 
                urlObj.searchParams.has('download')) {
                const forcedownload = urlObj.searchParams.get('forcedownload');
                if (forcedownload && forcedownload.toLowerCase().includes('.pdf')) {
                    pdfLinks.set(href, {
                        url: href,
                        name: decodeURIComponent(forcedownload) || fileName,
                        type: 'forcedownload'
                    });
                    console.log('[Moodle PDF Downloader] Found forcedownload PDF:', href);
                }
            }
        } catch (e) {
            // Invalid URL, skip
        }
    });

    // 6. Check for PDF links in images (some Moodle pages use images as links)
    try {
        const images = document.querySelectorAll('img[src*=".pdf"], img[alt*="pdf"], img[title*="pdf"]');
        images.forEach(img => {
            const parentLink = img.closest('a');
            if (parentLink && parentLink.href) {
                const fileName = extractFileName(parentLink, parentLink.href);
                pdfLinks.set(parentLink.href, {
                    url: parentLink.href,
                    name: fileName || img.alt || img.title || 'PDF File',
                    type: 'image_link'
                });
                console.log('[Moodle PDF Downloader] Found PDF via image:', parentLink.href);
            }
        });
    } catch (e) {
        // Ignore errors
    }

    // 7. Check for PDF links in iframes (for embedded content)
    try {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeLinks = iframeDoc.querySelectorAll('a[href]');
                iframeLinks.forEach(link => {
                    const href = link.href;
                    if (href && (href.toLowerCase().includes('.pdf') || 
                                 href.includes('/pluginfile.php/') ||
                                 href.includes('/mod/resource/view.php'))) {
                        const fileName = extractFileName(link, href);
                        pdfLinks.set(href, {
                            url: href,
                            name: fileName || link.textContent.trim() || 'PDF File',
                            type: 'iframe'
                        });
                        console.log('[Moodle PDF Downloader] Found PDF in iframe:', href);
                    }
                });
            } catch (e) {
                // Cross-origin iframe, skip
            }
        });
    } catch (e) {
        // Ignore iframe access errors
    }
    
    // 8. Check for file list items in Moodle (activity instances)
    try {
        const fileListItems = document.querySelectorAll('.filemanager, .fp-content, .resourcecontent, [class*="file"]');
        fileListItems.forEach(item => {
            const link = item.querySelector('a[href]');
            if (link && link.href) {
                const href = link.href;
                if (href.includes('/pluginfile.php/') || 
                    href.includes('/mod/resource/view.php') ||
                    href.toLowerCase().includes('.pdf')) {
                    const fileName = extractFileName(link, href);
                    pdfLinks.set(href, {
                        url: href,
                        name: fileName || link.textContent.trim() || 'PDF File',
                        type: 'file_list'
                    });
                }
            }
        });
    } catch (e) {
        // Ignore errors
    }
    
    // 9. Special handling: For each view.php link found, try to find its corresponding pluginfile.php
    // This is important because view.php links lead to HTML pages, not direct file downloads
    const viewLinks = Array.from(pdfLinks.values()).filter(link => link.type === 'resource');
    viewLinks.forEach(viewLink => {
        // Try to find pluginfile.php link in the same activity/module container
        // Moodle usually structures activities in containers
        const activityContainers = document.querySelectorAll('.activity, .modtype_resource, [class*="activityinstance"]');
        activityContainers.forEach(container => {
            const viewLinkInContainer = container.querySelector(`a[href="${viewLink.url}"]`);
            if (viewLinkInContainer) {
                // Found the container with this view.php link
                // Look for pluginfile.php in the same container
                const pluginfileLink = container.querySelector('a[href*="/pluginfile.php/"]');
                if (pluginfileLink && pluginfileLink.href) {
                    // Replace the view.php link with the pluginfile.php link
                    pdfLinks.delete(viewLink.url);
                    pdfLinks.set(pluginfileLink.href, {
                        url: pluginfileLink.href,
                        name: viewLink.name,
                        type: 'pluginfile'
                    });
                    console.log('[Moodle PDF Downloader] Replaced view.php with pluginfile.php:', viewLink.url, '->', pluginfileLink.href);
                }
            }
        });
    });

    const result = Array.from(pdfLinks.values());
    console.log('[Moodle PDF Downloader] Total PDF links found:', result.length);
    return result;
}

/**
 * Extracts file name from a link element using multiple methods
 * 
 * @param {HTMLElement} linkElement - The link element
 * @param {string} href - The href URL
 * @returns {string} The extracted filename
 */
function extractFileName(linkElement, href) {
    // Method 1: Link text content
    let fileName = linkElement.textContent.trim();
    if (fileName && fileName.length > 0 && fileName.length < 200) {
        // Clean up the text
        fileName = fileName.replace(/\s+/g, ' ').trim();
        // If it looks like a filename, use it
        if (fileName.includes('.') || fileName.length > 3) {
            return fileName;
        }
    }
    
    // Method 2: Check for img alt or title
    const img = linkElement.querySelector('img');
    if (img) {
        const alt = img.getAttribute('alt') || '';
        const title = img.getAttribute('title') || '';
        if (alt && alt.length > 0) {
            fileName = alt;
        } else if (title && title.length > 0) {
            fileName = title;
        }
    }
    
    // Method 3: Extract from URL
    fileName = extractFileNameFromURL(href);
    if (fileName && fileName.length > 0) {
        return fileName;
    }
    
    // Method 4: Check aria-label or title attribute
    const ariaLabel = linkElement.getAttribute('aria-label') || '';
    const title = linkElement.getAttribute('title') || '';
    if (ariaLabel && ariaLabel.length > 0) {
        fileName = ariaLabel;
    } else if (title && title.length > 0) {
        fileName = title;
    }
    
    // Method 5: Check parent element text
    const parent = linkElement.parentElement;
    if (parent && (!fileName || fileName.length === 0)) {
        const parentText = parent.textContent.trim();
        if (parentText && parentText.length < 200) {
            fileName = parentText;
        }
    }
    
    // Method 6: On resource view pages, try to get from page title
    if ((!fileName || fileName.length === 0) && isResourceViewPage()) {
        const pageTitle = document.querySelector('h1, .page-title, .resource-title, .activity-header h2');
        if (pageTitle) {
            fileName = pageTitle.textContent.trim();
            // Clean up common Moodle prefixes
            fileName = fileName.replace(/^Resource:\s*/i, '').trim();
        }
    }
    
    // Clean up the filename - remove HTML extensions if present
    if (fileName) {
        fileName = fileName.replace(/\.htm(l)?$/i, '');
        // If no extension, assume it's a PDF
        if (!fileName.match(/\.\w{2,4}$/)) {
            // Don't add .pdf here - let formatFileName handle it
        }
    }
    
    return fileName || '';
}

/**
 * Extracts a file name from a URL
 * 
 * @param {string} url - The URL to extract the filename from
 * @returns {string} The extracted filename or empty string
 */
function extractFileNameFromURL(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const segments = pathname.split('/').filter(s => s.length > 0);
        
        // For pluginfile.php, try to get filename from path
        if (url.includes('/pluginfile.php/')) {
            // pluginfile.php format: /pluginfile.php/contextid/component/filearea/filename
            // Usually the last segment is the filename
            if (segments.length > 0) {
                const lastSegment = segments[segments.length - 1];
                const decoded = decodeURIComponent(lastSegment);
                if (decoded && decoded.includes('.')) {
                    // Remove HTML extensions
                    return decoded.replace(/\.htm(l)?$/i, '');
                }
            }
        }
        
        // Try last segment
        if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            const decoded = decodeURIComponent(lastSegment.split('?')[0]);
            if (decoded && decoded.includes('.')) {
                // Remove HTML extensions
                return decoded.replace(/\.htm(l)?$/i, '');
            }
        }
        
        // Try to get from query parameters
        const forcedownload = urlObj.searchParams.get('forcedownload');
        if (forcedownload) {
            const decoded = decodeURIComponent(forcedownload);
            return decoded.replace(/\.htm(l)?$/i, '');
        }
        
        const filename = urlObj.searchParams.get('filename');
        if (filename) {
            const decoded = decodeURIComponent(filename);
            return decoded.replace(/\.htm(l)?$/i, '');
        }
        
        return '';
    } catch (e) {
        // Try simple string extraction
        try {
            const match = url.match(/([^\/\?]+\.pdf)/i);
            if (match) {
                return decodeURIComponent(match[1]);
            }
            // Try to find any filename with extension
            const matchAny = url.match(/([^\/\?]+\.\w{2,4})/i);
            if (matchAny) {
                const name = decodeURIComponent(matchAny[1]);
                return name.replace(/\.htm(l)?$/i, '');
            }
        } catch (e2) {
            // Ignore
        }
        return '';
    }
}

/**
 * Checks if a URL points to a PDF file by examining the URL pattern
 * This is a quick check without making HTTP requests
 * 
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL likely points to a PDF
 */
function isLikelyPDF(url) {
    if (!url) return false;
    
    const urlLower = url.toLowerCase();
    
    // Direct PDF extension
    if (urlLower.includes('.pdf') && 
        (urlLower.endsWith('.pdf') || urlLower.includes('.pdf?'))) {
        return true;
    }
    
    // Check for PDF in query parameters
    try {
        const urlObj = new URL(url);
        const forcedownload = urlObj.searchParams.get('forcedownload') || '';
        if (forcedownload.toLowerCase().includes('.pdf')) {
            return true;
        }
    } catch (e) {
        // Invalid URL
    }
    
    // For pluginfile.php and resource links, we can't be 100% sure without checking
    // So we return false here and let the caller decide based on other indicators
    return false;
}

/**
 * Gets file extension from URL
 * 
 * @param {string} url - The URL
 * @returns {string} The file extension
 */
function getFileExtension(url) {
    try {
        const match = url.match(/\.([a-z0-9]+)(\?|$)/i);
        return match ? match[1].toLowerCase() : 'unknown';
    } catch (e) {
        return 'unknown';
    }
}

/**
 * Checks if an element is in a video/recording context
 * Looks for video-related keywords in parent elements, classes, IDs, and text content
 * 
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} True if the element appears to be in a video context
 */
function hasVideoContext(element) {
    if (!element) return false;
    
    // Check parent elements up to 5 levels up
    let current = element;
    for (let i = 0; i < 5 && current; i++) {
        const text = current.textContent?.toLowerCase() || '';
        const className = current.className?.toLowerCase() || '';
        const id = current.id?.toLowerCase() || '';
        const ariaLabel = (current.getAttribute('aria-label') || '').toLowerCase();
        const title = (current.getAttribute('title') || '').toLowerCase();
        
        // Check for video-related keywords in text
        if (text.includes('הקלטה') || 
            text.includes('video') || 
            text.includes('recording') ||
            text.includes('שיעור') ||
            text.includes('lecture')) {
            return true;
        }
        
        // Check for video-related keywords in classes/IDs
        if (className.includes('video') || 
            className.includes('recording') ||
            className.includes('player') ||
            className.includes('media') ||
            id.includes('video') ||
            id.includes('recording') ||
            id.includes('player')) {
            return true;
        }
        
        // Check aria-label and title
        if (ariaLabel.includes('הקלטה') ||
            ariaLabel.includes('video') ||
            ariaLabel.includes('recording') ||
            title.includes('הקלטה') ||
            title.includes('video') ||
            title.includes('recording')) {
            return true;
        }
        
        current = current.parentElement;
    }
    
    return false;
}

/**
 * Checks if a URL is likely a recording/video URL and not a navigation link
 * Filters out tabs, navigation links, and other non-recording URLs
 * 
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL appears to be a recording/video URL
 */
function isRecordingURL(url) {
    if (!url) return false;
    
    const urlLower = url.toLowerCase();
    
    // Exclude navigation and tab links
    if (urlLower.includes('#requests-tab') ||
        urlLower.includes('#requests-tab-panel') ||
        urlLower.includes('#tab-panel') ||
        urlLower.includes('#section-') ||
        urlLower.includes('?tab=') ||
        urlLower.includes('&tab=') ||
        urlLower.includes('#requests') ||
        urlLower.includes('#contacts') ||
        urlLower.includes('#messages') ||
        urlLower.includes('#participants') ||
        urlLower.includes('#grades') ||
        urlLower.includes('#badges') ||
        urlLower.includes('#completion') ||
        urlLower.includes('user/index.php') ||
        urlLower.includes('user/view.php') ||
        urlLower.includes('message/index.php') ||
        urlLower.includes('enrol/index.php') ||
        // Exclude course view page with hash fragments (navigation)
        (urlLower.includes('/course/view.php') && urlLower.includes('#'))) {
        return false;
    }
    
    // Must include one of these recording indicators
    // Prioritize actual video recording modules
    const hasRecordingIndicator = 
        urlLower.includes('/mod/videostream/view.php') ||
        urlLower.includes('/blocks/video/') ||
        urlLower.includes('/pluginfile.php/') ||
        urlLower.includes('objectstorage') ||
        urlLower.includes('video_bucket') ||
        urlLower.includes('oraclecloud.com') ||
        urlLower.includes('video') ||
        urlLower.includes('recording') ||
        urlLower.includes('הקלטה') ||
        urlLower.includes('player') ||
        urlLower.includes('youtube.com') ||
        urlLower.includes('youtu.be') ||
        urlLower.includes('vimeo.com') ||
        urlLower.includes('panopto') ||
        urlLower.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|mp3|wav|m4a|aac|flac|wma)(\?|$)/i);
    
    // For mod/resource/view.php and mod/url/view.php - require additional context
    // These are usually files or external links, not recordings
    if (urlLower.includes('/mod/resource/view.php') || urlLower.includes('/mod/url/view.php')) {
        // Only include if URL or context strongly suggests it's a recording
        // (This will be checked more carefully in Method 5)
        return false; // Let Method 5 handle these with stricter checks
    }
    
    // If it's a lemida.biu.ac.il URL, it must have a recording indicator
    if (urlLower.includes('lemida.biu.ac.il') || urlLower.includes('biu.ac.il')) {
        return hasRecordingIndicator;
    }
    
    // For other URLs, check if they have recording indicators
    return hasRecordingIndicator;
}

/**
 * Finds recording links on BIU video recording pages (blocks/video/viewvideo_biu.php)
 * 
 * @returns {Array<Object>} Array of recording objects
 */
function findVideoRecordingPageLinks() {
    const recordings = new Map();
    
    console.log('[Moodle PDF Downloader] Searching for recording links on video page...');
    
    // Method 1: Look for video player elements
    const videoPlayers = document.querySelectorAll('video, iframe[src*="video"], iframe[src*="player"], .video-player, [class*="video-player"]');
    videoPlayers.forEach((player, index) => {
        let src = null;
        let name = null;
        
        if (player.tagName === 'VIDEO') {
            src = player.src || player.currentSrc;
            if (!src) {
                const source = player.querySelector('source');
                if (source) {
                    src = source.src || source.getAttribute('src');
                }
            }
            name = player.getAttribute('title') || 
                   player.getAttribute('aria-label') ||
                   document.querySelector('h1, .page-title')?.textContent.trim() ||
                   `Video Recording ${index + 1}`;
        } else if (player.tagName === 'IFRAME') {
            src = player.src;
            name = player.getAttribute('title') || 
                   player.getAttribute('aria-label') ||
                   document.querySelector('h1, .page-title')?.textContent.trim() ||
                   'Embedded Video';
        }
        
        if (src) {
            // Check if it's a valid video URL (including Oracle Cloud Object Storage)
            const isVideoUrl = src.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                              src.includes('/pluginfile.php/') ||
                              src.includes('objectstorage') ||
                              src.includes('video_bucket') ||
                              src.includes('oraclecloud.com');
            
            if (isVideoUrl) {
                recordings.set(src, {
                    url: src,
                    name: name || 'Video Recording',
                    type: 'video_recording',
                    extension: getFileExtension(src)
                });
                console.log('[Moodle PDF Downloader] Found video player:', src);
            }
        }
    });
    
    // Method 2: Look for download links and buttons
    const downloadLinks = document.querySelectorAll('a[href], button, [onclick]');
    downloadLinks.forEach(link => {
        let href = link.href;
        
        // Try to extract from onclick
        if (!href && link.getAttribute('onclick')) {
            const onclick = link.getAttribute('onclick');
            const urlMatch = onclick.match(/(?:href|url|src|location)\s*[=:]\s*['"]([^'"]+)['"]/i) ||
                           onclick.match(/['"](https?:\/\/[^'"]+)['"]/i) ||
                           onclick.match(/['"]([^'"]*\.(mp4|webm|avi|mov|mp3|wav)[^'"]*)['"]/i);
            if (urlMatch) {
                href = urlMatch[1];
            }
        }
        
        // Check if it's a download/video/recording link
        if (href && (href.includes('video') || 
                     href.includes('recording') || 
                     href.includes('download') ||
                     href.includes('pluginfile') ||
                     href.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|mp3|wav|m4a|aac|flac|wma)(\?|$)/i))) {
            const linkText = link.textContent.trim().toLowerCase();
            const linkHTML = link.outerHTML.toLowerCase();
            
            // Check if link text suggests it's a download/video link
            if (linkText.includes('הורד') || 
                linkText.includes('download') ||
                linkText.includes('video') ||
                linkText.includes('הקלטה') ||
                linkHTML.includes('download') ||
                linkHTML.includes('video') ||
                link.hasAttribute('download')) {
                const name = link.textContent.trim() || 
                            link.getAttribute('title') ||
                            link.getAttribute('aria-label') ||
                            document.querySelector('h1, .page-title')?.textContent.trim() ||
                            'Recording Download';
                
                recordings.set(href, {
                    url: href,
                    name: name,
                    type: 'download_link',
                    extension: getFileExtension(href)
                });
                console.log('[Moodle PDF Downloader] Found download link:', href);
            }
        }
    });
    
    // Method 3: Look for pluginfile.php links (video files)
    const pluginfileLinks = document.querySelectorAll('a[href*="/pluginfile.php/"]');
    pluginfileLinks.forEach(link => {
        const href = link.href;
        const fileName = extractFileNameFromURL(href).toLowerCase();
        
        // Check if it's a video/audio file
        if (fileName.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|mp3|wav|m4a|aac|flac|wma)(\?|$)/i)) {
            const name = link.textContent.trim() || 
                        extractFileNameFromURL(href) ||
                        document.querySelector('h1, .page-title')?.textContent.trim() ||
                        'Recording';
            
            recordings.set(href, {
                url: href,
                name: name,
                type: 'video_file',
                extension: getFileExtension(href)
            });
            console.log('[Moodle PDF Downloader] Found video file link:', href);
        }
    });
    
    // Method 3b: Look for direct video URLs (Oracle Cloud Object Storage, etc.)
    const allVideoLinks = document.querySelectorAll('a[href]');
    allVideoLinks.forEach(link => {
        const href = link.href;
        const hrefLower = href.toLowerCase();
        
        // Check for Oracle Cloud Object Storage or other direct video URLs
        if (hrefLower.includes('objectstorage') ||
            hrefLower.includes('video_bucket') ||
            hrefLower.includes('oraclecloud.com') ||
            (hrefLower.match(/https:\/\/[^\/]+\.(com|net|org|cloud)\/[^\/]+\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i))) {
            const name = link.textContent.trim() || 
                        extractFileNameFromURL(href) ||
                        document.querySelector('h1, .page-title')?.textContent.trim() ||
                        'Video Recording';
            
            recordings.set(href, {
                url: href,
                name: name,
                type: 'video_file',
                extension: getFileExtension(href)
            });
            console.log('[Moodle PDF Downloader] Found direct video URL:', href);
        }
    });
    
    // Method 4: Look for all links on the page that might be video/recording related
    const allLinks = document.querySelectorAll('a[href]');
    allLinks.forEach(link => {
        const href = link.href;
        const linkText = link.textContent.trim().toLowerCase();
        const linkHTML = link.outerHTML.toLowerCase();
        
        // Check for video/recording related keywords
        if (linkText.includes('הקלטה') || 
            linkText.includes('video') ||
            linkText.includes('recording') ||
            linkText.includes('שיעור') ||
            linkHTML.includes('video') ||
            linkHTML.includes('recording') ||
            linkHTML.includes('הקלטה')) {
            // Check if it's not already in recordings
            if (!recordings.has(href)) {
                const name = link.textContent.trim() || 
                            link.getAttribute('title') ||
                            link.getAttribute('aria-label') ||
                            'Recording';
                
                recordings.set(href, {
                    url: href,
                    name: name,
                    type: 'recording_link',
                    extension: getFileExtension(href)
                });
                console.log('[Moodle PDF Downloader] Found recording-related link:', href);
            }
        }
    });
    
    // Method 5: Look for page title and use current page URL as recording (fallback)
    if (recordings.size === 0) {
        const pageTitle = document.querySelector('h1, .page-title, title');
        const pageName = pageTitle ? pageTitle.textContent.trim() : 'Video Recording';
        const currentUrl = window.location.href;
        
        recordings.set(currentUrl, {
            url: currentUrl,
            name: pageName,
            type: 'video_page',
            extension: 'html'
        });
        console.log('[Moodle PDF Downloader] Added current page as recording:', currentUrl);
    }
    
    const result = Array.from(recordings.values());
    console.log('[Moodle PDF Downloader] Found', result.length, 'recordings on video page');
    return result;
}

/**
 * Finds recordings within Moodle course containers (sections, activities)
 * Searches for video/audio elements and iframes within Moodle-specific containers
 * This helps find recordings in collapsed sections or additional content
 * 
 * @returns {Array<Object>} Array of recording objects found in Moodle containers
 */
function findRecordingsInMoodleContainers() {
    const recordings = new Map();
    
    console.log('[Moodle PDF Downloader] Searching for recordings in Moodle containers...');
    
    // Find all Moodle course containers
    const moodleContainers = document.querySelectorAll(
        '.section, .course-content, .activity, .modtype_resource, .activityinstance, ' +
        '[class*="section"], [class*="activity"], [class*="modtype"]'
    );
    
    console.log('[Moodle PDF Downloader] Found', moodleContainers.length, 'Moodle containers');
    
    moodleContainers.forEach((container, containerIndex) => {
        // Search for video elements within this container
        const videos = container.querySelectorAll('video, video source');
        videos.forEach((video, index) => {
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
            
            if (src) {
                // Check if it's a valid video URL (including Oracle Cloud Object Storage)
                const isVideoUrl = src.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                                  src.includes('/pluginfile.php/') ||
                                  src.includes('objectstorage') ||
                                  src.includes('video_bucket') ||
                                  src.includes('oraclecloud.com');
                
                if (isVideoUrl) {
                    const name = video.getAttribute('title') || 
                                video.getAttribute('alt') || 
                                video.getAttribute('aria-label') ||
                                // Try to get name from container context
                                container.querySelector('h3, .activity-title, .instancename')?.textContent.trim() ||
                                `Video ${containerIndex + 1}-${index + 1}`;
                    
                    recordings.set(src, {
                        url: src,
                        name: name,
                        type: 'video_moodle_container',
                        extension: getFileExtension(src)
                    });
                    console.log('[Moodle PDF Downloader] Found video in Moodle container:', src);
                }
            }
        });
        
        // Search for audio elements within this container
        const audios = container.querySelectorAll('audio, audio source');
        audios.forEach((audio, index) => {
            let src = null;
            if (audio.tagName === 'AUDIO') {
                src = audio.src || audio.currentSrc;
                if (!src) {
                    const source = audio.querySelector('source');
                    if (source) {
                        src = source.src || source.getAttribute('src');
                    }
                }
            } else if (audio.tagName === 'SOURCE') {
                src = audio.src || audio.getAttribute('src');
            }
            
            if (src) {
                const name = audio.getAttribute('title') || 
                            audio.getAttribute('alt') || 
                            audio.getAttribute('aria-label') ||
                            container.querySelector('h3, .activity-title, .instancename')?.textContent.trim() ||
                            `Audio ${containerIndex + 1}-${index + 1}`;
                
                recordings.set(src, {
                    url: src,
                    name: name,
                    type: 'audio_moodle_container',
                    extension: getFileExtension(src)
                });
                console.log('[Moodle PDF Downloader] Found audio in Moodle container:', src);
            }
        });
        
        // Search for iframes within this container
        const iframes = container.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            let src = iframe.src;
            
            // Check data attributes
            if (!src || src === 'about:blank' || src === '') {
                src = iframe.getAttribute('data-src') || 
                      iframe.getAttribute('data-url') || 
                      iframe.getAttribute('data-video-url') ||
                      iframe.getAttribute('data-embed-url');
            }
            
            // Check if iframe has video context
            const hasContext = hasVideoContext(iframe);
            const containerText = container.textContent?.toLowerCase() || '';
            const hasVideoInContainer = containerText.includes('הקלטה') ||
                                        containerText.includes('video') ||
                                        containerText.includes('recording') ||
                                        containerText.includes('שיעור');
            
            if (src && src !== 'about:blank' && src !== '') {
                // Use isRecordingURL to filter out non-recording URLs
                if (isRecordingURL(src)) {
                    // Additional check: if it's a general lemida URL, must have video context
                    const srcLower = src.toLowerCase();
                    if ((srcLower.includes('lemida.biu.ac.il') || srcLower.includes('biu.ac.il')) && 
                        !srcLower.includes('/blocks/video/') &&
                        !srcLower.includes('/mod/resource/view.php') &&
                        !srcLower.includes('/mod/page/view.php') &&
                        !srcLower.includes('/mod/url/view.php') &&
                        !hasContext &&
                        !hasVideoInContainer) {
                        // Skip generic lemida URLs without video context
                        return;
                    }
                    
                    const name = iframe.getAttribute('title') || 
                                iframe.getAttribute('aria-label') ||
                                iframe.getAttribute('data-title') ||
                                container.querySelector('h3, .activity-title, .instancename')?.textContent.trim() ||
                                `Embedded Video ${containerIndex + 1}-${index + 1}`;
                    
                    recordings.set(src, {
                        url: src,
                        name: name,
                        type: 'embedded_video_moodle_container',
                        extension: 'html'
                    });
                    console.log('[Moodle PDF Downloader] Found iframe in Moodle container:', src);
                }
            } else if (hasContext || hasVideoInContainer) {
                // If no src but has video context, look for related links in container
                const containerLinks = container.querySelectorAll('a[href]');
                containerLinks.forEach(link => {
                    const href = link.href;
                    const linkText = (link.textContent.trim() || '').toLowerCase();
                    
                    // Prioritize videostream modules
                    if (href && href.includes('/mod/videostream/view.php')) {
                        const name = link.textContent.trim() || 
                                    container.querySelector('h3, .activity-title, .instancename')?.textContent.trim() ||
                                    'Recording';
                        
                        recordings.set(href, {
                            url: href,
                            name: name,
                            type: 'videostream_recording',
                            extension: 'html'
                        });
                        console.log('[Moodle PDF Downloader] Found videostream in Moodle container:', href);
                        return;
                    }
                    
                    // For mod/resource/view.php and mod/url/view.php - be very strict
                    if (href && (href.includes('/mod/resource/view.php') || href.includes('/mod/url/view.php'))) {
                        // Exclude if link text suggests it's a file or external link
                        const isFileOrLink = linkText.includes('קובץ') ||
                            linkText.includes('קישור') ||
                            linkText.includes('file') ||
                            linkText.includes('link') ||
                            linkText.includes('אתר') ||
                            linkText.includes('website') ||
                            linkText.includes('זום') ||
                            linkText.includes('zoom');
                        
                        // Must have strong video/recording indicators
                        const hasStrongVideoIndicator = 
                            linkText.includes('הקלטה') ||
                            linkText.includes('הקלטת') ||
                            linkText.includes('recording') ||
                            linkText.includes('video') ||
                            linkText.includes('שילוב סרטון') ||
                            linkText.includes('סרטון');
                        
                        // Only include if it has strong video indicators AND is not a file/link
                        if (hasStrongVideoIndicator && !isFileOrLink) {
                            const name = link.textContent.trim() || 
                                        container.querySelector('h3, .activity-title, .instancename')?.textContent.trim() ||
                                        'Recording';
                            
                            recordings.set(href, {
                                url: href,
                                name: name,
                                type: 'recording_link_moodle_container',
                                extension: 'html'
                            });
                            console.log('[Moodle PDF Downloader] Found recording link in Moodle container:', href);
                        }
                        return;
                    }
                    
                    // For other links, use isRecordingURL to filter
                    if (href && isRecordingURL(href)) {
                        const name = link.textContent.trim() || 
                                    container.querySelector('h3, .activity-title, .instancename')?.textContent.trim() ||
                                    'Recording';
                        
                        recordings.set(href, {
                            url: href,
                            name: name,
                            type: 'recording_link_moodle_container',
                            extension: 'html'
                        });
                        console.log('[Moodle PDF Downloader] Found recording link in Moodle container:', href);
                    }
                });
            }
        });
        
        // Search for video/audio file links within this container
        const links = container.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.href;
            const linkText = link.textContent.trim().toLowerCase();
            
            // Check for video file extensions or Oracle Cloud Object Storage URLs
            if (href.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                href.includes('objectstorage') ||
                href.includes('video_bucket') ||
                href.includes('oraclecloud.com')) {
                const name = link.textContent.trim() || 
                            extractFileNameFromURL(href) || 
                            container.querySelector('h3, .activity-title, .instancename')?.textContent.trim() ||
                            'Video';
                
                recordings.set(href, {
                    url: href,
                    name: name,
                    type: 'video_link_moodle_container',
                    extension: getFileExtension(href)
                });
                console.log('[Moodle PDF Downloader] Found video link in Moodle container:', href);
            }
            // Check for audio file extensions
            else if (href.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i)) {
                const name = link.textContent.trim() || 
                            extractFileNameFromURL(href) || 
                            container.querySelector('h3, .activity-title, .instancename')?.textContent.trim() ||
                            'Audio';
                
                recordings.set(href, {
                    url: href,
                    name: name,
                    type: 'audio_link_moodle_container',
                    extension: getFileExtension(href)
                });
                console.log('[Moodle PDF Downloader] Found audio link in Moodle container:', href);
            }
        });
    });
    
    const result = Array.from(recordings.values());
    console.log('[Moodle PDF Downloader] Found', result.length, 'recordings in Moodle containers');
    return result;
}

/**
 * Scans the page for video/audio recordings
 * Looks for video and audio elements, links to video/audio files, and embedded players
 * 
 * @returns {Array<Object>} Array of recording objects with url, name, and type
 */
function findRecordings() {
    const recordings = new Map();
    
    console.log('[Moodle PDF Downloader] Scanning page for recordings...');
    
    // Special handling for BIU video recording pages
    if (isVideoRecordingPage()) {
        console.log('[Moodle PDF Downloader] Detected BIU video recording page');
        return findVideoRecordingPageLinks();
    }
    
    // Method 1: Look for video elements
    const videos = document.querySelectorAll('video, video source');
    videos.forEach((video, index) => {
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
        
        if (src) {
            // Check if it's a valid video URL (including Oracle Cloud Object Storage)
            const isVideoUrl = src.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
                              src.includes('/pluginfile.php/') ||
                              src.includes('objectstorage') ||
                              src.includes('video_bucket') ||
                              src.includes('oraclecloud.com');
            
            if (isVideoUrl) {
                const name = video.getAttribute('title') || 
                            video.getAttribute('alt') || 
                            video.getAttribute('aria-label') ||
                            `Video ${index + 1}`;
                const extension = getFileExtension(src);
                
                recordings.set(src, {
                    url: src,
                    name: name,
                    type: 'video',
                    extension: extension
                });
                console.log('[Moodle PDF Downloader] Found video:', src);
            }
        }
    });
    
    // Method 2: Look for audio elements
    const audios = document.querySelectorAll('audio, audio source');
    audios.forEach((audio, index) => {
        let src = null;
        if (audio.tagName === 'AUDIO') {
            src = audio.src || audio.currentSrc;
            if (!src) {
                const source = audio.querySelector('source');
                if (source) {
                    src = source.src || source.getAttribute('src');
                }
            }
        } else if (audio.tagName === 'SOURCE') {
            src = audio.src || audio.getAttribute('src');
        }
        
        if (src) {
            const name = audio.getAttribute('title') || 
                        audio.getAttribute('alt') || 
                        audio.getAttribute('aria-label') ||
                        `Audio ${index + 1}`;
            const extension = getFileExtension(src);
            
            recordings.set(src, {
                url: src,
                name: name,
                type: 'audio',
                extension: extension
            });
            console.log('[Moodle PDF Downloader] Found audio:', src);
        }
    });
    
    // Method 3: Look for links to video/audio files
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        const href = link.href;
        const linkText = link.textContent.trim();
        
        // Check for video file extensions or Oracle Cloud Object Storage URLs
        if (href.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?|$)/i) ||
            href.includes('objectstorage') ||
            href.includes('video_bucket') ||
            href.includes('oraclecloud.com')) {
            recordings.set(href, {
                url: href,
                name: linkText || extractFileNameFromURL(href) || 'Video',
                type: 'video_link',
                extension: getFileExtension(href)
            });
            console.log('[Moodle PDF Downloader] Found video link:', href);
        }
        // Check for audio file extensions
        else if (href.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i)) {
            recordings.set(href, {
                url: href,
                name: linkText || extractFileNameFromURL(href) || 'Audio',
                type: 'audio_link',
                extension: getFileExtension(href)
            });
            console.log('[Moodle PDF Downloader] Found audio link:', href);
        }
    });
    
    // Method 4: Look for iframes with video/audio (YouTube, Vimeo, BIU, etc.)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        // Check src attribute
        let src = iframe.src;
        
        // Check data attributes for lazy-loaded iframes
        if (!src || src === 'about:blank' || src === '') {
            src = iframe.getAttribute('data-src') || 
                  iframe.getAttribute('data-url') || 
                  iframe.getAttribute('data-video-url') ||
                  iframe.getAttribute('data-embed-url');
        }
        
        // Check if iframe has video context even without src
        const hasContext = hasVideoContext(iframe);
        const iframeClass = (iframe.className || '').toLowerCase();
        const iframeId = (iframe.id || '').toLowerCase();
        const iframeTitle = (iframe.getAttribute('title') || '').toLowerCase();
        const iframeAriaLabel = (iframe.getAttribute('aria-label') || '').toLowerCase();
        
        // Check if iframe class/id suggests video
        const hasVideoIndicator = iframeClass.includes('video') || 
                                  iframeClass.includes('player') ||
                                  iframeClass.includes('recording') ||
                                  iframeClass.includes('media') ||
                                  iframeId.includes('video') ||
                                  iframeId.includes('player') ||
                                  iframeId.includes('recording') ||
                                  iframeTitle.includes('video') ||
                                  iframeTitle.includes('הקלטה') ||
                                  iframeAriaLabel.includes('video') ||
                                  iframeAriaLabel.includes('הקלטה');
        
        // If we have a src, check if it's video-related
        if (src && src !== 'about:blank' && src !== '') {
            const srcLower = src.toLowerCase();
            if (srcLower.includes('youtube.com') || 
                srcLower.includes('youtu.be') || 
                srcLower.includes('vimeo.com') ||
                srcLower.includes('dailymotion.com') ||
                srcLower.includes('video') ||
                srcLower.includes('player') ||
                srcLower.includes('panopto') ||
                srcLower.includes('zoom') ||
                srcLower.includes('recording') ||
                srcLower.includes('lemida.biu.ac.il') ||
                srcLower.includes('biu.ac.il') ||
                srcLower.includes('biu') ||
                srcLower.includes('lemida') ||
                srcLower.includes('moodle') ||
                hasVideoIndicator ||
                hasContext) {
                const name = iframe.getAttribute('title') || 
                            iframe.getAttribute('alt') || 
                            iframe.getAttribute('aria-label') ||
                            iframe.getAttribute('data-title') ||
                            'Embedded Video';
                
                recordings.set(src, {
                    url: src,
                    name: name,
                    type: 'embedded_video',
                    extension: 'html'
                });
                console.log('[Moodle PDF Downloader] Found embedded video:', src);
            }
        }
        // If no src but has video context, try to find the URL from parent or data attributes
        else if (hasVideoIndicator || hasContext) {
            // Try to find URL in parent element
            const parent = iframe.parentElement;
            if (parent) {
                const parentLinks = parent.querySelectorAll('a[href]');
                parentLinks.forEach(link => {
                    const href = link.href;
                    if (href && (href.includes('video') || 
                                 href.includes('recording') ||
                                 href.includes('הקלטה') ||
                                 href.includes('lemida.biu.ac.il') ||
                                 href.includes('/blocks/video/'))) {
                        const name = link.textContent.trim() || 
                                    iframe.getAttribute('title') ||
                                    iframe.getAttribute('aria-label') ||
                                    'Embedded Video';
                        
                        recordings.set(href, {
                            url: href,
                            name: name,
                            type: 'embedded_video',
                            extension: 'html'
                        });
                        console.log('[Moodle PDF Downloader] Found embedded video via context:', href);
                    }
                });
            }
        }
    });
    
    // Method 5: Look for Moodle video/audio resources and BIU video recording pages
    // Only include actual video recording modules, not regular files or URLs
    const moodleVideoLinks = document.querySelectorAll('a[href*="/mod/videostream/view.php"], a[href*="/mod/resource/view.php"], a[href*="/mod/url/view.php"], a[href*="/mod/page/view.php"], a[href*="/blocks/video/viewvideo_biu.php"]');
    moodleVideoLinks.forEach(link => {
        const href = link.href;
        const linkText = link.textContent.trim().toLowerCase();
        const linkHTML = link.outerHTML.toLowerCase();
        const ariaLabel = (link.getAttribute('aria-label') || '').toLowerCase();
        const title = (link.getAttribute('title') || '').toLowerCase();
        
        // Priority 1: Check if it's a videostream module (actual video recording)
        if (href.includes('/mod/videostream/view.php')) {
            const name = link.textContent.trim() || 
                        link.getAttribute('aria-label') ||
                        link.getAttribute('title') ||
                        'Video Recording';
            recordings.set(href, {
                url: href,
                name: name,
                type: 'videostream_recording',
                extension: 'html'
            });
            console.log('[Moodle PDF Downloader] Found videostream recording:', href);
            return; // Skip further checks
        }
        
        // Priority 2: Check if it's a BIU video recording page
        if (href.includes('/blocks/video/viewvideo_biu.php')) {
            const name = link.textContent.trim() || 
                        link.getAttribute('aria-label') ||
                        link.getAttribute('title') ||
                        'Video Recording';
            recordings.set(href, {
                url: href,
                name: name,
                type: 'biu_video_page',
                extension: 'html'
            });
            console.log('[Moodle PDF Downloader] Found BIU video recording page:', href);
            return; // Skip further checks
        }
        
        // For mod/resource/view.php and mod/url/view.php - be very strict
        // Only include if it's clearly a video/recording (not just a file or external link)
        if (href.includes('/mod/resource/view.php') || href.includes('/mod/url/view.php')) {
            // Exclude if link text suggests it's a file or external link
            const isFileOrLink = linkText.includes('קובץ') ||
                linkText.includes('קישור') ||
                linkText.includes('file') ||
                linkText.includes('link') ||
                linkText.includes('אתר') ||
                linkText.includes('website') ||
                linkText.includes('זום') ||
                linkText.includes('zoom');
            
            // Must have strong video/recording indicators
            const hasStrongVideoIndicator = 
                linkText.includes('הקלטה') ||
                linkText.includes('הקלטת') ||
                linkText.includes('recording') ||
                linkText.includes('video') ||
                linkText.includes('שילוב סרטון') ||
                linkText.includes('סרטון') ||
                ariaLabel.includes('הקלטה') ||
                ariaLabel.includes('הקלטת') ||
                ariaLabel.includes('recording') ||
                ariaLabel.includes('video') ||
                title.includes('הקלטה') ||
                title.includes('הקלטת') ||
                title.includes('recording') ||
                title.includes('video');
            
            // Only include if it has strong video indicators AND is not a file/link
            if (hasStrongVideoIndicator && !isFileOrLink) {
                const name = link.textContent.trim() || 
                            link.getAttribute('aria-label') ||
                            link.getAttribute('title') ||
                            extractFileNameFromURL(href) || 
                            'Recording';
                recordings.set(href, {
                    url: href,
                    name: name,
                    type: 'moodle_resource',
                    extension: 'html'
                });
                console.log('[Moodle PDF Downloader] Found Moodle recording resource:', href);
            }
        }
    });
    
    // Method 6: Look for pluginfile.php links that might be videos/audios
    const pluginfileLinks = document.querySelectorAll('a[href*="/pluginfile.php/"]');
    pluginfileLinks.forEach(link => {
        const href = link.href;
        const fileName = extractFileNameFromURL(href).toLowerCase();
        
        // Check if filename suggests video/audio
        if (fileName.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|mp3|wav|m4a|aac|flac|wma)(\?|$)/i)) {
            // Additional check: verify it's actually a recording (not a false positive)
            // Check if link has video context or if filename clearly indicates recording
            const hasContext = hasVideoContext(link);
            const linkText = link.textContent.trim().toLowerCase();
            
            // Exclude if link text suggests it's NOT a recording
            const isNonRecordingText = linkText.includes('pdf') ||
                linkText.includes('מצגת') ||
                linkText.includes('presentation') ||
                linkText.includes('document') ||
                linkText.includes('מסמך') ||
                (linkText.includes('video') && (linkText.includes('pdf') || linkText.includes('מצגת')));
            
            // Only include if it's clearly a video/audio file and not excluded
            if (!isNonRecordingText) {
                const extension = getFileExtension(href);
                const type = fileName.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)/i) ? 'video' : 'audio';
                
                recordings.set(href, {
                    url: href,
                    name: extractFileNameFromURL(href) || 'Recording',
                    type: type + '_pluginfile',
                    extension: extension
                });
                console.log('[Moodle PDF Downloader] Found recording via pluginfile:', href);
            }
        }
    });
    
    // Method 7: Look for recordings in Moodle course containers (sections, activities)
    // This helps find recordings in collapsed sections or additional content
    const moodleContainerRecordings = findRecordingsInMoodleContainers();
    moodleContainerRecordings.forEach(recording => {
        // Only add if not already in recordings (avoid duplicates)
        // Also filter out non-recording URLs
        if (!recordings.has(recording.url) && isRecordingURL(recording.url)) {
            recordings.set(recording.url, recording);
        }
    });
    
    // Final filter: remove any recordings that don't pass isRecordingURL check
    const filteredRecordings = new Map();
    recordings.forEach((recording, url) => {
        const urlLower = url.toLowerCase();
        const nameLower = (recording.name || '').toLowerCase();
        
        // Always include videostream modules (actual recordings)
        if (urlLower.includes('/mod/videostream/view.php')) {
            filteredRecordings.set(url, recording);
            return;
        }
        
        // Always include BIU video blocks
        if (urlLower.includes('/blocks/video/viewvideo_biu.php')) {
            filteredRecordings.set(url, recording);
            return;
        }
        
        // For mod/resource/view.php and mod/url/view.php - exclude unless very clear it's a recording
        if (urlLower.includes('/mod/resource/view.php') || urlLower.includes('/mod/url/view.php')) {
            // Exclude if name suggests it's a file or external link
            const isFileOrLink = nameLower.includes('קובץ') ||
                nameLower.includes('קישור') ||
                nameLower.includes('file') ||
                nameLower.includes('link') ||
                nameLower.includes('אתר') ||
                nameLower.includes('website') ||
                nameLower.includes('זום') ||
                nameLower.includes('zoom');
            
            // Must have strong video/recording indicators in name
            const hasStrongVideoIndicator = 
                nameLower.includes('הקלטה') ||
                nameLower.includes('הקלטת') ||
                nameLower.includes('recording') ||
                nameLower.includes('video') ||
                nameLower.includes('שילוב סרטון') ||
                nameLower.includes('סרטון');
            
            // Only include if it has strong video indicators AND is not a file/link
            if (hasStrongVideoIndicator && !isFileOrLink) {
                filteredRecordings.set(url, recording);
            }
            return;
        }
        
        // For other URLs, use isRecordingURL check
        if (isRecordingURL(url)) {
            // Additional check: exclude if name suggests it's not a recording
            const isNonRecordingName = nameLower.includes('pdf') ||
                nameLower.includes('מצגת') ||
                nameLower.includes('presentation') ||
                nameLower.includes('document') ||
                nameLower.includes('מסמך') ||
                (nameLower.includes('video') && (nameLower.includes('pdf') || nameLower.includes('מצגת')));
            
            if (!isNonRecordingName) {
                filteredRecordings.set(url, recording);
            }
        }
    });
    
    const result = Array.from(filteredRecordings.values());
    console.log('[Moodle PDF Downloader] Total recordings found:', result.length);
    return result;
}

/**
 * Gets the course name from the Moodle page
 * 
 * @returns {string} The course name or empty string if not found
 */
function getCourseName() {
    // Try multiple methods to get course name
    // Method 1: Look for h1 with class "h2 mb-0" (BIU Moodle specific)
    const biuCourseTitle = document.querySelector('h1.h2.mb-0, h1.h2');
    if (biuCourseTitle) {
        const titleText = biuCourseTitle.textContent.trim();
        // Exclude common non-course titles and check if it looks like a course name
        if (titleText && 
            titleText.length > 3 &&
            !titleText.includes('Dashboard') && 
            !titleText.includes('My courses') &&
            !titleText.includes('דף הבית') &&
            !titleText.match(/^\d+$/)) { // Exclude if it's just a number (like course ID)
            return titleText;
        }
    }
    
    // Method 2: Look for course title in header (general Moodle)
    const courseTitle = document.querySelector('h1.coursename, .page-header-headings h1, .page-header h1, h1');
    if (courseTitle) {
        const titleText = courseTitle.textContent.trim();
        // Exclude common non-course titles
        if (titleText && 
            titleText.length > 3 &&
            !titleText.includes('Dashboard') && 
            !titleText.includes('My courses') &&
            !titleText.includes('דף הבית') &&
            !titleText.match(/^\d+$/)) {
            return titleText;
        }
    }
    
    // Method 3: Look for breadcrumb with course name
    const breadcrumb = document.querySelector('.breadcrumb, nav[aria-label="breadcrumb"], .breadcrumb-item');
    if (breadcrumb) {
        const breadcrumbItems = breadcrumb.querySelectorAll('a, span');
        for (let item of breadcrumbItems) {
            const text = item.textContent.trim();
            if (text && 
                text.length > 3 &&
                !text.includes('Home') && 
                !text.includes('Dashboard') &&
                !text.includes('דף הבית') &&
                !text.match(/^\d+$/)) {
                return text;
            }
        }
    }
    
    // Method 4: Look for course name in page title
    const pageTitle = document.title;
    if (pageTitle && !pageTitle.includes('Moodle')) {
        const titleParts = pageTitle.split(' : ');
        if (titleParts.length > 0) {
            const firstPart = titleParts[0].trim();
            if (firstPart && firstPart.length > 3) {
                return firstPart;
            }
        }
    }
    
    // Method 5: Try to extract from URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    if (courseId) {
        return `Course_${courseId}`;
    }
    
    return '';
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCourseName') {
        try {
            const courseName = getCourseName();
            sendResponse({ success: true, courseName: courseName });
        } catch (error) {
            console.error('[Moodle PDF Downloader] Error getting course name:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep message channel open for async response
    } else if (request.action === 'scanPDFs') {
        try {
            console.log('[Moodle PDF Downloader] Received scan request');
            const pdfLinks = findPDFLinks();
            
            // Filter out non-PDF links if they don't have PDF indicators
            // Keep all links that have explicit PDF indicators or are direct PDF links
            const filteredLinks = pdfLinks.filter(link => {
                // Keep direct PDFs and links with PDF indicators
                if (link.type === 'direct' || 
                    link.type === 'metadata' || 
                    link.type === 'forcedownload' ||
                    link.type === 'image_link' ||
                    link.type === 'iframe') {
                    return true;
                }
                
                // For pluginfile and resource links, keep them all
                // (user can decide which ones to download)
                // But prioritize those with PDF indicators
                return true;
            });
            
            console.log('[Moodle PDF Downloader] Sending response with', filteredLinks.length, 'links');
            sendResponse({ success: true, pdfLinks: filteredLinks });
        } catch (error) {
            console.error('[Moodle PDF Downloader] Error scanning:', error);
            sendResponse({ success: false, error: error.message });
        }
    } else if (request.action === 'getDirectDownloadLink') {
        // Try to find direct pluginfile.php link for a view.php URL
        try {
            const viewUrl = request.url;
            console.log('[Moodle PDF Downloader] Looking for direct link for:', viewUrl);
            
            // If we're on a resource view page, look for pluginfile.php links
            if (isResourceViewPage()) {
                const pluginfileLinks = document.querySelectorAll('a[href*="/pluginfile.php/"]');
                if (pluginfileLinks.length > 0) {
                    const directLink = pluginfileLinks[0].href;
                    console.log('[Moodle PDF Downloader] Found direct link on resource page:', directLink);
                    sendResponse({ success: true, directLink: directLink });
                    return true;
                }
            }
            
            // Look for pluginfile.php links anywhere on the page
            const allPluginfileLinks = document.querySelectorAll('a[href*="/pluginfile.php/"]');
            if (allPluginfileLinks.length > 0) {
                // Try to find one that matches the resource ID
                const urlObj = new URL(viewUrl);
                const resourceId = urlObj.searchParams.get('id');
                
                if (resourceId) {
                    // Look for links that might be related to this resource
                    for (let link of allPluginfileLinks) {
                        if (link.href.includes(resourceId) || link.textContent.includes(resourceId)) {
                            console.log('[Moodle PDF Downloader] Found matching direct link:', link.href);
                            sendResponse({ success: true, directLink: link.href });
                            return true;
                        }
                    }
                }
                
                // If no match, use the first pluginfile.php link
                const directLink = allPluginfileLinks[0].href;
                console.log('[Moodle PDF Downloader] Found first pluginfile.php link:', directLink);
                sendResponse({ success: true, directLink: directLink });
                return true;
            }
            
            // No direct link found
            console.log('[Moodle PDF Downloader] No direct link found, will use forcedownload');
            sendResponse({ success: false });
        } catch (error) {
            console.error('[Moodle PDF Downloader] Error getting direct link:', error);
            sendResponse({ success: false, error: error.message });
        }
    } else if (request.action === 'scanRecordings') {
        try {
            console.log('[Moodle PDF Downloader] Received scan recordings request');
            const recordings = findRecordings();
            console.log('[Moodle PDF Downloader] Sending response with', recordings.length, 'recordings');
            sendResponse({ success: true, recordings: recordings });
        } catch (error) {
            console.error('[Moodle PDF Downloader] Error scanning recordings:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; // Keep message channel open for async response
});
