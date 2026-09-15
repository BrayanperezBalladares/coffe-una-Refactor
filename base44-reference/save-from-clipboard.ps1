[CmdletBinding()]
param(
    [string]$Root = $PSScriptRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ClipboardText {
    try {
        $text = Get-Clipboard -Raw -Format Text
    } catch {
        throw 'Could not read the clipboard. Copy the file contents first.'
    }

    if ([string]::IsNullOrWhiteSpace($text)) {
        throw 'The clipboard is empty. Copy the file contents first.'
    }

    return $text
}

try {
    $rootPath = [System.IO.Path]::GetFullPath($Root)
    $relativePath = Read-Host 'Destination path relative to base44-reference (example: src/components/ui/button.jsx)'
    $relativePath = $relativePath.Trim().TrimStart('\', '/')

    if ([string]::IsNullOrWhiteSpace($relativePath)) {
        throw 'A destination path is required.'
    }

    if ([System.IO.Path]::IsPathRooted($relativePath) -or $relativePath -match '(^|[\\/])\.\.([\\/]|$)') {
        throw 'Use a relative path inside base44-reference. Parent-directory traversal is not allowed.'
    }

    $destination = [System.IO.Path]::GetFullPath((Join-Path $rootPath $relativePath))
    $rootWithSeparator = $rootPath.TrimEnd('\') + '\'

    if (-not $destination.StartsWith($rootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'The destination must remain inside base44-reference.'
    }

    $content = Get-ClipboardText
    $directory = Split-Path -Parent $destination
    New-Item -ItemType Directory -Force -Path $directory | Out-Null

    if (Test-Path -LiteralPath $destination) {
        $answer = Read-Host "File already exists: $relativePath. Overwrite? (y/N)"
        if ($answer -notmatch '^(y|yes|s|si)$') {
            Write-Output 'Cancelled. Existing file was not changed.'
            exit 0
        }
    }

    [System.IO.File]::WriteAllText($destination, $content, [System.Text.UTF8Encoding]::new($false))
    $lineCount = @($content -split "`r?`n").Count
    Write-Output "Saved $lineCount lines to $destination"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

