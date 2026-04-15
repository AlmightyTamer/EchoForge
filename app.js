/* ═══════════════════════════════════════════════════════════
   EchoForge Lite — app.js
   All logic: scroll reveals, counter animations, Groq AI,
   project dashboard, community feed, filters, export
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── Config ────────────────────────────────────────────────────
const GROQ_API_KEY = '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';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL        = 'llama-3.1-8b-instant';

// ── State ─────────────────────────────────────────────────────
let state = {
  myProjects: [],
  likedProjects: new Set(),
  lastForge: null,
  selectedTone: 'Bold & Ambitious',
};

// Seed community projects
const COMMUNITY_SEED = [
  {
    id: 'c1',
    name: 'Lunch Heroes Initiative',
    issue: 'School Lunch Waste in Massachusetts',
    creator: 'Aisha & Team GreenMA',
    grade: '11th',
    createdAt: 'Apr 01, 2026',
    summary: 'A student-led composting and food-sharing program that redirected 30% of wasted lunches to community food banks.',
    steps: ['Survey 5 local schools about waste volume','Partner with 2 food banks for weekly pickups','Train 50 student volunteers','Launch school-wide composting bins','Present data to school board'],
    estimatedImpact: 'Diverts 1,200 lbs of food waste monthly',
    timeline: '6 weeks',
    progress: 65, likes: 42, peopleReached: 500, actionsTaken: 87,
    img: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&q=75&fit=crop',
  },
  {
    id: 'c2',
    name: 'MindBridge Peer Support',
    issue: 'Teen Mental Health Crisis',
    creator: 'Marcus & Wellness Warriors',
    grade: '12th',
    createdAt: 'Mar 28, 2026',
    summary: 'Trained peer-support pairing struggling students with empathy-trained upperclassmen, cutting counselor wait times by 40%.',
    steps: ['Recruit 20 peer supporters','Create anonymous sign-up system','Launch weekly check-in meetups','Develop resource booklet','Measure impact with surveys'],
    estimatedImpact: 'Supports 200+ students per semester',
    timeline: '8 weeks',
    progress: 80, likes: 89, peopleReached: 310, actionsTaken: 145,
    img: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=600&q=75&fit=crop',
  },
  {
    id: 'c3',
    name: 'WiFi Wagon',
    issue: 'Digital Divide in Rural Schools',
    creator: 'Sofia & ConnectED Crew',
    grade: '10th',
    createdAt: 'Mar 20, 2026',
    summary: 'A mobile hotspot lending library run from the local public library, giving rural students reliable internet for homework.',
    steps: ['Apply for e-Rate federal funding','Partner with local library','Procure 30 hotspot devices','Run 2-week pilot','Publish impact report'],
    estimatedImpact: '30 students gain reliable internet immediately',
    timeline: '5 weeks',
    progress: 50, likes: 61, peopleReached: 120, actionsTaken: 34,
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75&fit=crop',
  },
  {
    id: 'c4',
    name: 'Girls Who Code: Local Chapter',
    issue: 'Lack of STEM Role Models for Girls',
    creator: 'Priya & STEM Sisters',
    grade: '11th',
    createdAt: 'Apr 05, 2026',
    summary: 'A weekend coding club bringing local women engineers as mentors for middle school girls, building skills and confidence.',
    steps: ['Recruit 5 women engineers as mentors','Host 4-week Saturday bootcamp','Build apps for real local problems','Demo day at science fair','Expand to 3 more schools'],
    estimatedImpact: 'Inspires 60+ girls toward STEM careers',
    timeline: '4 weeks',
    progress: 35, likes: 77, peopleReached: 85, actionsTaken: 28,
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=75&fit=crop',
  },
  {
    id: 'c5',
    name: 'Green Canopy Boston',
    issue: 'Urban Heat Islands in Boston',
    creator: 'Jordan & EcoBoston',
    grade: '12th',
    createdAt: 'Mar 15, 2026',
    summary: 'Partnered with city parks dept to plant 200 trees in Roxbury and Dorchester — neighborhoods hardest hit by urban heat.',
    steps: ['Map the 10 hottest blocks','Partner with Boston Parks Dept','Raise $4,000 for native trees','Organize 5 community plant days','Track temperature drops over summer'],
    estimatedImpact: 'Could reduce temps by 3–5°F in target area',
    timeline: '10 weeks',
    progress: 45, likes: 103, peopleReached: 800, actionsTaken: 210,
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=75&fit=crop',
  },
  {
    id: 'c6',
    name: 'Attendance Ally',
    issue: 'Chronic Absenteeism Post-Pandemic',
    creator: 'Riley & Comeback Crew',
    grade: '10th',
    createdAt: 'Apr 08, 2026',
    summary: 'A buddy-system app (built in one weekend) that pairs frequently absent students with a caring classmate who checks in daily.',
    steps: ['Build simple web check-in form','Train 30 volunteer "Allies"','Launch 3-week pilot at 1 school','Collect attendance data','Present to principal'],
    estimatedImpact: 'Targets reduction of 200 chronic absences',
    timeline: '3 weeks',
    progress: 20, likes: 55, peopleReached: 180, actionsTaken: 42,
    img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=75&fit=crop',
  },
];

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initRevealObserver();
  initHeroImage();
  initCounterAnimations();
  initFilters();
  initTonePicker();
  renderCommunity();

  // Toast element
  const toast = document.createElement('div');
  toast.id = 'toast';
  document.body.appendChild(toast);
});

// ════════════════════════════════════════════════════════════
// SCROLL REVEAL
// ════════════════════════════════════════════════════════════
function initRevealObserver() {
  const obs = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// Observe dynamically-added elements
function observeNew(el) {
  const obs = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );
  el.querySelectorAll('.reveal').forEach(r => obs.observe(r));
}

// ════════════════════════════════════════════════════════════
// HERO PARALLAX + IMAGE LOAD
// ════════════════════════════════════════════════════════════
function initHeroImage() {
  const img = document.getElementById('heroImg');
  if (img) {
    img.onload = () => img.classList.add('loaded');
    if (img.complete) img.classList.add('loaded');
  }

  // Subtle parallax
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (img) img.style.transform = `scale(1) translateY(${y * 0.3}px)`;
  }, { passive: true });
}

// ════════════════════════════════════════════════════════════
// COUNTER ANIMATIONS
// ════════════════════════════════════════════════════════════
function initCounterAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.target);
        animateCounter(el, target);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-target]').forEach(el => obs.observe(el));
}

function animateCounter(el, target) {
  let start = 0;
  const duration = 1800;
  const startTime = performance.now();
  const update = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(eased * target);
    el.textContent = val.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(update);
}

// ════════════════════════════════════════════════════════════
// ISSUE FILTERS
// ════════════════════════════════════════════════════════════
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.issue-card').forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

// ════════════════════════════════════════════════════════════
// TONE PICKER
// ════════════════════════════════════════════════════════════
function initTonePicker() {
  document.querySelectorAll('.tone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedTone = btn.dataset.tone;
    });
  });
}

// ════════════════════════════════════════════════════════════
// NAVIGATION HELPERS
// ════════════════════════════════════════════════════════════
function scrollToForge() {
  document.getElementById('forge').scrollIntoView({ behavior: 'smooth' });
}

function prefillForge(issue) {
  const sel = document.getElementById('issueSelect');
  const custom = document.getElementById('customIssue');
  // Try to select from dropdown first
  let found = false;
  for (let opt of sel.options) {
    if (opt.value === issue) { sel.value = issue; found = true; break; }
  }
  if (!found) { custom.value = issue; }
  scrollToForge();
  setTimeout(() => document.getElementById('issueSelect').focus(), 600);
}

// ════════════════════════════════════════════════════════════
// GROQ AI INTEGRATION
// ════════════════════════════════════════════════════════════
async function forgeProject() {
  const selectVal  = document.getElementById('issueSelect').value;
  const customVal  = document.getElementById('customIssue').value.trim();
  const issue      = customVal || selectVal;
  const creator    = document.getElementById('creatorName').value.trim() || 'Student Changemaker';

  if (!issue) { showToast('⚠️ Please pick or describe an issue first!'); return; }

  const btn    = document.getElementById('forgeBtn');
  const btnTxt = document.getElementById('forgeBtnText');
  const spinner= document.getElementById('forgeSpinner');

  btn.disabled = true;
  btnTxt.style.display = 'none';
  spinner.style.display = 'block';

  // Hide placeholder, show loading state
  document.getElementById('forgePlaceholder').style.display = 'flex';
  document.getElementById('forgePlaceholder').querySelector('p').textContent = '⚡ AI is forging your plan…';
  document.getElementById('forgeResult').style.display = 'none';

  try {
    const plan = await callGroq(issue, creator, state.selectedTone);
    if (plan) {
      state.lastForge = { ...plan, issue, creator };
      renderForgeResult(state.lastForge);
    } else {
      const fallback = makeFallbackPlan(issue, creator);
      state.lastForge = fallback;
      renderForgeResult(fallback);
      showToast('🔌 AI offline — showing a curated plan instead');
    }
  } catch (err) {
    const fallback = makeFallbackPlan(issue, creator);
    state.lastForge = fallback;
    renderForgeResult(fallback);
    showToast('🔌 AI offline — showing a curated plan instead');
  } finally {
    btn.disabled = false;
    btnTxt.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

async function callGroq(issue, creator, tone) {
  const systemPrompt = `You are EchoForge AI — a creative assistant helping high school students turn social issues into real action plans.
Respond ONLY with valid JSON (no markdown, no backticks, no extra text) in exactly this format:
{
  "project_name": "A catchy 4-7 word project name",
  "summary": "2-3 sentence description of what this project does and why it matters",
  "steps": ["Step 1 (Week 1)", "Step 2 (Week 2)", "Step 3 (Week 3)", "Step 4 (Week 4)", "Step 5 (Week 5-6)"],
  "estimated_impact": "Specific quantified impact statement",
  "timeline": "X weeks"
}
Be specific, inspiring, and realistic for a high schooler. Use the specified tone.`;

  const userPrompt = `Issue: ${issue}\nCreator: ${creator}\nTone: ${tone}\n\nGenerate a complete action plan.`;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 700,
      temperature: 0.85,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;

  // Strip markdown fences if present
  const clean = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/,'').trim();
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function makeFallbackPlan(issue, creator) {
  return {
    project_name: `Project EchoForge: ${issue.split(' ').slice(0,4).join(' ')}`,
    issue, creator,
    summary: `A student-led initiative to address "${issue}" through community organizing, peer education, and local partnerships. Starting small, thinking big — this project creates visible, measurable change at the school level.`,
    steps: [
      'Research the issue locally and collect data from 10+ students (Week 1)',
      'Build a core team of 5–8 motivated classmates (Week 1–2)',
      'Reach out to 3 local orgs, teachers, or officials for support (Week 2–3)',
      'Launch a school awareness campaign — posters, social, morning announcements (Week 3–4)',
      'Present findings and your solution to the school board or community (Week 5–6)',
    ],
    estimated_impact: 'Could directly reach 300+ students and influence school-wide policy',
    timeline: '6 weeks',
  };
}

function renderForgeResult(plan) {
  document.getElementById('forgePlaceholder').style.display = 'none';
  const result = document.getElementById('forgeResult');
  result.style.display = 'block';

  document.getElementById('resultName').textContent = plan.project_name || 'My Impact Project';
  document.getElementById('resultIssueLabel').textContent = `Issue: ${plan.issue}`;
  document.getElementById('resultSummary').textContent = plan.summary || '';
  document.getElementById('resultImpact').textContent = plan.estimated_impact || '';
  document.getElementById('resultTimeline').textContent = plan.timeline || '';

  const list = document.getElementById('resultStepsList');
  list.innerHTML = '';
  (plan.steps || []).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    list.appendChild(li);
  });

  // Scroll result into view smoothly
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ════════════════════════════════════════════════════════════
// SAVE PROJECT
// ════════════════════════════════════════════════════════════
function saveProject() {
  if (!state.lastForge) { showToast('⚠️ Nothing to save yet — forge a project first!'); return; }

  const plan = state.lastForge;
  const exists = state.myProjects.some(p => p.project_name === plan.project_name && p.issue === plan.issue);
  if (exists) { showToast('📋 Already saved!'); return; }

  const proj = {
    id: `proj_${Date.now()}`,
    project_name: plan.project_name,
    issue: plan.issue,
    creator: plan.creator || 'You',
    summary: plan.summary,
    steps: plan.steps || [],
    estimated_impact: plan.estimated_impact,
    timeline: plan.timeline,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    progress: 5,
    peopleReached: 0,
    actionsTaken: 0,
    notes: '',
  };

  state.myProjects.unshift(proj);
  renderProjects();
  document.getElementById('saveModal').style.display = 'flex';
}

function closeSaveModal(e) {
  if (!e || e.target === document.getElementById('saveModal')) {
    document.getElementById('saveModal').style.display = 'none';
  }
}

// ════════════════════════════════════════════════════════════
// RENDER PROJECTS DASHBOARD
// ════════════════════════════════════════════════════════════
function renderProjects() {
  const projects = state.myProjects;
  const listEl   = document.getElementById('projectsList');
  const emptyEl  = document.getElementById('projectsEmpty');
  const statsEl  = document.getElementById('projectsStats');
  const exportEl = document.getElementById('exportWrap');

  if (projects.length === 0) {
    emptyEl.style.display = 'block';
    statsEl.style.display = 'none';
    exportEl.style.display = 'none';
    listEl.innerHTML = '';
    return;
  }

  emptyEl.style.display = 'none';
  statsEl.style.display = 'grid';
  exportEl.style.display = 'block';

  // Update stats
  const totalReached  = projects.reduce((a, p) => a + (p.peopleReached || 0), 0);
  const totalActions  = projects.reduce((a, p) => a + (p.actionsTaken || 0), 0);
  const avgProgress   = Math.round(projects.reduce((a, p) => a + (p.progress || 0), 0) / projects.length);
  document.getElementById('statProjects').textContent = projects.length;
  document.getElementById('statReached').textContent  = totalReached.toLocaleString();
  document.getElementById('statActions').textContent  = totalActions.toLocaleString();
  document.getElementById('statProgress').textContent = `${avgProgress}%`;

  listEl.innerHTML = '';
  projects.forEach((proj, idx) => {
    const div = document.createElement('div');
    div.className = 'project-item';
    div.id = `project_${proj.id}`;

    const stepsHtml = proj.steps.map((s,i) => `<li>${s}</li>`).join('');
    const barColor  = proj.progress >= 70 ? 'linear-gradient(90deg,#2fffb4,#0af)'
                    : proj.progress >= 30 ? 'linear-gradient(90deg,#ff9f0a,#ffcc02)'
                    : 'linear-gradient(90deg,#ff453a,#ff9f0a)';

    div.innerHTML = `
      <div class="project-item-header">
        <div>
          <div class="project-item-title">${proj.project_name}</div>
          <div class="project-item-meta">📌 ${proj.issue} · 👤 ${proj.creator} · 📅 ${proj.createdAt}</div>
        </div>
        <span class="project-item-badge">⏱️ ${proj.timeline}</span>
      </div>
      <p class="project-item-summary">${proj.summary}</p>
      <div class="progress-wrap">
        <div class="progress-top"><span>Progress</span><span>${proj.progress}%</span></div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${proj.progress}%;background:${barColor}"></div></div>
      </div>
      <div class="project-chips">
        <span class="chip">🌟 ${proj.peopleReached} reached</span>
        <span class="chip">✅ ${proj.actionsTaken} actions</span>
        <span class="chip">🎯 ${proj.estimated_impact}</span>
      </div>
      <details style="margin-bottom:12px">
        <summary style="cursor:pointer;font-size:0.78rem;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">View Action Steps</summary>
        <ol style="padding-left:20px;margin-top:8px">${stepsHtml}</ol>
      </details>
      ${proj.notes ? `<div style="font-size:0.82rem;color:#ff9f0a;background:rgba(255,159,10,0.06);border:1px solid rgba(255,159,10,0.15);border-radius:10px;padding:10px 14px;margin-bottom:12px">📝 ${proj.notes}</div>` : ''}
      <div class="project-actions">
        <button onclick="toggleUpdateForm('${proj.id}')">✏️ Update</button>
        <button onclick="downloadProjectMd(${idx})">📤 Export</button>
        <button onclick="forkToFeed(${idx})">🍴 Share to Feed</button>
        <button class="btn-danger" onclick="deleteProject('${proj.id}')">🗑️ Delete</button>
      </div>
      <div class="project-update-form" id="form_${proj.id}">
        <label>Progress: <span id="progVal_${proj.id}">${proj.progress}%</span></label>
        <input type="range" min="0" max="100" value="${proj.progress}"
          oninput="document.getElementById('progVal_${proj.id}').textContent=this.value+'%'" />
        <label>People Reached</label>
        <input type="number" value="${proj.peopleReached}" placeholder="0" id="reached_${proj.id}" />
        <label>Actions Taken</label>
        <input type="number" value="${proj.actionsTaken}" placeholder="0" id="actions_${proj.id}" />
        <label>Notes</label>
        <textarea id="notes_${proj.id}" placeholder="What's happening with this project?">${proj.notes}</textarea>
        <div style="margin-top:12px;display:flex;gap:10px">
          <button onclick="saveProjectUpdate('${proj.id}', ${idx})" style="padding:8px 20px;background:var(--accent);color:var(--black);border:none;border-radius:980px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;">💾 Save</button>
          <button onclick="toggleUpdateForm('${proj.id}')" style="padding:8px 20px;background:transparent;color:var(--white2);border:1px solid var(--glass-border);border-radius:980px;font-family:'DM Sans',sans-serif;cursor:pointer;">Cancel</button>
        </div>
      </div>
    `;
    listEl.appendChild(div);
  });
}

function toggleUpdateForm(projId) {
  const form = document.getElementById(`form_${projId}`);
  if (form) form.classList.toggle('open');
}

function saveProjectUpdate(projId, idx) {
  const proj = state.myProjects.find(p => p.id === projId);
  if (!proj) return;

  const rangeEl   = document.querySelector(`#form_${projId} input[type="range"]`);
  const reachedEl = document.getElementById(`reached_${projId}`);
  const actionsEl = document.getElementById(`actions_${projId}`);
  const notesEl   = document.getElementById(`notes_${projId}`);

  if (rangeEl)   proj.progress      = parseInt(rangeEl.value);
  if (reachedEl) proj.peopleReached = parseInt(reachedEl.value) || 0;
  if (actionsEl) proj.actionsTaken  = parseInt(actionsEl.value) || 0;
  if (notesEl)   proj.notes         = notesEl.value;

  renderProjects();
  showToast('✅ Project updated!');
}

function deleteProject(projId) {
  state.myProjects = state.myProjects.filter(p => p.id !== projId);
  renderProjects();
  showToast('🗑️ Project deleted');
}

function forkToFeed(idx) {
  const proj = state.myProjects[idx];
  const alreadyIn = COMMUNITY_SEED.some(c => c.name === proj.project_name);
  if (alreadyIn) { showToast('📋 Already in Community Feed'); return; }

  COMMUNITY_SEED.unshift({
    id: `shared_${proj.id}`,
    name: proj.project_name,
    issue: proj.issue,
    creator: proj.creator,
    grade: '',
    createdAt: proj.createdAt,
    summary: proj.summary,
    steps: proj.steps,
    estimatedImpact: proj.estimated_impact,
    timeline: proj.timeline,
    progress: proj.progress,
    likes: 0,
    peopleReached: proj.peopleReached,
    actionsTaken: proj.actionsTaken,
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=75&fit=crop',
  });

  renderCommunity();
  showToast('🌐 Shared to Community Feed!');
}

// ════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════
function downloadProjectMd(idx) {
  const p = state.myProjects[idx];
  if (!p) return;
  const steps = p.steps.map((s,i) => `${i+1}. ${s}`).join('\n');
  const md = `# 🔥 ${p.project_name}\n> EchoForge Lite · HackAmerica 2026\n\n---\n\n## Issue\n**${p.issue}**\n\n## Creator\n${p.creator} · Started ${p.createdAt}\n\n## Summary\n${p.summary}\n\n## Action Steps\n${steps}\n\n## Impact\n- **Estimated:** ${p.estimated_impact}\n- **Timeline:** ${p.timeline}\n- **Progress:** ${p.progress}%\n- **People Reached:** ${p.peopleReached}\n- **Actions Taken:** ${p.actionsTaken}\n${p.notes ? `\n## Notes\n${p.notes}` : ''}\n\n---\n*Generated by EchoForge Lite · ${new Date().toLocaleDateString()}*`;
  downloadFile(md, `${p.project_name.replace(/[^a-z0-9]/gi,'_')}_summary.md`, 'text/markdown');
  showToast('📤 Summary downloaded!');
}

function exportPortfolio() {
  if (!state.myProjects.length) { showToast('⚠️ No projects to export yet!'); return; }

  const totalReached = state.myProjects.reduce((a,p) => a + (p.peopleReached||0), 0);
  const totalActions = state.myProjects.reduce((a,p) => a + (p.actionsTaken||0), 0);
  const avg          = Math.round(state.myProjects.reduce((a,p) => a + (p.progress||0), 0) / state.myProjects.length);

  let md = `# 🔥 My EchoForge Portfolio\n> HackAmerica 2026 · Generated ${new Date().toLocaleDateString()}\n\n---\n\n## Impact Summary\n\n| Metric | Value |\n|--------|-------|\n| 🔥 Projects | ${state.myProjects.length} |\n| 🌟 People Reached | ${totalReached.toLocaleString()} |\n| ✅ Actions Taken | ${totalActions.toLocaleString()} |\n| 📈 Avg Progress | ${avg}% |\n\n---\n\n`;

  state.myProjects.forEach((p, i) => {
    const steps = p.steps.map((s,j) => `   ${j+1}. ${s}`).join('\n');
    md += `## ${i+1}. ${p.project_name}\n\n**Issue:** ${p.issue}  \n**Creator:** ${p.creator} · Started ${p.createdAt}  \n**Progress:** ${p.progress}%  \n\n${p.summary}\n\n**Steps:**\n${steps}\n\n**Impact:** ${p.estimated_impact}  \n**Timeline:** ${p.timeline}  \n**Reached:** ${p.peopleReached} people · **Actions:** ${p.actionsTaken}  \n${p.notes ? `**Notes:** ${p.notes}  \n` : ''}\n---\n\n`;
  });

  md += `## About EchoForge Lite\nSocial impact platform for HackAmerica 2026 · Python · GitHub Pages · Groq + Llama-3\n\n*Built with ❤️ for positive change.*`;
  downloadFile(md, 'EchoForge_Portfolio.md', 'text/markdown');
  showToast('📦 Portfolio exported!');
}

function downloadFile(content, filename, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ════════════════════════════════════════════════════════════
// SHARE (Web Share API or clipboard)
// ════════════════════════════════════════════════════════════
function shareProject() {
  if (!state.lastForge) return;
  const text = `🔥 Check out my impact project: "${state.lastForge.project_name}" — built with EchoForge Lite for HackAmerica 2026!`;
  if (navigator.share) {
    navigator.share({ title: state.lastForge.project_name, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Copied to clipboard!'));
  }
}

// ════════════════════════════════════════════════════════════
// COMMUNITY FEED
// ════════════════════════════════════════════════════════════
function renderCommunity() {
  const search = (document.getElementById('communitySearch')?.value || '').toLowerCase();
  const grid   = document.getElementById('communityGrid');
  if (!grid) return;

  const all = [...COMMUNITY_SEED, ...state.myProjects.filter(p =>
    !COMMUNITY_SEED.some(c => c.name === p.project_name)
  ).map(p => ({
    id: p.id,
    name: p.project_name,
    issue: p.issue,
    creator: p.creator,
    grade: '',
    createdAt: p.createdAt,
    summary: p.summary,
    estimatedImpact: p.estimated_impact,
    timeline: p.timeline,
    progress: p.progress,
    likes: 0,
    peopleReached: p.peopleReached,
    actionsTaken: p.actionsTaken,
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=75&fit=crop',
  }))];

  const filtered = search
    ? all.filter(p => p.name.toLowerCase().includes(search) || p.issue.toLowerCase().includes(search) || (p.creator||'').toLowerCase().includes(search))
    : all;

  grid.innerHTML = '';
  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--white3);padding:60px">No projects found for "${search}"</div>`;
    return;
  }

  filtered.forEach(proj => {
    const isLiked = state.likedProjects.has(proj.id);
    const likeCount = (proj.likes || 0) + (isLiked ? 1 : 0);
    const card = document.createElement('div');
    card.className = 'community-card';
    card.innerHTML = `
      <div style="overflow:hidden;border-radius:24px 24px 0 0">
        <img src="${proj.img || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=75&fit=crop'}"
             class="community-card-img" loading="lazy" alt="${proj.name}" />
      </div>
      <div class="community-card-body">
        <span class="community-card-tag">📌 ${proj.issue}</span>
        <div class="community-card-title">${proj.name}</div>
        <div class="community-card-creator">👤 ${proj.creator} ${proj.grade ? `· ${proj.grade}` : ''} · 📅 ${proj.createdAt}</div>
        <p class="community-card-summary">${proj.summary}</p>
        <div class="community-card-progress">
          <div class="community-card-progress-fill" style="width:${proj.progress}%"></div>
        </div>
        <div class="community-card-footer">
          <span class="community-card-stats">🌟 ${proj.peopleReached} reached · ${proj.progress}% done</span>
          <div class="community-card-actions">
            <button class="${isLiked ? 'liked' : ''}" onclick="toggleLike('${proj.id}', this)">
              ${isLiked ? '❤️' : '🤍'} ${likeCount}
            </button>
            <button onclick="forkCommunityProject('${proj.id}')">🍴 Fork</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function toggleLike(projId, btn) {
  if (state.likedProjects.has(projId)) {
    state.likedProjects.delete(projId);
    showToast('💔 Unliked');
  } else {
    state.likedProjects.add(projId);
    showToast('❤️ Liked!');
  }
  renderCommunity();
}

function forkCommunityProject(projId) {
  const source = COMMUNITY_SEED.find(p => p.id === projId);
  if (!source) { showToast('⚠️ Project not found'); return; }

  const forked = {
    id: `forked_${projId}_${Date.now()}`,
    project_name: `[Fork] ${source.name}`,
    issue: source.issue,
    creator: 'You',
    summary: source.summary,
    steps: source.steps || [],
    estimated_impact: source.estimatedImpact || '',
    timeline: source.timeline || '6 weeks',
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    progress: 5,
    peopleReached: 0,
    actionsTaken: 0,
    notes: `Forked from ${source.creator}'s "${source.name}"`,
  };

  state.myProjects.unshift(forked);
  renderProjects();
  showToast(`🍴 Forked "${source.name}" to your dashboard!`);
  setTimeout(() => document.getElementById('projects').scrollIntoView({ behavior: 'smooth' }), 1200);
}

// ════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════
function showToast(msg, duration = 2800) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}
