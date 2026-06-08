
const dom = {
  leftInput: document.getElementById('leftInput'),
  rightInput: document.getElementById('rightInput'),
  leftFile: document.getElementById('leftFile'),
  rightFile: document.getElementById('rightFile'),
  leftValidityBadge: document.getElementById('leftValidityBadge'),
  rightValidityBadge: document.getElementById('rightValidityBadge'),
  leftValidationMsg: document.getElementById('leftValidationMsg'),
  rightValidationMsg: document.getElementById('rightValidationMsg'),
  leftMeta: document.getElementById('leftMeta'),
  rightMeta: document.getElementById('rightMeta'),
  leftDiff: document.getElementById('leftDiff'),
  rightDiff: document.getElementById('rightDiff'),
  globalStatus: document.getElementById('globalStatus'),
  diffSummary: document.getElementById('diffSummary'),
  compareBtn: document.getElementById('compareBtn'),
  backBtn: document.getElementById('backBtn'),
  beautifyBtn: document.getElementById('beautifyBtn'),
  minifyBtn: document.getElementById('minifyBtn'),
  clearBtn: document.getElementById('clearBtn'),
  leftBeautifyBtn: document.getElementById('leftBeautifyBtn'),
  rightBeautifyBtn: document.getElementById('rightBeautifyBtn'),
  leftMinifyBtn: document.getElementById('leftMinifyBtn'),
  rightMinifyBtn: document.getElementById('rightMinifyBtn'),
  editorSection: document.getElementById('editorSection'),
  resultSection: document.getElementById('resultSection')
};

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function setGlobalStatus(message = '', type = '') {
  if (!message) {
    dom.globalStatus.textContent = '';
    dom.globalStatus.className = 'global-status hidden';
    return;
  }
  dom.globalStatus.textContent = message;
  dom.globalStatus.className = `global-status ${type}`;
}

function updateBadge(badgeEl, state, text) {
  badgeEl.className = 'badge';
  if (state === 'valid') badgeEl.classList.add('badge-valid');
  else if (state === 'invalid') badgeEl.classList.add('badge-invalid');
  else badgeEl.classList.add('badge-neutral');
  badgeEl.textContent = text;
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).sort().forEach((key) => out[key] = sortKeysDeep(value[key]));
    return out;
  }
  return value;
}

function formatBytesFromText(text) { return `${new Blob([text]).size.toLocaleString()} bytes`; }
function getStats(parsed) {
  if (Array.isArray(parsed)) return `Type: Array | Items: ${parsed.length}`;
  if (parsed && typeof parsed === 'object') return `Type: Object | Keys: ${Object.keys(parsed).length}`;
  return `Type: ${typeof parsed}`;
}

function validatePanel(side) {
  const input = side === 'left' ? dom.leftInput : dom.rightInput;
  const badge = side === 'left' ? dom.leftValidityBadge : dom.rightValidityBadge;
  const msg = side === 'left' ? dom.leftValidationMsg : dom.rightValidationMsg;
  const meta = side === 'left' ? dom.leftMeta : dom.rightMeta;
  const text = input.value.trim();

  if (!text) {
    updateBadge(badge, 'neutral', 'Waiting for input');
    msg.textContent = 'No JSON entered yet.';
    meta.textContent = '';
    return { valid: false, empty: true };
  }

  try {
    const parsed = JSON.parse(text);
    updateBadge(badge, 'valid', 'Valid JSON');
    msg.textContent = 'JSON is valid.';
    meta.textContent = `${getStats(parsed)} | ${formatBytesFromText(text)}`;
    return { valid: true, parsed };
  } catch (error) {
    updateBadge(badge, 'invalid', 'Invalid JSON');
    msg.textContent = error.message;
    meta.textContent = formatBytesFromText(text);
    return { valid: false, error };
  }
}

const debouncedValidateLeft = debounce(() => validatePanel('left'));
const debouncedValidateRight = debounce(() => validatePanel('right'));
dom.leftInput.addEventListener('input', debouncedValidateLeft);
dom.rightInput.addEventListener('input', debouncedValidateRight);

function loadFile(evt, targetInput, side) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    targetInput.value = e.target.result;
    validatePanel(side);
    setGlobalStatus(`${file.name} loaded into ${side === 'left' ? 'File 1' : 'File 2'}.`, 'success');
  };
  reader.onerror = () => setGlobalStatus(`Unable to read file: ${file.name}`, 'error');
  reader.readAsText(file);
}

dom.leftFile.addEventListener('change', (e) => loadFile(e, dom.leftInput, 'left'));
dom.rightFile.addEventListener('change', (e) => loadFile(e, dom.rightInput, 'right'));

function transformInput(side, mode) {
  const input = side === 'left' ? dom.leftInput : dom.rightInput;
  const result = validatePanel(side);
  if (!result.valid) {
    setGlobalStatus(`Cannot ${mode} ${side === 'left' ? 'File 1' : 'File 2'} because the JSON is invalid.`, 'error');
    return false;
  }
  const normalized = sortKeysDeep(result.parsed);
  input.value = mode === 'beautify' ? JSON.stringify(normalized, null, 2) : JSON.stringify(normalized);
  validatePanel(side);
  return true;
}

function transformBoth(mode) {
  const leftOk = transformInput('left', mode);
  const rightOk = transformInput('right', mode);
  if (leftOk && rightOk) setGlobalStatus(`Both files ${mode === 'beautify' ? 'beautified' : 'minified'} successfully.`, 'success');
}

dom.leftBeautifyBtn.addEventListener('click', () => { if (transformInput('left', 'beautify')) setGlobalStatus('File 1 beautified successfully.', 'success'); });
dom.rightBeautifyBtn.addEventListener('click', () => { if (transformInput('right', 'beautify')) setGlobalStatus('File 2 beautified successfully.', 'success'); });
dom.leftMinifyBtn.addEventListener('click', () => { if (transformInput('left', 'minify')) setGlobalStatus('File 1 minified successfully.', 'success'); });
dom.rightMinifyBtn.addEventListener('click', () => { if (transformInput('right', 'minify')) setGlobalStatus('File 2 minified successfully.', 'success'); });
dom.beautifyBtn.addEventListener('click', () => transformBoth('beautify'));
dom.minifyBtn.addEventListener('click', () => transformBoth('minify'));

function resetCompareView() {
  dom.leftDiff.className = 'diff-content empty-state';
  dom.rightDiff.className = 'diff-content empty-state';
  dom.leftDiff.textContent = 'Run a comparison to see File 1 differences.';
  dom.rightDiff.textContent = 'Run a comparison to see File 2 differences.';
  dom.diffSummary.textContent = 'No comparison run yet.';
}

dom.clearBtn.addEventListener('click', () => {
  dom.leftInput.value = '';
  dom.rightInput.value = '';
  dom.leftFile.value = '';
  dom.rightFile.value = '';
  validatePanel('left');
  validatePanel('right');
  resetCompareView();
  showEditors();
  setGlobalStatus('', '');
});

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function syntaxHighlight(line) {
  let value = escapeHtml(line);
  value = value.replace(/(&quot;.*?&quot;)(\s*:)/g, '<span class="json-key">$1</span><span class="json-punct">$2</span>');
  value = value.replace(/(:\s*)(&quot;.*?&quot;)/g, '$1<span class="json-string">$2</span>');
  value = value.replace(/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span class="json-number">$1</span>');
  value = value.replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>');
  value = value.replace(/\bnull\b/g, '<span class="json-null">null</span>');
  value = value.replace(/([{}\[\],])/g, '<span class="json-punct">$1</span>');
  return value;
}
function buildLcsMatrix(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      matrix[i][j] = a[i] === b[j] ? matrix[i + 1][j + 1] + 1 : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
    }
  }
  return matrix;
}
function backtrackDiff(a, b, matrix) {
  let i = 0, j = 0;
  const ops = [];
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ type: 'same', left: a[i], right: b[j] }); i++; j++;
    } else if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      ops.push({ type: 'removed', left: a[i], right: '' }); i++;
    } else {
      ops.push({ type: 'added', left: '', right: b[j] }); j++;
    }
  }
  while (i < a.length) ops.push({ type: 'removed', left: a[i++], right: '' });
  while (j < b.length) ops.push({ type: 'added', left: '', right: b[j++] });
  const refined = [];
  for (let idx = 0; idx < ops.length; idx++) {
    const current = ops[idx], next = ops[idx + 1];
    if (current && next && current.type === 'removed' && next.type === 'added') {
      refined.push({ type: 'changed', left: current.left, right: next.right }); idx++;
    } else refined.push(current);
  }
  return refined;
}
function renderTable(target, ops, side) {
  let html = '<table class="diff-table">';
  let lineNo = 1;
  for (const op of ops) {
    const sideText = side === 'left' ? op.left : op.right;
    const cssClass = op.type === 'same' ? 'same' : op.type;
    const number = sideText ? lineNo++ : '';
    html += `\n<tr><td class="line-no">${number}</td><td class="code-cell ${cssClass}">${sideText ? syntaxHighlight(sideText) : '<span class="placeholder">&nbsp;</span>'}</td></tr>`;
  }
  html += '\n</table>';
  target.className = 'diff-content';
  target.innerHTML = html;
}

let syncLock = false;
function syncScroll(source, target) {
  if (syncLock) return;
  syncLock = true;
  const maxSourceTop = source.scrollHeight - source.clientHeight;
  const maxTargetTop = target.scrollHeight - target.clientHeight;
  const maxSourceLeft = source.scrollWidth - source.clientWidth;
  const maxTargetLeft = target.scrollWidth - target.clientWidth;

  target.scrollTop = maxSourceTop > 0 ? (source.scrollTop / maxSourceTop) * maxTargetTop : 0;
  target.scrollLeft = maxSourceLeft > 0 ? (source.scrollLeft / maxSourceLeft) * maxTargetLeft : 0;
  requestAnimationFrame(() => { syncLock = false; });
}

function attachSynchronizedScroll() {
  const left = dom.leftDiff;
  const right = dom.rightDiff;
  left.onscroll = () => syncScroll(left, right);
  right.onscroll = () => syncScroll(right, left);
}

function showResults() {
  dom.editorSection.classList.add('hidden');
  dom.resultSection.classList.remove('hidden');
  dom.backBtn.classList.remove('hidden');
  dom.beautifyBtn.classList.add('hidden');
  dom.minifyBtn.classList.add('hidden');
}
function showEditors() {
  dom.resultSection.classList.add('hidden');
  dom.editorSection.classList.remove('hidden');
  dom.backBtn.classList.add('hidden');
  dom.beautifyBtn.classList.remove('hidden');
  dom.minifyBtn.classList.remove('hidden');
}

dom.backBtn.addEventListener('click', showEditors);

function compareJson() {
  const left = validatePanel('left');
  const right = validatePanel('right');
  if (!left.valid || !right.valid) {
    setGlobalStatus('Both panels must contain valid JSON before comparison.', 'error');
    return;
  }
  const leftFormatted = JSON.stringify(sortKeysDeep(left.parsed), null, 2).split('\n');
  const rightFormatted = JSON.stringify(sortKeysDeep(right.parsed), null, 2).split('\n');
  const matrix = buildLcsMatrix(leftFormatted, rightFormatted);
  const ops = backtrackDiff(leftFormatted, rightFormatted, matrix);
  renderTable(dom.leftDiff, ops, 'left');
  renderTable(dom.rightDiff, ops, 'right');
  const counts = ops.reduce((acc, item) => { acc[item.type] = (acc[item.type] || 0) + 1; return acc; }, { same: 0, added: 0, removed: 0, changed: 0 });
  dom.diffSummary.textContent = `Unchanged: ${counts.same || 0} | Added: ${counts.added || 0} | Removed: ${counts.removed || 0} | Changed: ${counts.changed || 0}`;
  showResults();
  attachSynchronizedScroll();
  setGlobalStatus('Comparison completed successfully.', 'success');
}

dom.compareBtn.addEventListener('click', compareJson);
validatePanel('left');
validatePanel('right');
showEditors();
