# Serveur local Windows PowerShell, aucune installation de dépendances.
$ErrorActionPreference = 'Stop'
$nrRoot = Join-Path $PSScriptRoot 'app'
$nrListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,8765)
try { $nrListener.Start() } catch { Write-Host 'Le port 8765 est occupé. Si NR-TRANS fonctionne déjà, ouvrez http://127.0.0.1:8765'; exit 1 }
Start-Process 'http://127.0.0.1:8765'
Write-Host 'NR-TRANS fonctionne. Laissez cette fenêtre ouverte. Ctrl+C pour arrêter.'
$nrTypes = @{'.html'='text/html; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.css'='text/css; charset=utf-8';'.json'='application/json';'.webmanifest'='application/manifest+json';'.png'='image/png';'.svg'='image/svg+xml'}
try {
 while ($true) {
  $nrClient = $nrListener.AcceptTcpClient()
  try {
   $nrClient.ReceiveTimeout=3000
   $nrStream=$nrClient.GetStream()
   $nrReader=[System.IO.StreamReader]::new($nrStream,[System.Text.Encoding]::ASCII,$false,1024,$true)
   $nrLine=$nrReader.ReadLine()
   if (!$nrLine) {continue}
   $nrRequestPath=($nrLine -split ' ')[1]
   while ($nrReader.ReadLine()) {}
   $nrRequestPath=[Uri]::UnescapeDataString(($nrRequestPath -split '\?')[0])
   if ($nrRequestPath -eq '/') {$nrRequestPath='/index.html'}
   $nrPath=[System.IO.Path]::GetFullPath((Join-Path $nrRoot $nrRequestPath.TrimStart('/')))
   $nrStatus='200 OK'
   $nrMime=$nrTypes[[System.IO.Path]::GetExtension($nrPath)]
   if (!$nrMime) {$nrMime='application/octet-stream'}
   if (!$nrPath.StartsWith($nrRoot+[System.IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) -or !(Test-Path -LiteralPath $nrPath -PathType Leaf)) {
    $nrStatus='404 Not Found';$nrBytes=[System.Text.Encoding]::UTF8.GetBytes('Not found')
   } else {$nrBytes=[System.IO.File]::ReadAllBytes($nrPath)}
   $nrHeader=[System.Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $nrStatus`r`nContent-Type: $nrMime`r`nContent-Length: $($nrBytes.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n")
   $nrStream.Write($nrHeader,0,$nrHeader.Length);$nrStream.Write($nrBytes,0,$nrBytes.Length)
  } catch {Write-Host 'Requête interrompue.'} finally {$nrClient.Close()}
 }
} finally {$nrListener.Stop()}
