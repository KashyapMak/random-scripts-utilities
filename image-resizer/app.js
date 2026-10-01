const imageInput = document.getElementById('image-input');
const fileName = document.getElementById('file-name');
const sourceDetails = document.getElementById('source-details');
const presetSelect = document.getElementById('preset-select');
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const unitSelect = document.getElementById('unit-select');
const dpiInput = document.getElementById('dpi-input');
const lockRatio = document.getElementById('lock-ratio');
const cropRatio = document.getElementById('crop-ratio');
const cropModeButton = document.getElementById('crop-mode');
const applyCropButton = document.getElementById('apply-crop');
const rotateLeftButton = document.getElementById('rotate-left');
const rotateRightButton = document.getElementById('rotate-right');
const resetImageButton = document.getElementById('reset-image');
const formatSelect = document.getElementById('format-select');
const qualityInput = document.getElementById('quality-input');
const qualityValue = document.getElementById('quality-value');
const targetSizeEnabled = document.getElementById('target-size-enabled');
const targetSizeInput = document.getElementById('target-size-input');
const targetSizeUnit = document.getElementById('target-size-unit');
const editorTab = document.getElementById('editor-tab');
const printTab = document.getElementById('print-tab');
const editorPanel = document.getElementById('editor-panel');
const printPanel = document.getElementById('print-panel');
const paperSizeSelect = document.getElementById('paper-size');
const copyCountInput = document.getElementById('copy-count');
const printDpiInput = document.getElementById('print-dpi');
const sheetMarginInput = document.getElementById('sheet-margin');
const sheetGapInput = document.getElementById('sheet-gap');
const sheetLayoutInfo = document.getElementById('sheet-layout-info');
const printEmptyState = document.getElementById('print-empty-state');
const printSheetDetails = document.getElementById('print-sheet-details');
const printExportButton = document.getElementById('print-export-button');
const printExportResult = document.getElementById('print-export-result');
const printDownloadLink = document.getElementById('print-download-link');
const exportButton = document.getElementById('export-button');
const exportResult = document.getElementById('export-result');
const downloadLink = document.getElementById('download-link');
const previewCanvas = document.getElementById('preview-canvas');
const sheetCanvas = document.getElementById('sheet-canvas');
const canvasStage = document.getElementById('canvas-stage');
const emptyState = document.getElementById('empty-state');
const imageDetails = document.getElementById('image-details');
const cropHint = document.getElementById('crop-hint');

const presetValues = {
    'us-passport': { width: 2, height: 2, unit: 'in' },
    'india-passport': { width: 35, height: 45, unit: 'mm' },
    'uk-passport': { width: 35, height: 45, unit: 'mm' },
    'eu-passport': { width: 35, height: 45, unit: 'mm' }
};
const unitScale = { px: 1, mm: 25.4, cm: 2.54, in: 1 };
const maxDimension = 20000;

let originalBitmap = null;
let workingCanvas = null;
let targetWidthPx = 1200;
let targetHeightPx = 1600;
let currentUnit = 'px';
let currentDpi = 300;
let cropSelection = null;
let cropDragState = null;
let cropModeActive = false;
let currentObjectUrl = '';
let printLayoutCache = null;
let currentPrintObjectUrl = '';
let imageSizeRequest = 0;

function toPixels(value, unit = currentUnit, dpi = currentDpi) {
    const numericValue = Number(value);
    if (unit === 'px') return numericValue;
    return numericValue * dpi / unitScale[unit];
}

function fromPixels(value, unit = currentUnit, dpi = currentDpi) {
    if (unit === 'px') return value;
    return value * unitScale[unit] / dpi;
}

function displayDimension(value) {
    const converted = fromPixels(value);
    return currentUnit === 'px' ? String(Math.round(converted)) : String(Number(converted.toFixed(2)));
}

function syncDimensionFields() {
    widthInput.value = displayDimension(targetWidthPx);
    heightInput.value = displayDimension(targetHeightPx);
    if (workingCanvas) updatePrintSheet();
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function updateImageDetails() {
    const requestId = ++imageSizeRequest;
    if (!workingCanvas) {
        imageDetails.textContent = 'Current working image dimensions and size will appear here.';
        return;
    }

    const width = workingCanvas.width;
    const height = workingCanvas.height;
    const format = formatSelect.value || 'image/jpeg';
    const quality = Number(qualityInput.value) / 100;
    const formatName = format === 'image/png' ? 'PNG' : format === 'image/webp' ? 'WebP' : 'JPEG';
    imageDetails.textContent = `${width} x ${height} px / estimating ${formatName} size...`;
    workingCanvas.toBlob(blob => {
        if (requestId !== imageSizeRequest) return;
        imageDetails.textContent = blob
            ? `Current working image: ${width} x ${height} px / ${formatBytes(blob.size)} ${formatName}`
            : `Current working image: ${width} x ${height} px / size unavailable`;
    }, format, format === 'image/png' ? undefined : quality);
}

function setEditingEnabled(enabled) {
    [presetSelect, widthInput, heightInput, unitSelect, dpiInput, lockRatio, cropRatio,
        cropModeButton, rotateLeftButton, rotateRightButton, resetImageButton, formatSelect,
        qualityInput, targetSizeEnabled, paperSizeSelect, copyCountInput, printDpiInput,
        sheetMarginInput, sheetGapInput, exportButton, printExportButton].forEach(control => {
        control.disabled = !enabled;
    });
    editorTab.disabled = !enabled;
    printTab.disabled = !enabled;
    printExportButton.disabled = !enabled;
    targetSizeInput.disabled = !enabled || !targetSizeEnabled.checked;
    targetSizeUnit.disabled = !enabled || !targetSizeEnabled.checked;
}

function invalidateExport() {
    const hadExport = currentObjectUrl !== '';
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = '';
    downloadLink.removeAttribute('href');
    downloadLink.hidden = true;
    if (hadExport) exportResult.textContent = 'Export settings changed; export again to update the file.';
}

function invalidatePrintExport() {
    const hadExport = currentPrintObjectUrl !== '';
    if (currentPrintObjectUrl) URL.revokeObjectURL(currentPrintObjectUrl);
    currentPrintObjectUrl = '';
    printDownloadLink.removeAttribute('href');
    printDownloadLink.hidden = true;
    if (hadExport) printExportResult.textContent = 'Print layout changed; export the sheet again.';
}

function setActiveTab(tab) {
    const showPrint = tab === 'print' && Boolean(workingCanvas);
    editorTab.classList.toggle('active', !showPrint);
    printTab.classList.toggle('active', showPrint);
    editorTab.setAttribute('aria-selected', String(!showPrint));
    printTab.setAttribute('aria-selected', String(showPrint));
    editorPanel.hidden = showPrint;
    printPanel.hidden = !showPrint;
    if (showPrint) updatePrintSheet();
}

function drawPreview() {
    if (!workingCanvas) return;
    if (previewCanvas.width !== workingCanvas.width) previewCanvas.width = workingCanvas.width;
    if (previewCanvas.height !== workingCanvas.height) previewCanvas.height = workingCanvas.height;
    const context = previewCanvas.getContext('2d');
    context.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    context.drawImage(workingCanvas, 0, 0);

    if (cropSelection && cropSelection.width > 1 && cropSelection.height > 1) {
        const { x, y, width, height } = cropSelection;
        context.save();
        context.fillStyle = 'rgba(12, 28, 20, .48)';
        context.fillRect(0, 0, previewCanvas.width, y);
        context.fillRect(0, y + height, previewCanvas.width, previewCanvas.height - y - height);
        context.fillRect(0, y, x, height);
        context.fillRect(x + width, y, previewCanvas.width - x - width, height);
        context.setLineDash([Math.max(4, previewCanvas.width / 180), Math.max(3, previewCanvas.width / 260)]);
        context.lineWidth = Math.max(2, previewCanvas.width / 600);
        context.strokeStyle = '#fff';
        context.strokeRect(x, y, width, height);
        context.lineWidth = Math.max(1, previewCanvas.width / 1000);
        context.strokeStyle = '#176c55';
        context.strokeRect(x, y, width, height);
        const handleSize = Math.max(10, Math.min(previewCanvas.width, previewCanvas.height) * 0.018);
        const handlePoints = [
            [x, y], [x + width, y], [x, y + height], [x + width, y + height]
        ];
        context.setLineDash([]);
        context.lineWidth = Math.max(1, previewCanvas.width / 1200);
        handlePoints.forEach(([handleX, handleY]) => {
            context.fillStyle = '#fff';
            context.fillRect(handleX - handleSize / 2, handleY - handleSize / 2, handleSize, handleSize);
            context.strokeStyle = '#176c55';
            context.strokeRect(handleX - handleSize / 2, handleY - handleSize / 2, handleSize, handleSize);
        });
        context.restore();
    }
    emptyState.hidden = true;
    previewCanvas.hidden = false;
}

function setPresetDimensions(preset) {
    const dimensions = presetValues[preset];
    if (!dimensions) return;
    currentUnit = dimensions.unit;
    unitSelect.value = currentUnit;
    targetWidthPx = Math.round(toPixels(dimensions.width, currentUnit));
    targetHeightPx = Math.round(toPixels(dimensions.height, currentUnit));
    lockRatio.checked = true;
    cropRatio.value = 'target';
    syncDimensionFields();
    invalidateExport();
    invalidatePrintExport();
}

async function createBitmap(file) {
    if (typeof createImageBitmap === 'function') {
        try {
            return await createImageBitmap(file, { imageOrientation: 'from-image' });
        } catch {
            return createImageBitmap(file);
        }
    }

    const objectUrl = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        sourceDetails.textContent = 'Choose a supported image file.';
        return;
    }

    try {
        const bitmap = await createBitmap(file);
        if (originalBitmap && typeof originalBitmap.close === 'function') originalBitmap.close();
        originalBitmap = bitmap;
        workingCanvas = document.createElement('canvas');
        workingCanvas.width = bitmap.width;
        workingCanvas.height = bitmap.height;
        workingCanvas.getContext('2d').drawImage(bitmap, 0, 0);
        cropSelection = null;
        cropModeActive = false;
        cropModeButton.setAttribute('aria-pressed', 'false');
        cropModeButton.textContent = 'Start crop';
        fileName.textContent = file.name;
        sourceDetails.textContent = 'Original file loaded locally; edits use a separate working copy.';
        cropHint.textContent = 'Your uploaded original is kept separately from this working copy.';
        targetWidthPx = bitmap.width;
        targetHeightPx = bitmap.height;
        currentUnit = 'px';
        unitSelect.value = currentUnit;
        presetSelect.value = 'custom';
        syncDimensionFields();
        setEditingEnabled(true);
        targetSizeInput.disabled = !targetSizeEnabled.checked;
        targetSizeUnit.disabled = !targetSizeEnabled.checked;
        invalidateExport();
        invalidatePrintExport();
        exportResult.textContent = 'Output size will appear here';
        drawPreview();
        updateImageDetails();
        updatePrintSheet();
    } catch (error) {
        sourceDetails.textContent = 'This image format could not be opened by the browser.';
        console.error('Unable to open image:', error);
    }
}

function updateDimensionFromInput(changedField) {
    const value = Number(changedField.value);
    if (!Number.isFinite(value) || value <= 0) return;
    const pixels = Math.round(toPixels(value));
    if (pixels < 1 || pixels > maxDimension) {
        cropHint.textContent = `Dimensions must be between 1 and ${maxDimension} px.`;
        return;
    }

    presetSelect.value = 'custom';
    const ratio = targetWidthPx / targetHeightPx;
    if (changedField === widthInput) {
        targetWidthPx = pixels;
        if (lockRatio.checked) targetHeightPx = Math.max(1, Math.round(targetWidthPx / ratio));
    } else {
        targetHeightPx = pixels;
        if (lockRatio.checked) targetWidthPx = Math.max(1, Math.round(targetHeightPx * ratio));
    }
    cropHint.textContent = 'Output dimensions are applied when you export.';
    syncDimensionFields();
    invalidateExport();
    invalidatePrintExport();
}

function rotateWorkingImage(direction) {
    if (!workingCanvas) return;
    const rotated = document.createElement('canvas');
    rotated.width = workingCanvas.height;
    rotated.height = workingCanvas.width;
    const context = rotated.getContext('2d');
    context.translate(rotated.width / 2, rotated.height / 2);
    context.rotate(direction * Math.PI / 2);
    context.drawImage(workingCanvas, -workingCanvas.width / 2, -workingCanvas.height / 2);
    workingCanvas = rotated;
    [targetWidthPx, targetHeightPx] = [targetHeightPx, targetWidthPx];
    presetSelect.value = 'custom';
    cropSelection = null;
    syncDimensionFields();
    drawPreview();
    updateImageDetails();
    invalidateExport();
    invalidatePrintExport();
}

function getCropRatio() {
    if (cropRatio.value === 'square') return 1;
    if (cropRatio.value === 'target' && targetHeightPx > 0) return targetWidthPx / targetHeightPx;
    return 0;
}

function canvasPoint(event) {
    const rect = previewCanvas.getBoundingClientRect();
    return {
        x: Math.max(0, Math.min(workingCanvas.width, (event.clientX - rect.left) * workingCanvas.width / rect.width)),
        y: Math.max(0, Math.min(workingCanvas.height, (event.clientY - rect.top) * workingCanvas.height / rect.height))
    };
}

function makeCropSelection(start, point) {
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    const signX = dx < 0 ? -1 : 1;
    const signY = dy < 0 ? -1 : 1;
    let width = Math.abs(dx);
    let height = Math.abs(dy);
    const ratio = getCropRatio();
    const availableWidth = signX > 0 ? workingCanvas.width - start.x : start.x;
    const availableHeight = signY > 0 ? workingCanvas.height - start.y : start.y;

    if (ratio > 0) {
        if (height === 0 && width > 0) height = width / ratio;
        else if (width === 0 && height > 0) width = height * ratio;
        if (height > 0 && width / height > ratio) width = height * ratio;
        else if (width > 0) height = width / ratio;
        const scale = Math.min(1, availableWidth / Math.max(width, 1), availableHeight / Math.max(height, 1));
        width *= scale;
        height *= scale;
    } else {
        width = Math.min(width, availableWidth);
        height = Math.min(height, availableHeight);
    }

    return {
        x: signX > 0 ? start.x : start.x - width,
        y: signY > 0 ? start.y : start.y - height,
        width,
        height
    };
}

function getCropAction(point) {
    if (!cropSelection) return { mode: 'draw' };
    const rect = previewCanvas.getBoundingClientRect();
    const hitX = 12 * workingCanvas.width / rect.width;
    const hitY = 12 * workingCanvas.height / rect.height;
    const handles = {
        nw: { x: cropSelection.x, y: cropSelection.y },
        ne: { x: cropSelection.x + cropSelection.width, y: cropSelection.y },
        sw: { x: cropSelection.x, y: cropSelection.y + cropSelection.height },
        se: { x: cropSelection.x + cropSelection.width, y: cropSelection.y + cropSelection.height }
    };
    for (const [handle, location] of Object.entries(handles)) {
        if (Math.abs(point.x - location.x) <= hitX && Math.abs(point.y - location.y) <= hitY) {
            return { mode: 'resize', handle };
        }
    }
    const inside = point.x >= cropSelection.x && point.x <= cropSelection.x + cropSelection.width
        && point.y >= cropSelection.y && point.y <= cropSelection.y + cropSelection.height;
    return inside ? { mode: 'move' } : { mode: 'draw' };
}

function moveCropSelection(point, dragState) {
    const dx = point.x - dragState.pointerStart.x;
    const dy = point.y - dragState.pointerStart.y;
    const selection = dragState.initialSelection;
    return {
        ...selection,
        x: Math.max(0, Math.min(workingCanvas.width - selection.width, selection.x + dx)),
        y: Math.max(0, Math.min(workingCanvas.height - selection.height, selection.y + dy))
    };
}

function resizeCropSelection(point, dragState) {
    const { x, y, width: originalWidth, height: originalHeight } = dragState.initialSelection;
    const handle = dragState.handle;
    const movesWest = handle.includes('w');
    const movesNorth = handle.includes('n');
    const anchorX = movesWest ? x + originalWidth : x;
    const anchorY = movesNorth ? y + originalHeight : y;
    let width = Math.abs(point.x - anchorX);
    let height = Math.abs(point.y - anchorY);
    const ratio = getCropRatio();

    if (ratio > 0) {
        if (width / Math.max(height, 1) > ratio) height = width / ratio;
        else width = height * ratio;
    }
    const availableWidth = movesWest ? anchorX : workingCanvas.width - anchorX;
    const availableHeight = movesNorth ? anchorY : workingCanvas.height - anchorY;
    const scale = Math.min(1, availableWidth / Math.max(width, 1), availableHeight / Math.max(height, 1));
    width = Math.max(2, width * scale);
    height = Math.max(2, height * scale);
    return {
        x: movesWest ? anchorX - width : anchorX,
        y: movesNorth ? anchorY - height : anchorY,
        width,
        height
    };
}

async function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not export this image format.')), type, quality);
    });
}

function targetBytes() {
    const value = Number(targetSizeInput.value);
    if (!targetSizeEnabled.checked || !Number.isFinite(value) || value <= 0) return 0;
    return value * (targetSizeUnit.value === 'MB' ? 1024 * 1024 : 1024);
}

async function encodeForTarget(canvas, type, quality, maxBytes) {
    if (!maxBytes) return { blob: await canvasToBlob(canvas, type, quality), metTarget: true };
    if (type === 'image/png') {
        const blob = await canvasToBlob(canvas, type, quality);
        return { blob, metTarget: blob.size <= maxBytes };
    }

    let low = 0.05;
    let high = quality;
    let best = null;
    let smallest = null;
    for (let attempt = 0; attempt < 9; attempt += 1) {
        const candidateQuality = (low + high) / 2;
        const blob = await canvasToBlob(canvas, type, candidateQuality);
        if (!smallest || blob.size < smallest.size) smallest = blob;
        if (blob.size <= maxBytes) {
            best = blob;
            low = candidateQuality;
        } else {
            high = candidateQuality;
        }
    }
    return best ? { blob: best, metTarget: true } : { blob: smallest, metTarget: false };
}

function calculatePrintLayout() {
    const papers = {
        a4: { label: 'A4', widthInches: 210 / 25.4, heightInches: 297 / 25.4 },
        letter: { label: 'Letter', widthInches: 8.5, heightInches: 11 }
    };
    const paper = papers[paperSizeSelect.value];
    const dpi = Number(printDpiInput.value);
    const copies = Math.round(Number(copyCountInput.value));
    const marginMm = Number(sheetMarginInput.value);
    const gapMm = Number(sheetGapInput.value);
    if (!paper || !Number.isFinite(dpi) || dpi < 72 || dpi > 600
        || !Number.isFinite(copies) || copies < 1 || copies > 100
        || !Number.isFinite(marginMm) || marginMm < 0
        || !Number.isFinite(gapMm) || gapMm < 0) {
        return { valid: false, error: 'Enter valid print layout settings.' };
    }

    const pageWidth = Math.round(paper.widthInches * dpi);
    const pageHeight = Math.round(paper.heightInches * dpi);
    const margin = marginMm * dpi / 25.4;
    const gap = gapMm * dpi / 25.4;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const photoWidth = targetWidthPx * dpi / currentDpi;
    const photoHeight = targetHeightPx * dpi / currentDpi;
    if (photoWidth > availableWidth || photoHeight > availableHeight) {
        return { valid: false, error: 'The photo is larger than the printable area. Reduce its physical size or margins.' };
    }

    let bestLayout = null;
    let bestScore = Infinity;
    for (let columns = 1; columns <= copies; columns += 1) {
        const rows = Math.ceil(copies / columns);
        const usedWidth = columns * photoWidth + (columns - 1) * gap;
        const usedHeight = rows * photoHeight + (rows - 1) * gap;
        if (usedWidth > availableWidth || usedHeight > availableHeight) continue;
        const layoutRatio = usedWidth / usedHeight;
        const pageRatio = availableWidth / availableHeight;
        const score = Math.abs(Math.log(layoutRatio / pageRatio));
        if (score < bestScore) {
            bestScore = score;
            bestLayout = { columns, rows, usedWidth, usedHeight };
        }
    }
    if (!bestLayout) {
        return { valid: false, error: 'These copies will not fit at the selected photo size. Reduce copies or photo dimensions.' };
    }

    return {
        valid: true,
        paperKey: paperSizeSelect.value,
        paperLabel: paper.label,
        dpi,
        copies,
        columns: bestLayout.columns,
        rows: bestLayout.rows,
        pageWidth,
        pageHeight,
        margin,
        gap,
        photoWidth,
        photoHeight,
        usedWidth: bestLayout.usedWidth,
        usedHeight: bestLayout.usedHeight,
        availableWidth,
        availableHeight
    };
}

function drawPrintSheet(canvas, layout) {
    canvas.width = layout.pageWidth;
    canvas.height = layout.pageHeight;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const startX = layout.margin + (layout.availableWidth - layout.usedWidth) / 2;
    const startY = layout.margin + (layout.availableHeight - layout.usedHeight) / 2;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.strokeStyle = '#9aa89e';
    context.lineWidth = Math.max(1, layout.dpi / 300);
    for (let index = 0; index < layout.copies; index += 1) {
        const column = index % layout.columns;
        const row = Math.floor(index / layout.columns);
        const x = startX + column * (layout.photoWidth + layout.gap);
        const y = startY + row * (layout.photoHeight + layout.gap);
        context.drawImage(workingCanvas, x, y, layout.photoWidth, layout.photoHeight);
        context.strokeRect(x, y, layout.photoWidth, layout.photoHeight);
    }
}

function updatePrintSheet() {
    if (!workingCanvas) {
        printEmptyState.hidden = false;
        sheetCanvas.hidden = true;
        printSheetDetails.textContent = 'No print sheet yet';
        printExportButton.disabled = true;
        return;
    }
    printLayoutCache = calculatePrintLayout();
    if (!printLayoutCache.valid) {
        sheetLayoutInfo.textContent = printLayoutCache.error;
        sheetCanvas.hidden = true;
        printEmptyState.hidden = false;
        printSheetDetails.textContent = 'Print layout does not fit';
        printExportButton.disabled = true;
        return;
    }

    drawPrintSheet(sheetCanvas, printLayoutCache);
    sheetCanvas.hidden = false;
    printEmptyState.hidden = true;
    sheetLayoutInfo.textContent = `${printLayoutCache.copies} photos / ${printLayoutCache.columns} columns x ${printLayoutCache.rows} rows / ${printLayoutCache.paperLabel} at ${printLayoutCache.dpi} DPI`;
    printSheetDetails.textContent = `${printLayoutCache.paperLabel}: ${printLayoutCache.pageWidth} x ${printLayoutCache.pageHeight} px / ${printLayoutCache.dpi} DPI`;
    printExportButton.disabled = false;
}

function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

async function addPngPrintResolution(blob, dpi) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (signature.some((byte, index) => bytes[index] !== byte)) return blob;

    const pixelsPerMeter = Math.round(dpi / 0.0254);
    const physicalChunk = new Uint8Array(21);
    const view = new DataView(physicalChunk.buffer);
    view.setUint32(0, 9);
    physicalChunk.set([112, 72, 89, 115], 4);
    view.setUint32(8, pixelsPerMeter);
    view.setUint32(12, pixelsPerMeter);
    physicalChunk[16] = 1;
    view.setUint32(17, crc32(physicalChunk.subarray(4, 17)));

    const chunks = [];
    let offset = 8;
    let inserted = false;
    while (offset + 12 <= bytes.length) {
        const chunkLength = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
        const chunkEnd = offset + chunkLength + 12;
        if (chunkEnd > bytes.length) return blob;
        const chunkType = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
        if (chunkType === 'pHYs') {
            offset = chunkEnd;
            continue;
        }
        if (chunkType === 'IDAT' && !inserted) {
            chunks.push(physicalChunk);
            inserted = true;
        }
        chunks.push(bytes.slice(offset, chunkEnd));
        offset = chunkEnd;
    }
    if (!inserted) return blob;
    return new Blob([bytes.slice(0, 8), ...chunks], { type: 'image/png' });
}

async function exportImage() {
    if (!workingCanvas) return;
    const type = formatSelect.value;
    const width = Math.round(targetWidthPx);
    const height = Math.round(targetHeightPx);
    if (width < 1 || height < 1 || width > maxDimension || height > maxDimension) {
        exportResult.textContent = `Output dimensions must be between 1 and ${maxDimension} px.`;
        return;
    }
    if (targetSizeEnabled.checked && targetBytes() <= 0) {
        exportResult.textContent = 'Enter a valid maximum file size.';
        targetSizeInput.focus();
        return;
    }

    exportButton.disabled = true;
    exportButton.textContent = 'Preparing...';
    exportResult.textContent = 'Rendering a new copy...';
    downloadLink.hidden = true;

    try {
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = width;
        outputCanvas.height = height;
        const context = outputCanvas.getContext('2d');
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        if (type === 'image/jpeg') {
            context.fillStyle = '#fff';
            context.fillRect(0, 0, width, height);
        }
        context.drawImage(workingCanvas, 0, 0, width, height);
        const quality = Number(qualityInput.value) / 100;
        const maxBytes = targetBytes();
        const result = await encodeForTarget(outputCanvas, type, quality, maxBytes);
        const actualType = result.blob.type || type;
        const extension = actualType === 'image/png' ? 'png' : actualType === 'image/webp' ? 'webp' : 'jpg';
        const safeBaseName = (fileName.textContent || 'photo').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-');

        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = URL.createObjectURL(result.blob);
        downloadLink.href = currentObjectUrl;
        downloadLink.download = `${safeBaseName || 'photo'}-resized.${extension}`;
        downloadLink.textContent = `Download ${formatBytes(result.blob.size)} image`;
        downloadLink.hidden = false;

        let message = `Output: ${width} x ${height} px / ${formatBytes(result.blob.size)}.`;
        if (maxBytes) {
            message += result.metTarget ? ' Maximum size met.' : ' Maximum size not reached at this quality; reduce dimensions or choose another format.';
        }
        if (type === 'image/png' && maxBytes) message += ' PNG export does not use the quality setting.';
        exportResult.textContent = message;
        cropHint.textContent = 'Export created from the working copy. The original remains unchanged.';
    } catch (error) {
        exportResult.textContent = error.message || 'Could not export this image.';
    } finally {
        exportButton.disabled = false;
    }
}

async function exportPrintSheet() {
    if (!workingCanvas) return;
    const layout = calculatePrintLayout();
    if (!layout.valid) {
        printExportResult.textContent = layout.error;
        updatePrintSheet();
        return;
    }

    printExportButton.disabled = true;
    printExportButton.textContent = 'Preparing sheet...';
    printExportResult.textContent = 'Rendering print sheet PNG...';
    printDownloadLink.hidden = true;
    try {
        const outputCanvas = document.createElement('canvas');
        drawPrintSheet(outputCanvas, layout);
        const png = await canvasToBlob(outputCanvas, 'image/png');
        const blob = await addPngPrintResolution(png, layout.dpi);
        if (currentPrintObjectUrl) URL.revokeObjectURL(currentPrintObjectUrl);
        currentPrintObjectUrl = URL.createObjectURL(blob);
        const safeBaseName = (fileName.textContent || 'photo').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-');
        printDownloadLink.href = currentPrintObjectUrl;
        printDownloadLink.download = `${safeBaseName || 'photo'}-${layout.paperKey}-photo-sheet.png`;
        printDownloadLink.textContent = `Download ${layout.paperLabel} sheet / ${formatBytes(blob.size)}`;
        printDownloadLink.hidden = false;
        printExportResult.textContent = `${layout.copies} photos / ${layout.paperLabel} / ${layout.pageWidth} x ${layout.pageHeight} px at ${layout.dpi} DPI / ${formatBytes(blob.size)}.`;
    } catch (error) {
        printExportResult.textContent = error.message || 'Could not create the print sheet.';
    } finally {
        printExportButton.disabled = false;
        printExportButton.textContent = 'Export print sheet';
    }
}

imageInput.addEventListener('change', event => loadFile(event.target.files[0]));
editorTab.addEventListener('click', () => setActiveTab('editor'));
printTab.addEventListener('click', () => setActiveTab('print'));
canvasStage.addEventListener('dragover', event => {
    event.preventDefault();
    canvasStage.classList.add('drag-over');
});
canvasStage.addEventListener('dragleave', () => canvasStage.classList.remove('drag-over'));
canvasStage.addEventListener('drop', event => {
    event.preventDefault();
    canvasStage.classList.remove('drag-over');
    loadFile(event.dataTransfer.files[0]);
});

presetSelect.addEventListener('change', () => {
    if (presetSelect.value === 'custom') return;
    setPresetDimensions(presetSelect.value);
});
unitSelect.addEventListener('change', () => {
    currentUnit = unitSelect.value;
    syncDimensionFields();
});
widthInput.addEventListener('input', () => updateDimensionFromInput(widthInput));
heightInput.addEventListener('input', () => updateDimensionFromInput(heightInput));
dpiInput.addEventListener('change', () => {
    const nextDpi = Number(dpiInput.value);
    if (!Number.isFinite(nextDpi) || nextDpi < 1 || nextDpi > 2400) {
        dpiInput.value = String(currentDpi);
        return;
    }
    const widthInCurrentUnit = fromPixels(targetWidthPx, currentUnit, currentDpi);
    const heightInCurrentUnit = fromPixels(targetHeightPx, currentUnit, currentDpi);
    currentDpi = nextDpi;
    if (currentUnit !== 'px') {
        targetWidthPx = Math.round(toPixels(widthInCurrentUnit, currentUnit, currentDpi));
        targetHeightPx = Math.round(toPixels(heightInCurrentUnit, currentUnit, currentDpi));
    }
    syncDimensionFields();
    invalidateExport();
    invalidatePrintExport();
});
lockRatio.addEventListener('change', () => {
    if (lockRatio.checked) {
        targetHeightPx = Math.max(1, Math.round(targetWidthPx / (workingCanvas.width / workingCanvas.height)));
        syncDimensionFields();
        invalidateExport();
        invalidatePrintExport();
    }
});
qualityInput.addEventListener('input', () => {
    qualityValue.textContent = `${qualityInput.value}%`;
    invalidateExport();
    updateImageDetails();
});
targetSizeEnabled.addEventListener('change', () => {
    targetSizeInput.disabled = !targetSizeEnabled.checked;
    targetSizeUnit.disabled = !targetSizeEnabled.checked;
    invalidateExport();
});
 [targetSizeInput, targetSizeUnit].forEach(control => control.addEventListener('input', invalidateExport));
formatSelect.addEventListener('change', () => {
    invalidateExport();
    updateImageDetails();
});
[paperSizeSelect, copyCountInput, printDpiInput, sheetMarginInput, sheetGapInput].forEach(control => {
    control.addEventListener('input', () => {
        updatePrintSheet();
        invalidatePrintExport();
    });
});

cropModeButton.addEventListener('click', () => {
    cropModeActive = !cropModeActive;
    cropSelection = null;
    cropModeButton.setAttribute('aria-pressed', String(cropModeActive));
    cropModeButton.textContent = cropModeActive ? 'Cancel crop' : 'Start crop';
    previewCanvas.dataset.cropping = String(cropModeActive);
    applyCropButton.disabled = true;
    cropHint.textContent = cropModeActive ? 'Drag over the image to select a crop area.' : 'Crop selection cleared.';
    drawPreview();
});
previewCanvas.addEventListener('pointerdown', event => {
    if (!cropModeActive || !workingCanvas) return;
    event.preventDefault();
    previewCanvas.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    const action = getCropAction(point);
    cropDragState = {
        ...action,
        pointerStart: point,
        initialSelection: cropSelection ? { ...cropSelection } : null
    };
    if (action.mode === 'draw') {
        cropSelection = { x: point.x, y: point.y, width: 0, height: 0 };
        applyCropButton.disabled = true;
    }
    previewCanvas.style.cursor = action.mode === 'move' ? 'move' : action.mode === 'resize' ? 'nwse-resize' : 'crosshair';
    drawPreview();
});
previewCanvas.addEventListener('pointermove', event => {
    if (!previewCanvas.hasPointerCapture(event.pointerId) || !cropDragState) {
        if (cropModeActive && cropSelection) {
            const action = getCropAction(canvasPoint(event));
            previewCanvas.style.cursor = action.mode === 'move' ? 'move' : action.mode === 'resize' ? 'nwse-resize' : 'crosshair';
        }
        return;
    }
    const point = canvasPoint(event);
    if (cropDragState.mode === 'draw') cropSelection = makeCropSelection(cropDragState.pointerStart, point);
    if (cropDragState.mode === 'move') cropSelection = moveCropSelection(point, cropDragState);
    if (cropDragState.mode === 'resize') cropSelection = resizeCropSelection(point, cropDragState);
    applyCropButton.disabled = cropSelection.width < 2 || cropSelection.height < 2;
    drawPreview();
});
function finishCropDrag(event) {
    if (previewCanvas.hasPointerCapture(event.pointerId)) previewCanvas.releasePointerCapture(event.pointerId);
    cropDragState = null;
    previewCanvas.style.cursor = cropModeActive ? 'crosshair' : '';
}
previewCanvas.addEventListener('pointerup', finishCropDrag);
previewCanvas.addEventListener('pointercancel', finishCropDrag);
applyCropButton.addEventListener('click', () => {
    if (!workingCanvas || !cropSelection || cropSelection.width < 2 || cropSelection.height < 2) return;
    const x = Math.max(0, Math.floor(cropSelection.x));
    const y = Math.max(0, Math.floor(cropSelection.y));
    const width = Math.min(workingCanvas.width - x, Math.round(cropSelection.width));
    const height = Math.min(workingCanvas.height - y, Math.round(cropSelection.height));
    const cropped = document.createElement('canvas');
    cropped.width = width;
    cropped.height = height;
    cropped.getContext('2d').drawImage(workingCanvas, x, y, width, height, 0, 0, width, height);
    workingCanvas = cropped;
    cropSelection = null;
    cropDragState = null;
    cropModeActive = false;
    cropModeButton.setAttribute('aria-pressed', 'false');
    cropModeButton.textContent = 'Start crop';
    previewCanvas.dataset.cropping = 'false';
    applyCropButton.disabled = true;
    if (cropRatio.value !== 'target') {
        targetWidthPx = width;
        targetHeightPx = height;
        presetSelect.value = 'custom';
        syncDimensionFields();
    }
    cropHint.textContent = 'Crop applied to the working copy.';
    drawPreview();
    updateImageDetails();
    updatePrintSheet();
    invalidateExport();
    invalidatePrintExport();
});
rotateLeftButton.addEventListener('click', () => rotateWorkingImage(-1));
rotateRightButton.addEventListener('click', () => rotateWorkingImage(1));
resetImageButton.addEventListener('click', () => {
    if (!originalBitmap) return;
    workingCanvas = document.createElement('canvas');
    workingCanvas.width = originalBitmap.width;
    workingCanvas.height = originalBitmap.height;
    workingCanvas.getContext('2d').drawImage(originalBitmap, 0, 0);
    targetWidthPx = originalBitmap.width;
    targetHeightPx = originalBitmap.height;
    currentUnit = 'px';
    currentDpi = 300;
    dpiInput.value = '300';
    unitSelect.value = currentUnit;
    presetSelect.value = 'custom';
    lockRatio.checked = true;
    cropRatio.value = 'target';
    cropSelection = null;
    cropModeActive = false;
    cropModeButton.setAttribute('aria-pressed', 'false');
    cropModeButton.textContent = 'Start crop';
    previewCanvas.dataset.cropping = 'false';
    applyCropButton.disabled = true;
    syncDimensionFields();
    cropHint.textContent = 'Reset complete. The uploaded original is unchanged.';
    drawPreview();
    updateImageDetails();
    invalidateExport();
    invalidatePrintExport();
});
exportButton.addEventListener('click', exportImage);
printExportButton.addEventListener('click', exportPrintSheet);
