Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:RouteBDefaults = [ordered]@{
  PackageId = '0x8c03f8415d7a4af75c9dc95fdbfe7e64de611bb26f5e7bb8a1197443f6c4accd'
  BountyBoardId = '0xadd50afd6aac041574e50bbff5a08948d3afd5dc6358343aae8d514b8389f4f6'
  ClaimRegistryId = '0xf30348954b620a4d2c761e34132782b4559153a077309d30217131182631b671'
  KillProofIssuerCapId = '0x21af175fcbb2024923339f5c871bf1856bc731002904966b3b20ae40418d6539'
  ClockId = '0x6'
}

function Get-RouteBConfig {
  [CmdletBinding()]
  param(
    [string]$PackageId,
    [string]$BountyBoardId,
    [string]$ClaimRegistryId,
    [string]$KillProofIssuerCapId,
    [string]$ClockId
  )

  return [ordered]@{
    PackageId = if ($PackageId) { $PackageId } elseif ($env:PACKAGE_ID) { $env:PACKAGE_ID } else { $script:RouteBDefaults.PackageId }
    BountyBoardId = if ($BountyBoardId) { $BountyBoardId } elseif ($env:BOUNTY_BOARD_ID) { $env:BOUNTY_BOARD_ID } else { $script:RouteBDefaults.BountyBoardId }
    ClaimRegistryId = if ($ClaimRegistryId) { $ClaimRegistryId } elseif ($env:CLAIM_REGISTRY_ID) { $env:CLAIM_REGISTRY_ID } else { $script:RouteBDefaults.ClaimRegistryId }
    KillProofIssuerCapId = if ($KillProofIssuerCapId) { $KillProofIssuerCapId } elseif ($env:KILL_PROOF_ISSUER_CAP_ID) { $env:KILL_PROOF_ISSUER_CAP_ID } else { $script:RouteBDefaults.KillProofIssuerCapId }
    ClockId = if ($ClockId) { $ClockId } elseif ($env:CLOCK_ID) { $env:CLOCK_ID } else { $script:RouteBDefaults.ClockId }
  }
}

function Invoke-SuiText {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  $output = & sui @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "sui $($Arguments -join ' ') failed.`n$($output | Out-String)"
  }

  return ($output | Out-String).Trim()
}

function Invoke-SuiJson {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  $text = Invoke-SuiText -Arguments ($Arguments + '--json')
  try {
    return $text | ConvertFrom-Json -Depth 100
  } catch {
    throw "Failed to parse JSON for: sui $($Arguments -join ' ')`n$text"
  }
}

function Set-SuiContextIfRequested {
  [CmdletBinding()]
  param(
    [string]$SwitchEnv,
    [string]$SwitchAddress
  )

  if ($SwitchEnv) {
    Write-Host "Switching active Sui env to $SwitchEnv"
    Invoke-SuiText -Arguments @('client', 'switch', '--env', $SwitchEnv) | Out-Null
  }

  if ($SwitchAddress) {
    Write-Host "Switching active Sui address to $SwitchAddress"
    Invoke-SuiText -Arguments @('client', 'switch', '--address', $SwitchAddress) | Out-Null
  }
}

function Get-ActiveSuiContext {
  [CmdletBinding()]
  param()

  return [ordered]@{
    Env = Invoke-SuiText -Arguments @('client', 'active-env')
    Address = Invoke-SuiText -Arguments @('client', 'active-address')
  }
}

function Get-TransactionDigest {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true)]$Response)

  if ($Response.PSObject.Properties.Name -contains 'digest' -and $Response.digest) {
    return [string]$Response.digest
  }

  if ($Response.PSObject.Properties.Name -contains 'transactionDigest' -and $Response.transactionDigest) {
    return [string]$Response.transactionDigest
  }

  if (
    ($Response.PSObject.Properties.Name -contains 'effects') -and
    $Response.effects -and
    ($Response.effects.PSObject.Properties.Name -contains 'transactionDigest') -and
    $Response.effects.transactionDigest
  ) {
    return [string]$Response.effects.transactionDigest
  }

  throw 'Could not determine transaction digest from Sui response.'
}

function Get-ObjectChanges {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true)]$Response)

  if (($Response.PSObject.Properties.Name -contains 'objectChanges') -and $Response.objectChanges) {
    return @($Response.objectChanges)
  }

  return @()
}

function Get-CreatedObjectIdByTypeFragment {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)]$Response,
    [Parameter(Mandatory = $true)][string]$TypeFragment
  )

  foreach ($change in Get-ObjectChanges -Response $Response) {
    $changeType = [string]($change.type)
    $objectType = [string]($change.objectType)
    if ($changeType -eq 'created' -and $objectType -like "*$TypeFragment*") {
      return [string]$change.objectId
    }
  }

  return $null
}

function Get-GasCoins {
  [CmdletBinding()]
  param()

  return @(Invoke-SuiJson -Arguments @('client', 'gas'))
}

function Resolve-GasObjectId {
  [CmdletBinding()]
  param(
    [string]$GasObjectId,
    [string[]]$Exclude = @()
  )

  if ($GasObjectId) {
    return $GasObjectId
  }

  $excluded = @{}
  foreach ($item in $Exclude) {
    if ($item) {
      $excluded[$item.ToLowerInvariant()] = $true
    }
  }

  foreach ($coin in Get-GasCoins) {
    $coinId = [string]$coin.gasCoinId
    if (-not $excluded.ContainsKey($coinId.ToLowerInvariant())) {
      return $coinId
    }
  }

  throw 'Unable to auto-select a gas object. Pass -GasObjectId explicitly.'
}

function Resolve-FundingCoinId {
  [CmdletBinding()]
  param([string]$FundingCoinId)

  if ($FundingCoinId) {
    return $FundingCoinId
  }

  $coins = Get-GasCoins | Sort-Object { [int64]$_.mistBalance } -Descending
  if (-not $coins) {
    throw 'No SUI gas coins found for funding.'
  }

  return [string]$coins[0].gasCoinId
}

function Convert-StringToUtf8VectorLiteral {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true)][string]$Value)

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
  return '[' + (($bytes | ForEach-Object { [string]$_ }) -join ',') + ']'
}

function Convert-HexToVectorLiteral {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true)][string]$Hex)

  $normalized = $Hex.Trim()
  if ($normalized.StartsWith('0x')) {
    $normalized = $normalized.Substring(2)
  }

  if (($normalized.Length % 2) -ne 0) {
    throw 'Hex value must contain an even number of characters.'
  }

  $bytes = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt $normalized.Length; $i += 2) {
    $bytes.Add([Convert]::ToInt32($normalized.Substring($i, 2), 16).ToString())
  }

  return '[' + ($bytes -join ',') + ']'
}

function Normalize-VectorLiteral {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true)][string]$Value)

  $trimmed = $Value.Trim()
  if ($trimmed.StartsWith('[') -and $trimmed.EndsWith(']')) {
    return $trimmed
  }

  if ($trimmed -match '^(0x)?[0-9a-fA-F]+$') {
    return Convert-HexToVectorLiteral -Hex $trimmed
  }

  throw 'Vector argument must be a [1,2,3] literal or a hex string.'
}

function Split-SuiCoin {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][string]$CoinId,
    [Parameter(Mandatory = $true)][UInt64]$AmountMist,
    [Parameter(Mandatory = $true)][UInt64]$GasBudget,
    [string]$GasObjectId
  )

  $resolvedGas = Resolve-GasObjectId -GasObjectId $GasObjectId -Exclude @($CoinId)
  $response = Invoke-SuiJson -Arguments @(
    'client', 'split-coin',
    '--coin-id', $CoinId,
    '--amounts', $AmountMist.ToString(),
    '--gas', $resolvedGas,
    '--gas-budget', $GasBudget.ToString()
  )

  $paymentCoinId = Get-CreatedObjectIdByTypeFragment -Response $response -TypeFragment '::coin::Coin<'
  if (-not $paymentCoinId) {
    throw 'Split coin succeeded but created payment coin ID was not found in objectChanges.'
  }

  return [pscustomobject]@{
    TxDigest = Get-TransactionDigest -Response $response
    PaymentCoinId = $paymentCoinId
    GasObjectId = $resolvedGas
    Raw = $response
  }
}

function Invoke-RegisterHunterTx {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Collections.IDictionary]$Config,
    [Parameter(Mandatory = $true)][UInt64]$GasBudget,
    [string]$GasObjectId
  )

  $resolvedGas = Resolve-GasObjectId -GasObjectId $GasObjectId
  $response = Invoke-SuiJson -Arguments @(
    'client', 'call',
    '--package', $Config.PackageId,
    '--module', 'bounty_registry',
    '--function', 'register_hunter',
    '--gas', $resolvedGas,
    '--gas-budget', $GasBudget.ToString()
  )

  return [pscustomobject]@{
    TxDigest = Get-TransactionDigest -Response $response
    HunterBadgeId = Get-CreatedObjectIdByTypeFragment -Response $response -TypeFragment '::bounty_registry::HunterBadge'
    GasObjectId = $resolvedGas
    Raw = $response
  }
}

function Invoke-CreateBountyTx {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Collections.IDictionary]$Config,
    [Parameter(Mandatory = $true)][string]$Target,
    [Parameter(Mandatory = $true)][UInt64]$DurationHours,
    [Parameter(Mandatory = $true)][string]$Description,
    [Parameter(Mandatory = $true)][UInt64]$GasBudget,
    [string]$PaymentCoinId,
    [string]$FundingCoinId,
    [UInt64]$RewardAmountMist,
    [string]$GasObjectId,
    [UInt64]$SplitGasBudget = 50000000
  )

  if (-not $PaymentCoinId) {
    if (-not $RewardAmountMist) {
      throw 'Pass -PaymentCoinId directly or provide -FundingCoinId with -RewardAmountMist.'
    }

    $resolvedFundingCoin = Resolve-FundingCoinId -FundingCoinId $FundingCoinId
    $split = Split-SuiCoin -CoinId $resolvedFundingCoin -AmountMist $RewardAmountMist -GasBudget $SplitGasBudget -GasObjectId $GasObjectId
    $PaymentCoinId = $split.PaymentCoinId
    if (-not $GasObjectId) {
      $GasObjectId = Resolve-GasObjectId -Exclude @($PaymentCoinId, $resolvedFundingCoin)
    }
  }

  $resolvedGas = Resolve-GasObjectId -GasObjectId $GasObjectId -Exclude @($PaymentCoinId)
  $descriptionBytes = Convert-StringToUtf8VectorLiteral -Value $Description
  $response = Invoke-SuiJson -Arguments @(
    'client', 'call',
    '--package', $Config.PackageId,
    '--module', 'bounty_registry',
    '--function', 'create_bounty',
    '--args', $Config.BountyBoardId, $PaymentCoinId, $Target, $DurationHours.ToString(), $descriptionBytes, $Config.ClockId,
    '--gas', $resolvedGas,
    '--gas-budget', $GasBudget.ToString()
  )

  return [pscustomobject]@{
    TxDigest = Get-TransactionDigest -Response $response
    BountyId = Get-CreatedObjectIdByTypeFragment -Response $response -TypeFragment '::bounty_registry::Bounty'
    PaymentCoinId = $PaymentCoinId
    GasObjectId = $resolvedGas
    Raw = $response
  }
}

function Invoke-IssueKillProofTx {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Collections.IDictionary]$Config,
    [Parameter(Mandatory = $true)][string]$Recipient,
    [Parameter(Mandatory = $true)][string]$Killer,
    [Parameter(Mandatory = $true)][string]$Victim,
    [Parameter(Mandatory = $true)][UInt64]$TimestampMs,
    [Parameter(Mandatory = $true)][UInt64]$SolarSystemId,
    [Parameter(Mandatory = $true)][string]$KillDigest,
    [Parameter(Mandatory = $true)][UInt64]$GasBudget,
    [string]$GasObjectId
  )

  $resolvedGas = Resolve-GasObjectId -GasObjectId $GasObjectId
  $vectorLiteral = Normalize-VectorLiteral -Value $KillDigest
  $response = Invoke-SuiJson -Arguments @(
    'client', 'call',
    '--package', $Config.PackageId,
    '--module', 'bounty_verify',
    '--function', 'issue_kill_proof',
    '--args', $Config.KillProofIssuerCapId, $Recipient, $Killer, $Victim, $TimestampMs.ToString(), $SolarSystemId.ToString(), $vectorLiteral,
    '--gas', $resolvedGas,
    '--gas-budget', $GasBudget.ToString()
  )

  return [pscustomobject]@{
    TxDigest = Get-TransactionDigest -Response $response
    KillProofId = Get-CreatedObjectIdByTypeFragment -Response $response -TypeFragment '::bounty_verify::KillProof'
    GasObjectId = $resolvedGas
    Raw = $response
  }
}

function Write-RouteBContext {
  [CmdletBinding()]
  param([Parameter(Mandatory = $true)][System.Collections.IDictionary]$Config)

  $context = Get-ActiveSuiContext
  Write-Host "Active env: $($context.Env)"
  Write-Host "Active address: $($context.Address)"
  Write-Host "Package: $($Config.PackageId)"
  Write-Host "BountyBoard: $($Config.BountyBoardId)"
  Write-Host "ClaimRegistry: $($Config.ClaimRegistryId)"
  Write-Host "KillProofIssuerCap: $($Config.KillProofIssuerCapId)"
}


function Invoke-RegisterGateTx {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][System.Collections.IDictionary]$Config,
    [Parameter(Mandatory = $true)][UInt32]$Mode,
    [Parameter(Mandatory = $true)][UInt64]$SurchargeMist,
    [Parameter(Mandatory = $true)][UInt64]$MinThresholdMist,
    [Parameter(Mandatory = $true)][UInt64]$GasBudget,
    [string]$GasObjectId
  )

  $resolvedGas = Resolve-GasObjectId -GasObjectId $GasObjectId
  $response = Invoke-SuiJson -Arguments @(
    'client', 'call',
    '--package', $Config.PackageId,
    '--module', 'gate_bounty',
    '--function', 'register_bounty_gate',
    '--args', $Mode.ToString(), $SurchargeMist.ToString(), $MinThresholdMist.ToString(),
    '--gas', $resolvedGas,
    '--gas-budget', $GasBudget.ToString()
  )

  return [pscustomobject]@{
    TxDigest = Get-TransactionDigest -Response $response
    GateConfigId = Get-CreatedObjectIdByTypeFragment -Response $response -TypeFragment '::gate_bounty::BountyGateConfig'
    GasObjectId = $resolvedGas
    Raw = $response
  }
}
