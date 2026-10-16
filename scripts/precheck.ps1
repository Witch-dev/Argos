# Runs the checks CI runs on Apollon, for what is about to be pushed, so a failure shows up here and
# not on GitHub. Lives in Argos (the Claude tooling repo); it checks the Apollon code repo.
#
#   scripts/precheck.ps1          run by hand from anywhere
#   scripts/precheck.ps1 -Hook    run by the Claude Code PreToolUse hook: reads the tool call from
#                                 stdin and does nothing unless it is a `git push` of Apollon
#   PRECHECK_ALL=1               check everything, not only what is being pushed
#   APOLLON_DIR=<path>           where the Apollon repo is (default C:/Users/jramo/Apollon)
#
# Exit 0: fine (or nothing to check). Exit 2: a check failed; the failing tail is on stderr, which
# is what Claude Code feeds back to Claude when the hook blocks the push.
param([switch]$Hook)

$ErrorActionPreference = 'Continue'
$repo = if ($env:APOLLON_DIR) { $env:APOLLON_DIR } else { 'C:/Users/jramo/Apollon' }

if ($Hook) {
    $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
    $command = [string]$payload.tool_input.command
    # `git push` at the start of a command or after && ; | (not inside a quoted string or a commit message).
    $isPush = $command -match '(^|&&|;|\|)\s*git\s+(-C\s+\S+\s+)?push\b'
    # Only pushes of Apollon. The planning repo (Argos) has nothing to run.
    $isApollon = $command -match 'Apollon'
    if (-not ($isPush -and $isApollon)) { exit 0 }
}

Set-Location $repo

# What is being pushed: files changed between the upstream branch and HEAD (everything when there is none).
$changed = @(git diff --name-only '@{u}' HEAD 2>$null)
if ($env:PRECHECK_ALL) { $changed = @('src/', 'test/', 'web/') }  # PRECHECK_ALL=1: check everything
elseif ($LASTEXITCODE -ne 0 -or $changed.Count -eq 0) {
    $upstreamKnown = (git rev-parse --abbrev-ref '@{u}' 2>$null) -and ($LASTEXITCODE -eq 0)
    if ($upstreamKnown) { Write-Output 'precheck: nothing to push, nothing to check'; exit 0 }
    $changed = @('src/', 'test/', 'web/')
}
$backend = @($changed | Where-Object { $_ -like 'src/*' -or $_ -like 'test/*' -or $_ -like '*.sln' -or $_ -like 'Directory.*' }).Count -gt 0
$web = @($changed | Where-Object { $_ -like 'web/*' }).Count -gt 0
if (-not ($backend -or $web)) { Write-Output 'precheck: no backend or web changes, nothing to check'; exit 0 }

function Fail($step, $lines) {
    [Console]::Error.WriteLine("precheck FAILED at: $step")
    $lines | Select-Object -Last 60 | ForEach-Object { [Console]::Error.WriteLine($_) }
    exit 2
}

function Run($step, [scriptblock]$block) {
    $output = & $block 2>&1 | ForEach-Object { "$_" }
    if ($LASTEXITCODE -ne 0) { Fail $step $output }
    return $output
}

$summary = @()

if ($backend) {
    # An API started from the Release folder locks the DLLs the tests build. Stop only that one: the
    # user's own dev API runs from bin/Debug and is left alone.
    Get-CimInstance Win32_Process -Filter "Name = 'dotnet.exe'" |
        Where-Object { $_.CommandLine -match 'bin[\\/]Release[\\/].*Argos\.Api\.dll' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    $out = Run 'dotnet test (Release)' { dotnet test test/Argos.Tests -c Release }
    $total = ($out | Select-String -Pattern '(total|Total tests):\s*(\d+)' | Select-Object -Last 1)
    $summary += "backend ok" + $(if ($total) { " ($($total.Matches[0].Groups[2].Value) tests)" } else { '' })
}

if ($web) {
    Push-Location (Join-Path $repo 'web')
    try {
        Run 'typecheck (tsc)' { npx tsc --noEmit -p tsconfig.app.json } | Out-Null
        Run 'lint' { npm run lint } | Out-Null
        $out = Run 'vitest' { npx vitest run }
        Run 'build' { npm run build } | Out-Null
        $tests = ($out | Select-String -Pattern 'Tests\s+(\d+) passed' | Select-Object -Last 1)
        $summary += "web ok" + $(if ($tests) { " ($($tests.Matches[0].Groups[1].Value) tests)" } else { '' })
    }
    finally { Pop-Location }
}

Write-Output ('precheck passed: ' + ($summary -join ', '))
exit 0
