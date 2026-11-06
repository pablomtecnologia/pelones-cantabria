# Servidor local para ver la web de Pelones Cantabria (no necesita instalar nada)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8000
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
  '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.svg'='image/svg+xml';
  '.ico'='image/x-icon'; '.webp'='image/webp'; '.md'='text/plain; charset=utf-8'; '.sql'='text/plain; charset=utf-8' }
$listener = New-Object System.Net.HttpListener
while ($true) {
  try { $listener.Prefixes.Clear(); $listener.Prefixes.Add("http://localhost:$port/"); $listener.Start(); break }
  catch { $port++; if ($port -gt 8020) { throw "No hay ningun puerto libre entre 8000 y 8020" } $listener = New-Object System.Net.HttpListener }
}
$url = "http://localhost:$port/"
Write-Host ""
Write-Host "  Pelones Cantabria funcionando en $url" -ForegroundColor Magenta
Write-Host "  Deja esta ventana abierta mientras uses la web. Cierrala para apagarla." -ForegroundColor Cyan
Write-Host ""
Start-Process $url
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($path -eq '') { $path = 'index.html' }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $path))
    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-store')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $res.StatusCode = 404 }
  } catch { $res.StatusCode = 500 }
  finally { $res.OutputStream.Close() }
}
