/* StudyStackHS extension. Injected inside the EXISTING StudyStack IIFE. */
let hsGuides = [];
const hsSafeFile = s => typeof s === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(s);
async function hsFetchGuides(){
  const response = await fetch('study-guides/index.json', {cache:'no-store'});
  if (!response.ok) throw Error('Study guide catalog could not be loaded (HTTP '+response.status+').');
  const data = await response.json();
  if (!Array.isArray(data.guides)) throw Error('Study guide catalog needs a guides array.');
  hsGuides = data.guides.filter(g => g && hsSafeFile(g.id) && hsSafeFile(g.html) && hsSafeFile(g.pdf) && hsSafeFile(g.deck));
  return hsGuides;
}
async function hsShowGuides(){
  mode='hs-guides'; current=null;
  set('<h1>Study Guides</h1><p class="muted">Loading original high school learning materials…</p>');
  try { await hsFetchGuides(); hsRenderGuides(); }
  catch(e){set(`<div class="row space"><h1>Study Guides</h1>${btn('← Home','home','ghost')}</div><div class="panel"><p>${esc(e.message)}</p><p class="muted small">Check hs/study-guides/index.json and try again.</p>${btn('Reload','hs-guides','primary')}</div>`);}
}
function hsRenderGuides(){
  mode='hs-guides';
  set(`<div class="row space"><div><h1>High School Study Guides</h1><p class="muted">Read the latest original guide, or practice its linked flashcards.</p></div>${btn('← Home','home','ghost')}</div>
  <div class="grid">${hsGuides.map(g=>`<article class="panel deck-card"><span class="pill">${esc(g.subject||'High School')}</span><strong>${esc(g.title||g.id)}</strong><p class="muted small">${esc(g.description||'Original guide and linked practice materials.')}</p><div class="row">${btn('📖 Read guide','hs-guide:'+g.id,'primary')}${btn('🗂 Flashcards','hs-cards:'+g.id)}</div><div class="row"><a class="btn ghost" href="study-guides/${encodeURIComponent(g.html)}" target="_blank" rel="noopener">Open HTML</a><a class="btn ghost" href="study-guides/${encodeURIComponent(g.pdf)}" target="_blank" rel="noopener">Open PDF</a></div></article>`).join('')||'<div class="panel">No high school study guides are published yet.</div>'}</div>`);
}
async function hsOpenGuide(id){
  if(!hsGuides.length){try{await hsFetchGuides()}catch(e){return hsShowGuides();}}
  const g = hsGuides.find(g=>g.id===id);
  if(!g) return hsShowGuides();
  mode='hs-guide';
  const htmlUrl='study-guides/'+encodeURIComponent(g.html),pdfUrl='study-guides/'+encodeURIComponent(g.pdf);
  const topics=Array.isArray(g.topics)?g.topics:[];
  set(`<div class="row space"><div><span class="pill">${esc(g.subject||'High School')}</span><h1 style="margin-top:10px">${esc(g.title||g.id)}</h1><p class="muted">Always opens the current published HTML guide at the same address.</p></div>${btn('← All Study Guides','hs-guides','ghost')}</div>
  <div class="row" style="margin:14px 0;gap:9px">${btn('🗂 Study flashcards','hs-cards:'+g.id,'primary')}${btn('＋ Create flashcards','hs-create:'+g.id)}<a class="btn ghost" href="${htmlUrl}" target="_blank" rel="noopener">↗ Full-page HTML</a><a class="btn ghost" href="${pdfUrl}" target="_blank" rel="noopener">↗ PDF version</a></div>
  ${topics.length?`<div class="panel"><b>Jump to a unit in the full guide:</b><div class="row" style="margin-top:10px">${topics.map((t,i)=>`<a class="btn ghost" target="_blank" rel="noopener" href="${htmlUrl}#unit-${i+1}">${i+1}. ${esc(t)}</a>`).join('')}</div></div>`:''}
  <div class="panel" style="padding:10px"><div class="row space" style="margin-bottom:9px"><b>Original HTML study guide</b><span class="muted small">Scroll in the reader below</span></div><iframe title="${esc(g.title||'Study guide')}" src="${htmlUrl}" loading="lazy" style="background:white;width:100%;height:min(77vh,900px);min-height:470px;border:0;border-radius:10px" referrerpolicy="no-referrer"></iframe></div>
  <p class="muted small">The full-page HTML link is the permanent reader link. Updating the HTML file on GitHub updates the same link. The PDF must be uploaded again separately if it changes.</p>`);
}
async function hsOpenCards(id){
  try {
    if(!hsGuides.length)await hsFetchGuides();
    const g=hsGuides.find(x=>x.id===id);
    if(!g)throw Error('Guide was not found.');
    let d=db.decks.find(d=>d.sharedFile===g.deck);
    if(d){d.hidden=false;save();return open(d.id);}
    await fetchCatalog();
    if(!sharedCatalog.some(d=>d.file===g.deck))throw Error('Linked flashcard file is missing from hs/decks/index.json.');
    await addShared(g.deck);
    d=db.decks.find(d=>d.sharedFile===g.deck);
    if(!d)throw Error('The flashcards could not be imported.');
    return open(d.id);
  } catch(e) {alert('Unable to open linked flashcards: '+e.message);hsShowGuides();}
}
function hsCreateCardPrompt(id){
  const g=hsGuides.find(x=>x.id===id);
  return `I am uploading the complete study guide named "${g?.title||'High School Study Guide'}". Read the document carefully, including all topics, tables, equations, definitions, diagrams, and practice questions. Create accurate high-school flashcards that teach the material, not just memorize isolated numerical answers. Before using a variable, define its meaning, units, and applicable assumptions. Distinguish standard values from problem-specific givens. Flag any missing or ambiguous source information instead of guessing. Keep question and answer short and focused on one concept. Return ONLY valid JSON that can be imported into StudyStackHS using this schema: {"title":"My Study Guide Flashcards","subject":"${g?.subject||'Other'}","cards":[{"front":"Question?","back":"Correct answer with required conditions."}]}. Do not use Markdown code fences.`;
}
function hsCreateCards(id){
  const g=hsGuides.find(x=>x.id===id);
  if(!g)return hsShowGuides();
  mode='hs-create';
  const prompt=hsCreateCardPrompt(id);
  set(`<div class="row space"><h1>Create flashcards from a guide</h1>${btn('← Back to guide','hs-guide:'+id,'ghost')}</div>
  <p class="muted">Guide: <strong>${esc(g.title)}</strong></p>
  <div class="panel"><h2>Option 1 — Generate from the entire document</h2><p>Upload the HTML or PDF study guide to ChatGPT, then paste the instructions below. Review the generated questions, save the JSON, and import it here. GitHub Pages does not include an AI service by itself.</p><textarea id="hsPrompt" readonly style="min-height:190px">${esc(prompt)}</textarea><div class="row">${btn('Copy generation instructions','hs-copy:'+id,'primary')}${btn('Import generated JSON','import')}</div></div>
  <div class="panel"><h2>Option 2 — Create cards yourself</h2><p class="muted">Start your own deck, add flashcards individually, or import additional cards later.</p>${btn('Create my own deck','hs-blank:'+id,'primary')}</div>`);
}
async function hsCopyCardsPrompt(id){
  const prompt=hsCreateCardPrompt(id);
  try{await navigator.clipboard.writeText(prompt);alert('Flashcard instructions copied. Upload your guide to ChatGPT and paste them.');}
  catch(e){const t=document.getElementById('hsPrompt');if(t){t.focus();t.select();alert('Text selected. Use Ctrl+C or Copy to copy the instructions.');}}
}
function hsBlankDeck(id){
  const g=hsGuides.find(x=>x.id===id);
  if(!g)return hsShowGuides();
  const d=makeDeck(g.title+' — My Flashcards',[]);
  d.subject=g.subject||'Other';
  db.decks.push(d);save();current=d.id;edit();
}
