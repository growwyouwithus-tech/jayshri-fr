
$backupPath = "c:\Users\pc\Desktop\plot\jayshri-fr\src\pages\admin\PlotManagement_backup.jsx"
$targetPath = "c:\Users\pc\Desktop\plot\jayshri-fr\src\pages\admin\PlotManagement.jsx"

# Read both files
$backupLines = Get-Content -Path $backupPath -Raw -Encoding UTF8
$targetLines = Get-Content -Path $targetPath -Encoding UTF8

# The Get-Content -Raw gives a single string, but array slicing is easier with an array of lines.
$backupLinesArray = Get-Content -Path $backupPath -Encoding UTF8

# Extract lines 2165 to 5541 (1-indexed)
# 0-indexed: 2164 to 5540
$formCode = $backupLinesArray[2164..5540]

# Target lines to keep: 0 to 2191 (1-indexed 1 to 2192) and 3746 to end (1-indexed 3747 to end)
$head = $targetLines[0..2191]
$tail = $targetLines[3746..($targetLines.Length - 1)]

# Combine everything
$newContent = $head + $formCode + $tail

# Join with newlines
$finalString = $newContent -join "`r`n"

# Remove zoom: '0.9'
$finalString = $finalString.Replace(", zoom: '0.9'", "")

# Write back to file
[System.IO.File]::WriteAllText($targetPath, $finalString, [System.Text.Encoding]::UTF8)

Write-Host "Reverted forms and removed zoom successfully."
