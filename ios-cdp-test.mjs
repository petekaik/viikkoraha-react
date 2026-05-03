import WebSocket from 'ws';

const WS_URL = 'ws://localhost:9321/ios_00008130-0016786A368A001C/ws://127.0.0.1:9422/devtools/page/2';

(async () => {
    console.log('Yhdistetään puhelimeen...');
    const ws = new WebSocket(WS_URL);

    await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('WS open timeout')), 5000);
    });

    console.log('✓ Yhteys auki\n');

    // Collect all messages for 3 seconds
    let messages = [];
    const collect = (data) => {
        try {
            const msg = JSON.parse(data.toString());
            messages.push(msg);
            if (msg.method === 'Console.messageAdded') {
                const m = msg.params?.message;
                console.log(`  [${m?.level}] ${m?.text}`);
            } else if (msg.method) {
                console.log(`  <- ${msg.method} id=${msg.id}`);
            } else {
                console.log(`  <- ${JSON.stringify(msg).substring(0, 150)}`);
            }
        } catch(e) {
            console.log(`  <- RAW: ${data.toString().substring(0, 200)}`);
        }
    };
    ws.on('message', collect);

    // Send Console.enable
    console.log('-> Console.enable');
    ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));

    // Send Runtime.evaluate to check page state
    console.log('-> Runtime.evaluate');
    ws.send(JSON.stringify({
        id: 2,
        method: 'Runtime.evaluate',
        params: {
            expression: `(function(){
                var s = {
                    t: document.title,
                    sp: !!document.querySelector('.animate-spin'),
                    bt: (document.body?.innerText || '').substring(0, 500),
                    au: localStorage.getItem('viikkoraha-auth')
                };
                return JSON.stringify(s);
            })()`,
            returnByValue: true
        }
    }));

    // Wait and collect
    await new Promise(r => setTimeout(r, 3000));

    // Find our responses
    const resp1 = messages.find(m => m.id === 1);
    const resp2 = messages.find(m => m.id === 2);

    console.log('\n=== VASTAUKSET ===');
    if (resp1) console.log('Console.enable:', JSON.stringify(resp1).substring(0, 200));
    else console.log('Console.enable: EI VASTAUSTA');

    if (resp2 && resp2.result) {
        const val = resp2.result.result?.value;
        console.log('Runtime.evaluate:', val?.substring(0, 500) || JSON.stringify(resp2.result).substring(0, 300));
    } else {
        console.log('Runtime.evaluate: EI VASTAUSTA');
    }

    console.log('\n=== KAIKKI VIESTIT (' + messages.length + ') ===');
    messages.forEach((m, i) => {
        console.log(`[${i}] ${JSON.stringify(m).substring(0, 200)}`);
    });

    ws.close();
    process.exit(0);
})();
