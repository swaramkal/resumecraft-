import { STORAGE_KEYS, loadData, saveData } from './storage.js';
import { DEFAULT_RESUME_DATA } from './data.js';
import { escapeHTML, showToast } from './utils.js';

const THEMES = {
  obsidian: { bg: '#07090f', card: '#111625', text: '#f8fafc', muted: '#94a3b8', accent: '#6366f1' },
  emerald: { bg: '#051311', card: '#0b221e', text: '#ecfdf5', muted: '#a7f3d0', accent: '#10b981' },
  light: { bg: '#f8fafc', card: '#ffffff', text: '#0f172a', muted: '#475569', accent: '#2563eb' },
  sunset: { bg: '#160b14', card: '#241221', text: '#fdf2f8', muted: '#f5d0fe', accent: '#ec4899' }
};

function generatePortfolioHTML(data) {
  const t = THEMES[data.theme] || THEMES.obsidian;
  const skills = (data.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const projects = (data.projects || '').split('\n').map(line => {
    const [title, desc, link] = line.split('|').map(s => (s || '').trim());
    return { title, desc, link };
  }).filter(p => p.title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(data.name)} — Portfolio</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,sans-serif;background:${t.bg};color:${t.text};line-height:1.6;padding:2rem 1.25rem}
  .wrap{max-width:960px;margin:0 auto}
  .hero{background:${t.card};border:1px solid rgba(128,128,128,0.2);border-radius:20px;padding:2.5rem;margin-bottom:2rem}
  .badge{display:inline-block;padding:0.3rem 0.85rem;border-radius:999px;background:${t.accent}22;color:${t.accent};font-weight:700;font-size:0.85rem;margin-bottom:0.75rem}
  h1{font-size:2.4rem;margin-bottom:0.5rem}
  .muted{color:${t.muted}}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;margin-top:1rem}
  .card{background:${t.card};border:1px solid rgba(128,128,128,0.2);border-radius:16px;padding:1.4rem}
  .tag{display:inline-block;padding:0.3rem 0.7rem;border-radius:8px;background:${t.accent}20;color:${t.accent};font-size:0.82rem;margin:0.2rem;font-weight:600}
  a{color:${t.accent};text-decoration:none;font-weight:600}
  h2{font-size:1.35rem;margin:2rem 0 0.75rem}
</style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <span class="badge">${escapeHTML(data.title || 'Professional Portfolio')}</span>
      <h1>${escapeHTML(data.name || 'Your Name')}</h1>
      <p class="muted" style="max-width:680px;margin-bottom:1.25rem;">${escapeHTML(data.about || '')}</p>
      <div style="display:flex;flex-wrap:wrap;gap:1rem;font-size:0.9rem;">
        ${data.email ? `<span>📧 ${escapeHTML(data.email)}</span>` : ''}
        ${data.github ? `<a href="https://${escapeHTML(data.github.replace(/^https?:\/\//,''))}" target="_blank">GitHub ↗</a>` : ''}
        ${data.linkedin ? `<a href="https://${escapeHTML(data.linkedin.replace(/^https?:\/\//,''))}" target="_blank">LinkedIn ↗</a>` : ''}
      </div>
    </section>

    <h2>Core Skills</h2>
    <div>${skills.map(s => `<span class="tag">${escapeHTML(s)}</span>`).join('')}</div>

    <h2>Featured Projects</h2>
    <div class="grid">
      ${projects.map(p => `
        <div class="card">
          <h3 style="margin-bottom:0.4rem;">${escapeHTML(p.title)}</h3>
          <p class="muted" style="font-size:0.92rem;margin-bottom:0.75rem;">${escapeHTML(p.desc || '')}</p>
          ${p.link ? `<a href="https://${escapeHTML(p.link.replace(/^https?:\/\//,''))}" target="_blank">View Project →</a>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="grid" style="margin-top:1.5rem;">
      <div class="card">
        <h3>Experience</h3>
        <p class="muted" style="white-space:pre-line;font-size:0.92rem;margin-top:0.5rem;">${escapeHTML(data.experience || '')}</p>
      </div>
      <div class="card">
        <h3>Education & Certifications</h3>
        <p class="muted" style="white-space:pre-line;font-size:0.92rem;margin-top:0.5rem;">${escapeHTML(data.education || '')}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function initPortfolioPage() {
  const form = document.getElementById('pfForm');
  const frame = document.getElementById('pfPreviewFrame');
  if (!form || !frame) return;

  const saved = loadData(STORAGE_KEYS.PORTFOLIO, {
    theme: 'obsidian',
    name: 'Aarav Sharma',
    title: 'Full-Stack Software Engineer',
    about: 'I build fast, accessible, and user-centric web applications with modern frontend architectures and clean APIs.',
    skills: 'JavaScript, HTML5, CSS3, Python, MySQL, Git, UI/UX Design',
    projects: 'ResumeCraft Platform | All-in-one career builder with 24 templates and PDF export | github.com/aaravsharma/resumecraft\nCloudNova Analytics | Real-time SaaS telemetry dashboard | github.com/aaravsharma/cloudnova',
    experience: 'Software Engineer at CloudNova Technologies (2024 - Present)\nJunior Web Developer at PixelForge Digital (2023 - 2024)',
    education: 'Bachelor of Computer Applications (BCA) — Andhra University\nAWS Certified Cloud Practitioner',
    email: 'aarav.sharma@example.com',
    github: 'github.com/aaravsharma',
    linkedin: 'linkedin.com/in/aaravsharma'
  });

  Object.entries(saved).forEach(([k, v]) => {
    if (form.elements[k]) form.elements[k].value = v;
  });

  function render() {
    const data = Object.fromEntries(new FormData(form).entries());
    saveData(STORAGE_KEYS.PORTFOLIO, data);
    frame.srcdoc = generatePortfolioHTML(data);
  }

  document.getElementById('syncResumeToPfBtn')?.addEventListener('click', () => {
    const r = loadData(STORAGE_KEYS.RESUME, DEFAULT_RESUME_DATA);
    form.elements.name.value = r.personal.fullName || '';
    form.elements.title.value = r.personal.title || '';
    form.elements.email.value = r.personal.email || '';
    form.elements.github.value = r.personal.github || '';
    form.elements.linkedin.value = r.personal.linkedin || '';
    const sum = r.sections.find(s => s.type === 'summary');
    if (sum) form.elements.about.value = sum.content || '';
    const skills = r.sections.find(s => s.id === 'techSkills');
    if (skills) form.elements.skills.value = (skills.tags || []).join(', ');
    render();
    showToast('Synced profile details from Resume Builder.', 'success');
  });

  document.getElementById('downloadPortfolioBtn')?.addEventListener('click', () => {
    const data = Object.fromEntries(new FormData(form).entries());
    const html = generatePortfolioHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Standalone portfolio index.html downloaded!', 'success');
  });

  form.addEventListener('input', render);
  render();
}
