/**
 * Popup Script for Moodle PDF Downloader Extension
 * 
 * This file handles the popup interface logic, including scanning for PDFs,
 * displaying results, and managing downloads.
 */

// Global state
let currentPDFLinks = [];
let downloadedCount = 0;

/**
 * Updates the status message with appropriate styling
 * 
 * @param {string} message - The status message to display
 * @param {string} type - The type of status: 'success', 'error', or 'info'
 */
function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = type;
    statusElement.style.display = 'block';
}

/**
 * Displays the list of found PDF files
 * 
 * @param {Array<Object>} pdfLinks - Array of PDF link objects
 */
function displayPDFList(pdfLinks) {
    const listElement = document.getElementById('linkList');
    listElement.innerHTML = '';
    
    if (!pdfLinks || pdfLinks.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <div>לא נמצאו קבצי PDF בדף זה</div>
            </div>
        `;
        return;
    }
    
    // Update stats
    const statsElement = document.getElementById('stats');
    const totalCountElement = document.getElementById('totalCount');
    statsElement.style.display = 'flex';
    totalCountElement.textContent = pdfLinks.length;
    
    // Create download all button
    const downloadAllButton = document.createElement('button');
    downloadAllButton.textContent = `⬇️ הורד את כל הקבצים (${pdfLinks.length})`;
    downloadAllButton.onclick = () => downloadAllPDFs(pdfLinks);
    listElement.appendChild(downloadAllButton);
    
    // Create individual file items
    pdfLinks.forEach((pdfLink, index) => {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        
        const linkName = document.createElement('div');
        linkName.className = 'link-name';
        linkName.textContent = `${index + 1}. ${pdfLink.name || 'PDF File'}`;
        
        const linkUrl = document.createElement('div');
        linkUrl.className = 'link-url';
        linkUrl.textContent = pdfLink.url;
        linkUrl.title = pdfLink.url;
        
        const linkType = document.createElement('span');
        linkType.className = 'link-type';
        linkType.textContent = `סוג: ${pdfLink.type || 'unknown'}`;
        
        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-single';
        downloadButton.textContent = '⬇️ הורד קובץ זה';
        downloadButton.onclick = () => downloadSinglePDF(pdfLink, index);
        
        linkItem.appendChild(linkName);
        linkItem.appendChild(linkType);
        linkItem.appendChild(linkUrl);
        linkItem.appendChild(downloadButton);
        
        listElement.appendChild(linkItem);
    });
}

/**
 * Downloads a single PDF file
 * 
 * @param {Object} pdfLink - PDF link object with url and name
 * @param {number} index - Index of the file in the list
 */
function downloadSinglePDF(pdfLink, index) {
    const fileName = pdfLink.name || `file_${index + 1}.pdf`;
    
    downloadPDF(pdfLink.url, fileName, (success, error) => {
        if (success) {
            downloadedCount++;
            updateDownloadedCount();
            updateStatus(`✅ הורדה הושלמה: ${fileName}`, 'success');
            
            // Update button state
            const buttons = document.querySelectorAll('.download-single');
            if (buttons[index]) {
                buttons[index].textContent = '✅ הורד';
                buttons[index].disabled = true;
            }
        } else {
            updateStatus(`❌ שגיאה בהורדה: ${error || 'שגיאה לא ידועה'}`, 'error');
        }
    });
}

/**
 * Downloads all PDF files sequentially with delay
 * 
 * @param {Array<Object>} pdfLinks - Array of PDF link objects
 */
function downloadAllPDFs(pdfLinks) {
    if (!pdfLinks || pdfLinks.length === 0) {
        updateStatus('❌ אין קבצים להוריד', 'error');
        return;
    }
    
    updateStatus(`⬇️ מתחיל להוריד ${pdfLinks.length} קבצים...`, 'info');
    downloadedCount = 0;
    updateDownloadedCount();
    
    // Disable download all button
    const downloadAllButton = document.querySelector('button');
    if (downloadAllButton) {
        downloadAllButton.disabled = true;
        downloadAllButton.textContent = '⏳ מוריד...';
    }
    
    // Download files with delay to avoid overwhelming the browser
    let currentIndex = 0;
    const downloadNext = () => {
        if (currentIndex >= pdfLinks.length) {
            updateStatus(`✅ הושלמה הורדת כל הקבצים (${downloadedCount}/${pdfLinks.length})`, 'success');
            if (downloadAllButton) {
                downloadAllButton.disabled = false;
                downloadAllButton.textContent = `⬇️ הורד את כל הקבצים (${pdfLinks.length})`;
            }
            return;
        }
        
        const pdfLink = pdfLinks[currentIndex];
        const fileName = pdfLink.name || `file_${currentIndex + 1}.pdf`;
        
        downloadPDF(pdfLink.url, fileName, (success) => {
            if (success) {
                downloadedCount++;
                updateDownloadedCount();
            }
            
            currentIndex++;
            // Small delay between downloads
            setTimeout(downloadNext, 500);
        });
    };
    
    downloadNext();
}

/**
 * Updates the downloaded count display
 */
function updateDownloadedCount() {
    const downloadedCountElement = document.getElementById('downloadedCount');
    if (downloadedCountElement) {
        downloadedCountElement.textContent = downloadedCount;
    }
}

/**
 * Scans the current page for PDF links
 */
function scanForPDFs() {
    const statusElement = document.getElementById('status');
    const listElement = document.getElementById('linkList');
    
    // Clear previous results
    listElement.innerHTML = '';
    currentPDFLinks = [];
    downloadedCount = 0;
    updateDownloadedCount();
    
    // Get active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
            updateStatus('❌ שגיאה בגישה לטאב: ' + chrome.runtime.lastError.message, 'error');
            return;
        }
        
        const activeTab = tabs[0];
        
        if (!activeTab) {
            updateStatus('❌ לא נמצא טאב פעיל', 'error');
            return;
        }
        
        // Check if it's a Moodle page
        if (!activeTab.url.includes('lemida.biu.ac.il/course/') && 
            !activeTab.url.includes('/mod/resource/view.php')) {
            updateStatus('❌ אנא נווט לדף קורס תקין של למדא (lemida.biu.ac.il/course/)', 'error');
            return;
        }
        
        updateStatus('🔍 סורק את הדף...', 'info');
        
        // Try to send message to content script first
        chrome.tabs.sendMessage(activeTab.id, { action: 'scanPDFs' }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script might not be loaded, try injecting
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        updateStatus('❌ שגיאה בטעינת סקריפט התוכן: ' + chrome.runtime.lastError.message, 'error');
                        return;
                    }
                    
                    // Retry sending message after injection
                    setTimeout(() => {
                        chrome.tabs.sendMessage(activeTab.id, { action: 'scanPDFs' }, handleScanResponse);
                    }, 100);
                });
            } else {
                handleScanResponse(response);
            }
        });
    });
}

/**
 * Handles the response from the content script scan
 * 
 * @param {Object} response - Response from content script
 */
function handleScanResponse(response) {
    if (!response) {
        updateStatus('❌ לא התקבלה תגובה מהדף', 'error');
        return;
    }
    
    if (!response.success) {
        updateStatus('❌ שגיאה בסריקה: ' + (response.error || 'שגיאה לא ידועה'), 'error');
        return;
    }
    
    const pdfLinks = response.pdfLinks || [];
    currentPDFLinks = pdfLinks;
    
    if (pdfLinks.length > 0) {
        updateStatus(`✅ נמצאו ${pdfLinks.length} קבצי PDF`, 'success');
        displayPDFList(pdfLinks);
    } else {
        updateStatus('❌ לא נמצאו קישורי PDF בדף זה', 'error');
        displayPDFList([]);
    }
}

// Global state for recordings
let currentRecordings = [];
let recordingsDownloadedCount = 0;

/**
 * Handles tab switching
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

/**
 * Scans for recordings (video/audio) on the current page
 */
function scanForRecordings() {
    const statusElement = document.getElementById('recordingsStatus');
    const listElement = document.getElementById('recordingsList');
    
    // Clear previous results
    listElement.innerHTML = '';
    currentRecordings = [];
    recordingsDownloadedCount = 0;
    updateRecordingsDownloadedCount();
    
    // Get active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
            updateRecordingsStatus('❌ שגיאה בגישה לטאב: ' + chrome.runtime.lastError.message, 'error');
            return;
        }
        
        const activeTab = tabs[0];
        
        if (!activeTab) {
            updateRecordingsStatus('❌ לא נמצא טאב פעיל', 'error');
            return;
        }
        
        // Check if it's a Moodle page
        if (!activeTab.url.includes('lemida.biu.ac.il/course/') && 
            !activeTab.url.includes('/mod/resource/view.php') &&
            !activeTab.url.includes('/blocks/video/')) {
            updateRecordingsStatus('❌ אנא נווט לדף קורס תקין של למדא או לדף הקלטה', 'error');
            return;
        }
        
        updateRecordingsStatus('🔍 סורק את הדף להקלטות...', 'info');
        
        // Try to send message to content script
        chrome.tabs.sendMessage(activeTab.id, { action: 'scanRecordings' }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script might not be loaded, try injecting
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        updateRecordingsStatus('❌ שגיאה בטעינת סקריפט התוכן: ' + chrome.runtime.lastError.message, 'error');
                        return;
                    }
                    
                    // Retry sending message after injection
                    setTimeout(() => {
                        chrome.tabs.sendMessage(activeTab.id, { action: 'scanRecordings' }, handleRecordingsResponse);
                    }, 100);
                });
            } else {
                handleRecordingsResponse(response);
            }
        });
    });
}

/**
 * Handles the response from the content script for recordings
 * 
 * @param {Object} response - Response from content script
 */
function handleRecordingsResponse(response) {
    if (chrome.runtime.lastError) {
        updateRecordingsStatus('❌ שגיאה בתקשורת: ' + chrome.runtime.lastError.message, 'error');
        return;
    }
    
    if (!response) {
        updateRecordingsStatus('❌ לא התקבלה תגובה מהדף', 'error');
        return;
    }
    
    if (!response.success) {
        updateRecordingsStatus('❌ שגיאה בסריקה: ' + (response.error || 'שגיאה לא ידועה'), 'error');
        return;
    }
    
    const recordings = response.recordings || [];
    currentRecordings = recordings;
    
    if (recordings.length > 0) {
        updateRecordingsStatus(`✅ נמצאו ${recordings.length} הקלטות`, 'success');
        displayRecordingsList(recordings);
    } else {
        updateRecordingsStatus('❌ לא נמצאו הקלטות בדף זה', 'error');
        displayRecordingsList([]);
    }
}

/**
 * Updates the recordings status message
 * 
 * @param {string} message - The status message
 * @param {string} type - The type of status
 */
function updateRecordingsStatus(message, type = 'info') {
    const statusElement = document.getElementById('recordingsStatus');
    statusElement.textContent = message;
    statusElement.className = type;
    statusElement.style.display = 'block';
}

/**
 * Displays the list of found recordings
 * 
 * @param {Array<Object>} recordings - Array of recording objects
 */
function displayRecordingsList(recordings) {
    const listElement = document.getElementById('recordingsList');
    listElement.innerHTML = '';
    
    if (!recordings || recordings.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎥</div>
                <div>לא נמצאו הקלטות בדף זה</div>
            </div>
        `;
        return;
    }
    
    // Update stats
    const statsElement = document.getElementById('recordingsStats');
    const totalCountElement = document.getElementById('recordingsTotalCount');
    statsElement.style.display = 'flex';
    totalCountElement.textContent = recordings.length;
    
    // Create download all button
    const downloadAllButton = document.createElement('button');
    downloadAllButton.textContent = `⬇️ הורד את כל ההקלטות (${recordings.length})`;
    downloadAllButton.onclick = () => downloadAllRecordings(recordings);
    listElement.appendChild(downloadAllButton);
    
    // Create individual recording items
    recordings.forEach((recording, index) => {
        const recordingItem = document.createElement('div');
        recordingItem.className = 'link-item';
        
        const recordingName = document.createElement('div');
        recordingName.className = 'link-name';
        recordingName.textContent = `${index + 1}. ${recording.name || 'Recording'}`;
        
        const recordingUrl = document.createElement('div');
        recordingUrl.className = 'link-url';
        recordingUrl.textContent = recording.url;
        recordingUrl.title = recording.url;
        
        const recordingType = document.createElement('span');
        recordingType.className = 'link-type';
        recordingType.textContent = `סוג: ${recording.type || 'unknown'}`;
        
        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-single';
        downloadButton.textContent = '⬇️ הורד הקלטה זו';
        downloadButton.onclick = () => downloadSingleRecording(recording, index);
        
        recordingItem.appendChild(recordingName);
        recordingItem.appendChild(recordingType);
        recordingItem.appendChild(recordingUrl);
        recordingItem.appendChild(downloadButton);
        
        listElement.appendChild(recordingItem);
    });
}

/**
 * Downloads a single recording
 * 
 * @param {Object} recording - Recording object with url and name
 * @param {number} index - Index of the recording in the list
 */
function downloadSingleRecording(recording, index) {
    const fileName = recording.name || `recording_${index + 1}.${recording.extension || 'mp4'}`;
    
    // Check if it's a videostream module - need to extract direct video link
    if (recording.url.includes('/mod/videostream/view.php') || 
        recording.url.includes('/blocks/video/viewvideo_biu.php')) {
        // Try to extract direct video link
        updateRecordingsStatus(`🔍 מחפש קישור ישיר להקלטה...`, 'info');
        
        chrome.runtime.sendMessage({
            action: 'extractVideoLink',
            url: recording.url
        }, (response) => {
            if (chrome.runtime.lastError || !response || !response.success || !response.videoLink) {
                // If extraction fails, open in new tab
                chrome.tabs.create({ url: recording.url, active: false });
                updateRecordingsStatus(`✅ פתיחת הקלטה: ${fileName}`, 'success');
                
                // Update button state
                const buttons = document.querySelectorAll('#recordingsList .download-single');
                if (buttons[index]) {
                    buttons[index].textContent = '✅ נפתח';
                    buttons[index].disabled = true;
                }
                return;
            }
            
            // Use the extracted video link
            const videoUrl = response.videoLink;
            const formattedFileName = formatFileName(fileName);
            
            // Get folder path from storage
            chrome.storage.local.get(['downloadFolder'], (result) => {
                let finalFileName = formattedFileName;
                const folder = result.downloadFolder || '';
                
                // If folder is specified, prepend it to the filename
                if (folder && folder.trim()) {
                    // Sanitize folder name
                    let sanitizedFolder = folder.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
                    sanitizedFolder = sanitizedFolder.trim().replace(/^\.+|\.+$/g, '');
                    if (sanitizedFolder && sanitizedFolder.length <= 100) {
                        finalFileName = `${sanitizedFolder}/${formattedFileName}`;
                    }
                }
                
                chrome.downloads.download({
                    url: videoUrl,
                    filename: finalFileName,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        // If download fails, open in new tab
                        chrome.tabs.create({ url: recording.url, active: false });
                        updateRecordingsStatus(`✅ פתיחת הקלטה: ${fileName}`, 'success');
                    } else {
                        recordingsDownloadedCount++;
                        updateRecordingsDownloadedCount();
                        updateRecordingsStatus(`✅ הורדת הקלטה: ${fileName}`, 'success');
                    }
                    
                    // Update button state
                    const buttons = document.querySelectorAll('#recordingsList .download-single');
                    if (buttons[index]) {
                        buttons[index].textContent = '✅ הורד';
                        buttons[index].disabled = true;
                    }
                });
            });
        });
        return;
    }
    
    // Check if it's a direct video/audio file (including Oracle Cloud Object Storage)
    if (recording.url.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|mp3|wav|m4a|aac|flac|wma)(\?|$)/i) ||
        recording.url.includes('/pluginfile.php/') ||
        recording.url.includes('objectstorage') ||
        recording.url.includes('video_bucket') ||
        recording.url.includes('oraclecloud.com')) {
        // Try to download directly
        const formattedFileName = formatFileName(fileName);
        
        // Get folder path from storage
        chrome.storage.local.get(['downloadFolder'], (result) => {
            let finalFileName = formattedFileName;
            const folder = result.downloadFolder || '';
            
            // If folder is specified, prepend it to the filename
            if (folder && folder.trim()) {
                // Sanitize folder name
                let sanitizedFolder = folder.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
                sanitizedFolder = sanitizedFolder.trim().replace(/^\.+|\.+$/g, '');
                if (sanitizedFolder && sanitizedFolder.length <= 100) {
                    finalFileName = `${sanitizedFolder}/${formattedFileName}`;
                }
            }
            
            chrome.downloads.download({
                url: recording.url,
                filename: finalFileName,
                saveAs: false
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    // If download fails, open in new tab
                    chrome.tabs.create({ url: recording.url, active: false });
                    updateRecordingsStatus(`✅ פתיחת הקלטה: ${fileName}`, 'success');
                } else {
                    recordingsDownloadedCount++;
                    updateRecordingsDownloadedCount();
                    updateRecordingsStatus(`✅ הורדת הקלטה: ${fileName}`, 'success');
                }
                
                // Update button state
                const buttons = document.querySelectorAll('#recordingsList .download-single');
                if (buttons[index]) {
                    buttons[index].textContent = '✅ הורד';
                    buttons[index].disabled = true;
                }
            });
        });
    } else {
        // For HTML pages or embedded videos, open in new tab
        chrome.tabs.create({ url: recording.url, active: false }, () => {
            recordingsDownloadedCount++;
            updateRecordingsDownloadedCount();
            updateRecordingsStatus(`✅ פתיחת הקלטה: ${fileName}`, 'success');
            
            // Update button state
            const buttons = document.querySelectorAll('#recordingsList .download-single');
            if (buttons[index]) {
                buttons[index].textContent = '✅ נפתח';
                buttons[index].disabled = true;
            }
        });
    }
}

/**
 * Downloads all recordings sequentially
 * 
 * @param {Array<Object>} recordings - Array of recording objects
 */
function downloadAllRecordings(recordings) {
    if (!recordings || recordings.length === 0) {
        updateRecordingsStatus('❌ אין הקלטות להוריד', 'error');
        return;
    }
    
    updateRecordingsStatus(`⬇️ מוריד ${recordings.length} הקלטות...`, 'info');
    recordingsDownloadedCount = 0;
    updateRecordingsDownloadedCount();
    
    // Disable download all button
    const downloadAllButton = document.querySelector('#recordingsList button');
    if (downloadAllButton) {
        downloadAllButton.disabled = true;
        downloadAllButton.textContent = '⏳ מוריד...';
    }
    
    // Open/download recordings sequentially
    let currentIndex = 0;
    const processNext = () => {
        if (currentIndex >= recordings.length) {
            updateRecordingsStatus(`✅ עובדו ${recordingsDownloadedCount}/${recordings.length} הקלטות`, 'success');
            if (downloadAllButton) {
                downloadAllButton.disabled = false;
                downloadAllButton.textContent = `⬇️ הורד את כל ההקלטות (${recordings.length})`;
            }
            return;
        }
        
        const recording = recordings[currentIndex];
        const fileName = recording.name || `recording_${currentIndex + 1}.${recording.extension || 'mp4'}`;
        
        // Check if it's a videostream module - need to extract direct video link
        if (recording.url.includes('/mod/videostream/view.php') || 
            recording.url.includes('/blocks/video/viewvideo_biu.php')) {
            // Try to extract direct video link
            chrome.runtime.sendMessage({
                action: 'extractVideoLink',
                url: recording.url
            }, (response) => {
                if (chrome.runtime.lastError || !response || !response.success || !response.videoLink) {
                    // If extraction fails, open in new tab
                    chrome.tabs.create({ url: recording.url, active: false }, () => {
                        recordingsDownloadedCount++;
                        updateRecordingsDownloadedCount();
                    });
                    
                    currentIndex++;
                    setTimeout(processNext, 500);
                    return;
                }
                
                // Use the extracted video link
                const videoUrl = response.videoLink;
                const formattedFileName = formatFileName(fileName);
                
                // Get folder path from storage
                chrome.storage.local.get(['downloadFolder'], (result) => {
                    let finalFileName = formattedFileName;
                    const folder = result.downloadFolder || '';
                    
                    // If folder is specified, prepend it to the filename
                    if (folder && folder.trim()) {
                        // Sanitize folder name
                        let sanitizedFolder = folder.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
                        sanitizedFolder = sanitizedFolder.trim().replace(/^\.+|\.+$/g, '');
                        if (sanitizedFolder && sanitizedFolder.length <= 100) {
                            finalFileName = `${sanitizedFolder}/${formattedFileName}`;
                        }
                    }
                    
                    chrome.downloads.download({
                        url: videoUrl,
                        filename: finalFileName,
                        saveAs: false
                    }, (downloadId) => {
                        if (!chrome.runtime.lastError) {
                            recordingsDownloadedCount++;
                            updateRecordingsDownloadedCount();
                        }
                        
                        currentIndex++;
                        // Small delay between downloads
                        setTimeout(processNext, 500);
                    });
                });
            });
        }
        // Check if it's a direct video/audio file (including Oracle Cloud Object Storage)
        else if (recording.url.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|mp3|wav|m4a|aac|flac|wma)(\?|$)/i) ||
            recording.url.includes('/pluginfile.php/') ||
            recording.url.includes('objectstorage') ||
            recording.url.includes('video_bucket') ||
            recording.url.includes('oraclecloud.com')) {
            // Try to download directly
            const formattedFileName = formatFileName(fileName);
            
            // Get folder path from storage
            chrome.storage.local.get(['downloadFolder'], (result) => {
                let finalFileName = formattedFileName;
                const folder = result.downloadFolder || '';
                
                // If folder is specified, prepend it to the filename
                if (folder && folder.trim()) {
                    // Sanitize folder name
                    let sanitizedFolder = folder.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
                    sanitizedFolder = sanitizedFolder.trim().replace(/^\.+|\.+$/g, '');
                    if (sanitizedFolder && sanitizedFolder.length <= 100) {
                        finalFileName = `${sanitizedFolder}/${formattedFileName}`;
                    }
                }
                
                chrome.downloads.download({
                    url: recording.url,
                    filename: finalFileName,
                    saveAs: false
                }, (downloadId) => {
                    if (!chrome.runtime.lastError) {
                        recordingsDownloadedCount++;
                        updateRecordingsDownloadedCount();
                    }
                    
                    currentIndex++;
                    // Small delay between downloads
                    setTimeout(processNext, 500);
                });
            });
        } else {
            // For HTML pages or embedded videos, open in new tab
            chrome.tabs.create({ url: recording.url, active: false }, () => {
                recordingsDownloadedCount++;
                updateRecordingsDownloadedCount();
                
                currentIndex++;
                // Small delay between openings
                setTimeout(processNext, 500);
            });
        }
    };
    
    processNext();
}

/**
 * Updates the recordings downloaded count display
 */
function updateRecordingsDownloadedCount() {
    const downloadedCountElement = document.getElementById('recordingsDownloadedCount');
    if (downloadedCountElement) {
        downloadedCountElement.textContent = recordingsDownloadedCount;
    }
}

/**
 * Gets the course name from the current page
 * 
 * @param {Function} callback - Callback function with course name
 */
function getCourseName(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs[0]) {
            if (callback) callback('');
            return;
        }
        
        const activeTab = tabs[0];
        
        // Try to send message to content script
        chrome.tabs.sendMessage(activeTab.id, { action: 'getCourseName' }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script might not be loaded, try injecting
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error injecting content script:', chrome.runtime.lastError);
                        if (callback) callback('');
                        return;
                    }
                    
                    // Retry sending message after injection
                    setTimeout(() => {
                        chrome.tabs.sendMessage(activeTab.id, { action: 'getCourseName' }, (response) => {
                            if (chrome.runtime.lastError || !response || !response.success) {
                                if (callback) callback('');
                                return;
                            }
                            
                            if (callback) callback(response.courseName || '');
                        });
                    }, 100);
                });
            } else {
                if (!response || !response.success) {
                    if (callback) callback('');
                    return;
                }
                
                if (callback) callback(response.courseName || '');
            }
        });
    });
}

/**
 * Updates folder input with course name
 * 
 * @param {string} inputId - The input element ID
 */
function updateFolderWithCourseName(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Show loading state
    const originalValue = input.value;
    input.value = 'טוען...';
    input.disabled = true;
    
    getCourseName((courseName) => {
        input.disabled = false;
        if (courseName && courseName.trim()) {
            input.value = courseName;
            // Save to storage
            chrome.storage.local.set({ downloadFolder: courseName });
        } else {
            // Restore original value if no course name found
            input.value = originalValue;
            // Show error message
            const statusElement = document.getElementById('status') || document.getElementById('recordingsStatus');
            if (statusElement) {
                statusElement.textContent = '⚠️ לא נמצא שם קורס. אנא הזן ידנית.';
                statusElement.className = 'info';
                statusElement.style.display = 'block';
            }
        }
    });
}

/**
 * Saves folder name to storage
 * 
 * @param {string} folderName - The folder name to save
 */
function saveFolderName(folderName) {
    chrome.storage.local.set({ downloadFolder: folderName || '' });
}

/**
 * Loads folder name from storage
 */
function loadFolderName() {
    chrome.storage.local.get(['downloadFolder'], (result) => {
        const folder = result.downloadFolder || '';
        const pdfInput = document.getElementById('folderNameInput');
        const recordingsInput = document.getElementById('recordingsFolderNameInput');
        
        if (pdfInput) {
            pdfInput.value = folder;
        }
        if (recordingsInput) {
            recordingsInput.value = folder;
        }
    });
}

/**
 * Initialize the popup when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs
    initTabs();
    
    // Load saved folder name
    loadFolderName();
    
    // PDF folder selection
    const folderNameInput = document.getElementById('folderNameInput');
    const useCourseNameButton = document.getElementById('useCourseNameButton');
    
    if (folderNameInput) {
        folderNameInput.addEventListener('input', (e) => {
            saveFolderName(e.target.value);
        });
    }
    
    if (useCourseNameButton) {
        useCourseNameButton.addEventListener('click', () => {
            updateFolderWithCourseName('folderNameInput');
        });
    }
    
    // Recordings folder selection
    const recordingsFolderNameInput = document.getElementById('recordingsFolderNameInput');
    const useCourseNameRecordingsButton = document.getElementById('useCourseNameRecordingsButton');
    
    if (recordingsFolderNameInput) {
        recordingsFolderNameInput.addEventListener('input', (e) => {
            saveFolderName(e.target.value);
        });
    }
    
    if (useCourseNameRecordingsButton) {
        useCourseNameRecordingsButton.addEventListener('click', () => {
            updateFolderWithCourseName('recordingsFolderNameInput');
        });
    }
    
    // PDF scanning
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.addEventListener('click', scanForPDFs);
    }
    
    // Recordings scanning
    const scanRecordingsButton = document.getElementById('scanRecordingsButton');
    if (scanRecordingsButton) {
        scanRecordingsButton.addEventListener('click', scanForRecordings);
    }
    
    // Support button toggle
    const supportButton = document.getElementById('supportButton');
    const supportInfo = document.getElementById('supportInfo');
    if (supportButton && supportInfo) {
        supportButton.addEventListener('click', () => {
            const isVisible = supportInfo.style.display !== 'none';
            supportInfo.style.display = isVisible ? 'none' : 'block';
            supportButton.textContent = isVisible ? '💬 תמיכה' : '✖️ סגור';
        });
    }
});
