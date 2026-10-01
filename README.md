# A Utility Hub

Welcome to **A Utility Hub**, a collection of practical browser tools and scripts for development, planning, file work, and system maintenance.

Whether it's system maintenance, file management, or workflow shortcuts, these utilities are built to be lightweight, transparent, and effective.

---

## 🚀 Featured Utility: Browser & Machine Cleanup

The flagship tool in this repository is the **Browser & Machine Cleanup Utility**. Unlike standard "cleaners" that log you out of everything, this script is designed for the power user who wants a clean machine without the friction of re-entering passwords.

### 🧹 [Browser & Machine Cleanup](./browser-machine-clean/)
Located in the `browser-machine-clean/` directory, this PowerShell script is a surgical maintenance tool.

* **Smart Browser Cleaning:** Targets Chrome, Edge, and Brave across all profiles.
* **Safety First:** Wipes heavy caches but **leaves Cookies, History, and Passwords untouched**.
* **System Deep-Clean:** Dynamically identifies your system drive to clear Windows Temp, Update downloads, Prefetch, and DirectX shaders.
* **Adaptive Permissions:** Automatically detects if it's running with Admin rights and adjusts its scope accordingly.
* **Detailed Logging:** Reports exactly how many MB/GB were reclaimed from each specific profile and system folder.

---

## 📂 Repository Structure

| Folder | Utility | Description |
| :--- | :--- | :--- |
| `browser-machine-clean/` | **Clean-Browsers-and-machine.ps1** | Multi-browser cache and system temp cleanup. |
| `...` | *More tools coming soon* | *Stay tuned for more "pro" utilities.* |

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