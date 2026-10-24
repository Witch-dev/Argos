# Stops the browser-check skill's side-port servers: the API on 5259 and Vite on 5174.
# Never touches the user's own servers (5258, 5173). Run by the SessionStart and SessionEnd hooks in
# .claude/settings.local.json, so a side-port server never outlives the session that needed it (a
# crashed session's leftovers go when the next one starts). Always exits 0: a hook must not fail a session.
$ports = 5259, 5174
try {
    $owners = Get-NetTCPConnection -State Listen -ErrorAction Stop |
        Where-Object { $ports -contains $_.LocalPort } |
        Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($id in $owners) {
        Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
    }
} catch {
    # Nothing listening, or the lookup isn't available: nothing to stop.
}
exit 0
