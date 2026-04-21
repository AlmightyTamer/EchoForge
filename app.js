'use strict';

/* ══════════════════════════════════════════════════════════════
   EchoForge v2 — app.js
   Real data only. No fake stats. No fake community.
   Groq + Llama-3.1-8B-Instant via fetch()
══════════════════════════════════════════════════════════════ */

const GROQ_KEY = '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama-3.1-8b-instant';

/* ── State ───────────────────────────────────────────────── */
const S = {
  projects:  [],     // user's saved projects
  lastPlan:  null,   // most recent forge result
  tone:      'Bold & Ambitious',
};

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setupReveal();
  setupHeroPhoto();
  setupFilters();
  setupTonePicker();
  renderDashboard();   // start empty — no fake data
});

/* ══════════════════════════════════════════════════════════════
   SCROLL REVEAL  (Intersection Observer)
══════════════════════════════════════════════════════════════ */
function setupReveal() {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

function revealEl(el) {
  // Kick the observer on a freshly-created element
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.05 });
  el.querySelectorAll('.reveal').forEach(r => io.observe(r));
  el.classList.add('reveal');
  requestAnimationFrame(() => io.observe(el));
}

/* ══════════════════════════════════════════════════════════════
   HERO PHOTO PARALLAX
══════════════════════════════════════════════════════════════ */
function setupHeroPhoto() {
  const img = document.getElementById('heroPhoto');
  if (!img) return;
  const onLoad = () => img.classList.add('loaded');
  if (img.complete) onLoad(); else img.addEventListener('load', onLoad);

  window.addEventListener('scroll', () => {
    if (window.scrollY < window.innerHeight) {
      img.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    }
  }, { passive: true });

  // Subtle nav background on scroll
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 60
      ? 'rgba(10,10,10,0.97)'
      : 'rgba(10,10,10,0.85)';
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════════
   ISSUE FILTERS
══════════════════════════════════════════════════════════════ */
function setupFilters() {
  document.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      document.querySelectorAll('.issue-card').forEach(card => {
        const show = cat === 'all' || card.dataset.cat === cat;
        card.classList.toggle('hidden', !show);
      });
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   TONE PICKER
══════════════════════════════════════════════════════════════ */
function setupTonePicker() {
  document.querySelectorAll('.tone-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tone-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.tone = btn.dataset.tone;
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   PRE-FILL FORGE FROM ISSUE CARD
══════════════════════════════════════════════════════════════ */
function prefillForge(issue) {
  const sel    = document.getElementById('issueSelect');
  const custom = document.getElementById('customIssue');
  let found = false;
  for (const opt of sel.options) {
    if (opt.value === issue) { sel.value = issue; found = true; break; }
  }
  if (!found) { sel.value = ''; custom.value = issue; }
  document.getElementById('forge').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('creatorName').focus(), 700);
}

/* ══════════════════════════════════════════════════════════════
   GROQ AI  ─  forge a project plan
══════════════════════════════════════════════════════════════ */
async function forgeProject() {
  const sel    = document.getElementById('issueSelect').value;
  const custom = document.getElementById('customIssue').value.trim();
  const issue  = custom || sel;
  const name   = document.getElementById('creatorName').value.trim() || 'Student Changemaker';

  if (!issue) { showToast('Pick or describe an issue first.'); return; }

  const btn    = document.getElementById('forgeBtn');
  const label  = document.getElementById('forgeBtnLabel');
  const spin   = document.getElementById('forgeSpinner');

  btn.disabled     = true;
  label.style.display = 'none';
  spin.style.display  = 'block';

  // Show loading state in output panel
  setForgeState('loading');

  const plan = await callGroq(issue, name, S.tone) ?? makeFallback(issue, name);
  S.lastPlan = { ...plan, issue, creator: name };
  renderForgeResult(S.lastPlan);

  btn.disabled     = false;
  label.style.display = 'inline';
  spin.style.display  = 'none';
}

async function callGroq(issue, creator, tone) {
  const system = `You are EchoForge AI — concise, sharp, inspiring. You help high school students turn real problems into action plans.
Respond ONLY with raw JSON — no markdown fences, no commentary, no preamble.
Schema (all fields required):
{
  "project_name": "4-7 word catchy project name",
  "summary": "2-3 sentences: what this project does and why it matters",
  "steps": ["Week 1: ...", "Week 2: ...", "Week 3: ...", "Week 4-5: ...", "Week 6: ..."],
  "estimated_impact": "Specific realistic impact for a high schooler",
  "timeline": "X weeks"
}`;

  const user = `Issue: ${issue}\nCreator: ${creator}\nTone: ${tone}\n\nGenerate the plan.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user },
        ],
        max_tokens: 650,
        temperature: 0.82,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? '';
    const clean = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function makeFallback(issue, creator) {
  return {
    project_name: `The ${issue.split(' ').slice(0,3).join(' ')} Project`,
    summary: `A student-led initiative to address "${issue}" through direct community action, peer organizing, and measurable outcomes. Built from the ground up by someone who's tired of waiting for adults to fix it.`,
    steps: [
      'Week 1: Map the problem — interview 10 classmates, collect data, document examples',
      'Week 2: Build your team — recruit 4–6 people who care, assign roles',
      'Week 3: Reach out — contact 3 local orgs, teachers, or officials for support',
      'Week 4–5: Launch — run your school campaign, host an event, collect feedback',
      'Week 6: Present findings and your solution to the school board or community',
    ],
    estimated_impact: 'Directly engages 200+ students; creates a repeatable model others can fork',
    timeline: '6 weeks',
  };
}

/* ── Forge output panel states ──────────────────────────── */
function setForgeState(state) {
  const idle   = document.getElementById('forgeIdle');
  const result = document.getElementById('forgeResult');
  if (state === 'idle') {
    idle.style.display   = 'flex';
    result.style.display = 'none';
  } else if (state === 'loading') {
    idle.style.display   = 'flex';
    idle.querySelector('p').innerHTML = 'Forging your plan…<br/><span style="font-size:0.75rem;opacity:0.5">Usually takes 5–10 seconds</span>';
    result.style.display = 'none';
  } else if (state === 'result') {
    idle.style.display   = 'none';
    result.style.display = 'block';
  }
}

function renderForgeResult(plan) {
  document.getElementById('frName').textContent    = plan.project_name ?? '';
  document.getElementById('frIssue').textContent   = `Issue: ${plan.issue}`;
  document.getElementById('frSummary').textContent = plan.summary ?? '';
  document.getElementById('frImpact').textContent  = plan.estimated_impact ?? '';
  document.getElementById('frTimeline').textContent = plan.timeline ?? '';

  const list = document.getElementById('frSteps');
  list.innerHTML = '';
  (plan.steps ?? []).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    list.appendChild(li);
  });

  setForgeState('result');
  document.getElementById('forgeResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ══════════════════════════════════════════════════════════════
   SAVE + DASHBOARD
══════════════════════════════════════════════════════════════ */
function saveProject() {
  if (!S.lastPlan) { showToast('Nothing to save — forge a plan first.'); return; }

  const plan = S.lastPlan;
  const dupe = S.projects.some(p => p.project_name === plan.project_name && p.issue === plan.issue);
  if (dupe) { showToast('Already saved to your dashboard.'); return; }

  S.projects.unshift({
    id:              `p_${Date.now()}`,
    project_name:    plan.project_name,
    issue:           plan.issue,
    creator:         plan.creator,
    summary:         plan.summary,
    steps:           plan.steps ?? [],
    estimated_impact: plan.estimated_impact,
    timeline:        plan.timeline,
    createdAt:       new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    progress:        5,
    peopleReached:   0,
    actionsTaken:    0,
    notes:           '',
  });

  renderDashboard();
  openModal(
    '◈ Saved.',
    'Your project is in your dashboard. Update your progress as you go.',
    'Go to Dashboard',
    () => { closeModal(); document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' }); }
  );
}

function shareForgeResult() {
  if (!S.lastPlan) return;
  const text = `🔥 I just forged a plan for "${S.lastPlan.project_name}" on EchoForge — an AI tool that helps students tackle real community issues. Check it out at almightytamer.github.io/EchoForge`;
  if (navigator.share) {
    navigator.share({ title: S.lastPlan.project_name, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard.'));
  }
}

/* ── Render dashboard ──────────────────────────────────── */
function renderDashboard() {
  const emptyEl  = document.getElementById('dashEmpty');
  const statsEl  = document.getElementById('dashStats');
  const listEl   = document.getElementById('dashList');
  const exportEl = document.getElementById('exportRow');

  if (S.projects.length === 0) {
    emptyEl.style.display  = 'block';
    statsEl.style.display  = 'none';
    listEl.innerHTML       = '';
    exportEl.style.display = 'none';
    return;
  }

  emptyEl.style.display  = 'none';
  statsEl.style.display  = 'flex';
  exportEl.style.display = 'block';

  // Real stats — only what the user actually entered
  const totalReached = S.projects.reduce((a, p) => a + (p.peopleReached || 0), 0);
  const totalActions = S.projects.reduce((a, p) => a + (p.actionsTaken || 0), 0);
  const avgProg      = Math.round(S.projects.reduce((a, p) => a + p.progress, 0) / S.projects.length);

  document.getElementById('dsProjects').textContent = S.projects.length;
  document.getElementById('dsReached').textContent  = totalReached.toLocaleString();
  document.getElementById('dsActions').textContent  = totalActions.toLocaleString();
  document.getElementById('dsAvg').textContent      = `${avgProg}%`;

  listEl.innerHTML = '';
  S.projects.forEach((proj, idx) => {
    listEl.appendChild(buildProjectCard(proj, idx));
  });
}

function buildProjectCard(proj, idx) {
  const div = document.createElement('div');
  div.className = 'proj-card';
  div.id = `pcard_${proj.id}`;

  const stepsHtml = proj.steps.map(s => `<li>${escHtml(s)}</li>`).join('');

  div.innerHTML = `
    <div class="proj-card-top">
      <div>
        <div class="proj-card-name">${escHtml(proj.project_name)}</div>
        <div class="proj-card-meta">Issue: ${escHtml(proj.issue)} · ${escHtml(proj.creator)} · ${proj.createdAt}</div>
      </div>
      <span class="proj-card-badge">${escHtml(proj.timeline)}</span>
    </div>
    <p class="proj-card-summary">${escHtml(proj.summary)}</p>
    <div class="proj-progress-row">
      <div class="proj-progress-bar">
        <div class="proj-progress-fill" style="width:${proj.progress}%"></div>
      </div>
      <span class="proj-progress-label">${proj.progress}% complete</span>
    </div>
    <div class="proj-chips">
      <span class="proj-chip">${proj.peopleReached} people reached</span>
      <span class="proj-chip">${proj.actionsTaken} actions taken</span>
      <span class="proj-chip">${escHtml(proj.estimated_impact)}</span>
    </div>
    <details style="margin-bottom:16px">
      <summary style="font-family:var(--mono);font-size:0.62rem;letter-spacing:.15em;text-transform:uppercase;color:var(--muted2);cursor:pointer">
        Action Steps
      </summary>
      <ol style="padding-left:20px;margin-top:10px;display:flex;flex-direction:column;gap:6px">
        ${stepsHtml}
      </ol>
    </details>
    ${proj.notes ? `<p style="font-size:.82rem;color:#c47;background:rgba(200,16,46,.06);border-left:2px solid var(--accent);padding:10px 14px;margin-bottom:14px;border-radius:0 4px 4px 0">${escHtml(proj.notes)}</p>` : ''}
    <div class="proj-actions">
      <button onclick="toggleUpdateForm('${proj.id}')">Update</button>
      <button onclick="downloadProjMd(${idx})">Export</button>
      <button class="act-danger" onclick="deleteProject('${proj.id}')">Delete</button>
    </div>
    <div class="proj-update" id="uf_${proj.id}">
      <label class="uf-label">Progress — <span id="ufPct_${proj.id}">${proj.progress}%</span></label>
      <input class="uf-range" type="range" min="0" max="100" value="${proj.progress}"
        oninput="document.getElementById('ufPct_${proj.id}').textContent=this.value+'%'" />
      <label class="uf-label">People Reached</label>
      <input class="uf-number" type="number" id="ufReached_${proj.id}" value="${proj.peopleReached}" min="0"/>
      <label class="uf-label">Actions Taken</label>
      <input class="uf-number" type="number" id="ufActions_${proj.id}" value="${proj.actionsTaken}" min="0"/>
      <label class="uf-label">Notes</label>
      <textarea class="uf-textarea" id="ufNotes_${proj.id}">${escHtml(proj.notes)}</textarea>
      <div class="uf-row">
        <button class="uf-save" onclick="saveUpdate('${proj.id}', ${idx})">Save</button>
        <button class="uf-cancel" onclick="toggleUpdateForm('${proj.id}')">Cancel</button>
      </div>
    </div>
  `;

  return div;
}

function toggleUpdateForm(id) {
  document.getElementById(`uf_${id}`)?.classList.toggle('open');
}

function saveUpdate(id, idx) {
  const proj     = S.projects.find(p => p.id === id);
  if (!proj) return;
  const range    = document.querySelector(`#uf_${id} .uf-range`);
  const reached  = document.getElementById(`ufReached_${id}`);
  const actions  = document.getElementById(`ufActions_${id}`);
  const notes    = document.getElementById(`ufNotes_${id}`);

  if (range)   proj.progress      = parseInt(range.value);
  if (reached) proj.peopleReached = Math.max(0, parseInt(reached.value) || 0);
  if (actions) proj.actionsTaken  = Math.max(0, parseInt(actions.value) || 0);
  if (notes)   proj.notes         = notes.value.trim();

  renderDashboard();
  showToast('Saved.');
}

function deleteProject(id) {
  S.projects = S.projects.filter(p => p.id !== id);
  renderDashboard();
  showToast('Project deleted.');
}

/* ══════════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════════ */
function downloadProjMd(idx) {
  const p = S.projects[idx];
  if (!p) return;
  const steps = p.steps.map((s,i) => `${i+1}. ${s}`).join('\n');
  const md = `# ${p.project_name}
> EchoForge · HackAmerica 2026

---

**Issue:** ${p.issue}
**Creator:** ${p.creator} · ${p.createdAt}

## Summary
${p.summary}

## Action Steps
${steps}

## Impact
- Estimated: ${p.estimated_impact}
- Timeline: ${p.timeline}
- Progress: ${p.progress}%
- People Reached: ${p.peopleReached}
- Actions Taken: ${p.actionsTaken}
${p.notes ? `\n## Notes\n${p.notes}` : ''}

---
*Generated by EchoForge on ${new Date().toLocaleDateString()}*
`;
  dlFile(md, `${p.project_name.replace(/[^\w\s-]/g,'').replace(/\s+/g,'_')}.md`, 'text/markdown');
  showToast('Exported.');
}

function exportPortfolio() {
  if (!S.projects.length) { showToast('No projects to export yet.'); return; }

  const totalReached = S.projects.reduce((a,p) => a + (p.peopleReached||0), 0);
  const totalActions = S.projects.reduce((a,p) => a + (p.actionsTaken||0), 0);
  const avg          = Math.round(S.projects.reduce((a,p) => a + p.progress, 0) / S.projects.length);

  let md = `# EchoForge Portfolio
> HackAmerica 2026 · ${new Date().toLocaleDateString()}

## Summary
| | |
|--|--|
| Projects | ${S.projects.length} |
| People Reached | ${totalReached} |
| Actions Taken | ${totalActions} |
| Avg Progress | ${avg}% |

---

`;
  S.projects.forEach((p, i) => {
    const steps = p.steps.map((s,j) => `   ${j+1}. ${s}`).join('\n');
    md += `## ${i+1}. ${p.project_name}

**Issue:** ${p.issue}
**Creator:** ${p.creator} · ${p.createdAt}
**Progress:** ${p.progress}% · Reached: ${p.peopleReached} · Actions: ${p.actionsTaken}

${p.summary}

**Steps:**
${steps}

**Impact:** ${p.estimated_impact} · **Timeline:** ${p.timeline}
${p.notes ? `**Notes:** ${p.notes}` : ''}

---

`;
  });
  md += `*Built with EchoForge · almightytamer.github.io/EchoForge*`;
  dlFile(md, 'EchoForge_Portfolio.md', 'text/markdown');
  showToast('Portfolio exported.');
}

function dlFile(content, name, mime) {
  const a   = document.createElement('a');
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════════ */
let _modalCb = null;

function openModal(title, body, btnLabel, cb) {
  _modalCb = cb ?? null;
  document.getElementById('modalBox').innerHTML = `
    <h3>${escHtml(title)}</h3>
    <p>${escHtml(body)}</p>
    <button class="btn-primary" onclick="_modalCb && _modalCb(); closeModal();">${escHtml(btnLabel)}</button>
  `;
  document.getElementById('modal').style.display = 'flex';
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
}

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
let _toastTimer = null;

function showToast(msg, ms = 2600) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/* ══════════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════════ */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
