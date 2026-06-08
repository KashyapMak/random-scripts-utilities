
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
  globalStatus: document.getElementById('globalStatus'),
  validationSummary: document.getElementById('validationSummary'),
  errorList: document.getElementById('errorList'),
  jsonPreview: document.getElementById('jsonPreview'),
  generateSchemaBtn: document.getElementById('generateSchemaBtn'),
  validateBtn: document.getElementById('validateBtn'),
  beautifyBothBtn: document.getElementById('beautifyBothBtn'),
  clearBtn: document.getElementById('clearBtn'),
  leftBeautifyBtn: document.getElementById('leftBeautifyBtn'),
  rightBeautifyBtn: document.getElementById('rightBeautifyBtn'),
  inputsTab: document.getElementById('inputsTab'),
  resultsTab: document.getElementById('resultsTab'),
  inputsSection: document.getElementById('inputsSection'),
  resultsSection: document.getElementById('resultsSection'),
  resultsContent: document.getElementById('resultsContent'),
  resultsEmptyState: document.getElementById('resultsEmptyState')
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

function formatBytesFromText(text) {
  return `${new Blob([text]).size.toLocaleString()} bytes`;
}

function getStats(parsed) {
  if (Array.isArray(parsed)) return `Type: Array | Items: ${parsed.length}`;
  if (parsed && typeof parsed === 'object') return `Type: Object | Keys: ${Object.keys(parsed).length}`;
  return `Type: ${typeof parsed}`;
}

function validateTextArea(text, badge, msgEl, metaEl, emptyMsg) {
  const trimmed = text.trim();
  if (!trimmed) {
    updateBadge(badge, 'neutral', 'Waiting for input');
    msgEl.textContent = emptyMsg;
    metaEl.textContent = '';
    return { valid: false, empty: true };
  }
  try {
    const parsed = JSON.parse(trimmed);
    updateBadge(badge, 'valid', 'Valid JSON');
    msgEl.textContent = 'Valid JSON structure.';
    metaEl.textContent = `${getStats(parsed)} | ${formatBytesFromText(trimmed)}`;
    return { valid: true, parsed };
  } catch (error) {
    updateBadge(badge, 'invalid', 'Invalid JSON');
    msgEl.textContent = error.message;
    metaEl.textContent = formatBytesFromText(trimmed);
    return { valid: false, error };
  }
}

function validateLeft() {
  return validateTextArea(dom.leftInput.value, dom.leftValidityBadge, dom.leftValidationMsg, dom.leftMeta, 'No JSON entered yet.');
}

function validateRight() {
  return validateTextArea(dom.rightInput.value, dom.rightValidityBadge, dom.rightValidationMsg, dom.rightMeta, 'No schema entered yet.');
}

const debouncedValidateLeft = debounce(validateLeft);
const debouncedValidateRight = debounce(validateRight);
dom.leftInput.addEventListener('input', debouncedValidateLeft);
dom.rightInput.addEventListener('input', debouncedValidateRight);

function showInputsTab() {
  dom.inputsTab.classList.add('active');
  dom.resultsTab.classList.remove('active');
  dom.inputsSection.classList.remove('hidden');
  dom.resultsSection.classList.add('hidden');
}

function showResultsTab() {
  dom.resultsTab.classList.add('active');
  dom.inputsTab.classList.remove('active');
  dom.resultsSection.classList.remove('hidden');
  dom.inputsSection.classList.add('hidden');
}

dom.inputsTab.addEventListener('click', showInputsTab);
dom.resultsTab.addEventListener('click', showResultsTab);

function setResultsVisibility(hasResults) {
  if (hasResults) {
    dom.resultsContent.classList.remove('hidden');
    dom.resultsEmptyState.classList.add('hidden');
  } else {
    dom.resultsContent.classList.add('hidden');
    dom.resultsEmptyState.classList.remove('hidden');
  }
}

function loadFile(evt, targetInput, sideLabel, validateFn) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    targetInput.value = e.target.result;
    validateFn();
    setGlobalStatus(`${file.name} loaded into ${sideLabel}.`, 'success');
  };
  reader.onerror = () => setGlobalStatus(`Unable to read file: ${file.name}`, 'error');
  reader.readAsText(file);
}

dom.leftFile.addEventListener('change', (e) => loadFile(e, dom.leftInput, 'JSON Input', validateLeft));
dom.rightFile.addEventListener('change', (e) => loadFile(e, dom.rightInput, 'Schema', validateRight));

function beautifyTextarea(inputEl, validateFn, label) {
  const result = validateFn();
  if (!result.valid) {
    setGlobalStatus(`Cannot beautify ${label} because it is not valid JSON.`, 'error');
    return false;
  }
  inputEl.value = JSON.stringify(result.parsed, null, 2);
  validateFn();
  return true;
}

dom.leftBeautifyBtn.addEventListener('click', () => {
  if (beautifyTextarea(dom.leftInput, validateLeft, 'JSON Input')) setGlobalStatus('JSON Input beautified successfully.', 'success');
});
dom.rightBeautifyBtn.addEventListener('click', () => {
  if (beautifyTextarea(dom.rightInput, validateRight, 'Schema')) setGlobalStatus('Schema beautified successfully.', 'success');
});
dom.beautifyBothBtn.addEventListener('click', () => {
  const leftOk = beautifyTextarea(dom.leftInput, validateLeft, 'JSON Input');
  const rightOk = beautifyTextarea(dom.rightInput, validateRight, 'Schema');
  if (leftOk && rightOk) setGlobalStatus('Both sides beautified successfully.', 'success');
});

function clearResults() {
  dom.validationSummary.className = 'summary-box summary-neutral';
  dom.validationSummary.textContent = 'Run validation to see results.';
  dom.errorList.className = 'error-list empty-state';
  dom.errorList.textContent = 'No validation run yet.';
  dom.jsonPreview.className = 'preview-content empty-state';
  dom.jsonPreview.textContent = 'Run validation to highlight invalid parts in light red.';
  setResultsVisibility(false);
}

dom.clearBtn.addEventListener('click', () => {
  dom.leftInput.value = '';
  dom.rightInput.value = '';
  dom.leftFile.value = '';
  dom.rightFile.value = '';
  validateLeft();
  validateRight();
  clearResults();
  showInputsTab();
  setGlobalStatus('', '');
});

function generateSchemaFromSample(sample, title = 'GeneratedSchema') {
  function infer(value) {
    if (value === null) return { type: 'null' };
    if (Array.isArray(value)) {
      if (value.length === 0) return { type: 'array', items: {} };
      const itemSchemas = value.map(infer);
      const first = JSON.stringify(itemSchemas[0]);
      const same = itemSchemas.every((schema) => JSON.stringify(schema) === first);
      return { type: 'array', items: same ? itemSchemas[0] : { anyOf: mergeUniqueSchemas(itemSchemas) } };
    }
    switch (typeof value) {
      case 'string': return { type: 'string' };
      case 'number': return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
      case 'boolean': return { type: 'boolean' };
      case 'object': {
        const properties = {};
        const required = Object.keys(value);
        for (const key of required) properties[key] = infer(value[key]);
        return { type: 'object', properties, required, additionalProperties: false };
      }
      default: return {};
    }
  }
  function mergeUniqueSchemas(schemas) {
    const unique = [];
    const seen = new Set();
    for (const schema of schemas) {
      const key = JSON.stringify(schema);
      if (!seen.has(key)) { seen.add(key); unique.push(schema); }
    }
    return unique;
  }
  return { $schema: 'http://json-schema.org/draft-07/schema#', title, ...infer(sample) };
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

function toPointer(pathParts) {
  if (!pathParts.length) return '#';
  return '#/' + pathParts.map((part) => String(part).replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
}

function addError(errors, pathParts, message) {
  errors.push({ path: toPointer(pathParts), message });
}

function matchesType(value, type) {
  switch (type) {
    case 'null': return value === null;
    case 'array': return Array.isArray(value);
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'integer': return Number.isInteger(value);
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'string': return typeof value === 'string';
    case 'boolean': return typeof value === 'boolean';
    default: return true;
  }
}

function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function validateAgainstSchema(value, schema, pathParts = [], errors = []) {
  if (!schema || typeof schema !== 'object') return errors;

  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const branchErrors = schema.anyOf.map((branch) => {
      const temp = [];
      validateAgainstSchema(value, branch, pathParts, temp);
      return temp;
    });
    const hasSuccess = branchErrors.some((arr) => arr.length === 0);
    if (!hasSuccess) addError(errors, pathParts, 'Value does not match any of the allowed schemas.');
    return errors;
  }

  if (schema.const !== undefined && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    addError(errors, pathParts, `Value must exactly match const ${JSON.stringify(schema.const)}.`);
  }

  if (schema.enum && Array.isArray(schema.enum)) {
    const found = schema.enum.some((entry) => JSON.stringify(entry) === JSON.stringify(value));
    if (!found) addError(errors, pathParts, `Value must be one of: ${schema.enum.map((v) => JSON.stringify(v)).join(', ')}.`);
  }

  const allowedTypes = Array.isArray(schema.type) ? schema.type : (schema.type ? [schema.type] : []);
  if (allowedTypes.length) {
    const matches = allowedTypes.some((type) => matchesType(value, type));
    if (!matches) {
      addError(errors, pathParts, `Expected type ${allowedTypes.join(' or ')}, but found ${describeType(value)}.`);
      return errors;
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) addError(errors, pathParts, `String length must be at least ${schema.minLength}.`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) addError(errors, pathParts, `String length must be at most ${schema.maxLength}.`);
    if (schema.pattern) {
      try {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(value)) addError(errors, pathParts, `String must match pattern ${schema.pattern}.`);
      } catch {
        addError(errors, pathParts, `Invalid regex pattern in schema: ${schema.pattern}.`);
      }
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) addError(errors, pathParts, `Number must be >= ${schema.minimum}.`);
    if (schema.maximum !== undefined && value > schema.maximum) addError(errors, pathParts, `Number must be <= ${schema.maximum}.`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) addError(errors, pathParts, `Array must contain at least ${schema.minItems} item(s).`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) addError(errors, pathParts, `Array must contain at most ${schema.maxItems} item(s).`);
    if (schema.items) value.forEach((item, index) => validateAgainstSchema(item, schema.items, [...pathParts, index], errors));
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!(key in value)) addError(errors, [...pathParts, key], 'Required property is missing.');
    }
    const properties = schema.properties && typeof schema.properties === 'object' ? schema.properties : {};
    for (const [key, propSchema] of Object.entries(properties)) {
      if (key in value) validateAgainstSchema(value[key], propSchema, [...pathParts, key], errors);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) addError(errors, [...pathParts, key], 'Additional property is not allowed by the schema.');
      }
    }
  }
  return errors;
}

function renderErrorList(errors) {
  if (!errors.length) {
    dom.errorList.className = 'error-list empty-state';
    dom.errorList.textContent = 'No validation errors. JSON matches the schema.';
    return;
  }
  dom.errorList.className = 'error-list';
  dom.errorList.innerHTML = errors.map((err) => `\n    <div class="error-item">\n      <div class="error-path">${escapeHtml(err.path)}</div>\n      <div class="error-message">${escapeHtml(err.message)}</div>\n    </div>\n  `).join('');
}

function getInvalidPathSet(errors) {
  const set = new Set();
  for (const err of errors) {
    const path = err.path || '#';
    set.add(path);
    const parts = path === '#' ? [] : path.slice(2).split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
    while (parts.length > 0) {
      parts.pop();
      set.add(toPointer(parts));
    }
  }
  return set;
}

function renderPreview(value, invalidPaths) {
  const formatted = JSON.stringify(value, null, 2);
  const lines = formatted.split('\n');
  const htmlLines = [];
  const stack = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.match(/^\s*/)[0].length;
    const level = Math.floor(indent / 2);
    stack.length = Math.min(stack.length, level);

    let currentPath = '#';
    const propertyMatch = trimmed.match(/^"([^"]+)":/);
    if (propertyMatch) {
      const key = propertyMatch[1];
      stack[level] = key;
      stack.length = level + 1;
      currentPath = toPointer(stack);
    } else if (trimmed === '{' || trimmed === '[') {
      currentPath = toPointer(stack);
    } else if (trimmed.startsWith(']') || trimmed.startsWith('}')) {
      currentPath = toPointer(stack);
      if (stack.length > level) stack.length = level;
    } else {
      currentPath = toPointer(stack);
    }

    const isInvalid = invalidPaths.has(currentPath);
    htmlLines.push(`<span class="preview-line ${isInvalid ? 'invalid-line' : ''}">${syntaxHighlight(line)}</span>`);
  }

  dom.jsonPreview.className = 'preview-content';
  dom.jsonPreview.innerHTML = htmlLines.join('');
}

dom.generateSchemaBtn.addEventListener('click', () => {
  const left = validateLeft();
  if (!left.valid) {
    setGlobalStatus('Please provide valid JSON on the left side before generating schema.', 'error');
    return;
  }
  const title = Array.isArray(left.parsed) ? 'GeneratedArraySchema' : 'GeneratedObjectSchema';
  const schema = generateSchemaFromSample(left.parsed, title);
  dom.rightInput.value = JSON.stringify(schema, null, 2);
  validateRight();
  setGlobalStatus('Schema generated successfully from the left-side JSON.', 'success');
  showInputsTab();
});

dom.validateBtn.addEventListener('click', () => {
  const left = validateLeft();
  const right = validateRight();

  if (!left.valid) {
    setGlobalStatus('Please provide valid JSON on the left side before validation.', 'error');
    showInputsTab();
    return;
  }
  if (!right.valid) {
    setGlobalStatus('Please provide valid JSON Schema on the right side before validation.', 'error');
    showInputsTab();
    return;
  }

  const errors = validateAgainstSchema(left.parsed, right.parsed, [], []);
  renderErrorList(errors);
  const invalidPaths = getInvalidPathSet(errors);
  renderPreview(left.parsed, invalidPaths);
  setResultsVisibility(true);
  showResultsTab();

  if (errors.length === 0) {
    dom.validationSummary.className = 'summary-box summary-success';
    dom.validationSummary.textContent = 'Validation successful. The JSON matches the schema.';
    setGlobalStatus('Validation completed successfully. No schema violations found.', 'success');
  } else {
    dom.validationSummary.className = 'summary-box summary-error';
    dom.validationSummary.textContent = `Validation failed with ${errors.length} issue(s). Invalid JSON parts are highlighted in light red.`;
    setGlobalStatus(`Validation completed with ${errors.length} issue(s).`, 'error');
  }
});

validateLeft();
validateRight();
clearResults();
showInputsTab();
