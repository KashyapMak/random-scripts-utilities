# 📂 README: Clean-Browsers-and-machine.ps1

## 📖 Overview
**Clean-Browsers-and-machine.ps1** is a high-performance PowerShell maintenance utility. It is designed to reclaim disk space by purging "disposable" data (caches and temporary files) while strictly preserving your **browsing history, saved passwords, and active login sessions (cookies)**.

Unlike generic cleaners, this script is **Chromium-aware** and **Permission-adaptive**, meaning it works whether you run it as a standard user or an administrator.

---

## ✨ Key Features

### 1. Precision Browser Cleaning
Targets **Google Chrome**, **Microsoft Edge**, and **Brave Browser**.
* **Multi-Profile Detection:** Automatically scans and cleans `Default`, `Profile 1`, `Profile 2`, etc.
* **Surgical Deletion:** Only wipes folders like `Cache`, `Code Cache`, `GPUCache`, and `ShaderCache`.
* **Privacy Preservation:** It **never** touches your `History`, `Bookmarks`, or `Login Data` files.

### 2. Intelligent Permission Handling
* **User Mode:** Cleans browser data and local temporary files that your account owns.
* **Admin Mode:** Unlocks system-level cleaning for Windows Temp, Prefetch, and Update downloads.
* **Adaptive Logging:** If you aren't an admin, the script skips protected folders and logs them in red so you know why they weren't cleaned.

### 3. System-Wide Maintenance
* **Update Cleanup:** Clears the `SoftwareDistribution` folder where Windows leaves behind old update installers.
* **Shader Refresh:** Wipes DirectX and Browser GPU caches to resolve visual glitches in games or websites.
* **Network Refresh:** Flushes the DNS cache to resolve connectivity issues.
* **Recycle Bin:** Empties the bin across all connected drives automatically.

### 4. Real-Time Analytics
* Calculates exactly how much data is being deleted from every single folder.
* Provides a **Grand Total Summary** at the end in a human-readable format (MB/GB).

---

## 🛠️ How to Run

### Step 1: Prepare the File
1.  Copy the script code.
2.  Create a new file on your computer named `Clean-Browsers-and-machine.ps1`.
3.  Paste the code and save.

### Step 2: Set Execution Policy (One-time setup)
Windows blocks scripts by default. If you haven't run scripts before, open PowerShell (as Admin) and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser