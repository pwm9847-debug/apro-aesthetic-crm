# src/pages/*.dc.html 의 @@HEAD@@, @@SIDE@@, @@SIDEJS@@ 를 partials 로 채워
# design/ (디자인 캔버스용)과 docs/ (GitHub Pages용)에 출력합니다.
$root = $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$head = [System.IO.File]::ReadAllText("$root\src\partials\head.html")
$side = [System.IO.File]::ReadAllText("$root\src\partials\side.html")
$sidejs = [System.IO.File]::ReadAllText("$root\src\partials\sidejs.txt")
$ver = Get-Date -Format 'yyyyMMddHHmm'
Get-ChildItem "$root\src\pages" -Filter *.dc.html | ForEach-Object {
  $t = [System.IO.File]::ReadAllText($_.FullName)
  $t = $t.Replace('@@HEAD@@', $head).Replace('@@SIDE@@', $side).Replace('@@SIDEJS@@', $sidejs)
  [System.IO.File]::WriteAllText("$root\design\$($_.Name)", $t, $utf8)
  $web = $t.Replace('<script src="./support.js"></script>', "<script src=""./dc-lite.js?v=$ver""></script>")
  [System.IO.File]::WriteAllText("$root\docs\$($_.Name)", $web, $utf8)
}
Write-Output "built with v=$ver"
