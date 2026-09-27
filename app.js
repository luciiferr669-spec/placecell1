/* ---------- Data layer (browser storage, stands in for a database) ---------- */
const KEY = 'placecell-v1';
const STATUSES = ['Applied','Test scheduled','Shortlisted','Selected','Rejected'];

function seed(){
  return {
    users:[
      {id:1,name:'Rahul Kumar',email:'rahul@college.edu',pass:'1234',role:'student',branch:'CSE',cgpa:7.8},
      {id:2,name:'Priya Singh',email:'priya@college.edu',pass:'1234',role:'student',branch:'ECE',cgpa:8.6},
      {id:3,name:'Placement Officer',email:'admin@college.edu',pass:'admin',role:'admin'}
    ],
    jobs:[
      {id:1,company:'Infosys',role:'Systems Engineer',pkg:3.6,location:'Bengaluru',minCgpa:6.0,branches:['CSE','IT','ECE'],deadline:'2026-10-15',desc:'Online test, technical interview and HR round. Training at Mysuru campus.'},
      {id:2,company:'TCS',role:'Assistant System Engineer',pkg:3.4,location:'Pan India',minCgpa:6.0,branches:['CSE','IT','ECE','EEE','ME','CE'],deadline:'2026-10-10',desc:'Selection through TCS NQT followed by a single interview.'},
      {id:3,company:'Wipro',role:'Project Engineer',pkg:3.5,location:'Hyderabad',minCgpa:6.5,branches:['CSE','IT'],deadline:'2026-10-20',desc:'Aptitude, essay writing and coding round.'},
      {id:4,company:'L&T',role:'Graduate Engineer Trainee',pkg:5.0,location:'Chennai',minCgpa:7.0,branches:['ME','CE','EEE'],deadline:'2026-10-25',desc:'Core engineering role on site and design teams.'},
      {id:5,company:'Zoho',role:'Software Developer',pkg:8.4,location:'Chennai',minCgpa:7.5,branches:['CSE','IT'],deadline:'2026-11-02',desc:'Multiple coding rounds and a final technical HR round.'}
    ],
    apps:[
      {id:1,userId:1,jobId:2,status:'Test scheduled',date:'2026-09-20'},
      {id:2,userId:1,jobId:3,status:'Shortlisted',date:'2026-09-18'},
      {id:3,userId:2,jobId:1,status:'Applied',date:'2026-09-24'}
    ],
    nextId:100
  };
}
let db;
try{ db = JSON.parse(localStorage.getItem(KEY)) || seed(); }catch(e){ db = seed(); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){} }
let me = null, page = 'dashboard';

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const job = id => db.jobs.find(j=>j.id===id);
const user = id => db.users.find(u=>u.id===id);
const fmtDate = d => new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const statusTag = s => `<span class="status s-${s.split(' ')[0]}">${s}</span>`;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200); }
function eligible(j,u){ return u.cgpa>=j.minCgpa && j.branches.includes(u.branch); }

/* ---------- auth ---------- */
function showAuth(which){
  $('loginForm').classList.toggle('hidden',which!=='login');
  $('regForm').classList.toggle('hidden',which!=='register');
  $('tabLogin').classList.toggle('on',which==='login');
  $('tabReg').classList.toggle('on',which==='register');
}
function login(){
  const u = db.users.find(u=>u.email.toLowerCase()===$('lEmail').value.trim().toLowerCase() && u.pass===$('lPass').value);
  if(!u){ $('lErr').textContent='Email or password is incorrect. Check both and try again.'; return; }
  $('lErr').textContent=''; enter(u);
}
function demo(role){
  const u = db.users.find(u=>u.role===role); $('lEmail').value=u.email; $('lPass').value=u.pass; login();
}
function register(){
  const email=$('rEmail').value.trim().toLowerCase();
  if(db.users.some(u=>u.email.toLowerCase()===email)){ $('rErr').textContent='An account with this email already exists. Log in instead.'; return; }
  const cgpa=parseFloat($('rCgpa').value);
  if(isNaN(cgpa)||cgpa<0||cgpa>10){ $('rErr').textContent='Enter a CGPA between 0 and 10.'; return; }
  const u={id:db.nextId++,name:$('rName').value.trim(),email,pass:$('rPass').value,role:'student',branch:$('rBranch').value,cgpa};
  db.users.push(u); save(); toast('Account created'); enter(u);
}
function enter(u){
  me=u; page='dashboard';
  $('auth').classList.add('hidden'); $('app').classList.remove('hidden');
  $('whoName').textContent=u.name;
  $('whoMeta').textContent=u.role==='admin'?'Admin':`${u.branch} · CGPA ${u.cgpa}`;
  render();
}
function logout(){ me=null; $('app').classList.add('hidden'); $('auth').classList.remove('hidden'); $('lPass').value=''; }

/* ---------- navigation ---------- */
function go(p){ page=p; render(); window.scrollTo(0,0); }
function render(){
  const tabs = me.role==='admin'
    ? [['dashboard','Dashboard'],['jobs','Manage jobs'],['applications','Applications'],['students','Students']]
    : [['dashboard','Dashboard'],['jobs','Browse jobs'],['mine','My applications']];
  $('nav').innerHTML = tabs.map(([k,l])=>`<button class="${page===k?'on':''}" onclick="go('${k}')">${l}</button>`).join('');
  const views = me.role==='admin'
    ? {dashboard:adminDash,jobs:adminJobs,applications:adminApps,students:adminStudents}
    : {dashboard:studentDash,jobs:studentJobs,mine:studentApps};
  $('view').innerHTML = views[page]();
}

/* ---------- student views ---------- */
function studentDash(){
  const mine=db.apps.filter(a=>a.userId===me.id);
  const open=db.jobs.filter(j=>eligible(j,me)).length;
  const c=s=>mine.filter(a=>a.status===s).length;
  const recent=mine.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  return `
  <div class="page-head"><div><h2>Hello, ${esc(me.name.split(' ')[0])}</h2><p>Here's where your placement season stands.</p></div>
    <button class="btn gold" onclick="go('jobs')">Browse jobs</button></div>
  <div class="stats">
    <div class="stat"><b>${open}</b><span>Jobs you're eligible for</span></div>
    <div class="stat"><b>${mine.length}</b><span>Applications</span></div>
    <div class="stat"><b>${c('Test scheduled')}</b><span>Upcoming tests</span></div>
    <div class="stat hl"><b>${c('Shortlisted')+c('Selected')}</b><span>Shortlisted or selected</span></div>
  </div>
  <div class="section"><h3>Recent applications</h3>
    ${recent.length? appTable(recent,false) : `<div class="card empty">You haven't applied anywhere yet. <br><br><button class="btn" onclick="go('jobs')">Find a job</button></div>`}
  </div>`;
}
function studentJobs(){
  return `
  <div class="page-head"><div><h2>Browse jobs</h2><p>${db.jobs.length} companies visiting campus this season.</p></div></div>
  <div class="filters">
    <input id="q" placeholder="Search company, role or city" oninput="drawJobs()" aria-label="Search jobs">
    <select id="fElig" onchange="drawJobs()" aria-label="Eligibility"><option value="all">All jobs</option><option value="yes">Only jobs I can apply for</option></select>
    <select id="fSort" onchange="drawJobs()" aria-label="Sort"><option value="deadline">Closing soonest</option><option value="pkg">Highest package</option></select>
  </div>
  <div class="jobs" id="jobList">${jobCards()}</div>`;
}
function drawJobs(){ $('jobList').innerHTML=jobCards(); }
function jobCards(){
  const q=($('q')?.value||'').toLowerCase(), el=$('fElig')?.value||'all', sort=$('fSort')?.value||'deadline';
  let list=db.jobs.filter(j=>(j.company+' '+j.role+' '+j.location).toLowerCase().includes(q));
  if(el==='yes') list=list.filter(j=>eligible(j,me));
  list.sort((a,b)=>sort==='pkg'?b.pkg-a.pkg:a.deadline.localeCompare(b.deadline));
  if(!list.length) return `<div class="card empty" style="grid-column:1/-1">No jobs match your search. Clear the filters to see all jobs.</div>`;
  return list.map(j=>{
    const applied=db.apps.find(a=>a.userId===me.id&&a.jobId===j.id);
    const ok=eligible(j,me);
    const why=!ok?(me.cgpa<j.minCgpa?`Needs CGPA ${j.minCgpa}+`:`Not open to ${me.branch}`):'';
    return `<article class="job">
      <div class="job-top"><div class="logo">${esc(j.company[0])}</div><div><h4>${esc(j.role)}</h4><div class="co">${esc(j.company)} · ${esc(j.location)}</div></div></div>
      <div class="facts"><span class="chip">CGPA ${j.minCgpa}+</span><span class="chip">${j.branches.join(', ')}</span><span class="chip">Apply by ${fmtDate(j.deadline)}</span></div>
      <p>${esc(j.desc)}</p>
      <div class="job-foot"><span class="pkg">₹${j.pkg} LPA</span>
        ${applied?statusTag(applied.status):ok?`<button class="btn small gold" onclick="apply(${j.id})">Apply</button>`:`<span class="note">${why}</span>`}
      </div></article>`;
  }).join('');
}
function apply(jobId){
  if(db.apps.some(a=>a.userId===me.id&&a.jobId===jobId)) return;
  db.apps.push({id:db.nextId++,userId:me.id,jobId,status:'Applied',date:new Date().toISOString().slice(0,10)});
  save(); toast(`Applied to ${job(jobId).company}`); drawJobs();
}
function studentApps(){
  const mine=db.apps.filter(a=>a.userId===me.id).sort((a,b)=>b.date.localeCompare(a.date));
  return `<div class="page-head"><div><h2>My applications</h2><p>Status updates from the placement cell appear here.</p></div></div>
  ${mine.length?appTable(mine,false):`<div class="card empty">No applications yet.<br><br><button class="btn" onclick="go('jobs')">Browse jobs</button></div>`}`;
}
function withdraw(id){ db.apps=db.apps.filter(a=>a.id!==id); save(); toast('Application withdrawn'); render(); }

/* ---------- shared table ---------- */
function appTable(list,admin){
  return `<div class="table-wrap"><table>
    <thead><tr>${admin?'<th>Student</th>':''}<th>Company</th><th>Role</th><th>Applied on</th><th>Status</th><th></th></tr></thead>
    <tbody>${list.map(a=>{const j=job(a.jobId),u=user(a.userId); if(!j||!u) return '';
      return `<tr>
        ${admin?`<td><b>${esc(u.name)}</b><br><span style="color:var(--muted);font-size:12px">${u.branch} · ${u.cgpa}</span></td>`:''}
        <td>${esc(j.company)}</td><td>${esc(j.role)}</td><td>${fmtDate(a.date)}</td>
        <td>${admin?`<select onchange="setStatus(${a.id},this.value)" aria-label="Status">${STATUSES.map(s=>`<option ${s===a.status?'selected':''}>${s}</option>`).join('')}</select>`:statusTag(a.status)}</td>
        <td>${!admin&&a.status==='Applied'?`<button class="btn ghost small" onclick="withdraw(${a.id})">Withdraw</button>`:''}</td>
      </tr>`}).join('')}</tbody></table></div>`;
}

/* ---------- admin views ---------- */
function adminDash(){
  const students=db.users.filter(u=>u.role==='student');
  const placed=new Set(db.apps.filter(a=>a.status==='Selected').map(a=>a.userId)).size;
  const pct=students.length?Math.round(placed/students.length*100):0;
  const byCo=db.jobs.map(j=>({n:j.company,c:db.apps.filter(a=>a.jobId===j.id).length}));
  const max=Math.max(1,...byCo.map(x=>x.c));
  const byStatus=STATUSES.map(s=>({n:s,c:db.apps.filter(a=>a.status===s).length}));
  const maxS=Math.max(1,...byStatus.map(x=>x.c));
  const bars=(arr,m)=>arr.map(x=>`<div class="bar"><span>${esc(x.n)}</span><div class="bar-track"><div class="bar-fill" style="width:${x.c/m*100}%"></div></div><b>${x.c}</b></div>`).join('');
  return `
  <div class="page-head"><div><h2>Placement overview</h2><p>Season 2026–27</p></div><button class="btn gold" onclick="go('jobs')">Add a job</button></div>
  <div class="stats">
    <div class="stat"><b>${students.length}</b><span>Registered students</span></div>
    <div class="stat"><b>${db.jobs.length}</b><span>Companies</span></div>
    <div class="stat"><b>${db.apps.length}</b><span>Applications</span></div>
    <div class="stat hl"><b>${placed} <small style="font-size:15px;font-weight:600">(${pct}%)</small></b><span>Students placed</span></div>
  </div>
  <div class="section grid2">
    <div class="card"><h3>Applications per company</h3><div class="bars" style="margin-top:14px">${bars(byCo,max)}</div></div>
    <div class="card"><h3>Applications by stage</h3><div class="bars" style="margin-top:14px">${bars(byStatus,maxS)}</div></div>
  </div>`;
}
function adminJobs(){
  const br=['CSE','IT','ECE','EEE','ME','CE'];
  return `
  <div class="page-head"><div><h2>Manage jobs</h2><p>Post a new drive or remove one that has closed.</p></div></div>
  <form class="card" onsubmit="event.preventDefault();addJob()">
    <h3>Post a job</h3>
    <div class="row2">
      <div><label for="jCo">Company</label><input id="jCo" required></div>
      <div><label for="jRole">Role</label><input id="jRole" required></div>
      <div><label for="jPkg">Package (LPA)</label><input id="jPkg" type="number" step="0.1" min="0" required></div>
      <div><label for="jLoc">Location</label><input id="jLoc" required></div>
      <div><label for="jCgpa">Minimum CGPA</label><input id="jCgpa" type="number" step="0.1" min="0" max="10" value="6" required></div>
      <div><label for="jDl">Apply by</label><input id="jDl" type="date" required></div>
    </div>
    <label>Eligible branches</label>
    <div class="facts">${br.map(b=>`<label class="chip" style="margin:0;cursor:pointer"><input type="checkbox" value="${b}" class="jBr" checked style="width:auto;margin-right:4px">${b}</label>`).join('')}</div>
    <label for="jDesc">Selection process</label><textarea id="jDesc" required></textarea>
    <button class="btn gold" style="margin-top:16px" type="submit">Post job</button>
  </form>
  <div class="section"><h3>Posted jobs</h3>
  <div class="table-wrap"><table><thead><tr><th>Company</th><th>Role</th><th>Package</th><th>Apply by</th><th>Applicants</th><th></th></tr></thead><tbody>
  ${db.jobs.map(j=>`<tr><td><b>${esc(j.company)}</b></td><td>${esc(j.role)}</td><td>₹${j.pkg} LPA</td><td>${fmtDate(j.deadline)}</td><td>${db.apps.filter(a=>a.jobId===j.id).length}</td>
    <td><button class="btn ghost small" onclick="delJob(${j.id})">Remove</button></td></tr>`).join('')}
  </tbody></table></div></div>`;
}
function addJob(){
  const branches=[...document.querySelectorAll('.jBr:checked')].map(c=>c.value);
  if(!branches.length){ toast('Select at least one branch'); return; }
  db.jobs.push({id:db.nextId++,company:$('jCo').value.trim(),role:$('jRole').value.trim(),pkg:parseFloat($('jPkg').value),
    location:$('jLoc').value.trim(),minCgpa:parseFloat($('jCgpa').value),branches,deadline:$('jDl').value,desc:$('jDesc').value.trim()});
  save(); toast('Job posted'); render();
}
function delJob(id){
  if(!confirm(`Remove ${job(id).company}? Its applications will be removed too.`)) return;
  db.jobs=db.jobs.filter(j=>j.id!==id); db.apps=db.apps.filter(a=>a.jobId!==id); save(); toast('Job removed'); render();
}
function adminApps(){
  const list=db.apps.slice().sort((a,b)=>b.date.localeCompare(a.date));
  return `<div class="page-head"><div><h2>Applications</h2><p>Change a status and the student sees it straight away.</p></div></div>
  ${list.length?appTable(list,true):'<div class="card empty">No applications yet.</div>'}`;
}
function setStatus(id,s){ db.apps.find(a=>a.id===id).status=s; save(); toast(`Status set to ${s}`); }
function adminStudents(){
  const st=db.users.filter(u=>u.role==='student');
  return `<div class="page-head"><div><h2>Students</h2><p>${st.length} registered</p></div></div>
  <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>CGPA</th><th>Applications</th><th>Best status</th></tr></thead><tbody>
  ${st.map(u=>{const a=db.apps.filter(x=>x.userId===u.id);
    const best=['Selected','Shortlisted','Test scheduled','Applied','Rejected'].find(s=>a.some(x=>x.status===s));
    return `<tr><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td>${u.branch}</td><td>${u.cgpa}</td><td>${a.length}</td><td>${best?statusTag(best):'—'}</td></tr>`}).join('')}
  </tbody></table></div>
  <p class="disclaimer">Demo data is saved in this browser only. <button class="btn ghost small" onclick="resetData()">Reset demo data</button></p>`;
}
function resetData(){ if(confirm('Reset all demo data?')){ db=seed(); save(); toast('Demo data reset'); render(); } }
