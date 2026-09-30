import { mkdir, readFile, writeFile } from 'node:fs/promises';

const cities = ['Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Mumbai'];
const cityTopics = [
  {key:'projects', label:'Projects & launches', query:'real estate developer project launch construction residential commercial RERA'},
  {key:'land', label:'Land & acquisitions', query:'real estate land acquisition purchase property developer'},
  {key:'capital', label:'Capital & lending', query:'real estate developer funding debt loan lender refinancing fund'},
  {key:'risk', label:'Legal & risk', query:'real estate builder litigation insolvency default project delay dispute'},
  {key:'leadership', label:'Company & leadership', query:'real estate developer promoter chairman CEO leadership appointment'},
  {key:'policy', label:'Approvals & regulation', query:'real estate RERA approval planning authority regulation property'},
];
const nationalTopics = [
  {city:'India', key:'funds', label:'Capital & lending', query:'India real estate private equity fund investment debt lender 2026'},
  {city:'India', key:'lenders', label:'Capital & lending', query:'India real estate NBFC bank lender exposure loan default 2026'},
  {city:'India', key:'companies', label:'Company & leadership', query:'India real estate developer promoter CEO board leadership 2026'},
  {city:'India', key:'reit', label:'Market & policy', query:'India REIT real estate investment trust market news 2026'},
];
const streams = [...cities.flatMap(city => cityTopics.map(topic => ({...topic, city}))), ...nationalTopics];
const categories = {
  projects:'Projects & launches', land:'Land & acquisitions', capital:'Capital & lending', risk:'Legal & risk',
  leadership:'Company & leadership', policy:'Approvals & regulation', funds:'Capital & lending',
  lenders:'Capital & lending', companies:'Company & leadership', reit:'Market & policy'
};

function decode(value='') {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}
function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? decode(match[1]).trim() : '';
}
function cleanHtml(s='') {
  return decode(s.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}
function classifyTone(text='') {
  const t = text.toLowerCase();
  const neg = /default|insolvency|bankrupt|fraud|arrest|raid|probe|scam|collapse|stalled|delay|litigation|lawsuit|suspend|suspension|demolition|violation|penalty|crisis|distress|non.payment|NPA|dues unpaid|fire|fatal|death|accident|evict|cheat|allegation|complaint|seized|attachment|winding up/;
  const pos = /launch|inaugurat|sold out|record sale|funding|raises? (?:₹|rs|\$|usd|inr)|investment|acquire|acquisition|approv|clearance|award|profit|revenue|growth|expansion|lease|signs? (?:a )?(?:deal|agreement)|appoint|landmark|breaks ground/;
  if (neg.test(t)) return 'negative';
  if (pos.test(t)) return 'positive';
  return 'neutral';
}
function priority(text='', tone='neutral') {
  return /default|insolvency|bankrupt|fraud|arrest|raid|probe|scam|stalled|litigation|lawsuit|suspend|demolition|violation|NPA|non.payment|distress|fire|fatal|death|accident|evict|winding up|regulatory action/i.test(text) ? 'high' : tone === 'negative' ? 'watch' : 'normal';
}
function inferEntities(text, entities) {
  const lower=text.toLowerCase();
  return entities.filter(e=>[e.name,...(e.aliases||[])].some(name=>name && lower.includes(name.toLowerCase()))).map(e=>e.name);
}
function stableId(url) {
  let h=2166136261; for (const ch of url) { h ^= ch.charCodeAt(0); h=Math.imul(h,16777619); }
  return (h>>>0).toString(16);
}
async function fetchStream(stream, entities) {
  const q = encodeURIComponent(`${stream.query} ${stream.city==='India'?'India':stream.city} when:7d`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
  try {
    const response = await fetch(url, {headers:{'user-agent':'Groundline public news monitor/1.0'}, signal:AbortSignal.timeout(18000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml=await response.text();
    if (!xml.includes('<rss') && !xml.includes('<feed')) throw new Error('Feed response was not RSS/XML');
    const rows=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>m[1]);
    const items=rows.map(row=>{
      const title=tag(row,'title'); const link=tag(row,'link');
      if(!title||!link) return null;
      const description=cleanHtml(tag(row,'description'));
      const src=row.match(/<source(?:\s[^>]*)?>([\s\S]*?)<\/source>/i);
      const source=src?cleanHtml(decode(src[1])):'';
      const pub=tag(row,'pubDate'); const published=pub && !Number.isNaN(Date.parse(pub)) ? new Date(pub).toISOString() : null;
      const body=`${title} ${description}`; const tone=classifyTone(body);
      return {id:stableId(link),title,url:link,description:description.slice(0,500),source:source||new URL(link).hostname.replace(/^www\./,''),publishedAt:published,city:stream.city,category:categories[stream.key],tone,priority:priority(body,tone),entities:inferEntities(body,entities),stream:stream.key};
    }).filter(Boolean);
    return {status:'ok', items};
  } catch(error) { return {status:'failed', items:[], error:String(error.message||error).slice(0,150)}; }
}

const entityDoc=JSON.parse(await readFile(new URL('../data/entities.json', import.meta.url),'utf8'));
const outcomes=await Promise.all(streams.map(s=>fetchStream(s,entityDoc.entities||[]).then(result=>({stream:s,...result}))));
const unique=new Map();
for(const outcome of outcomes) for(const item of outcome.items) {
  const prior=unique.get(item.id);
  if(!prior || (item.priority==='high'&&prior.priority!=='high') || (item.description.length>(prior.description||'').length)) unique.set(item.id,item);
}
const items=[...unique.values()].sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));
const generatedAt=new Date().toISOString();
const now=Date.now();
// Keep a two-day collection window so delayed or once-daily runs do not drop late-published stories.
const recentItems=items.filter(item=>item.publishedAt&&new Date(item.publishedAt).getTime()>=now-48*60*60*1000);
let previous=[];
try { const prior=JSON.parse(await readFile(new URL('../data/news.json',import.meta.url),'utf8')); previous=Array.isArray(prior.items)?prior.items:[]; } catch {}
const retained=new Map();
for(const item of [...previous,...items]) {
  if(!item.publishedAt||new Date(item.publishedAt).getTime()<now-30*24*60*60*1000) continue;
  const old=retained.get(item.id); if(!old||((item.description||'').length>(old.description||'').length)) retained.set(item.id,item);
}
const allItems=[...retained.values()].sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
const data={generatedAt, timezone:'Asia/Kolkata', provider:'Google News RSS public search feeds', itemCount:allItems.length, todayCount:recentItems.length,
  streamCount:outcomes.length, successfulStreams:outcomes.filter(x=>x.status==='ok').length,
  note:'Public web news discovery, not a complete record of all online or offline information. Tone and priority are keyword triage labels, not verified conclusions. Review original sources.',
  streams:outcomes.map(o=>({label:`${o.city} · ${o.label}`,city:o.city,status:o.status,items:o.items.length,...(o.error?{error:o.error}:{})})),todayItems:recentItems,items:allItems};
await mkdir(new URL('../data/',import.meta.url),{recursive:true});
await writeFile(new URL('../data/news.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
console.log(`Collected ${recentItems.length} stories from the last 48 hours; retaining ${allItems.length} stories from 30 days. ${data.successfulStreams}/${data.streamCount} search streams succeeded.`);
