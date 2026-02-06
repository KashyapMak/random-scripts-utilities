# 🛠️ Random Scripts & Utilities

Welcome to **random-scripts-utilities**! This is a collection of curated scripts and tools designed for the "little pro" user—the person who knows their way around a computer and wants to automate daily tasks, optimize system performance, and handle technical chores with ease.

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

## 🛠️ Getting Started

### 1. Execution Policy
Most scripts here are PowerShell-based. To run them, you may need to allow local scripts once:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser