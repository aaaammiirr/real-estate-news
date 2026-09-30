const CITIES = ["Bengaluru", "Hyderabad", "Chennai", "Pune", "Mumbai"];
const CATEGORIES = ["Projects & launches", "Land & acquisitions", "Approvals & regulation", "Capital & lending", "Project progress & delays", "Legal & risk", "Company & leadership", "Market & policy"];
const DEFAULT_ENTITIES = [
  {name:"Prestige Estates Projects",type:"Developer",city:"Bengaluru",aliases:["Prestige Estates","Prestige Group"]},
  {name:"Brigade Enterprises",type:"Developer",city:"Bengaluru",aliases:["Brigade Group"]},
  {name:"Sobha Limited",type:"Developer",city:"Bengaluru",aliases:["Sobha"]},
  {name:"Godrej Properties",type:"Developer",city:"Mumbai",aliases:["Godrej Properties Ltd"]},
  {name:"Lodha Developers",type:"Developer",city:"Mumbai",aliases:["Macrotech Developers","Lodha"]},
  {name:"DLF Limited",type:"Developer",city:"All markets",aliases:["DLF"]},
  {name:"Oberoi Realty",type:"Developer",city:"Mumbai",aliases:[]},
  {name:"Phoenix Mills",type:"Developer",city:"Mumbai",aliases:["The Phoenix Mills"]},
  {name:"RMZ Corp",type:"Developer",city:"Bengaluru",aliases:["RMZ"]},
  {name:"Embassy Developments",type:"Developer",city:"Bengaluru",aliases:["Embassy Group","Embassy Office Parks"]},
  {name:"Sattva Group",type:"Developer",city:"Bengaluru",aliases:["Sattva"]},
  {name:"Puravankara Limited",type:"Developer",city:"Bengaluru",aliases:["Puravankara"]},
  {name:"Keystone Realtors",type:"Developer",city:"Mumbai",aliases:["Rustomjee"]},
  {name:"K Raheja Corp",type:"Developer",city:"Mumbai",aliases:["Raheja"]},
  {name:"NCC Limited",type:"Developer",city:"Hyderabad",aliases:["NCC Urban"]},
  {name:"My Home Group",type:"Developer",city:"Hyderabad",aliases:["My Home Constructions"]},
  {name:"Aparna Constructions",type:"Developer",city:"Hyderabad",aliases:["Aparna Group"]},
  {name:"Casagrand",type:"Developer",city:"Chennai",aliases:["Casagrand Builder"]},
  {name:"Brigade Enterprises",type:"Developer",city:"Pune",aliases:["Brigade Group"]},
  {name:"Kolte-Patil Developers",type:"Developer",city:"Pune",aliases:["Kolte Patil"]},
  {name:"Panchshil Realty",type:"Developer",city:"Pune",aliases:["Panchshil"]},
  {name:"HDFC Capital Advisors",type:"Real estate fund",city:"Mumbai",aliases:["HDFC Capital"]},
  {name:"Blackstone Real Estate",type:"Real estate fund",city:"All markets",aliases:["Blackstone"]},
  {name:"Nexus Select Trust",type:"REIT / listed trust",city:"All markets",aliases:["Nexus Select"]},
  {name:"Brookfield India Real Estate Trust",type:"REIT / listed trust",city:"All markets",aliases:["Brookfield India REIT"]},
  {name:"L&T Finance",type:"Lender",city:"All markets",aliases:["L&T Finance Holdings"]},
  {name:"Tata Capital",type:"Lender",city:"All markets",aliases:[]},
  {name:"Bajaj Housing Finance",type:"Lender",city:"All markets",aliases:[]},
  {name:"IndiaBulls Housing Finance",type:"Lender",city:"All markets",aliases:["Samman Capital"]}
];
const state = {news:[], dailyNews:[], entities:[], city:"All markets", category:"all", tone:"all", sort:"newest", view:"overview", selectedEntity:null};
const $ = (s,root=document)=>root.querySelector(s); const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug = s => String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const fmtDate = (d, opts={day:"numeric",month:"short",year:"numeric"}) => d ? new Intl.DateTimeFormat("en-IN",{...opts,timeZone:"Asia/Kolkata"}).format(new Date(d)) : "Date unavailable";
const isRisk = x => x.priority === "high" || x.tone === "negative";
function setView(view){state.view=view; $$(".view").forEach(x=>x.classList.toggle("active",x.id===`view-${view}`)); $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===view)); const labels={overview:"DAILY BRIEF",feed:"NEWS & SIGNALS",companies:"ENTITY EXPLORER",coverage:"SOURCE COVERAGE"}; $("#page-label").textContent=labels[view]; window.scrollTo({top:0,behavior:"smooth"}); if(view==="companies") renderEntities(); if(view==="feed") renderFeed(); }
function categoryClass(c){return slug(c).split("-").slice(0,2).join("-")}
function toneLabel(t){return t==="negative"?"Risk & negative":t==="positive"?"Positive signal":"Market update"}
function cityTag(item){return item.city||"India"}
function storyCard(item,compact=false){
  const entities=(item.entities||[]).slice(0,3);
  const date=fmtDate(item.publishedAt,{day:"numeric",month:"short"});
  return `<article class="story-card ${compact?"compact-story":""} ${isRisk(item)?"risk-story":""}">
    <div class="story-meta"><span class="category-tag ${categoryClass(item.category)}">${esc(item.category||"Market & policy")}</span><span class="story-city">${esc(cityTag(item))}</span>${isRisk(item)?'<span class="priority-tag">PRIORITY</span>':''}</div>
    <a class="story-title" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} <span>↗</span></a>
    <p class="story-summary">${esc(item.description||"Open the original report for the full story.")}</p>
    <div class="story-footer"><span class="publisher">${esc(item.source||"Publisher")} <i>·</i> ${esc(date)}</span><span class="tone tone-${esc(item.tone||"neutral")}"><b></b>${esc(toneLabel(item.tone||"neutral"))}</span></div>
    ${entities.length?`<div class="entity-chips">${entities.map(n=>`<button data-entity="${esc(n)}">${esc(n)}</button>`).join("")}</div>`:""}
  </article>`;
}
function filteredNews({forFeed=false,dailyOnly=false}={}){
  let arr=(dailyOnly?state.dailyNews:state.news).filter(n=>(state.city==="All markets"||n.city===state.city)&&(state.category==="all"||n.category===state.category));
  if(forFeed){const q=$("#search-input")?.value.trim().toLowerCase()||"";if(q)arr=arr.filter(n=>[n.title,n.description,n.source,...(n.entities||[])].join(" ").toLowerCase().includes(q));if(state.tone!=="all")arr=arr.filter(n=>state.tone==="negative"?isRisk(n):n.tone===state.tone);if(state.sort==="priority")arr.sort((a,b)=>(isRisk(b)?1:0)-(isRisk(a)?1:0)||new Date(b.publishedAt)-new Date(a.publishedAt));else arr.sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));}
  return arr;
}
function renderStories(){
  const arr=filteredNews({dailyOnly:true}); const leads=arr.filter(x=>x.featured).concat(arr.filter(x=>!x.featured)).slice(0,5);
  $("#lead-stories").innerHTML=leads.length?leads.map(n=>storyCard(n)).join(""):emptyNews();
  const risk=arr.filter(isRisk).slice(0,3);$("#risk-list").innerHTML=risk.length?risk.map(x=>`<a class="risk-item" href="${esc(x.url)}" target="_blank" rel="noopener"><span class="risk-mark">!</span><span>${esc(x.title)}<small>${esc(x.source||"Source")} · ${esc(cityTag(x))}</small></span><span class="arrow">↗</span></a>`).join(""):`<div class="rail-empty">No priority signals in this edition.</div>`;
  $("#metric-total").textContent=String(arr.length).padStart(2,"0");$("#metric-priority").textContent=String(arr.filter(isRisk).length).padStart(2,"0");
  const matched=new Set(arr.flatMap(n=>n.entities||[]));$("#metric-entities").textContent=String(matched.size).padStart(2,"0");$("#today-count").textContent=arr.length;
  $("#all-stories").innerHTML=filteredNews({forFeed:true}).map(n=>storyCard(n)).join("")||emptyNews();
  const byCat=CATEGORIES.map(c=>[c,arr.filter(x=>x.category===c).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);$("#category-breakdown").innerHTML=byCat.length?byCat.map(([c,n])=>`<div class="breakdown-row"><span>${esc(c)}</span><div class="breakdown-track"><i style="width:${Math.max(6,n/Math.max(...byCat.map(x=>x[1]))*100)}%"></i></div><b>${n}</b></div>`).join(""):`<div class="rail-empty">No category counts yet.</div>`;
}
function emptyNews(){return `<div class="empty-state"><span class="empty-icon">◎</span><h3>No stories in this view yet</h3><p>Run the daily collection workflow or change your filters. Collection status and sources are shown in Source coverage.</p></div>`}
function renderFilters(){
  $("#city-filters").innerHTML=["All markets",...CITIES].map(c=>`<button class="city-pill ${state.city===c?"selected":""}" data-city="${esc(c)}">${c==="All markets"?"All markets":c}</button>`).join("");
  $("#market-list").innerHTML=CITIES.map(c=>`<button class="market-item ${state.city===c?"selected":""}" data-city="${esc(c)}"><span class="market-dot"></span>${esc(c)}<span class="market-n">${state.news.filter(n=>n.city===c).length||"—"}</span></button>`).join("");
  $("#category-filter").innerHTML='<option value="all">All categories</option>'+CATEGORIES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
}
function renderEntities(){
  const q=$("#entity-search")?.value.toLowerCase().trim()||"";const entities=state.entities.filter(e=>`${e.name} ${e.type} ${e.city}`.toLowerCase().includes(q));$("#entity-count").textContent=state.entities.length;
  $("#entity-list").innerHTML=entities.length?entities.map(e=>`<button class="entity-row ${state.selectedEntity===e.name?"selected":""}" data-pick-entity="${esc(e.name)}"><span class="entity-monogram">${esc(e.name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())}</span><span class="entity-row-text"><b>${esc(e.name)}</b><small>${esc(e.type)} · ${esc(e.city)}</small></span><span>›</span></button>`).join(""):`<div class="picker-empty">No tracked entities match. Add one to start its dossier.</div>`;
  if(state.selectedEntity){const entity=state.entities.find(e=>e.name===state.selectedEntity);if(entity)renderDossier(entity);}
}
function entityNews(e){const terms=[e.name,...(e.aliases||[])].map(x=>x.toLowerCase());return state.news.filter(n=>[n.title,n.description,...(n.entities||[])].join(" ").toLowerCase().includes(e.name.toLowerCase())||terms.some(t=>(n.entities||[]).some(x=>x.toLowerCase()===t)));}
function renderDossier(e){const items=entityNews(e);const lead=items.filter(isRisk).length;const query=encodeURIComponent(`"${e.name}" real estate OR property`);$("#entity-detail").innerHTML=`<div class="dossier-head"><div><div class="eyebrow">${esc(e.type.toUpperCase())} · ${esc(e.city.toUpperCase())}</div><h2>${esc(e.name)}</h2><p>Public coverage and tracked profile information</p></div><button class="icon-button dossier-edit" title="Edit watchlist item" data-edit="${esc(e.name)}">···</button></div><div class="dossier-stats"><div><small>TRACKED COVERAGE</small><b>${items.length}</b></div><div><small>PRIORITY ITEMS</small><b class="${lead?"red":""}">${lead}</b></div><div><small>LAST MENTION</small><b class="date-stat">${items[0]?fmtDate(items[0].publishedAt):"No mentions yet"}</b></div></div><div class="dossier-tabs"><button class="selected">Overview</button><button data-dossier="projects">Projects</button><button data-dossier="people">Promoters & leadership</button><button data-dossier="coverage">Coverage</button></div><div class="dossier-content" id="dossier-content"><div class="profile-placeholder"><span class="profile-pin">i</span><div><b>Profile enrichment follows verified sources</b><p>Company records, project names, leadership and promoter relationships will appear here as they are linked to source documents. The watchlist stores your query; it does not imply endorsement or identity verification.</p></div></div><div class="dossier-section-head"><h3>Recent coverage</h3><a href="https://news.google.com/search?q=${query}&hl=en-IN&gl=IN&ceid=IN%3Aen" target="_blank" rel="noopener">Search the wider web ↗</a></div>${items.length?items.map(n=>storyCard(n,true)).join(""):`<div class="dossier-no-coverage">No exact-name match in the current edition. <a target="_blank" rel="noopener" href="https://news.google.com/search?q=${query}&hl=en-IN&gl=IN&ceid=IN%3Aen">Search current news coverage ↗</a></div>`}</div>`;
}
function renderCoverage(meta={}){
  const streams=meta.streams||[];$("#coverage-sources").textContent=meta.streamCount??(streams.length||"—");const successes=streams.filter(s=>s.status==="ok").length;$("#coverage-progress").style.width=streams.length?`${successes/streams.length*100}%`:"0%";$("#coverage-caption").textContent=streams.length?`${successes} of ${streams.length} search streams returned successfully.`:"Waiting for the first collection.";
  const families=[{title:"Local market activity",cats:["Projects & launches","Land & acquisitions","Approvals & regulation","Project progress & delays"],desc:"New supply, land deals, construction progress and city-level policy."},{title:"Capital & counterparties",cats:["Capital & lending"],desc:"Debt, refinancing, fund activity, lender exposure and capital raises."},{title:"Corporate & people",cats:["Company & leadership"],desc:"Results, appointments, promoter and senior leadership coverage."},{title:"Legal, disputes & risk",cats:["Legal & risk"],desc:"Litigation, insolvency, enforcement, safety and adverse reporting."},{title:"Market & policy",cats:["Market & policy"],desc:"Demand, pricing, macro conditions, taxation and regulatory changes."}];
  $("#coverage-grid").innerHTML=families.map((f,i)=>`<article class="coverage-card"><div class="coverage-card-index">0${i+1}</div><div><h3>${f.title}</h3><p>${f.desc}</p><div class="coverage-card-tags">${f.cats.map(c=>`<span>${esc(c)}</span>`).join("")}</div></div></article>`).join("");
  if(streams.length)$("#coverage-grid").insertAdjacentHTML("afterend",`<div class="stream-table-wrap"><div class="eyebrow">LATEST RUN BY SEARCH STREAM</div><table class="stream-table"><thead><tr><th>Search stream</th><th>Market</th><th>Result</th><th>Stories</th></tr></thead><tbody>${streams.map(s=>`<tr><td>${esc(s.label)}</td><td>${esc(s.city||"India")}</td><td><span class="run-status ${s.status}">${s.status==="ok"?"Collected":"Unavailable"}</span></td><td>${s.items??"—"}</td></tr>`).join("")}</tbody></table></div>`);
}
async function loadData(){
  $("#updated-at").textContent="Refreshing edition…";let edition=null;try{const [newsRes,entRes]=await Promise.all([fetch(`data/news.json?ts=${Date.now()}`),fetch("data/entities.json")]);if(newsRes.ok){edition=await newsRes.json();state.news=Array.isArray(edition.items)?edition.items:[];state.dailyNews=Array.isArray(edition.todayItems)?edition.todayItems:[];renderCoverage(edition);}else{state.news=[];state.dailyNews=[];renderCoverage({});}if(entRes.ok){const data=await entRes.json();const saved=JSON.parse(localStorage.getItem("groundline-entities")||"[]");const fromFile=Array.isArray(data.entities)?data.entities:[];state.entities=[...fromFile,...(Array.isArray(saved)?saved.filter(e=>!fromFile.some(f=>f.name.toLowerCase()===e.name.toLowerCase())):[])];}else state.entities=[];
  }catch(e){state.news=[];state.dailyNews=[];state.entities=[];renderCoverage({});}
  if(!state.entities.length)state.entities=DEFAULT_ENTITIES.map(x=>({...x}));
  const date=edition?.generatedAt||"";
  $("#edition-date").textContent=date?fmtDate(date,{day:"numeric",month:"long",year:"numeric"}):"Awaiting first run";$("#updated-at").textContent=date?`Last collected ${new Intl.DateTimeFormat("en-IN",{hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"}).format(new Date(date))} IST`:`Collection not run yet`;
  renderFilters();renderStories();renderEntities();
}
function saveEntities(){localStorage.setItem("groundline-entities",JSON.stringify(state.entities));}
function restoreSavedEntities(){try{const saved=JSON.parse(localStorage.getItem("groundline-entities")||"null");if(Array.isArray(saved)&&saved.length)state.entities=saved;}catch{}}
function bind(){
  $$(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));$$('[data-go]').forEach(b=>b.addEventListener("click",()=>setView(b.dataset.go)));
  document.addEventListener("click",e=>{const city=e.target.closest("[data-city]");if(city){state.city=city.dataset.city;renderFilters();renderStories();}
    const entity=e.target.closest("[data-entity]");if(entity){state.selectedEntity=entity.dataset.entity;setView("companies");renderEntities();}
    const pick=e.target.closest("[data-pick-entity]");if(pick){state.selectedEntity=pick.dataset.pickEntity;renderEntities();}
    const dossierTab=e.target.closest("[data-dossier]");if(dossierTab){$$('.dossier-tabs button').forEach(b=>b.classList.toggle('selected',b===dossierTab));renderDossierTab(dossierTab.dataset.dossier);}
  });
  $("#category-filter").addEventListener("change",e=>{state.category=e.target.value;renderStories();});$("#search-input").addEventListener("input",renderStories);$("#feed-tone").addEventListener("change",e=>{state.tone=e.target.value;renderStories();});$("#feed-sort").addEventListener("change",e=>{state.sort=e.target.value;renderStories();});$("#entity-search").addEventListener("input",renderEntities);$("#refresh-btn").addEventListener("click",loadData);
  const dialog=$("#entity-dialog");$("#add-entity").addEventListener("click",()=>dialog.showModal());$("#save-entity").addEventListener("click",e=>{e.preventDefault();const name=$("#new-name").value.trim();if(!name)return;const type=$("#new-type").value,city=$("#new-city").value;if(state.entities.some(x=>x.name.toLowerCase()===name.toLowerCase())){dialog.close();state.selectedEntity=name;renderEntities();return;}state.entities.unshift({name,type,city,aliases:[]});saveEntities();state.selectedEntity=name;dialog.close();$("#new-name").value="";renderEntities();});
}
function renderDossierTab(tab){
  const e=state.entities.find(x=>x.name===state.selectedEntity);if(!e)return;const host=$("#dossier-content");if(!host)return;
  const q=encodeURIComponent(`"${e.name}" real estate ${tab==='projects'?'upcoming projects launch construction':tab==='people'?'promoter chairman CEO leadership':tab==='coverage'?'news updates announcement':'news'}`);
  const related=entityNews(e);const selected=tab==='projects'?related.filter(n=>['Projects & launches','Approvals & regulation','Project progress & delays'].includes(n.category)):tab==='people'?related.filter(n=>n.category==='Company & leadership'):related;
  const title=tab==='projects'?'Project activity':tab==='people'?'Promoters & senior leadership':'All tracked coverage';
  const disclaimer=tab==='people'?'Profiles and relationships will be shown when supported by linked company disclosures or reputable reporting. Search results are leads for review, not verified biographical records.':tab==='projects'?'Coverage about launches, approvals and project progress appears here when an exact entity match is found. Upcoming status needs confirmation from the source.':'News and updates currently captured for this entity, with direct links to publishers.';
  host.innerHTML=`<div class="profile-placeholder"><span class="profile-pin">i</span><div><b>${esc(title)}</b><p>${esc(disclaimer)}</p><a class="dossier-web-search" target="_blank" rel="noopener" href="https://news.google.com/search?q=${q}&hl=en-IN&gl=IN&ceid=IN%3Aen">Search public coverage ↗</a></div></div>${selected.length?selected.map(n=>storyCard(n,true)).join(""):`<div class="dossier-no-coverage">No exact-name matches in the current daily edition. <a target="_blank" rel="noopener" href="https://news.google.com/search?q=${q}&hl=en-IN&gl=IN&ceid=IN%3Aen">Search current public coverage ↗</a></div>`}`;
}
restoreSavedEntities();bind();loadData();
