# specs/five-books.md Phase 2: checks the FavouriteBooksList migration on a COPY of the live data.
#
# 1. Put a copy of the live database in the local Postgres (the one the dev API uses), in a database whose name
#    contains "copy", e.g. from a Render backup:  pg_restore -d argos_livecopy --no-owner <backup file>
#    (create it first with: createdb argos_livecopy). The copy must be before FavouriteBooksList (an older one is brought up to FiveBooks first).
# 2. Run:  powershell -File scripts/five-books-migration-check/run.ps1 -Database argos_livecopy
#
# It snapshots the showcases (before.sql), migrates the copy up to FavouriteBooksList, and prints the checks
# (after.sql): every "problems" row must be 0. It never touches any database but the one named.
param(
    [Parameter(Mandatory = $true)][string]$Database,
    [string]$ApollonDir = $(if ($env:APOLLON_DIR) { $env:APOLLON_DIR } else { 'C:/Users/jramo/Apollon' })
)

$ErrorActionPreference = 'Stop'
if ($Database -notmatch 'copy') {
    throw "The database name must contain 'copy' (got '$Database'), so the dev or live database can't be picked by mistake."
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$psql = 'C:/Program Files/PostgreSQL/17/bin/psql.exe'

# The local server's login, from the API's user-secrets; only the database name is swapped.
Push-Location "$ApollonDir/src/Argos.Api"
$devConnection = (dotnet user-secrets list | Where-Object { $_ -like 'Database:ConnectionString = *' }) -replace '^Database:ConnectionString = ', ''
Pop-Location
if (-not $devConnection) { throw 'No Database:ConnectionString in the API user-secrets.' }
$parts = @{}
foreach ($pair in $devConnection.Split(';')) {
    if ($pair -match '^\s*([^=]+)=(.*)$') { $parts[$Matches[1].Trim().ToLowerInvariant()] = $Matches[2] }
}
$copyConnection = ($devConnection -replace '(?i)(Database=)[^;]*', "`${1}$Database")

$env:PGHOST = $parts['host']; $env:PGPORT = $parts['port']; $env:PGUSER = $parts['username']; $env:PGPASSWORD = $parts['password']
$env:PGDATABASE = $Database

# before.sql reads BookLists."Type", so an older copy (e.g. the live one) is first brought up to FiveBooks,
# which only adds columns; the showcases are untouched until FavouriteBooksList.
Write-Host '== Bringing the copy up to FiveBooks'
Push-Location $ApollonDir
dotnet build src/Argos.Api -c Release | Out-Null
dotnet ef database update 20261113015723_FiveBooks --project src/Argos.Infrastructure --startup-project src/Argos.Api `
    --configuration Release --no-build --connection $copyConnection
$upToFiveBooks = $LASTEXITCODE
Pop-Location
if ($upToFiveBooks -ne 0) { throw 'Migrating the copy up to FiveBooks failed.' }

Write-Host "== Before ($Database)"
& $psql -X -v ON_ERROR_STOP=1 -q -f "$here/before.sql"
if ($LASTEXITCODE -ne 0) { throw 'before.sql failed' }

Write-Host '== Migrating the copy'
Push-Location $ApollonDir
dotnet ef database update 20261113023004_FavouriteBooksList --project src/Argos.Infrastructure --startup-project src/Argos.Api `
    --configuration Release --no-build --connection $copyConnection
$migrated = $LASTEXITCODE
Pop-Location
if ($migrated -ne 0) { throw 'The migration failed on the copy.' }

Write-Host '== After'
& $psql -X -v ON_ERROR_STOP=1 -q -f "$here/after.sql"
