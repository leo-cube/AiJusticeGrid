/**
 * Frontend Integration for AI Justice Grid PDF Downloads
 * 
 * This file provides the JavaScript code needed to integrate PDF downloads
 * with your deployed backend on Render.
 * 
 * Usage:
 * 1. Copy this code into your frontend application
 * 2. Update BACKEND_URLS with your actual Render deployment URL
 * 3. Call downloadReport() when the user clicks the download button
 */

// Backend URL Configuration
const BACKEND_URLS = {
    // Replace 'your-app-name' with your actual Render service name
    production: 'https://ai-investigation-backend.onrender.com',
    // Fallback URLs - try these if the main one doesn't work
    fallback: [
        'https://aijusticegrid-backend.onrender.com',
        'https://ai-justice-grid.onrender.com'
    ],
    development: 'http://localhost:5000'
};

// Auto-detect backend URL
let BACKEND_URL = null;

/**
 * Automatically discover the backend URL
 */
async function discoverBackendUrl() {
    const urlsToTry = [
        BACKEND_URLS.production,
        ...BACKEND_URLS.fallback
    ];
    
    for (const url of urlsToTry) {
        try {
            console.log(`Trying backend URL: ${url}`);
            const response = await fetch(`${url}/api/config`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const config = await response.json();
                console.log('Backend discovered:', config);
                BACKEND_URL = url;
                return url;
            }
        } catch (error) {
            console.log(`Failed to connect to ${url}:`, error.message);
        }
    }
    
    throw new Error('Could not discover backend URL. Please check your deployment.');
}

/**
 * Download PDF Report
 * Call this function when the user clicks the "Download & Save Report" button
 */
async function downloadReport(conversationData) {
    try {
        // Discover backend URL if not already set
        if (!BACKEND_URL) {
            await discoverBackendUrl();
        }
        
        // Prepare the request data
        const reportData = {
            messages: conversationData.messages || [],
            reportType: conversationData.reportType || 'Investigation Report',
            agentType: conversationData.agentType || 'general',
            sessionId: conversationData.sessionId || `session_${Date.now()}`,
            version: '1.0'
        };
        
        console.log('Sending PDF download request:', reportData);
        
        // Make the request
        const response = await fetch(`${BACKEND_URL}/api/download-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData)
        });
        
        console.log('PDF download response:', response.status, response.headers);
        
        if (response.ok && response.headers.get('content-type')?.includes('application/pdf')) {
            // Handle PDF download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Investigation_Report_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('PDF downloaded successfully');
            return { success: true, message: 'PDF downloaded successfully' };
        } else {
            // Handle error response
            let errorMessage = 'Failed to generate PDF';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = `Server error: ${response.status}`;
            }
            
            console.error('PDF download failed:', errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('PDF download error:', error);
        throw error;
    }
}

/**
 * Example usage with your existing button
 */
function setupDownloadButton() {
    // Find your download button (adjust selector as needed)
    const downloadButton = document.querySelector('button[onclick*="download"], button:contains("Download")');
    
    if (downloadButton) {
        downloadButton.addEventListener('click', async (event) => {
            event.preventDefault();
            
            // Disable button during download
            downloadButton.disabled = true;
            downloadButton.textContent = 'Generating PDF...';
            
            try {
                // Get your conversation data - replace this with your actual data source
                const conversationData = {
                    messages: getConversationMessages(), // You need to implement this
                    reportType: 'Investigation Report',
                    agentType: getCurrentAgentType(), // You need to implement this
                    sessionId: getCurrentSessionId() // You need to implement this
                };
                
                await downloadReport(conversationData);
                
                // Show success message
                alert('PDF downloaded successfully!');
                
            } catch (error) {
                // Show error message
                alert(`Failed to download PDF: ${error.message}`);
            } finally {
                // Re-enable button
                downloadButton.disabled = false;
                downloadButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-1 h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"></path>
                    </svg>
                    Download & Save Report
                `;
            }
        });
    }
}

/**
 * Helper functions - you need to implement these based on your app structure
 */

function getConversationMessages() {
    // Replace this with your actual method to get conversation messages
    // Example structure:
    return [
        {
            sender: 'assistant',
            content: 'What is the case ID?',
            agentType: 'murder',
            timestamp: new Date().toISOString()
        },
        {
            sender: 'user',
            content: 'CASE001',
            timestamp: new Date().toISOString()
        }
        // ... more messages
    ];
}

function getCurrentAgentType() {
    // Replace this with your actual method to get current agent type
    return 'murder'; // or 'financial', 'theft', etc.
}

function getCurrentSessionId() {
    // Replace this with your actual method to get session ID
    return `session_${Date.now()}`;
}

/**
 * Initialize when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI Justice Grid PDF Integration loaded');
    
    // Discover backend URL on page load
    discoverBackendUrl().catch(error => {
        console.error('Failed to discover backend:', error);
        // You might want to show a user-friendly message here
    });
    
    // Setup download button if it exists
    setupDownloadButton();
});

// Export functions for use in other parts of your app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        downloadReport,
        discoverBackendUrl,
        BACKEND_URLS
    };
}
