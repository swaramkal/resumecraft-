import { STORAGE_KEYS, loadData, saveData } from './storage.js';
import { DEFAULT_RESUME_DATA } from './data.js';
import { escapeHTML, showToast } from './utils.js';

const STOP_WORDS = new Set([
  'the','and','for','with','that','this','from','have','will','your','their','about','into','over','under',
  'work','experience','skills','team','role','using','years','ability','strong','good','knowledge','including'
]);

function extractKeywords(text) {
  const words = (text.toLowerCase().match(/[a-z0-9+#.-]{3,}/g) || [])
    .filter(w => !STOP_WORDS.has(w));
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 28)
    .map(([word]) => word);
}

export function analyzeResumeText(resumeText, jdText = '') {
  const cleanResume = resumeText.trim();
  const lower = cleanResume.toLowerCase();

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(cleanResume);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(cleanResume);
  const hasLinkedIn = /linkedin\.com/i.test(cleanResume);
  const hasSummary = /(summary|objective|profile)/i.test(cleanResume);
  const hasExperience = /(experience|employment|work history|internship)/i.test(cleanResume);
  const hasEducation = /(education|bachelor|master|university|college|degree|bca|b\.tech)/i.test(cleanResume);
  const hasSkills = /(skills|technologies|tools|languages)/i.test(cleanResume);

  const actionVerbs = ['built','developed','led','designed','optimized','reduced','increased','managed','implemented','architected','launched','automated'];
  const verbHits = actionVerbs.filter(v => lower.includes(v));
  const metricHits = (cleanResume.match(/\b\d+(\.\d+)?(%|\+|k|m|x|ms)\b/gi) || []).length;

  let structureScore = 0;
  if (hasEmail) structureScore += 10;
  if (hasPhone) structureScore += 8;
  if (hasLinkedIn) structureScore += 5;
  if (hasSummary) structureScore += 8;
  if (hasExperience) structureScore += 12;
  if (hasEducation) structureScore += 10;
  if (hasSkills) structureScore += 10;
  structureScore += Math.min(10, verbHits.length * 2);
  structureScore += Math.min(7, metricHits * 2);

  let matchedKeywords = [];
  let missingKeywords = [];
  let keywordPct = 100;

  if (jdText.trim()) {
    const jdKeywords = extractKeywords(jdText);
    jdKeywords.forEach(kw => {
      if (lower.includes(kw)) matchedKeywords.push(kw);
      else missingKeywords.push(kw);
    });
    keywordPct = jdKeywords.length ? Math.round((matchedKeywords.length / jdKeywords.length) * 100) : 100;
  } else {
    matchedKeywords = extractKeywords(cleanResume).slice(0, 14);
  }

  const totalScore = jdText.trim()
    ? Math.min(100, Math.round(structureScore * 0.75 + keywordPct * 0.25))
    : Math.min(100, Math.round((structureScore / 80) * 100));

  const strengths = [];
  const suggestions = [];
  const warnings = [];

  if (hasEmail && hasPhone) strengths.push('Complete primary contact details detected.');
  else warnings.push('Missing clear email address or phone number.');

  if (hasExperience && hasEducation && hasSkills) strengths.push('Standard ATS-recognized section headings present.');
  else warnings.push('Ensure standard headings (Experience, Education, Skills) are clearly labeled.');

  if (metricHits >= 2) strengths.push(`Strong quantification with ${metricHits} measurable impact metrics.`);
  else suggestions.push('Add measurable numbers (%, $, latency, user counts) to experience bullet points.');

  if (verbHits.length >= 3) strengths.push(`Uses strong action verbs (${verbHits.slice(0, 4).join(', ')}).`);
  else suggestions.push('Start experience bullets with strong action verbs like Built, Optimized, or Led.');

  if (cleanResume.length < 400) warnings.push('Resume text appears brief; expand project and role descriptions.');

  return {
    totalScore,
    keywordPct,
    matchedKeywords,
    missingKeywords,
    strengths,
    suggestions,
    warnings,
    sections: {
      Contact: hasEmail && hasPhone,
      Summary: hasSummary,
      Experience: hasExperience,
      Education: hasEducation,
      Skills: hasSkills
    }
  };
}

export function initAtsPage() {
  const resumeInput = document.getElementById('atsResumeText');
  const jdInput = document.getElementById('atsJdText');
  const analyzeBtn = document.getElementById('runAtsBtn');
  if (!resumeInput || !analyzeBtn) return;

  document.getElementById('importBuilderToAtsBtn')?.addEventListener('click', () => {
    const data = loadData(STORAGE_KEYS.RESUME, DEFAULT_RESUME_DATA);
    const p = data.personal;
    const lines = [
      `${p.fullName} | ${p.title}`,
      `${p.email} | ${p.phone} | ${p.location} | ${p.linkedin} | ${p.github}`
    ];
    data.sections.filter(s => s.visible).forEach(s => {
      lines.push(`\n${s.title.toUpperCase()}`);
      if (s.content) lines.push(s.content);
      if (s.tags) lines.push(s.tags.join(', '));
      if (Array.isArray(s.items)) {
        s.items.forEach(it => {
          if (typeof it === 'string') lines.push(it);
          else lines.push(Object.values(it).filter(Boolean).join(' - '));
        });
      }
    });
    resumeInput.value = lines.join('\n');
    showToast('Loaded active resume from Resume Builder.', 'success');
  });

  document.getElementById('atsFileUpload')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'pdf' && typeof pdfjsLib !== 'undefined') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        resumeInput.value = fullText.trim();
        showToast('PDF text extracted successfully.', 'success');
      } else if (ext === 'docx' && typeof mammoth !== 'undefined') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        resumeInput.value = result.value.trim();
        showToast('DOCX text extracted successfully.', 'success');
      } else {
        const txt = await file.text();
        resumeInput.value = txt;
        showToast('Text file loaded.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not parse file. Please paste resume text directly.', 'error');
    }
  });

  analyzeBtn.addEventListener('click', () => {
    if (!resumeInput.value.trim()) {
      return showToast('Please paste resume text or upload a file first.', 'error');
    }
    const res = analyzeResumeText(resumeInput.value, jdInput.value);
    saveData(STORAGE_KEYS.ATS, res);
    renderAtsResults(res);
    showToast('Compatibility analysis complete.', 'success');
  });

  const saved = loadData(STORAGE_KEYS.ATS, null);
  if (saved) renderAtsResults(saved);
}

function renderAtsResults(res) {
  const panel = document.getElementById('atsResultsPanel');
  if (!panel) return;
  panel.innerHTML = `
    <div style="text-align:center;margin-bottom:1.5rem;">
      <div class="score-ring" style="--score:${res.totalScore};">
        <span class="score-value">${res.totalScore}%</span>
      </div>
      <h3>Estimated ATS Compatibility Score</h3>
      <p style="color:var(--text-secondary);font-size:0.88rem;">Keyword Alignment: <strong>${res.keywordPct}%</strong></p>
    </div>

    <div style="margin-bottom:1.25rem;">
      <h4 style="margin-bottom:0.5rem;">Section Completeness</h4>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
        ${Object.entries(res.sections).map(([k, ok]) => `
          <span class="badge" style="background:${ok ? 'rgba(16,185,129,0.16)' : 'rgba(244,63,94,0.16)'};color:${ok ? '#34d399' : '#fda4af'};border-color:transparent;">
            ${ok ? '✓' : '✕'} ${k}
          </span>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom:1.25rem;">
      <h4 style="margin-bottom:0.4rem;">Matched Keywords</h4>
      <div>${res.matchedKeywords.length ? res.matchedKeywords.map(k => `<span class="kw-pill kw-matched">${escapeHTML(k)}</span>`).join('') : '<span style="color:var(--text-muted);">No keyword matches found.</span>'}</div>
    </div>

    ${res.missingKeywords.length ? `
      <div style="margin-bottom:1.25rem;">
        <h4 style="margin-bottom:0.4rem;">Missing Job Description Keywords</h4>
        <div>${res.missingKeywords.map(k => `<span class="kw-pill kw-missing">${escapeHTML(k)}</span>`).join('')}</div>
      </div>` : ''}

    <div class="grid-2">
      <div>
        <h4 style="color:#34d399;margin-bottom:0.4rem;">Strengths</h4>
        <ul style="padding-left:1.1rem;font-size:0.88rem;color:var(--text-secondary);">
          ${res.strengths.map(s => `<li>${escapeHTML(s)}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h4 style="color:#fcd34d;margin-bottom:0.4rem;">Suggestions & Warnings</h4>
        <ul style="padding-left:1.1rem;font-size:0.88rem;color:var(--text-secondary);">
          ${[...res.warnings, ...res.suggestions].map(s => `<li>${escapeHTML(s)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}
