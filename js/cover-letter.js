import { STORAGE_KEYS, loadData, saveData } from './storage.js';
import { downloadElementAsPDF } from './pdf-generator.js';
import { escapeHTML, showToast } from './utils.js';

const STYLE_TEMPLATES = {
  modern: (d) => `Dear ${d.manager || 'Hiring Manager'},

I am writing to express my strong interest in the ${d.role || 'Open'} position at ${d.company || 'your organization'}. With hands-on experience in ${d.experience || 'delivering scalable solutions'} and core strengths in ${d.skills || 'modern engineering and problem solving'}, I am excited about the opportunity to contribute immediate value to your team.

In my recent work, ${d.achievements || 'I consistently delivered high-impact projects ahead of schedule while collaborating across product and engineering teams.'} Reviewing your requirements for ${d.company || 'this role'}, I see a strong alignment between my background and your team's goals${d.jd ? `, particularly around ${d.jd.slice(0, 120).trim()}...` : '.'}

Thank you for your time and consideration. I welcome the opportunity to discuss how my skills and track record can support ${d.company || 'your team'}.

Sincerely,
${d.name || 'Applicant Name'}`,

  executive: (d) => `Dear ${d.manager || 'Executive Search Committee'},

Please accept this letter as an expression of my interest in the ${d.role || 'Leadership'} role at ${d.company || 'your company'}. Over the course of my career, I have focused on ${d.experience || 'driving operational excellence and measurable business growth'}, backed by deep capabilities in ${d.skills || 'strategic execution and cross-functional leadership'}.

Notable highlights from my background include ${d.achievements || 'leading key initiatives that improved efficiency, quality, and stakeholder outcomes.'} I am confident that this disciplined approach will translate directly into sustained impact at ${d.company || 'your organization'}.

I appreciate your consideration and look forward to a conversation regarding ${d.company || 'your'} upcoming priorities.

Respectfully,
${d.name || 'Applicant Name'}`,

  fresher: (d) => `Dear ${d.manager || 'Hiring Team'},

I am excited to apply for the ${d.role || 'Entry-Level'} opportunity at ${d.company || 'your organization'}. As a motivated candidate trained in ${d.skills || 'software development, analytical problem-solving, and teamwork'}, I am eager to bring fresh energy, adaptability, and strong foundational skills to your team.

Through academic projects and practical experience in ${d.experience || 'building real-world applications'}, ${d.achievements || 'I have demonstrated fast learning, clean execution, and collaborative ownership.'} I admire ${d.company || 'your organization'}'s work and would be thrilled to grow while contributing to your upcoming milestones.

Thank you for reviewing my application. I look forward to the possibility of an interview.

Warm regards,
${d.name || 'Applicant Name'}`
};

export function initCoverLetterPage() {
  const form = document.getElementById('clForm');
  const preview = document.getElementById('clPreviewContent');
  if (!form || !preview) return;

  const saved = loadData(STORAGE_KEYS.COVER_LETTER, {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    company: 'TechNova Labs',
    manager: 'Hiring Manager',
    role: 'Frontend Software Engineer',
    style: 'modern',
    skills: 'JavaScript, HTML5, CSS3, Performance Optimization',
    experience: '3+ years developing responsive web applications',
    achievements: 'Reduced page load latency by 38% and built modular UI components used by 180K+ users',
    jd: ''
  });

  Object.entries(saved).forEach(([k, v]) => {
    const el = form.elements[k];
    if (el) el.value = v;
  });

  function updatePreview() {
    const data = Object.fromEntries(new FormData(form).entries());
    saveData(STORAGE_KEYS.COVER_LETTER, data);
    const builder = STYLE_TEMPLATES[data.style] || STYLE_TEMPLATES.modern;
    const bodyText = builder(data);

    document.getElementById('clHeaderBlock').innerHTML = `
      <div style="border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:18px;">
        <h2 style="margin:0;color:#0f172a;">${escapeHTML(data.name || 'Your Name')}</h2>
        <div style="font-size:0.88rem;color:#475569;">${escapeHTML(data.email || '')} ${data.phone ? `• ${escapeHTML(data.phone)}` : ''}</div>
      </div>
      <div style="margin-bottom:14px;font-size:0.9rem;color:#334155;">
        <strong>${escapeHTML(data.company || '')}</strong><br>
        Re: ${escapeHTML(data.role || '')}
      </div>
    `;
    preview.textContent = bodyText;
  }

  document.getElementById('generateClBtn')?.addEventListener('click', () => {
    updatePreview();
    showToast('Cover letter generated from structured template.', 'success');
  });

  form.addEventListener('input', updatePreview);

  document.getElementById('copyClBtn')?.addEventListener('click', async () => {
    const full = `${document.getElementById('clHeaderBlock').innerText}\n\n${preview.innerText}`;
    await navigator.clipboard.writeText(full);
    showToast('Cover letter copied to clipboard.', 'success');
  });

  document.getElementById('downloadClPdfBtn')?.addEventListener('click', () => {
    downloadElementAsPDF(document.getElementById('clPaperSheet'), 'Cover_Letter_ResumeCraft.pdf');
  });

  updatePreview();
}
