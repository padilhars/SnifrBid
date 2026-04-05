const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
export class BaseAdapter {
    baseUrl;
    timeoutMs;
    constructor(baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS) {
        this.baseUrl = baseUrl;
        this.timeoutMs = timeoutMs;
    }
    async healthCheck() {
        try {
            const res = await this.get('/');
            return res !== null;
        }
        catch {
            return false;
        }
    }
    /**
     * GET com retry automático, backoff exponencial e timeout.
     */
    async get(path, params) {
        const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`);
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                if (v !== undefined)
                    url.searchParams.set(k, String(v));
            }
        }
        let lastError = new Error('Nenhuma tentativa realizada');
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), this.timeoutMs);
                const res = await fetch(url.toString(), {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json', 'User-Agent': 'SnifrBid/1.0' },
                });
                clearTimeout(timer);
                // Rate limiting ou sobrecarga — esperar e tentar novamente
                if (res.status === 429 || res.status === 503) {
                    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '0', 10) || attempt * 10;
                    this.log(`warn`, `HTTP ${res.status} — aguardando ${retryAfter}s (tentativa ${attempt}/${MAX_RETRIES})`);
                    await this.sleep(retryAfter * 1000);
                    continue;
                }
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url.toString()}`);
                }
                return await res.json();
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (attempt < MAX_RETRIES) {
                    const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    this.log('warn', `Tentativa ${attempt}/${MAX_RETRIES} falhou: ${lastError.message} — retry em ${delayMs / 1000}s`);
                    await this.sleep(delayMs);
                }
            }
        }
        throw lastError;
    }
    log(level, msg) {
        const prefix = `[${this.portalName}]`;
        if (level === 'error')
            console.error(prefix, msg);
        else if (level === 'warn')
            console.warn(prefix, msg);
        else
            console.log(prefix, msg);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=BaseAdapter.js.map