[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Prompt,

    [string[]]$ContextPath = @(),

    [string]$Model = 'openai/gpt-oss-20b',

    [ValidateSet('low', 'medium', 'xhigh')]
    [string]$ReasoningEffort = 'low',

    [ValidateRange(1, 65535)]
    [int]$Port = 1234,

    [ValidateRange(4096, 131072)]
    [int]$ContextLength = 32768,

    [ValidateRange(256, 16384)]
    [int]$MaxOutputTokens = 4096
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$modelsEndpoint = "http://127.0.0.1:$Port/v1/models"

if (-not (Get-Command lms -ErrorAction SilentlyContinue)) {
    throw 'O comando lms não está disponível. Abre o LM Studio e confirma a instalação do CLI em Developer.'
}

$loadedModels = @((lms ps --json | ConvertFrom-Json) | Where-Object { $_.type -eq 'llm' })
$selectedModel = $loadedModels | Where-Object { $_.identifier -eq $Model -or $_.modelKey -eq $Model } | Select-Object -First 1

if (-not $selectedModel) {
    foreach ($loadedModel in $loadedModels) {
        lms unload $loadedModel.identifier
        if ($LASTEXITCODE -ne 0) {
            throw "Não foi possível descarregar o modelo '$($loadedModel.identifier)'."
        }
    }

    Write-Host "A carregar no LM Studio: $Model"
    lms load $Model --gpu max --context-length $ContextLength --parallel 1 --yes
    if ($LASTEXITCODE -ne 0) {
        throw "Não foi possível carregar o modelo '$Model' no LM Studio."
    }
}

try {
    $modelResponse = Invoke-RestMethod -Uri $modelsEndpoint -Method Get -TimeoutSec 5
} catch {
    throw "O servidor do LM Studio não respondeu em $modelsEndpoint. Ativa Developer > Start Server e confirma a porta."
}

$availableModels = @($modelResponse.data | ForEach-Object { $_.id } | Where-Object { $_ })

if (-not $Model) {
    if ($availableModels.Count -eq 1) {
        $Model = $availableModels[0]
    } elseif ($availableModels.Count -eq 0) {
        throw 'O LM Studio respondeu, mas não apresentou nenhum modelo disponível.'
    } else {
        $modelList = $availableModels -join ', '
        throw "Existem vários modelos disponíveis: $modelList. Repete com -Model 'identificador'."
    }
} elseif ($Model -notin $availableModels) {
    $modelList = $availableModels -join ', '
    throw "O modelo '$Model' não está disponível. Modelos apresentados pelo LM Studio: $modelList"
}

$contextSections = foreach ($path in $ContextPath) {
    $resolvedPath = (Resolve-Path -LiteralPath $path).Path
    if (-not $resolvedPath.StartsWith($repoRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "O ficheiro de contexto tem de estar dentro do repositório: $resolvedPath"
    }

    $relativePath = [System.IO.Path]::GetRelativePath($repoRoot, $resolvedPath)
    "--- FICHEIRO: $relativePath ---`n$(Get-Content -Raw -LiteralPath $resolvedPath)"
}

$localPrompt = @"
$Prompt

Analisa apenas o pedido e o contexto fornecido. Não assumes que consegues executar comandos ou editar ficheiros. Devolve:
1. diagnóstico e solução recomendada;
2. alterações exatas por ficheiro;
3. testes que o Codex principal deve executar;
4. riscos ou dúvidas.

$($contextSections -join "`n`n")
"@

Write-Host "Repositório: $repoRoot"
Write-Host "Modelo local: $Model"
Write-Host "Raciocínio pedido: $ReasoningEffort"
Write-Host "Ficheiros de contexto: $($ContextPath.Count)"

$requestBody = @{
    model = $Model
    messages = @(
        @{
            role = 'system'
            content = 'És um assistente local de engenharia de software. Sê conciso, rigoroso e preserva os requisitos fornecidos.'
        },
        @{
            role = 'user'
            content = $localPrompt
        }
    )
    temperature = 0.1
    reasoning_effort = $ReasoningEffort
    max_tokens = $MaxOutputTokens
    stream = $false
} | ConvertTo-Json -Depth 8

$completionEndpoint = "http://127.0.0.1:$Port/v1/chat/completions"
$response = Invoke-RestMethod -Uri $completionEndpoint -Method Post -ContentType 'application/json' -Body $requestBody -TimeoutSec 1500
$message = $response.choices[0].message.content

if ([string]::IsNullOrWhiteSpace($message)) {
    $usage = $response.usage | ConvertTo-Json -Compress
    throw "O modelo terminou sem resposta utilizável. Utilização local: $usage"
}

$message
