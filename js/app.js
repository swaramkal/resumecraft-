import { DEFAULT_RESUME_DATA } from './data.js';
import { STORAGE_KEYS, loadData, saveData, validateResumeSchema } from './storage.js';
import { renderResumeHTML } from './template-engine.js';
import { RESUME_TEMPLATES } from './template-definitions.js';
import { downloadElementAsPDF } from './pdf-generator.js';
import { deepClone, escapeHTML, showToast, uid } from './utils.js';

// Shared Navigation & FAQ initialization across all pages
export function initGlobalUI() {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.classList.toggle('open');
    });
  });
}

// Builder Controller
export function initBuilderPage() {
  const editorContainer = document.getElementById('editorSectionsContainer');
  const previewSheet = document.getElementById('resumePreviewSheet');
  if (!editorContainer || !previewSheet) return;

  let state = loadData(STORAGE_KEYS.RESUME, DEFAULT_RESUME_DATA);
  const selectedTpl = localStorage.getItem(STORAGE_KEYS.TEMPLATE);
  if (selectedTpl) {
    state.templateId = selectedTpl;
  }

  let undoStack = [];
  let redoStack = [];

  function pushHistory() {
    undoStack.push(deepClone(state));
    if (undoStack.length > 35) undoStack.shift();
    redoStack = [];
  }

  function commit(reRenderEditor = false) {
    saveData(STORAGE_KEYS.RESUME, state);
    renderPreview();
    if (reRenderEditor) renderEditor();
  }

  function renderPreview() {
    previewSheet.classList.toggle('compact-mode', Boolean(state.compactMode));
    previewSheet.innerHTML = renderResumeHTML(state);
    checkPageOverflow();
  }

  function checkPageOverflow() {
    const banner = document.getElementById('overflowBanner');
    if (!banner) return;
    if (previewSheet.scrollHeight > 1135) {
      banner.classList.add('visible');
    } else {
      banner.classList.remove('visible');
    }
  }

  function scalePreviewForViewport() {
    const pane = document.getElementById('previewPane');
    const scaler = document.getElementById('a4Scaler');
    if (!pane || !scaler) return;
    const available = pane.clientWidth - 40;
    const scale = available < 794 ? Math.max(0.38, available / 794) : 1;
    scaler.style.transform = `scale(${scale})`;
    scaler.style.height = `${previewSheet.offsetHeight * scale}px`;
  }

  function renderEditor() {
    const p = state.personal;
    let html = `
      <div class="section-card">
        <div class="section-card-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="section-card-title">Personal Information</span>
          <span style="font-size:0.8rem;color:var(--text-muted);">Toggle</span>
        </div>
        <div class="section-card-body">
          <div class="grid-2">
            <div class="form-group"><label>Full Name</label><input class="form-control" data-personal="fullName" value="${escapeHTML(p.fullName)}"></div>
            <div class="form-group"><label>Professional Title</label><input class="form-control" data-personal="title" value="${escapeHTML(p.title)}"></div>
            <div class="form-group"><label>Email</label><input class="form-control" data-personal="email" value="${escapeHTML(p.email)}"></div>
            <div class="form-group"><label>Phone</label><input class="form-control" data-personal="phone" value="${escapeHTML(p.phone)}"></div>
            <div class="form-group"><label>Location</label><input class="form-control" data-personal="location" value="${escapeHTML(p.location)}"></div>
            <div class="form-group"><label>LinkedIn URL</label><input class="form-control" data-personal="linkedin" value="${escapeHTML(p.linkedin)}"></div>
            <div class="form-group"><label>GitHub URL</label><input class="form-control" data-personal="github" value="${escapeHTML(p.github)}"></div>
            <div class="form-group"><label>Personal Website</label><input class="form-control" data-personal="website" value="${escapeHTML(p.website)}"></div>
          </div>
          <div class="form-group">
            <label>Profile Photo (Optional)</label>
            <input type="file" id="profilePhotoInput" accept="image/*" class="form-control">
          </div>
        </div>
      </div>
    `;

    state.sections.forEach((sec, idx) => {
      html += `
        <div class="section-card" data-sec-idx="${idx}">
          <div class="section-card-header">
            <div class="section-card-title" onclick="this.closest('.section-card').classList.toggle('collapsed')">
              <span>${escapeHTML(sec.title)}</span>
              ${!sec.visible ? '<span class="badge" style="font-size:0.7rem;">Hidden</span>' : ''}
            </div>
            <div class="section-card-controls">
              <button class="icon-btn" title="Move Up" data-action="up" data-idx="${idx}">↑</button>
              <button class="icon-btn" title="Move Down" data-idx="${idx}" data-action="down">↓</button>
              <button class="icon-btn" title="Toggle Visibility" data-idx="${idx}" data-action="toggle">${sec.visible ? '👁' : '🚫'}</button>
              <button class="icon-btn" title="Delete Section" data-idx="${idx}" data-action="delete-sec">✕</button>
            </div>
          </div>
          <div class="section-card-body">
            <div class="form-group">
              <label>Section Heading</label>
              <input class="form-control" data-sec-title="${idx}" value="${escapeHTML(sec.title)}">
            </div>
            ${renderSectionEditorFields(sec, idx)}
          </div>
        </div>
      `;
    });

    editorContainer.innerHTML = html;
    bindEditorEvents();
  }

  function renderSectionEditorFields(sec, idx) {
    if (sec.type === 'summary' || sec.type === 'custom') {
      return `<div class="form-group"><label>Content</label><textarea class="form-control" data-sec-content="${idx}">${escapeHTML(sec.content || '')}</textarea></div>`;
    }
    if (sec.type === 'tags') {
      return `<div class="form-group"><label>Items (comma-separated)</label><input class="form-control" data-sec-tags="${idx}" value="${escapeHTML((sec.tags || []).join(', '))}"></div>`;
    }
    if (sec.type === 'list') {
      return `<div class="form-group"><label>Bullet Items (one per line)</label><textarea class="form-control" data-sec-list="${idx}">${escapeHTML((sec.items || []).join('\n'))}</textarea></div>`;
    }
    if (sec.type === 'experience') {
      return (sec.items || []).map((item, i) => `
        <div class="entry-item">
          <div class="grid-2">
            <div class="form-group"><label>Role / Title</label><input class="form-control" data-item-field="role" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.role || '')}"></div>
            <div class="form-group"><label>Organization</label><input class="form-control" data-item-field="company" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.company || '')}"></div>
            <div class="form-group"><label>Start Date</label><input class="form-control" data-item-field="startDate" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.startDate || '')}"></div>
            <div class="form-group"><label>End Date</label><input class="form-control" data-item-field="endDate" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.endDate || '')}"></div>
          </div>
          <div class="form-group"><label>Location</label><input class="form-control" data-item-field="location" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.location || '')}"></div>
          <div class="form-group"><label>Highlights (one bullet per line)</label><textarea class="form-control" data-item-field="bullets" data-idx="${idx}" data-i="${i}">${escapeHTML(item.bullets || '')}</textarea></div>
          <button class="btn btn-danger btn-sm" data-action="del-item" data-idx="${idx}" data-i="${i}">Remove Entry</button>
        </div>
      `).join('') + `<button class="btn btn-secondary btn-sm" data-action="add-item" data-idx="${idx}">+ Add Entry</button>`;
    }
    if (sec.type === 'education') {
      return (sec.items || []).map((item, i) => `
        <div class="entry-item">
          <div class="grid-2">
            <div class="form-group"><label>Degree / Program</label><input class="form-control" data-item-field="degree" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.degree || '')}"></div>
            <div class="form-group"><label>Institution</label><input class="form-control" data-item-field="institution" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.institution || '')}"></div>
            <div class="form-group"><label>Year</label><input class="form-control" data-item-field="year" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.year || '')}"></div>
            <div class="form-group"><label>GPA / Percentage</label><input class="form-control" data-item-field="score" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.score || '')}"></div>
          </div>
          <button class="btn btn-danger btn-sm" data-action="del-item" data-idx="${idx}" data-i="${i}">Remove Education</button>
        </div>
      `).join('') + `<button class="btn btn-secondary btn-sm" data-action="add-item" data-idx="${idx}">+ Add Education</button>`;
    }
    if (sec.type === 'projects') {
      return (sec.items || []).map((item, i) => `
        <div class="entry-item">
          <div class="grid-2">
            <div class="form-group"><label>Project Name</label><input class="form-control" data-item-field="name" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.name || '')}"></div>
            <div class="form-group"><label>Tech Stack</label><input class="form-control" data-item-field="tech" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.tech || '')}"></div>
          </div>
          <div class="form-group"><label>Project Link</label><input class="form-control" data-item-field="link" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.link || '')}"></div>
          <div class="form-group"><label>Description</label><textarea class="form-control" data-item-field="description" data-idx="${idx}" data-i="${i}">${escapeHTML(item.description || '')}</textarea></div>
          <button class="btn btn-danger btn-sm" data-action="del-item" data-idx="${idx}" data-i="${i}">Remove Project</button>
        </div>
      `).join('') + `<button class="btn btn-secondary btn-sm" data-action="add-item" data-idx="${idx}">+ Add Project</button>`;
    }
    if (sec.type === 'certifications') {
      return (sec.items || []).map((item, i) => `
        <div class="entry-item">
          <div class="grid-2">
            <div class="form-group"><label>Certification</label><input class="form-control" data-item-field="name" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.name || '')}"></div>
            <div class="form-group"><label>Issuer</label><input class="form-control" data-item-field="issuer" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.issuer || '')}"></div>
          </div>
          <div class="form-group"><label>Year</label><input class="form-control" data-item-field="year" data-idx="${idx}" data-i="${i}" value="${escapeHTML(item.year || '')}"></div>
          <button class="btn btn-danger btn-sm" data-action="del-item" data-idx="${idx}" data-i="${i}">Remove Certification</button>
        </div>
      `).join('') + `<button class="btn btn-secondary btn-sm" data-action="add-item" data-idx="${idx}">+ Add Certification</button>`;
    }
    return '';
  }

  function bindEditorEvents() {
    editorContainer.querySelectorAll('[data-personal]').forEach(inp => {
      inp.addEventListener('input', e => {
        pushHistory();
        state.personal[e.target.dataset.personal] = e.target.value;
        commit(false);
      });
    });

    const photoInput = document.getElementById('profilePhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          pushHistory();
          state.personal.photo = reader.result;
          commit(false);
          showToast('Profile photo updated.', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    editorContainer.querySelectorAll('[data-sec-title]').forEach(inp => {
      inp.addEventListener('input', e => {
        pushHistory();
        state.sections[Number(e.target.dataset.secTitle)].title = e.target.value;
        commit(false);
      });
    });

    editorContainer.querySelectorAll('[data-sec-content]').forEach(inp => {
      inp.addEventListener('input', e => {
        pushHistory();
        state.sections[Number(e.target.dataset.secContent)].content = e.target.value;
        commit(false);
      });
    });

    editorContainer.querySelectorAll('[data-sec-tags]').forEach(inp => {
      inp.addEventListener('input', e => {
        pushHistory();
        state.sections[Number(e.target.dataset.secTags)].tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
        commit(false);
      });
    });

    editorContainer.querySelectorAll('[data-sec-list]').forEach(inp => {
      inp.addEventListener('input', e => {
        pushHistory();
        state.sections[Number(e.target.dataset.secList)].items = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
        commit(false);
      });
    });

    editorContainer.querySelectorAll('[data-item-field]').forEach(inp => {
      inp.addEventListener('input', e => {
        pushHistory();
        const { idx, i, itemField } = e.target.dataset;
        state.sections[Number(idx)].items[Number(i)][itemField] = e.target.value;
        commit(false);
      });
    });

    editorContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const idx = Number(btn.dataset.idx);
        const i = Number(btn.dataset.i);
        pushHistory();

        if (action === 'up' && idx > 0) {
          [state.sections[idx - 1], state.sections[idx]] = [state.sections[idx], state.sections[idx - 1]];
        } else if (action === 'down' && idx < state.sections.length - 1) {
          [state.sections[idx + 1], state.sections[idx]] = [state.sections[idx], state.sections[idx + 1]];
        } else if (action === 'toggle') {
          state.sections[idx].visible = !state.sections[idx].visible;
        } else if (action === 'delete-sec') {
          if (confirm('Remove this section from your resume?')) {
            state.sections.splice(idx, 1);
          }
        } else if (action === 'del-item') {
          state.sections[idx].items.splice(i, 1);
        } else if (action === 'add-item') {
          const type = state.sections[idx].type;
          if (type === 'experience') state.sections[idx].items.push({ id: uid('exp'), role: 'Role', company: 'Company', location: '', startDate: '2025', endDate: 'Present', bullets: 'Key achievement' });
          if (type === 'education') state.sections[idx].items.push({ id: uid('edu'), degree: 'Degree', institution: 'University', location: '', year: '2025', score: '' });
          if (type === 'projects') state.sections[idx].items.push({ id: uid('proj'), name: 'New Project', tech: 'Tech Stack', link: '', description: 'Project summary' });
          if (type === 'certifications') state.sections[idx].items.push({ id: uid('cert'), name: 'Certification Name', issuer: 'Issuer', year: '2025' });
        }
        commit(true);
      });
    });
  }

  // Toolbar controls
  const tplSelect = document.getElementById('builderTemplateSelect');
  if (tplSelect) {
    tplSelect.innerHTML = RESUME_TEMPLATES.map(t => `<option value="${t.id}" ${t.id === state.templateId ? 'selected' : ''}>${t.name} (${t.category})</option>`).join('');
    tplSelect.addEventListener('change', e => {
      pushHistory();
      state.templateId = e.target.value;
      localStorage.setItem(STORAGE_KEYS.TEMPLATE, state.templateId);
      commit(false);
    });
  }

  const colorPicker = document.getElementById('accentColorPicker');
  if (colorPicker) {
    colorPicker.value = state.accentColor || '#2563eb';
    colorPicker.addEventListener('input', e => {
      state.accentColor = e.target.value;
      commit(false);
    });
  }

  document.getElementById('undoBtn')?.addEventListener('click', () => {
    if (!undoStack.length) return showToast('Nothing to undo.', 'info');
    redoStack.push(deepClone(state));
    state = undoStack.pop();
    commit(true);
  });

  document.getElementById('redoBtn')?.addEventListener('click', () => {
    if (!redoStack.length) return showToast('Nothing to redo.', 'info');
    undoStack.push(deepClone(state));
    state = redoStack.pop();
    commit(true);
  });

  document.getElementById('addCustomSectionBtn')?.addEventListener('click', () => {
    const title = prompt('Enter custom section heading:', 'Additional Highlights');
    if (!title) return;
    pushHistory();
    state.sections.push({
      id: uid('custom'),
      type: 'custom',
      title: title.trim(),
      visible: true,
      content: 'Add details for this custom section here.'
    });
    commit(true);
    showToast('Custom section added.', 'success');
  });

  document.getElementById('compactToggleBtn')?.addEventListener('click', () => {
    state.compactMode = !state.compactMode;
    commit(false);
    showToast(state.compactMode ? 'Compact one-page spacing enabled.' : 'Standard spacing restored.', 'info');
  });

  document.getElementById('clearResumeBtn')?.addEventListener('click', () => {
    if (!confirm('Reset resume to default starter template? This will replace current entries.')) return;
    pushHistory();
    state = deepClone(DEFAULT_RESUME_DATA);
    commit(true);
    showToast('Resume reset to defaults.', 'info');
  });

  document.getElementById('saveResumeBtn')?.addEventListener('click', () => {
    saveData(STORAGE_KEYS.RESUME, state);
    showToast('Resume saved to browser storage.', 'success');
  });

  document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(state.personal.fullName || 'resume').replace(/\s+/g, '_')}_ResumeCraft.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON exported.', 'success');
  });

  const importInput = document.getElementById('importJsonInput');
  document.getElementById('importJsonBtn')?.addEventListener('click', () => importInput?.click());
  importInput?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!validateResumeSchema(parsed)) {
          return showToast('Invalid ResumeCraft JSON schema.', 'error');
        }
        pushHistory();
        state = parsed;
        commit(true);
        showToast('Resume JSON imported successfully!', 'success');
      } catch {
        showToast('Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
    const filename = `${(state.personal.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
    downloadElementAsPDF(previewSheet, filename);
  });

  document.getElementById('printResumeBtn')?.addEventListener('click', () => window.print());

  // Mobile toggle between Editor and Live Preview
  const mobileToggle = document.getElementById('mobileViewToggle');
  const editorPane = document.getElementById('editorPane');
  const previewPane = document.getElementById('previewPane');
  let showingPreviewOnMobile = false;
  mobileToggle?.addEventListener('click', () => {
    showingPreviewOnMobile = !showingPreviewOnMobile;
    editorPane.classList.toggle('mobile-hidden', showingPreviewOnMobile);
    previewPane.classList.toggle('mobile-hidden', !showingPreviewOnMobile);
    mobileToggle.textContent = showingPreviewOnMobile ? '✏️ Back to Editor' : '👁 Live A4 Preview';
    scalePreviewForViewport();
  });

  renderEditor();
  renderPreview();
  scalePreviewForViewport();
  window.addEventListener('resize', scalePreviewForViewport);
}
