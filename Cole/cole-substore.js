// Sub-Store Node.js 文件「脚本操作」；SUB_NAME 是集合名，勿填 URL 或凭据。
// Sub-Store retries failed function operators as shortcut scripts; reject that path.
if (typeof $content !== 'undefined') throw new Error('COLE_BUILD_FAILED');
const SUB_NAME = 'Surge组合';
const SOURCE_TYPE = 'collection'; // 沿用集合及子订阅已有失败容错设置
const regions = [
  ['HK', /香港|Hong Kong|HK|🇭🇰/i],
  ['SG', /新加坡|Singapore|🇸🇬|SIN|(^|[^A-Za-z0-9])SG([^A-Za-z0-9]|$)/i],
  ['JP', /日本|Japan|🇯🇵|JPN/i],
  ['US', /美国|USA|🇺🇸/i],
  ['TW', /台湾|台灣|Taiwan|🇹🇼|(^|[^A-Za-z0-9])TW[N]?([^A-Za-z0-9]|$)/i],
  ['KR', /韩国|韓國|Korea|🇰🇷|(^|[^A-Za-z0-9])(KR|KOR)([^A-Za-z0-9]|$)/i],
  ['DE', /德国|德國|Germany|🇩🇪|(^|[^A-Za-z0-9])DE[U]?([^A-Za-z0-9]|$)/i],
];
const excluded = /GB|Traffic|Expire|Premium|频道|订阅|ISP|流量|到期|重置|网站|网址|官网|通知|节点不通/i;

async function operator(input) {
  // Do not expose raw errors, source URLs, proxy values, or node names.
  try {
    if (!input || typeof input.$content !== 'string') throw 0;
    if (!['subscription', 'collection'].includes(SOURCE_TYPE) || !SUB_NAME) throw 0;
    let template = input.$content;
    for (const marker of ['@@COLE_PROXIES@@', '@@COLE_GROUPS@@']) {
      if (template.split(marker).length !== 2) throw 0;
    }
    const raw = await produceArtifact({type: SOURCE_TYPE, name: SUB_NAME,
      platform: 'JSON', produceType: 'internal', noCache: true});
    const nodes = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(nodes) || !nodes.length) throw 0;
    const buckets = Object.fromEntries([...regions.map(([r]) => [r, []]), ['OTHER', []]]);
    const lines = [];
    const seen = new Map();
    const crypto = require("node:crypto");
    for (const original of nodes) {
      if (!original || typeof original.name !== 'string' || !original.name.trim()) throw 0;
      if (excluded.test(original.name)) continue;
      // The real Surge formatter cannot export VLESS; omit it explicitly rather
      // than failing the whole profile. Other unsupported types still fail closed.
      if (String(original.type || '').toLowerCase() === 'vless') continue;
      // Hash the actual Surge representation with a fixed placeholder, not source order/name.
      // Identical outputs are deliberately deduplicated; hash collision fails closed.
      const placeholder = 'COLE-TEMP';
      const out = ProxyUtils.produce([{...original, name: placeholder}], 'Surge', 'external');
      if (typeof out !== 'string' || /[\r\n\x00]/.test(out) || !out.startsWith(placeholder + '=') || out.length > 16384) throw 0;
      if (!/^COLE-TEMP=[^,\s]+\s*,\s*[^,\s]+\s*,\s*\d+\s*(,|$)/.test(out)) throw 0;
      const id = 'COLE-' + crypto.createHash('sha256').update(out).digest('hex').slice(0, 24).toUpperCase();
      const prior = seen.get(id);
      if (prior && prior !== out) throw 0;
      if (!prior) { seen.set(id, out); lines.push({id, text: id + out.slice(placeholder.length)}); }
      const matched = regions.filter(([, rx]) => rx.test(original.name));
      if (matched.length) {
        for (const [r] of matched) if (!buckets[r].includes(id)) buckets[r].push(id);
      } else if (!buckets.OTHER.includes(id)) buckets.OTHER.push(id);
    }
    if (!lines.length) throw 0;
    lines.sort((a, b) => a.id.localeCompare(b.id));
    for (const bucket of Object.values(buckets)) bucket.sort();
    const order = [...regions.map(([r]) => r), 'OTHER'];
    const groups = [
      'PROXY = select, ' + order.map(r => r + ' AUTO').join(', '),
      'AIGC = select, US AUTO, SG AUTO, JP AUTO',
      'Telegram = select, SG AUTO, HK AUTO, JP AUTO, US AUTO',
      ...order.map(r => buckets[r].length
        ? `${r} AUTO = url-test, ${buckets[r].join(', ')}, interval=300, tolerance=80, evaluate-before-use=true`
        : `${r} AUTO = select, REJECT`),
      'GLOBAL = select, PROXY, AIGC, Telegram, ' + order.map(r => r + ' AUTO').join(', ') + ', ' + lines.map(x => x.id).join(', '),
    ];
    template = template.replace('@@COLE_PROXIES@@', () => lines.map(x => x.text).join('\n'));
    template = template.replace('@@COLE_GROUPS@@', () => groups.join('\n'));
    if (template.includes('@@COLE_')) throw 0;
    input.$content = template;
    return input;
  } catch (_) {
    // Throw rather than return template, original content, partial output or DIRECT.
    throw new Error('COLE_BUILD_FAILED');
  }
}
