param([Parameter(Mandatory=$true)][string]$InputFile)
$ErrorActionPreference = 'Stop'
$taskInput = [IO.File]::ReadAllText($InputFile, [Text.Encoding]::UTF8) | ConvertFrom-Json
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$taskSynth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$taskVoice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType=WindowsRuntime]::AllVoices | Where-Object Language -eq 'tr-TR' | Select-Object -First 1
if (-not $taskVoice) { throw 'Turkce Windows sesi bulunamadi' }
$taskSynth.Voice = $taskVoice
if ($null -ne $taskInput.rate) {
    $taskEscaped = [System.Security.SecurityElement]::Escape([string]$taskInput.text)
    $taskPause = [int]$taskInput.pause
    $taskEscaped = $taskEscaped -replace '([.!?])', ('$1<break time="' + $taskPause + 'ms"/>')
    $taskSynth.Options.SpeakingRate = [double]$taskInput.rate
    $taskSynth.Options.AudioPitch = [Math]::Pow(2,([double]$taskInput.pitch / 12))
    $taskSsml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="tr-TR">' + $taskEscaped + '</speak>'
    $taskOperation = $taskSynth.SynthesizeSsmlToStreamAsync($taskSsml)
} else { $taskOperation = $taskSynth.SynthesizeTextToStreamAsync($taskInput.text) }
$taskBridge = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 1 } | Select-Object -First 1
$taskAwaitable = $taskBridge.MakeGenericMethod([Windows.Media.SpeechSynthesis.SpeechSynthesisStream]).Invoke($null, @($taskOperation))
try { $taskAwaitable.Wait() } catch { throw $_.Exception.GetBaseException().Message }
$taskStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($taskAwaitable.Result)
$taskOutput = [IO.File]::Create($taskInput.output)
try { $taskStream.CopyTo($taskOutput) } finally { $taskOutput.Dispose(); $taskStream.Dispose(); $taskSynth.Dispose() }
