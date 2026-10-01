# A Utility Hub

Welcome to **A Utility Hub**, a collection of practical browser tools and scripts for development, planning, file work, and system maintenance.

Whether it's system maintenance, file management, or workflow shortcuts, these utilities are built to be lightweight, transparent, and effective.

**Demo:** [https://kashyapmak.github.io/random-scripts-utilities/](https://kashyapmak.github.io/random-scripts-utilities/)

---

## 📂 Available Utilities

| Utility | Type | Description |
| :--- | :--- | :--- |
| [India In-Hand Salary Calculator](./calculators/India-In-Hand-Salary-Calculator.html) | Browser | Estimate take-home pay in India by adjusting salary components and tax assumptions. |
| [Base64 Image Studio](./html-development-utilities/base64-to-image.html) | Browser | Decode Base64 image data, preview the result, and work with the generated image. |
| [Photo Resize Studio](./image-resizer/index.html) | Browser | Crop, rotate, resize, and compress photos in your browser with physical units and passport presets. |
| [URL Encoder/Decoder](./html-development-utilities/endcode-decode.html) | Browser | Encode text for URLs or decode percent-encoded strings in your browser. |
| [Power Automate ISO-8601 Duration Generator](./html-development-utilities/ISO-8601-Duration-Generator.html) | Browser | Build ISO-8601 duration values for use in Power Automate flows. |
| [Markdown Live Editor & Previewer](./html-development-utilities/markdown-editor.html) | Browser | Write Markdown, inspect a live preview, and switch to the rendered raw HTML. |
| [String Unescaper](./html-development-utilities/unescaper.html) | Browser | Turn escaped string content into readable text for inspection and reuse. |
| [Local JSON Compare Tool](./json-compare-tool/index.html) | Browser | Validate, format, and compare two JSON documents side by side in your browser. |
| [JSON Schema Generation & Validation Tool](./json-schema-tool/index.html) | Browser | Generate a JSON schema from sample data, then validate JSON against a schema. |
| [Sprint Project Planner](./sprint-project-planner/index.html) | Browser | Plan projects and organize work into sprints with a browser-based workspace. |
| [PixelMark](https://kashyapmak.github.io/PixelMark/) | External | Create image annotations, tutorials, bug reports, and screenshot markups. |
| [Browser & Machine Cleanup](./browser-machine-clean/Clean-Browsers-and-machine.ps1) | Download | Clean disposable browser caches and Windows temporary files while preserving cookies, history, and passwords. |
| [YouTube & Video Frame Extractor](./video-to-images/frame-extract.py) | Download | Extract and deduplicate video frames from a local file or YouTube URL, with optional OCR and exports. |

---

## Utility Index

The repository root `index.html` lists the available tools using `utilities.json`. Update that JSON file to add or edit a utility. Browser tools use `"type": "browser"` and downloadable scripts use `"type": "download"`; paths are relative to the repository root.

Because the index loads JSON with `fetch`, serve the repository over HTTP instead of opening the page directly as a file:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in your browser.

## 🛠️ Getting Started

### 1. Execution Policy
Most scripts here are PowerShell-based. To run them, you may need to allow local scripts once:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser