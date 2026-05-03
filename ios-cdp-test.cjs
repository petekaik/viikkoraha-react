const CDP = require('chrome-remote-interface');
const http = require('http');

const BASE = 'http://localhost:9321';

async function getViikkorahaTarget() {
    return new Promise((resolve, reject) => {
        http.get(`${BASE}/json`, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const targets = JSON.parse(data);
                const t = targets.find(p => p.title === 'Viikkoraha' && !p.title.includes('ServiceWorker'));
                resolve(t);
            });
        }).on('error', reject);
    });
}

async function checkPage(wsUrl, label) {
    try {
        const client = await CDP({ target: wsUrl });
        const {Runtime} = client;
        const res = await Runtime.evaluate({
            expression: `JSON.stringify({
                title: document.title,
                spinner: !!document.querySelector('.animate-spin'),
                bodyText: (document.body?.innerText || '').substring(0, 500),
                auth: localStorage.getItem('viikkoraha-auth') ? 'YES' : 'NO'
            })`,
            returnByValue: true
        });
        const state = JSON.parse(res.result.value);
        console.log(`\n=== ${label} ===`);
        console.log(JSON.stringify(state, null, 2));
        await client.close();
        return state;
    } catch(e) {
        console.error(`${label}: ERR ${e.message}`);
        return {};
    }
}

(async () => {
    console.log('Etsitään puhelimen Viikkoraha...');
    const t = await getViikkorahaTarget();
    if (!t) {
        console.log('Viikkoraha ei auki!');
        process.exit(1);
    }
    console.log('Löytyi:', t.url);

    // 1. Current state
    const ws = t.webSocketDebuggerUrl;
    const s1 = await checkPage(ws, '1. NYKYTILA');

    // 2. Navigate (soft reload)
    let client = await CDP({ target: ws });
    const {Page, Runtime} = client;
    console.log('\n⏳ Page.navigate (soft)...');
    await Page.navigate({ url: 'https://gitpages.morgeweb.com/viikkoraha/' });
    await Page.loadEventFired();
    await new Promise(r => setTimeout(r, 2000));
    await client.close();

    const t2 = await getViikkorahaTarget();
    await checkPage(t2.webSocketDebuggerUrl, '2. SOFT RELOAD');

    // 3. Clear localStorage + hard reload
    client = await CDP({ target: t2.webSocketDebuggerUrl });
    console.log('\n⏳ Clear localStorage + Page.reload (hard)...');
    await client.Runtime.evaluate({ expression: 'localStorage.clear();', returnByValue: true });
    console.log('  localStorage tyhjennetty.');
    await client.Page.reload();
    await client.Page.loadEventFired();
    await new Promise(r => setTimeout(r, 4000)); // Extra wait for rehydration
    await client.close();

    const t3 = await getViikkorahaTarget();
    const s3 = await checkPage(t3.webSocketDebuggerUrl, '3. HARD RELOAD');

    if (s3.spinner) {
        console.log('\n❌ BUGI: Spinner jäi ikuisesti hard reloadin jälkeen!');
    } else {
        console.log('\n✅ OK: Spinner haihtui — login näkyy.');
    }

    process.exit(0);
})();
