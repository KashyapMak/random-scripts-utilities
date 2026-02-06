$ErrorActionPreference = "SilentlyContinue"
$OSDrive = $env:SystemDrive
$TotalBytesSaved = 0

# Check for Admin rights
$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Helper function to calculate folder size
function Get-FolderSize {
    param ([string]$Path)
    $Size = 0
    if (Test-Path $Path) {
        $Files = Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue
        foreach ($File in $Files) { $Size += $File.Length }
    }
    return $Size
}

# Helper function to format bytes
function Format-Size {
    param ([long]$Bytes)
    if ($Bytes -gt 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -gt 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    if ($Bytes -gt 1KB) { return "{0:N2} KB" -f ($Bytes / 1KB) }
    return "0 KB"
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   CLEAN-BROWSERS-AND-MACHINE                " -ForegroundColor Cyan
if (-not $IsAdmin) { 
    Write-Host "   [RUNNING IN USER MODE - LIMITED ACCESS]   " -ForegroundColor Yellow 
}
Write-Host "==============================================" -ForegroundColor Cyan

# --- STAGE 1: CHROMIUM BROWSERS ---
# Note: Browser data is usually in LocalAppData, so Admin is rarely needed here.
$BrowserConfigs = @(
    @{ Name = "Google Chrome";   Path = "$env:LOCALAPPDATA\Google\Chrome\User Data" }
    @{ Name = "Microsoft Edge";  Path = "$env:LOCALAPPDATA\Microsoft\Edge\User Data" }
    @{ Name = "Brave Browser";   Path = "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\User Data" }
)
$CacheFolders = @("Cache", "Code Cache", "GPUCache", "ShaderCache")

Write-Host "`n[#] STAGE 1: Chromium Browser Caches" -ForegroundColor Magenta
foreach ($Browser in $BrowserConfigs) {
    if (Test-Path $Browser.Path) {
        $Profiles = Get-ChildItem -Path $Browser.Path -Directory | Where-Object { $_.Name -eq "Default" -or $_.Name -like "Profile*" }
        foreach ($Profile in $Profiles) {
            Write-Host "  -> $($Browser.Name) [$($Profile.Name)]" -ForegroundColor Yellow
            foreach ($SubFolder in $CacheFolders) {
                $TargetPath = Join-Path $Profile.FullName $SubFolder
                if (Test-Path $TargetPath) {
                    $FolderSize = Get-FolderSize -Path $TargetPath
                    $TotalBytesSaved += $FolderSize
                    Write-Host "     Cleaning $SubFolder ($(Format-Size $FolderSize))..." -ForegroundColor Gray
                    Remove-Item -Path "$TargetPath\*" -Recurse -Force
                }
            }
        }
    }
}

# --- STAGE 2: MACHINE TEMP & SYSTEM FILES ---
Write-Host "`n[#] STAGE 2: Machine Temp & System Files" -ForegroundColor Magenta
$SystemPaths = @(
    @{ Name = "User Temp Files";       Path = "$env:TEMP"; NeedsAdmin = $false }
    @{ Name = "Windows Temp Files";    Path = "$OSDrive\Windows\Temp"; NeedsAdmin = $true }
    @{ Name = "Windows Prefetch";      Path = "$OSDrive\Windows\Prefetch"; NeedsAdmin = $true }
    @{ Name = "Update Downloads";      Path = "$OSDrive\Windows\SoftwareDistribution\Download"; NeedsAdmin = $true }
    @{ Name = "DirectX Shader Cache";  Path = "$env:LOCALAPPDATA\Local\D3DSCache"; NeedsAdmin = $false }
)

foreach ($Entry in $SystemPaths) {
    if ($Entry.NeedsAdmin -and -not $IsAdmin) {
        Write-Host "  -> Skipping $($Entry.Name) [Requires Admin Rights]" -ForegroundColor DarkRed
        continue
    }

    if (Test-Path $Entry.Path) {
        $FolderSize = Get-FolderSize -Path $Entry.Path
        $TotalBytesSaved += $FolderSize
        Write-Host "  -> Cleaning $($Entry.Name) ($(Format-Size $FolderSize))..." -ForegroundColor Yellow
        Remove-Item -Path "$($Entry.Path)\*" -Recurse -Force
    }
}

# --- STAGE 3: FINAL REFRESH ---
Write-Host "`n[#] STAGE 3: Final System Refresh" -ForegroundColor Magenta
Write-Host "  -> Flushing DNS Cache..." -ForegroundColor Yellow
Clear-DnsClientCache

Write-Host "  -> Emptying Recycle Bin..." -ForegroundColor Yellow
Clear-RecycleBin -Confirm:$false -ErrorAction SilentlyContinue

# --- FINAL SUMMARY ---
Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "   CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "   Total Reclaimed: $(Format-Size $TotalBytesSaved)" -ForegroundColor White -BackgroundColor DarkGreen
if (-not $IsAdmin) {
    Write-Host "   Note: Run as Admin to clean system-level folders." -ForegroundColor Yellow
}
Write-Host "==============================================" -ForegroundColor Green
Pause