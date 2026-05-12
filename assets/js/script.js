// ===================== UTILITIES =====================
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===================== RESOURCES FILTER (tags) =====================
function filterTag(tag){
  const cols = document.querySelectorAll('#resource-grid .col');
  if (!cols.length) return; // not on resources page

  cols.forEach(col => {
    const tags = (col.dataset.tags || '').split(',').map(t => t.trim());
    const show = !tag || tag === '' || tags.includes(tag);
    col.style.display = show ? '' : 'none';
  });
}

// ===================== RESOURCES PDF VIEWER =====================
function initResourceViewer(){
  const resourceCards = document.querySelectorAll('.resource-card[data-pdf]');
  if (!resourceCards.length) return; // not on resources page

  const pdfModalEl = document.getElementById('pdfModal');
  const pdfViewer  = document.getElementById('pdfViewer');
  const pdfTitle   = document.getElementById('pdfModalLabel');

  if (!pdfModalEl || !pdfViewer) return;

  const pdfModal = new bootstrap.Modal(pdfModalEl);

  resourceCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const pdfPath = card.getAttribute('data-pdf');
      const title   = card.querySelector('.card-title')?.textContent || 'Resource';

      pdfViewer.setAttribute('src', pdfPath);
      if (pdfTitle) pdfTitle.textContent = title;

      pdfModal.show();
    });
  });
}

// ===================== NAVBAR ACTIVE LINK =====================
(function setActive(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar .nav-link').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === path){ a.classList.add('active'); }
  });
})();

// ===================== CONTACT FORM =====================
function validateContact(){
  const name  = $('#c-name')?.value.trim()  || "";
  const email = $('#c-email')?.value.trim() || "";
  const goal  = $('#c-goal')?.value         || "";
  const msg   = $('#c-msg')?.value.trim()   || "";

  if(!name || !email || !goal || !msg) return false;

  const ok = /^\S+@\S+\.\S+$/.test(email);
  if(!ok){
    alert('Invalid email');
    return false;
  }

  const rec = JSON.parse(localStorage.getItem('messages') || '[]');
  rec.push({name, email, goal, msg, ts: Date.now()});
  localStorage.setItem('messages', JSON.stringify(rec));

  $('#contact-alert')?.classList.remove('d-none');
  return false; // prevent real submit
}

// =======================================================
// WORKOUTS: FILTER + MODAL + ADD TO PLAN (CURRENT WEEK)
// =======================================================
function filterDrills(){
  const q = ($('#q')?.value   || '').toLowerCase();
  const c = $('#cat')?.value  || '';
  const d = $('#diff')?.value || '';

  $$('.drill-card').forEach(card=>{
    const name = (card.dataset.name || '').toLowerCase();
    const cat  = card.dataset.cat  || '';
    const diff = card.dataset.diff || '';

    const show = (!q || name.includes(q)) &&
                 (!c || c === cat) &&
                 (!d || d === diff);

    card.parentElement.style.display = show ? '' : 'none';
  });
}

function openDrill(title){
  const d = DRILLS.find(x => x.name === title);
  $('#drillTitle') && ($('#drillTitle').textContent = title);

  const steps = $('#drillSteps');
  if (steps) {
    steps.innerHTML = `
      <li>${d?.desc || 'Quality reps over quantity.'}</li>
      <li>Perform 2–4 sets with clean form.</li>
      <li>Rest adequately between sets.</li>
    `;
  }
  const modalEl = document.getElementById('drillModal');
  if(!modalEl) return;
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// ---------- WEEK HELPERS (multi-week) ----------
function getCurrentWeek(){
  return parseInt(localStorage.getItem('currentWeek') || '0', 10);
}
function setCurrentWeek(w){
  if(w < 0) w = 0;
  localStorage.setItem('currentWeek', String(w));
}
function getWeekKey(){
  return 'plan_week_' + getCurrentWeek();
}

// Add from workouts into current week (Mon by default)
function addToPlan(drill){
  const weekKey = getWeekKey();
  const plan = JSON.parse(localStorage.getItem(weekKey) || '{}');
  const day = 'Mon';
  plan[day] = plan[day] || [];
  plan[day].push({ name: drill, done: false });
  localStorage.setItem(weekKey, JSON.stringify(plan));
  alert('Added to plan (Mon) in the current planner week.');
}

// =======================================================
// PLANNER (calendar.html) – multi-week + drag & drop
// =======================================================
function updateWeekLabel(){
  const lbl = document.getElementById('week-label');
  if (!lbl) return;
  const w = getCurrentWeek();
  lbl.textContent = 'Week ' + (w + 1);
}

function buildWeek(){
  const grid = document.getElementById('week-grid');
  if(!grid) return; // not on calendar page

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const weekKey = getWeekKey();
  const stored = JSON.parse(localStorage.getItem(weekKey) || '{}');

  grid.innerHTML = '';

  days.forEach(day => {
    const col = document.createElement('div');
    col.className = 'col-md-4';

    const wrapper = document.createElement('div');
    wrapper.className = 'glass-day day-column';
    wrapper.dataset.day = day;

    const title = document.createElement('h5');
    title.className = 'mb-3';
    title.textContent = day;

    const list = document.createElement('div');
    list.className = 'plan-drill-list';

    const arr = stored[day] || [];
    arr.forEach((item, idx) => {
      const drill = (typeof item === 'string') ? { name: item, done: false } : item;

      const div = document.createElement('div');
      div.className = 'plan-drill';
      if (drill.done) div.classList.add('plan-drill-done');
      div.draggable = true;
      div.dataset.day = day;
      div.dataset.index = idx;

      div.innerHTML = `
        <span class="plan-drill-name">${drill.name}</span>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-light plan-drill-done-btn">✓</button>
          <button type="button" class="btn btn-sm btn-outline-light plan-drill-delete">&times;</button>
          <span class="move-btn">⋮⋮</span>
        </div>
      `;

      list.appendChild(div);
    });

    wrapper.appendChild(title);
    wrapper.appendChild(list);
    col.appendChild(wrapper);
    grid.appendChild(col);
  });

  updateWeekLabel();
}

function clearPlan(){
  localStorage.removeItem(getWeekKey());
  buildWeek();
}

function changeWeek(delta){
  const current = getCurrentWeek();
  const next = Math.max(0, current + delta);
  setCurrentWeek(next);
  buildWeek();
}

// ---------- Done / Delete buttons on drills ----------
document.addEventListener('click', (e) => {
  // DELETE
  if (e.target.classList.contains('plan-drill-delete')) {
    const item = e.target.closest('.plan-drill');
    if (!item) return;
    const day   = item.dataset.day;
    const index = parseInt(item.dataset.index, 10);

    const weekKey = getWeekKey();
    const plan = JSON.parse(localStorage.getItem(weekKey) || '{}');

    if (plan[day]) {
      plan[day].splice(index, 1);
      localStorage.setItem(weekKey, JSON.stringify(plan));
      buildWeek();
    }
  }

  // TOGGLE DONE
  if (e.target.classList.contains('plan-drill-done-btn')) {
    const item = e.target.closest('.plan-drill');
    if (!item) return;
    const day   = item.dataset.day;
    const index = parseInt(item.dataset.index, 10);

    const weekKey = getWeekKey();
    const plan = JSON.parse(localStorage.getItem(weekKey) || '{}');
    if (!plan[day] || plan[day][index] === undefined) return;

    const raw   = plan[day][index];
    const drill = (typeof raw === 'string') ? { name: raw, done: false } : raw;
    drill.done  = !drill.done;
    plan[day][index] = drill;

    localStorage.setItem(weekKey, JSON.stringify(plan));
    buildWeek();
  }

  // PROGRAM MODAL: per-week "Add this week" buttons
  const weekBtn = e.target.closest('[data-program-week]');
  if (weekBtn) {
    const programKey = weekBtn.getAttribute('data-program-key');
    const weekIndex  = parseInt(weekBtn.getAttribute('data-program-week'), 10);
    loadProgramWeek(programKey, weekIndex);

    const modalEl = document.getElementById('planModal');
    if (modalEl) {
      const inst = bootstrap.Modal.getInstance(modalEl);
      inst && inst.hide();
    }
  }
});

// ---------- Drag & Drop ----------
let draggedDrill = null;

document.addEventListener('dragstart', (e) => {
  const item = e.target.closest('.plan-drill');
  if (!item) return;
  draggedDrill = item;
  if(e.dataTransfer){
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }
  item.classList.add('dragging');
});

document.addEventListener('dragend', () => {
  if (draggedDrill) {
    draggedDrill.classList.remove('dragging');
    draggedDrill = null;
  }
});

document.addEventListener('dragover', (e) => {
  const col = e.target.closest('.day-column');
  if (col) {
    e.preventDefault();
    col.classList.add('drag-over');
  }
});

document.addEventListener('dragleave', (e) => {
  const col = e.target.closest('.day-column');
  if (col) {
    col.classList.remove('drag-over');
  }
});

document.addEventListener('drop', (e) => {
  const col = e.target.closest('.day-column');
  if (!col || !draggedDrill) return;

  e.preventDefault();
  col.classList.remove('drag-over');

  const fromDay   = draggedDrill.dataset.day;
  const fromIndex = parseInt(draggedDrill.dataset.index, 10);
  const toDay     = col.dataset.day;

  const weekKey = getWeekKey();
  const plan = JSON.parse(localStorage.getItem(weekKey) || '{}');
  if (!plan[fromDay]) return;

  const fromArr = plan[fromDay];
  const [moved] = fromArr.splice(fromIndex, 1);

  plan[toDay] = plan[toDay] || [];

  const targetDrill = e.target.closest('.plan-drill');
  if (targetDrill && targetDrill.dataset.day === toDay) {
    const targetIndex = parseInt(targetDrill.dataset.index, 10);
    plan[toDay].splice(targetIndex, 0, moved);
  } else {
    plan[toDay].push(moved);
  }

  localStorage.setItem(weekKey, JSON.stringify(plan));
  buildWeek();
});

// =======================================================
// PROGRAM SELECTION BANNER (calendar)
// =======================================================
function getSelectedProgramKey(){
  return localStorage.getItem('selectedProgram') || '';
}

function showProgramBanner(){
  const key    = getSelectedProgramKey();
  const banner = document.getElementById('program-banner');
  const nameBox= document.getElementById('sel-prog-name');
  if(!banner || !nameBox) return;

  if(key && PROGRAM_WEEK_PLANS[key] && PROGRAM_WEEK_PLANS[key].length){
    const label = key === 'vertical' ? 'Explosive Vertical'
                : key === 'speed'   ? 'Speed & Agility'
                : key === 'inseason'? 'In-Season Maintenance'
                : key;
    nameBox.textContent = label;
    banner.classList.remove('d-none');
  } else {
    banner.classList.add('d-none');
  }
}

function applyProgramToPlan(programKey){
  const blocks = PROGRAM_WEEK_PLANS[programKey];
  if(!blocks || !blocks.length){
    alert('Unknown program.');
    return;
  }

  const tmpl = blocks[0];
  const daysDef = tmpl.days || {};
  const newPlan = {};
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  days.forEach(d => {
    const arr = daysDef[d] || [];
    newPlan[d] = arr.map(n => ({ name:n, done:false }));
  });

  const weekKey = getWeekKey();
  localStorage.setItem(weekKey, JSON.stringify(newPlan));
  buildWeek();

  const myTabBtn = document.getElementById('myweek-tab');
  if(myTabBtn){
    const tab = new bootstrap.Tab(myTabBtn);
    tab.show();
  }
}

function applySelectedProgram(){
  const key = getSelectedProgramKey();
  if(!key){ alert('No program selected.'); return; }
  if(!PROGRAM_WEEK_PLANS[key] || !PROGRAM_WEEK_PLANS[key].length){
    alert('Program template not found.');
    return;
  }
  if(confirm('This will overwrite your current My Week plan for THIS week. Continue?')){
    applyProgramToPlan(key);
  }
}

function clearSelectedProgram(){
  localStorage.removeItem('selectedProgram');
  showProgramBanner();
}

// Preplan the *whole* program starting from the current week
function preplanFullProgram(){
  const key = getSelectedProgramKey();
  if(!key){
    alert('No program selected.');
    return;
  }
  const blocks = PROGRAM_WEEK_PLANS[key];
  if(!blocks || !blocks.length){
    alert('No detailed plan found for this program yet.');
    return;
  }

  const startWeek = getCurrentWeek();

  if(!confirm(`This will overwrite weeks starting from Week ${startWeek + 1} for the selected program.\nContinue?`)){
    return;
  }

  const allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let weekIndex = startWeek;

  blocks.forEach(block => {
    const repeats = block.repeatWeeks || 1;
    for(let r = 0; r < repeats; r++){
      const weekKey = 'plan_week_' + weekIndex;
      const newPlan = {};

      allDays.forEach(d => {
        const arr = (block.days && block.days[d]) ? block.days[d] : [];
        newPlan[d] = arr.map(n => ({ name: n, done: false }));
      });

      localStorage.setItem(weekKey, JSON.stringify(newPlan));
      weekIndex++;
    }
  });

  setCurrentWeek(startWeek);
  buildWeek();
  showProgramBanner();

  const myTabBtn = document.getElementById('myweek-tab');
  if(myTabBtn){
    const tab = new bootstrap.Tab(myTabBtn);
    tab.show();
  }
}

const PROGRAMS = {
  vertical: [
    'Weeks 1–2: Foundations – strength, low-impact plyos, ankle/hip mobility.',
    'Weeks 3–4: Power – higher-intensity jumps + strength.',
    'Weeks 5–6: Elasticity – more approach jumps, isometrics, speed.',
    'Weeks 7–8: Peak & Taper – low volume, high intent.'
  ],
  speed: [
    'Weeks 1–2: Acceleration & mechanics.',
    'Weeks 3–4: COD & deceleration.',
    'Weeks 5–6: Speed endurance & testing.'
  ],
  inseason: [
    'Weeks 1–4: 2×/week strength maintenance + mobility + prehab.'
  ]
};

// =======================================================
// WEEK-BY-WEEK PROGRAM PLANS
// =======================================================
const PROGRAM_WEEK_PLANS = {
  vertical: [
    {
      label: "Weeks 1–2 – Foundations",
      repeatWeeks: 2,
      desc: "Build base strength, simple jumps and joint mobility.",
      days: {
        Mon: ["Squats", "Hip Thrusts", "Pogo Hops", "Couch Stretch"],
        Tue: ["RDL", "Hamstring Curls", "Banded Ankle Dorsiflexion", "90/90 Hip Switches"],
        Thu: ["Approach Jumps", "Seated Jumps", "Calf Raises", "World’s Greatest Stretch"],
        Sat: ["Dead Bug (Core)", "Side Plank (Core)", "Banded Monster Walks", "Couch Stretch"],
        Wed: [], Fri: [], Sun: []
      }
    },
    {
      label: "Weeks 3–4 – Power Phase",
      repeatWeeks: 2,
      desc: "More explosive jumps + posterior chain strength.",
      days: {
        Mon: ["Squats", "Power Cleans", "Pogo Hops", "Banded Monster Walks"],
        Tue: ["Hip Thrusts", "Hamstring Curls", "Couch Stretch"],
        Thu: ["Approach Jumps", "Depth Jumps", "Calf Raises"],
        Sat: ["Midrange Spot Shooting", "Free Throws", "World’s Greatest Stretch"],
        Wed: [], Fri: [], Sun: []
      }
    },
    {
      label: "Weeks 5–6 – Elasticity & Speed",
      repeatWeeks: 2,
      desc: "Faster contacts, added sprints, controlled volume.",
      days: {
        Mon: ["Depth Jumps", "Approach Jumps", "Pogo Hops"],
        Tue: ["Resisted Acceleration (Band)", "Lateral Shuffle to Sprint", "Banded Monster Walks"],
        Thu: ["Split Squats", "Split Squat Iso", "90/90 Hip Switches"],
        Sat: ["3PT Spot Shooting", "Free Throws", "Couch Stretch"],
        Wed: [], Fri: [], Sun: []
      }
    },
    {
      label: "Weeks 7–8 – Peak & Taper",
      repeatWeeks: 2,
      desc: "Low volume, high intent. Keep jumps sharp, stay fresh.",
      days: {
        Mon: ["Approach Jumps", "Dunk Attempts", "Pogo Hops"],
        Tue: ["Spanish Squat Holds", "Wall Leans", "Banded Ankle Dorsiflexion"],
        Thu: ["Light Shooting", "Free Throws", "World’s Greatest Stretch"],
        Sat: ["Dead Bug (Core)", "Side Plank (Core)", "Couch Stretch"],
        Wed: [], Fri: [], Sun: []
      }
    }
  ],
  speed: [
    {
      label: "Weeks 1–2 – Acceleration",
      repeatWeeks: 2,
      desc: "Short sprints, first-step power, basic COD.",
      days: {
        Mon: ["Resisted Acceleration (Band)", "Crossover Step Starts", "Ladder Quick Feet"],
        Tue: ["90/90 Hip Switches", "Hip Flexor Stretch w/ Band"],
        Thu: ["Lateral Shuffle to Sprint", "Pro Agility (5-10-5)"],
        Sat: ["Closeout to Slide", "Couch Stretch"],
        Wed: [], Fri: [], Sun: []
      }
    },
    {
      label: "Weeks 3–4 – COD & Decel",
      repeatWeeks: 2,
      desc: "Braking, direction changes, maintaining posture.",
      days: {
        Mon: ["Pro Agility (5-10-5)", "T-Drill", "W-Drill Cones"],
        Tue: ["Banded Lateral Walk-Run", "Banded Monster Walks"],
        Thu: ["Lateral Shuffle to Sprint", "Closeout to Slide"],
        Sat: ["Dead Bug (Core)", "Side Plank (Core)"],
        Wed: [], Fri: [], Sun: []
      }
    },
    {
      label: "Weeks 5–6 – Speed Endurance & Test",
      repeatWeeks: 2,
      desc: "Sustain speed, sharpen reactions, test progress.",
      days: {
        Mon: ["Resisted Acceleration (Band)", "Lateral Shuffle to Sprint"],
        Tue: ["T-Drill", "Pro Agility (5-10-5)"],
        Thu: ["Shuttle Runs", "Closeout to Slide"],
        Sat: ["Light Shooting", "Couch Stretch"],
        Wed: [], Fri: [], Sun: []
      }
    }
  ],
  inseason: [
    {
      label: "Weeks 1–4 – In-Season Maintenance",
      repeatWeeks: 4,
      desc: "2x/week: keep strength & joints healthy without killing legs.",
      days: {
        Mon: ["Squats", "Hip Thrusts", "Dead Bug (Core)", "Couch Stretch"],
        Thu: ["Split Squats", "Spanish Squat Holds", "Banded Ankle Dorsiflexion", "90/90 Hip Switches"],
        Tue: [], Wed: [], Fri: [], Sat: [], Sun: []
      }
    }
  ]
};

function loadProgramWeek(programKey, weekIndex){
  const weeks = PROGRAM_WEEK_PLANS[programKey];
  if(!weeks || !weeks[weekIndex]){
    alert('Week not found for this program.');
    return;
  }
  const weekDef = weeks[weekIndex];
  const newPlan = {};
  const allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  allDays.forEach(d=>{
    const arr = (weekDef.days && weekDef.days[d]) ? weekDef.days[d] : [];
    newPlan[d] = arr.map(n => ({ name:n, done:false }));
  });

  const weekKey = getWeekKey();
  localStorage.setItem(weekKey, JSON.stringify(newPlan));
  buildWeek();

  const myTabBtn = document.getElementById('myweek-tab');
  if(myTabBtn){
    const tab = new bootstrap.Tab(myTabBtn);
    tab.show();
  }
}

// =======================================================
// PROGRAM MODAL (Programs page)
// =======================================================
document.addEventListener('show.bs.modal', (e)=>{
  if(e.target.id !== 'planModal') return;

  const btn = document.activeElement;
  const key = btn?.getAttribute('data-program') || 'vertical';
  const weeks = PROGRAM_WEEK_PLANS[key] || [];
  const box = document.getElementById('program-details');
  if(!box) return;

  if(!weeks.length){
    box.innerHTML = '<p class="text-muted small mb-0">No week plan defined yet.</p>';
    return;
  }

  box.innerHTML = weeks.map((w, idx) => {
    const daysSummary = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      .map(d=>{
        const drills = w.days[d] || [];
        if(!drills.length) return '';
        return `<div><strong>${d}:</strong> ${drills.join(', ')}</div>`;
      })
      .filter(Boolean)
      .join('');

    return `
      <div class="program-week-block mb-3 p-3 rounded-3 border border-light-subtle">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h6 class="mb-1">${w.label}</h6>
            <p class="small mb-2">${w.desc}</p>
            <div class="small text-muted">
              ${daysSummary}
            </div>
          </div>
          <button type="button"
            class="btn btn-sm btn-primary"
            data-program-key="${key}"
            data-program-week="${idx}">
            Add this week to current planner week
          </button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('choose-program')?.addEventListener('click', () => {
    localStorage.setItem('selectedProgram', key);
  }, { once: true });
});

// =======================================================
// NUTRITION CALCULATORS
// =======================================================
function paceToMET(kmh){
  const map = [
    {v:8,   m:8.3},
    {v:9.7, m:9.8},
    {v:10.8,m:10.5},
    {v:12.1,m:11.8},
    {v:13.0,m:12.8},
    {v:14.5,m:14.5},
    {v:16.1,m:16.0}
  ];
  let best = map[0];
  for(const p of map){
    if(Math.abs(p.v-kmh) < Math.abs(best.v-kmh)) best = p;
  }
  return best.m;
}

// === DAILY CALORIE INTAKE (Maintain / Bulk / Cut) ===
function calcDailyCalories() {
  const h = parseFloat(document.getElementById('n-hcm')?.value);
  const w = parseFloat(document.getElementById('n-kg')?.value);
  const activity = parseFloat(document.getElementById('n-activity')?.value || '1.5');

  if (!(h > 0 && w > 0)) {
    alert('Please enter your height and weight.');
    return;
  }

  const age = 20;
  const bmr = 10 * w + 6.25 * h - 5 * age + 5;
  const maintain = Math.round(bmr * activity);

  const bulk = maintain + 250;
  const cut = maintain - 300;

  const out = document.getElementById('daily-kcal-out');
  if (out) {
    out.innerHTML = `
      <strong>📊 Daily Calorie Targets</strong><br>
      <ul class="mt-2 mb-1">
        <li><strong>Maintain weight:</strong> ~${maintain} kcal/day</li>
        <li><strong>Lean bulk (gain):</strong> ~${bulk} kcal/day</li>
        <li><strong>Cut (lose fat):</strong> ~${cut} kcal/day</li>
      </ul>
    `;
    out.classList.remove('d-none');
  }

  const calInput = document.getElementById('cal');
  if (calInput) {
    calInput.value = maintain;
  }
}

function splitMacros(){
  const cal = parseFloat(document.getElementById('cal')?.value);
  if(!(cal>=1200)) return;
  const p = Math.round((cal*0.30)/4);
  const c = Math.round((cal*0.50)/4);
  const f = Math.round((cal*0.20)/9);
  const out = document.getElementById('macro-out');
  if(!out) return;
  out.textContent = `≈ Protein ${p} g • Carbs ${c} g • Fat ${f} g`;
  out.classList.remove('d-none');
}

// =======================================================
// PROGRESS (BMI + metrics)
// =======================================================
function calcBMI(){
  const h = parseFloat(document.getElementById('hcm')?.value)/100;
  const w = parseFloat(document.getElementById('kg')?.value);
  if(!(h>0 && w>0)) return;
  const bmi = w/(h*h);
  const out = document.getElementById('bmi-out');
  if(!out) return;
  out.textContent = `BMI: ${bmi.toFixed(1)}`;
  out.classList.remove('d-none');
}

function addMetric(key){
  const id  = key==='vertical' ? 'vj' : 'sprint';
  const inp = document.getElementById(id);
  if(!inp) return;
  const val = parseFloat(inp.value);
  if(!val) return;

  const store = JSON.parse(localStorage.getItem('metrics') || '{}');
  store[key] = store[key] || [];
  store[key].push({val, ts: Date.now()});
  localStorage.setItem('metrics', JSON.stringify(store));
  renderMetrics();
  inp.value = '';
}

function renderMetrics(){
  const store = JSON.parse(localStorage.getItem('metrics') || '{}');
  const vl = document.getElementById('vertical-list');
  const sl = document.getElementById('sprint-list');
  if(vl){
    vl.innerHTML = (store.vertical||[]).map(x=>`
      <li class="list-group-item d-flex justify-content-between">
        <span>${x.val}</span>
        <span class="text-muted small">${new Date(x.ts).toLocaleDateString()}</span>
      </li>
    `).join('');
  }
  if(sl){
    sl.innerHTML = (store.sprint||[]).map(x=>`
      <li class="list-group-item d-flex justify-content-between">
        <span>${x.val}</span>
        <span class="text-muted small">${new Date(x.ts).toLocaleDateString()}</span>
      </li>
    `).join('');
  }
}

// =======================================================
// DRILL CATALOG (Workouts page)
// =======================================================
const DRILLS = [
  // --- Strength ---
  {name:"Squats", img:"Workouts/squat.jpeg" , cat:"strength", diff:"int", desc:"Back or front squats for max strength and power."},
  {name:"Hip Thrusts", img:"Workouts/hipthrust.webp", cat:"strength", diff:"int", desc:"Glute-dominant hip extension strength."},
  {name:"RDL", img:"Workouts/RDL.jpg", cat:"strength", diff:"int", desc:"Romanian deadlifts for posterior chain."},
  {name:"Hamstring Curls", img:"Workouts/HamstringCurls.webp", cat:"strength", diff:"beg", desc:"Hamstring isolation with machine or bands."},
  {name:"Split Squats", img:"Workouts/SplitSquats.webp", cat:"strength", diff:"int", desc:"Unilateral strength and stability."},
  {name:"Calf Raises", img:"Workouts/CalfRaises.webp", cat:"strength", diff:"beg", desc:"Gastrocnemius/soleus strengthening."},
  {name:"Power Cleans", img:"Workouts/PowerCleans.webp", cat:"strength", diff:"adv", desc:"Explosive triple extension (technique!)."},
  {name:"Deadlift", img:"Workouts/Deadlift.webp", cat:"strength", diff:"adv", desc:"Max strength hinge pattern."},

  // --- Plyometrics ---
  {name:"Approach Jumps", img:"Workouts/ApproachJump.gif", cat:"plyo", diff:"int", desc:"2–3 step approach, jump and stick landing."},
  {name:"Dunk Attempts", img:"Workouts/DunkAttempts.jpeg", cat:"plyo", diff:"adv", desc:"Approach maximal attempts (rim height as possible)."},
  {name:"Depth Jumps", img:"Workouts/DepthJumps.jpg", cat:"plyo", diff:"adv", desc:"Step off low box, quick ground contact, jump."},
  {name:"Seated Jumps", img:"Workouts/SeatedJumps.gif", cat:"plyo", diff:"beg", desc:"From seated position to jump—concentric focus."},
  {name:"Pogo Hops", img:"Workouts/PogoHops.gif", cat:"plyo", diff:"beg", desc:"Ankle stiffness / spring drills."},
  {name:"Sprints", img:"Workouts/Sprints.jpg", cat:"plyo", diff:"int", desc:"Short, maximal acceleration efforts."},

  // --- Isometrics ---
  {name:"Spanish Squat Holds", img:"Workouts/SpanishSquatHolds.jpeg", cat:"iso", diff:"int", desc:"Band behind knees, upright torso quad iso."},
  {name:"Single-Leg Leg Extension Iso", img:"Workouts/Single-LegLegExtensionIso.jpg", cat:"iso", diff:"int", desc:"Hold end-range with machine or band."},
  {name:"Single-Leg Wall Sits", img:"Workouts/Single-LegWallSits.jpg", cat:"iso", diff:"adv", desc:"Unilateral isometric squat against wall."},
  {name:"Wall Leans", img:"Workouts/WallLeans.jpg", cat:"iso", diff:"beg", desc:"Tibialis/ankle isometrics with forward lean."},
  {name:"Split Squat Iso", img:"Workouts/SplitSquatIso.jpg", cat:"iso", diff:"int", desc:"Hold bottom position 20–40 s each leg."},

  // --- Ball-handling ---
  {name:"Pound Dribbles (R/L)", img:"Workouts/PoundDribbles.gif", cat:"ball", diff:"beg", desc:"Hard stationary pounds at hip height."},
  {name:"Low Pounds (R/L)", img:"Workouts/LowPounds.gif", cat:"ball", diff:"beg", desc:"Below-knee quick dribbles."},
  {name:"In-Out Dribbles", img:"Workouts/In-Out.gif", cat:"ball", diff:"beg", desc:"In-out pattern, control and rhythm."},
  {name:"Crossovers (Stationary)", img:"Workouts/Crossovers.gif", cat:"ball", diff:"beg", desc:"Tight crossovers in place."},
  {name:"Between-the-Legs (Stationary)", img:"Workouts/Between-the-Legs.gif", cat:"ball", diff:"int", desc:"Continuous between-the-legs."},
  {name:"Behind-the-Back (Stationary)", img:"Workouts/Behind-the-Back.gif", cat:"ball", diff:"int", desc:"Smooth behind-the-back cycle."},
  {name:"Figure-8 Dribbles", img:"Workouts/Figure-8.gif", cat:"ball", diff:"beg", desc:"Around and through legs pattern."},
  {name:"Two-Ball Pound", img:"Workouts/Two-BallPound.gif", cat:"ball", diff:"int", desc:"Both hands pound together."},
  {name:"Two-Ball Alternating", img:"Workouts/Two-BallAlternating.gif", cat:"ball", diff:"int", desc:"Alternate timing between hands."},
  {name:"Wraps Around Waist/Ankles", img:"Workouts/WrapAround.gif", cat:"ball", diff:"beg", desc:"Wraps without looking down."},

  // --- Shooting ---
  {name:"Midrange Spot Shooting", img:"Workouts/MidrangeSpotShooting.png", cat:"shooting", diff:"beg", desc:"5 spots, 5 makes each."},
  {name:"Midrange Off-the-Dribble (R/L)", img:"Workouts/MidrangeOff-the-Dribble(RL).png", cat:"shooting", diff:"int", desc:"One-bounce pull-ups."},
  {name:"Midrange Elbow Series", img:"Workouts/MidrangeElbowSeries.png", cat:"shooting", diff:"beg", desc:"Elbow catch & shoot routine."},
  {name:"Midrange Curl-to-Shot", img:"Workouts/MidrangeCurl-to-Shot.png", cat:"shooting", diff:"int", desc:"Curl around cone into shot."},
  {name:"Midrange Bank Shots", img:"Workouts/MidrangeBankShots.png", cat:"shooting", diff:"beg", desc:"Glass from wings/blocks."},

  {name:"3PT Spot Shooting", img:"Workouts/3PTSpotShooting.png", cat:"shooting", diff:"int", desc:"5 spots, 5 makes each."},
  {name:"3PT Off-the-Dribble", img:"Workouts/3PTOff-the-Dribble.png", cat:"shooting", diff:"adv", desc:"Pull-ups behind arc."},
  {name:"3PT Corner-to-Corner", img:"Workouts/3PTCorner-to-Corner.png", cat:"shooting", diff:"int", desc:"Sprint baseline corners."},
  {name:"3PT Relocation Threes", img:"Workouts/3PTRelocationThrees.png", cat:"shooting", diff:"adv", desc:"Kick-out relocate & shoot."},
  {name:"3PT Catch-and-Shoot", img:"Workouts/3PTCatch-and-Shoot.png", cat:"shooting", diff:"beg", desc:"Stationary catch & fire."},
  {name:"Free Throws", img:"Workouts/FreeThrows.png", cat:"shooting", diff:"beg", desc:"Routine + pressure sets."},

  // --- Mobility ---
  {name:"90/90 Hip Switches", img:"Workouts/HipSwitches.gif", cat:"mobility", diff:"beg", desc:"Internal/external rotation control."},
  {name:"Hip Flexor Stretch w/ Band", img:"Workouts/HipFlexorStretch.png", cat:"mobility", diff:"beg", desc:"Posterior pelvic tilt focus."},
  {name:"Couch Stretch", img:"Workouts/CouchStretch.webp", cat:"mobility", diff:"beg", desc:"Quad/hip flexor opening."},
  {name:"Adductor Rock-Backs", img:"Workouts/AdductorRock-Backs.png", cat:"mobility", diff:"beg", desc:"Groin lengthening w/ spine neutral."},
  {name:"Banded Ankle Dorsiflexion", img:"Workouts/BandedAnkleDorsiflexion.png", cat:"mobility", diff:"beg", desc:"Anterior tib glide w/ band."},
  {name:"World’s Greatest Stretch", img:"Workouts/WorldsGreatestStretch.png", cat:"mobility", diff:"int", desc:"Full chain mobility flow."},
  {name:"Dead Bug (Core)", img:"Workouts/DeadBug.gif", cat:"mobility", diff:"beg", desc:"Anterior core control."},
  {name:"Side Plank (Core)", img:"Workouts/SidePlank.jpg", cat:"mobility", diff:"int", desc:"Lateral core stability."},
  {name:"Glute Bridge March", img:"Workouts/GluteBridgeMarch.webp", cat:"mobility", diff:"beg", desc:"Hip extension + stability."},
  {name:"Banded Monster Walks", img:"Workouts/BandedMonsterWalks.gif", cat:"mobility", diff:"int", desc:"Glute med activation (bands)."},

  // --- Speed & Agility ---
  {name:"Resisted Acceleration (Band)", img:"Workouts/ResistedAcceleration.png", cat:"speed", diff:"int", desc:"Partner/band resisted starts."},
  {name:"Overspeed Assisted Runs (Band)", img:"Workouts/OverspeedAssistedRuns.jpg", cat:"speed", diff:"adv", desc:"Careful technique emphasis."},
  {name:"Lateral Shuffle to Sprint", img:"Workouts/LateralShuffletoSprint.gif", cat:"speed", diff:"int", desc:"COD into sprint."},
  {name:"Pro Agility (5-10-5)", img:"Workouts/ProAgility.png", cat:"speed", diff:"int", desc:"Classic change-of-direction test."},
  {name:"T-Drill", img:"Workouts/T-Drill.jpg", cat:"speed", diff:"int", desc:"Multi-direction agility."},
  {name:"W-Drill Cones", img:"Workouts/W-DrillCones.png", cat:"speed", diff:"beg", desc:"Angle cuts with posture control."},
  {name:"Crossover Step Starts", img:"Workouts/CrossoverStepStarts.webp", cat:"speed", diff:"beg", desc:"Explosive first step."},
  {name:"Ladder Quick Feet", img:"Workouts/LadderQuickFeet.jpg", cat:"speed", diff:"beg", desc:"Rhythm and foot speed."},
  {name:"Banded Lateral Walk-Run", img:"Workouts/BandedLateralWalk-Run.png", cat:"speed", diff:"int", desc:"Hip-resisted lateral power."},
  {name:"Closeout to Slide", img:"Workouts/CloseoutToSlide.png", cat:"speed", diff:"int", desc:"Basketball-specific closeout + slide."},
];

const DIFF_LABEL = {beg:"Easy", int:"Intermediate", adv:"Hard"};

function renderDrills(){
  const grid = document.getElementById('drill-grid');
  if(!grid) return; // not on workouts page

  grid.innerHTML = DRILLS.map(d => `
    <div class="col">
      <div class="card h-100 drill-card" data-name="${d.name}" data-cat="${d.cat}" data-diff="${d.diff}">
        <img src="assets/img/${d.img || 'placeholder.jpg'}" class="card-img-top" alt="${d.name}">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="card-title me-2">${d.name}</h5>
            <span class="badge ${d.diff==='beg' ? 'bg-success' : d.diff==='int' ? 'bg-warning text-dark' : 'bg-danger'}">
              ${DIFF_LABEL[d.diff] || d.diff}
            </span>
          </div>
          <p class="card-text small flex-grow-1">${d.desc || ""}</p>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" onclick="openDrill('${d.name}')">View</button>
            <button class="btn btn-primary btn-sm" onclick="addToPlan('${d.name}')">Add to Plan</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  filterDrills();
}

// ===================== POPUP QUIZ (Global) =====================
function initQuiz(){
  const quizModal = document.getElementById('quizModal');
  if (!quizModal) return; // page doesn't have the modal

  const steps      = quizModal.querySelectorAll('.quiz-step');
  const nextBtn    = quizModal.querySelector('[data-quiz="next"]');
  const backBtn    = quizModal.querySelector('[data-quiz="back"]');
  const restartBtn = quizModal.querySelector('[data-quiz="restart"]');
  const summaryBody= quizModal.querySelector('#quiz-summary-body');
  const programText= quizModal.querySelector('#quiz-program-text');
  const programLink= quizModal.querySelector('#quiz-program-link');

  let currentStep = 1;
  const maxStep   = steps.length;

  function showStep(n){
    currentStep = Math.min(Math.max(n, 1), maxStep);
    steps.forEach(step => {
      const s = parseInt(step.getAttribute('data-step'), 10);
      step.classList.toggle('active', s === currentStep);
    });

    backBtn.disabled = (currentStep === 1);
    restartBtn.classList.toggle('d-none', currentStep !== maxStep);

    if (currentStep === maxStep) {
      nextBtn.textContent = 'Close';
    } else {
      nextBtn.textContent = 'Next';
    }
  }

  function getAnswers(){
    const answers = [];
    const qBlocks = quizModal.querySelectorAll('.quiz-question');

    qBlocks.forEach(block => {
      const qid   = block.getAttribute('data-qid');
      const qtext = block.getAttribute('data-qtext');
      const input = block.querySelector('input[type="radio"]:checked');

      if (input) {
        const value = input.value;
        const label = input.getAttribute('data-label') ||
                      quizModal.querySelector(`label[for="${input.id}"]`)?.textContent ||
                      value;
        answers.push({ id: qid, question: qtext, value, label });
      }
    });

    return answers;
  }

  function validateStep(stepNum){
    const stepEl = quizModal.querySelector(`.quiz-step[data-step="${stepNum}"]`);
    if (!stepEl) return true;

    const qBlock = stepEl.querySelector('.quiz-question');
    if (!qBlock) return true;

    const checked = qBlock.querySelector('input[type="radio"]:checked');
    if (!checked) {
      alert('Please choose an answer to continue.');
      return false;
    }
    return true;
  }

  function computeRecommendation(answers){
    let programKey = 'vertical';
    const goalAns = answers.find(a => a.id === 'goal');
    const timeAns = answers.find(a => a.id === 'time');

    if (goalAns) {
      if (goalAns.value === 'speed')   programKey = 'speed';
      if (goalAns.value === 'inseason')programKey = 'inseason';
      if (goalAns.value === 'vertical')programKey = 'vertical';
    }

    if (programKey === 'vertical' && timeAns && timeAns.value === '2') {
      programKey = 'inseason';
    }

    let label = '';
    if (programKey === 'vertical')  label = 'Explosive Vertical Program';
    if (programKey === 'speed')     label = 'Speed & Agility Program';
    if (programKey === 'inseason')  label = 'In-Season Maintenance Program';

    const href = 'programs.html';

    return { programKey, label, href };
  }

  function fillSummary(){
    const answers = getAnswers();
    if (summaryBody) {
      summaryBody.innerHTML = answers.map(a => `
        <tr>
          <td>${a.question}</td>
          <td>${a.label}</td>
        </tr>
      `).join('');
    }

    const rec = computeRecommendation(answers);
    if (programText) programText.textContent = rec.label || '';
    if (programLink && rec.href) {
      programLink.setAttribute('href', rec.href);
    }
  }

  nextBtn.addEventListener('click', () => {
    if (currentStep < maxStep) {
      if (!validateStep(currentStep)) return;
      const next = currentStep + 1;
      if (next === maxStep) {
        fillSummary();
      }
      showStep(next);
    } else {
      const modalInstance = bootstrap.Modal.getInstance(quizModal);
      modalInstance && modalInstance.hide();
    }
  });

  backBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  });

  restartBtn.addEventListener('click', () => {
    quizModal.querySelectorAll('.quiz-question input[type="radio"]').forEach(inp => {
      inp.checked = false;
    });
    showStep(1);
  });

  quizModal.addEventListener('show.bs.modal', () => {
    quizModal.querySelectorAll('.quiz-question input[type="radio"]').forEach(inp => {
      inp.checked = false;
    });
    if (summaryBody) summaryBody.innerHTML = '';
    if (programText) programText.textContent = '';
    showStep(1);
  });
}

// =======================================================
// PROTEIN CARD HOVER (Nutrition page)
// =======================================================
function initProteinHover(){
  const img = document.querySelector('.protein-img');
  if (!img) return; // not on nutrition page

  const baseSrc  = img.getAttribute('src');
  const hoverSrc = img.getAttribute('data-hover');
  if (!hoverSrc) return;

  img.addEventListener('mouseenter', () => {
    img.src = hoverSrc;
  });

  img.addEventListener('mouseleave', () => {
    img.src = baseSrc;
  });
}

// ===================== DOM READY =====================
document.addEventListener('DOMContentLoaded', () => {
  renderDrills();
  buildWeek();
  renderMetrics();
  showProgramBanner();
  initResourceViewer();
  initQuiz();
  initProteinHover();

  const clearBtn = document.getElementById('btn-clear-program');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearSelectedProgram();
    });
  }
});
