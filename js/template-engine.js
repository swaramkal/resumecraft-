import { escapeHTML } from './utils.js';
import { RESUME_TEMPLATES } from './template-definitions.js';

function renderSectionContent(sec) {
  if (sec.type === 'summary' || sec.type === 'custom') {
    return `<p style="margin:0;white-space:pre-line;">${escapeHTML(sec.content || '')}</p>`;
  }
  if (sec.type === 'tags') {
    const tags = Array.isArray(sec.tags) ? sec.tags : [];
    return `<div class="rs-tags">${tags.map(t => `<span class="rs-tag">${escapeHTML(t)}</span>`).join('')}</div>`;
  }
  if (sec.type === 'list') {
    const items = Array.isArray(sec.items) ? sec.items : [];
    return `<ul class="rs-bullets">${items.map(i => `<li>${escapeHTML(i)}</li>`).join('')}</ul>`;
  }
  if (sec.type === 'experience') {
    return (sec.items || []).map(item => {
      const bullets = (item.bullets || '').split('\n').filter(Boolean);
      return `
        <div class="rs-entry">
          <div class="rs-entry-head">
            <span>${escapeHTML(item.role || '')} — ${escapeHTML(item.company || '')}</span>
            <span>${escapeHTML(item.startDate || '')} – ${escapeHTML(item.endDate || '')}</span>
          </div>
          ${item.location ? `<div class="rs-entry-sub"><span>${escapeHTML(item.location)}</span></div>` : ''}
          ${bullets.length ? `<ul class="rs-bullets">${bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}</ul>` : ''}
        </div>`;
    }).join('');
  }
  if (sec.type === 'education') {
    return (sec.items || []).map(item => `
      <div class="rs-entry">
        <div class="rs-entry-head">
          <span>${escapeHTML(item.degree || '')}</span>
          <span>${escapeHTML(item.year || '')}</span>
        </div>
        <div class="rs-entry-sub">
          <span>${escapeHTML(item.institution || '')}${item.location ? `, ${escapeHTML(item.location)}` : ''}</span>
          <span>${escapeHTML(item.score || '')}</span>
        </div>
      </div>`).join('');
  }
  if (sec.type === 'projects') {
    return (sec.items || []).map(item => `
      <div class="rs-entry">
        <div class="rs-entry-head">
          <span>${escapeHTML(item.name || '')} ${item.tech ? `<small style="font-weight:500;color:#475569;">(${escapeHTML(item.tech)})</small>` : ''}</span>
          <span style="font-size:0.88em;color:var(--tpl-accent);">${escapeHTML(item.link || '')}</span>
        </div>
        <p style="margin:2px 0 0;">${escapeHTML(item.description || '')}</p>
      </div>`).join('');
  }
  if (sec.type === 'certifications') {
    return (sec.items || []).map(item => `
      <div class="rs-entry" style="display:flex;justify-content:space-between;">
        <span><strong>${escapeHTML(item.name || '')}</strong>${item.issuer ? ` — ${escapeHTML(item.issuer)}` : ''}</span>
        <span>${escapeHTML(item.year || '')}</span>
      </div>`).join('');
  }
  return '';
}

export function renderResumeHTML(resumeData, overrideTemplateId = null) {
  const tplId = overrideTemplateId || resumeData.templateId || 'modern-horizon';
  const tpl = RESUME_TEMPLATES.find(t => t.id === tplId) || RESUME_TEMPLATES[0];
  const accent = resumeData.accentColor || tpl.accent;
  const p = resumeData.personal || {};
  const visibleSections = (resumeData.sections || []).filter(s => s.visible);

  const contactParts = [
    p.email, p.phone, p.location, p.linkedin, p.github, p.website
  ].filter(Boolean).map(v => escapeHTML(v));

  const photoHTML = p.photo
    ? `<img src="${escapeHTML(p.photo)}" alt="Profile" style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.5);">`
    : '';

  const sideTypes = new Set(['tags', 'certifications']);
  const sideSections = visibleSections.filter(s => sideTypes.has(s.type));
  const mainSections = visibleSections.filter(s => !sideTypes.has(s.type));

  const renderStandardBlock = (sec) => `
    <div style="margin-bottom:12px;">
      <div class="rs-sec-title">${escapeHTML(sec.title)}</div>
      ${renderSectionContent(sec)}
    </div>`;

  if (tpl.layout === 'sidebar-left') {
    return `
      <div class="tpl-layout-sidebar-left" style="--tpl-accent:${escapeHTML(accent)};">
        <aside class="rs-side">
          ${photoHTML ? `<div style="margin-bottom:12px;">${photoHTML}</div>` : ''}
          <h1 style="font-size:1.55em;line-height:1.18;margin-bottom:4px;">${escapeHTML(p.fullName || 'Your Name')}</h1>
          <div style="font-size:0.95em;opacity:0.9;margin-bottom:14px;">${escapeHTML(p.title || '')}</div>
          <div style="font-size:0.84em;display:flex;flex-direction:column;gap:4px;margin-bottom:16px;word-break:break-word;">
            ${contactParts.map(c => `<span>${c}</span>`).join('')}
          </div>
          ${sideSections.map(renderStandardBlock).join('')}
        </aside>
        <main class="rs-main">
          ${mainSections.map(renderStandardBlock).join('')}
        </main>
      </div>`;
  }

  if (tpl.layout === 'sidebar-right') {
    return `
      <div class="tpl-layout-sidebar-right" style="--tpl-accent:${escapeHTML(accent)};">
        <main class="rs-main">
          <div style="margin-bottom:14px;border-bottom:2px solid var(--tpl-accent);padding-bottom:10px;">
            <h1 style="font-size:1.85em;color:#0f172a;line-height:1.15;">${escapeHTML(p.fullName || 'Your Name')}</h1>
            <div style="color:var(--tpl-accent);font-weight:700;font-size:1.05em;">${escapeHTML(p.title || '')}</div>
          </div>
          ${mainSections.map(renderStandardBlock).join('')}
        </main>
        <aside class="rs-side">
          ${photoHTML ? `<div style="margin-bottom:12px;">${photoHTML}</div>` : ''}
          <div class="rs-sec-title">Contact</div>
          <div style="font-size:0.84em;display:flex;flex-direction:column;gap:4px;margin-bottom:16px;word-break:break-word;">
            ${contactParts.map(c => `<span>${c}</span>`).join('')}
          </div>
          ${sideSections.map(renderStandardBlock).join('')}
        </aside>
      </div>`;
  }

  if (tpl.layout === 'banner') {
    return `
      <div class="tpl-layout-banner" style="--tpl-accent:${escapeHTML(accent)};">
        <header class="rs-header">
          <div>
            <h1 style="font-size:1.95em;line-height:1.15;">${escapeHTML(p.fullName || 'Your Name')}</h1>
            <div style="font-size:1.05em;opacity:0.92;margin-top:3px;">${escapeHTML(p.title || '')}</div>
            <div style="font-size:0.84em;opacity:0.88;margin-top:8px;">${contactParts.join(' • ')}</div>
          </div>
          ${photoHTML}
        </header>
        <div class="rs-body">
          ${visibleSections.map(renderStandardBlock).join('')}
        </div>
      </div>`;
  }

  if (tpl.layout === 'swiss') {
    return `
      <div class="tpl-layout-swiss" style="--tpl-accent:${escapeHTML(accent)};">
        <header style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;">
          <div>
            <h1 style="font-size:2em;letter-spacing:-0.02em;color:#0f172a;">${escapeHTML(p.fullName || 'Your Name')}</h1>
            <div style="color:var(--tpl-accent);font-weight:700;">${escapeHTML(p.title || '')}</div>
          </div>
          <div style="text-align:right;font-size:0.84em;color:#475569;">
            ${contactParts.join('<br>')}
          </div>
        </header>
        ${visibleSections.map(sec => `
          <div class="rs-sec-row">
            <div class="rs-sec-title">${escapeHTML(sec.title)}</div>
            <div>${renderSectionContent(sec)}</div>
          </div>`).join('')}
      </div>`;
  }

  const layoutClass = `tpl-layout-${tpl.layout}`;
  return `
    <div class="${layoutClass}" style="--tpl-accent:${escapeHTML(accent)};">
      <header class="rs-header">
        <div style="display:flex;align-items:center;justify-content:center;gap:14px;">
          ${photoHTML}
          <div>
            <h1 style="font-size:1.9em;line-height:1.15;">${escapeHTML(p.fullName || 'Your Name')}</h1>
            <div style="font-weight:600;margin-top:3px;">${escapeHTML(p.title || '')}</div>
          </div>
        </div>
        <div style="font-size:0.85em;margin-top:8px;opacity:0.9;">${contactParts.join(' | ')}</div>
      </header>
      ${visibleSections.map(renderStandardBlock).join('')}
    </div>`;
}
