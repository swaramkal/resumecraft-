import { showToast } from './utils.js';

export async function downloadElementAsPDF(element, filename = 'ResumeCraft_Resume.pdf') {
  if (!element) {
    showToast('Resume preview element not found.', 'error');
    return;
  }
  if (typeof html2pdf === 'undefined') {
    showToast('PDF engine still loading. Please try again in a second.', 'error');
    return;
  }

  showToast('Generating high-resolution A4 PDF...', 'info');
  const scaler = element.closest('.a4-scaler');
  const prevTransform = scaler ? scaler.style.transform : '';
  if (scaler) scaler.style.transform = 'none';

  const opt = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().set(opt).from(element).save();
    showToast('PDF downloaded successfully!', 'success');
  } catch (err) {
    console.error('PDF export error:', err);
    showToast('Failed to export PDF. Please check console.', 'error');
  } finally {
    if (scaler) scaler.style.transform = prevTransform;
  }
}
