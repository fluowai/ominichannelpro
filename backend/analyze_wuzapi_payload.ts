import fs from 'fs';

/**
 * Script para analisar o payload do WUZAPI e encontrar o número real
 */
try {
    const logContent = fs.readFileSync('raw_wuzapi.log', 'utf-8');
    const lines = logContent.split('\n');
    
    console.log('[ANALYZE] Searching for phone number fields in WUZAPI payload...\n');
    
    // Find the last payload
    let lastPayloadStart = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('Payload:')) {
            lastPayloadStart = i;
            break;
        }
    }
    
    if (lastPayloadStart === -1) {
        console.log('[ANALYZE] No payload found in log');
        process.exit(0);
    }
    
    // Extract payload JSON
    let payloadJson = '';
    for (let i = lastPayloadStart + 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        if (lines[i].includes('instanceName')) break;
        payloadJson += lines[i];
    }
    
    try {
        const payload = JSON.parse(payloadJson);
        console.log('[ANALYZE] Full payload structure:');
        console.log(JSON.stringify(payload, null, 2));
        
        // Search for phone-like fields
        console.log('\n[ANALYZE] Searching for phone number fields...');
        const searchObject = (obj: any, path = '') => {
            for (const key in obj) {
                const value = obj[key];
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'string') {
                    // Check if it looks like a phone number
                    if (/^\d{10,15}/.test(value) || value.includes('@s.whatsapp.net') || value.includes('@lid')) {
                        console.log(`  ${currentPath}: ${value}`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    searchObject(value, currentPath);
                }
            }
        };
        
        searchObject(payload);
        
    } catch (e) {
        console.log('[ANALYZE] Failed to parse JSON, showing raw content:');
        console.log(payloadJson);
    }
    
} catch (error) {
    console.error('[ANALYZE] Error:', error);
}
