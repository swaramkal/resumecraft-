import { STORAGE_KEYS, loadData, saveData } from './storage.js';
import { escapeHTML, showToast, uid } from './utils.js';

export function initJobTrackerPage() {
  const form = document.getElementById('jobForm');
  const tbody = document.getElementById('jobsTableBody');
  if (!form || !tbody) return;

  let jobs = loadData(STORAGE_KEYS.JOBS, [
    {
      id: 'job_demo_1',
      company: 'CloudNova Technologies',
      title: 'Frontend Engineer',
      location: 'Bengaluru / Hybrid',
      date: '2026-11-12',
      url: 'https://example.com/careers',
      salary: '₹12L – ₹16L',
      status: 'Interview',
      notes: 'Completed technical screening; system design round scheduled.'
    }
  ]);

  let editId = null;

  function render() {
    const search = (document.getElementById('jobSearchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('jobStatusFilter')?.value || 'All';
    const sortOrder = document.getElementById('jobSortSelect')?.value || 'newest';

    const stats = { total: jobs.length, Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
    jobs.forEach(j => { if (stats[j.status] !== undefined) stats[j.status]++; });

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statApplied').textContent = stats.Applied;
    document.getElementById('statInterview').textContent = stats.Interview;
    document.getElementById('statOffer').textContent = stats.Offer;
    document.getElementById('statRejected').textContent = stats.Rejected;

    let filtered = jobs.filter(j => {
      const matchSearch = `${j.company} ${j.title} ${j.location}`.toLowerCase().includes(search);
      const matchStatus = statusFilter === 'All' || j.status === statusFilter;
      return matchSearch && matchStatus;
    });

    filtered.sort((a, b) => sortOrder === 'newest'
      ? (b.date || '').localeCompare(a.date || '')
      : (a.date || '').localeCompare(b.date || '')
    );

    tbody.innerHTML = filtered.length ? filtered.map(j => `
      <tr>
        <td><strong>${escapeHTML(j.company)}</strong><br><small style="color:var(--text-secondary);">${escapeHTML(j.location || '')}</small></td>
        <td>${escapeHTML(j.title)} ${j.url ? `<a href="${escapeHTML(j.url)}" target="_blank" style="color:var(--accent-cyan);font-size:0.8rem;">↗</a>` : ''}</td>
        <td>${escapeHTML(j.date || '')}</td>
        <td>${escapeHTML(j.salary || '—')}</td>
        <td><span class="status-badge st-${escapeHTML(j.status)}">${escapeHTML(j.status)}</span></td>
        <td style="max-width:220px;font-size:0.84rem;color:var(--text-secondary);">${escapeHTML(j.notes || '')}</td>
        <td>
          <button class="btn btn-secondary btn-sm" data-edit="${j.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-del="${j.id}">Delete</button>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">No matching job applications found.</td></tr>`;

    tbody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = jobs.find(x => x.id === btn.dataset.edit);
        if (!item) return;
        editId = item.id;
        Object.entries(item).forEach(([k, v]) => {
          if (form.elements[k]) form.elements[k].value = v;
        });
        document.getElementById('jobSubmitBtn').textContent = 'Update Application';
      });
    });

    tbody.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this job application record?')) return;
        jobs = jobs.filter(x => x.id !== btn.dataset.del);
        saveData(STORAGE_KEYS.JOBS, jobs);
        render();
        showToast('Application removed.', 'info');
      });
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const record = Object.fromEntries(new FormData(form).entries());
    if (editId) {
      const idx = jobs.findIndex(x => x.id === editId);
      if (idx !== -1) jobs[idx] = { ...jobs[idx], ...record };
      editId = null;
      document.getElementById('jobSubmitBtn').textContent = 'Add Application';
      showToast('Application updated.', 'success');
    } else {
      jobs.unshift({ id: uid('job'), ...record });
      showToast('Job application saved.', 'success');
    }
    saveData(STORAGE_KEYS.JOBS, jobs);
    form.reset();
    render();
  });

  ['jobSearchInput', 'jobStatusFilter', 'jobSortSelect'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', render);
  });

  render();
}
