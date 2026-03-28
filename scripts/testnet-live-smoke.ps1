<#
.SYNOPSIS
Runs the minimal Route B testnet live smoke path.

.DESCRIPTION
This script can execute:
- register_hunter
- split coin if needed
- create_bounty
- optional issue_kill_proof

Use -IncludeKillProof only when the active address controls KILL_PROOF_ISSUER_CAP_ID
and you intentionally want to verify the manual issuance boundary.

.EXAMPLE
pwsh ./scripts/testnet-live-smoke.ps1 -FundingCoinId 0xac31... -GasObjectId 0x4c3b... -IncludeKillProof
#>
[CmdletBinding()]
param(
  [string]$PackageId,
  [string]$BountyBoardId,
  [string]$ClaimRegistryId,
  [string]$KillProofIssuerCapId,
  [string]$ClockId,
  [string]$FundingCoinId,
  [string]$GasObjectId,
  [UInt64]$RewardAmountMist = 50000000,
  [string]$Target = '0x0000000000000000000000000000000000000000000000000000000000000b0b',
  [UInt64]$DurationHours = 24,
  [string]$Description = 'RC live smoke bounty',
  [UInt64]$RegisterGasBudget = 50000000,
  [UInt64]$CreateGasBudget = 100000000,
  [UInt64]$IssueGasBudget = 100000000,
  [UInt64]$SplitGasBudget = 50000000,
  [switch]$IncludeKillProof,
  [UInt64]$KillProofTimestampMs,
  [UInt64]$KillProofSolarSystemId = 300001,
  [string]$KillDigest,
  [string]$SwitchEnv,
  [string]$SwitchAddress
)

. (Join-Path $PSScriptRoot 'testnet-common.ps1')

Set-SuiContextIfRequested -SwitchEnv $SwitchEnv -SwitchAddress $SwitchAddress
$config = Get-RouteBConfig `
  -PackageId $PackageId `
  -BountyBoardId $BountyBoardId `
  -ClaimRegistryId $ClaimRegistryId `
  -KillProofIssuerCapId $KillProofIssuerCapId `
  -ClockId $ClockId

Write-RouteBContext -Config $config
$context = Get-ActiveSuiContext

if (-not $FundingCoinId) {
  $FundingCoinId = Resolve-FundingCoinId
}
if (-not $GasObjectId) {
  $GasObjectId = Resolve-GasObjectId -Exclude @($FundingCoinId)
}

Write-Host "Funding coin: $FundingCoinId"
Write-Host "Gas object: $GasObjectId"

$register = Invoke-RegisterHunterTx -Config $config -GasBudget $RegisterGasBudget -GasObjectId $GasObjectId
$create = Invoke-CreateBountyTx `
  -Config $config `
  -Target $Target `
  -DurationHours $DurationHours `
  -Description $Description `
  -GasBudget $CreateGasBudget `
  -FundingCoinId $FundingCoinId `
  -RewardAmountMist $RewardAmountMist `
  -GasObjectId $GasObjectId `
  -SplitGasBudget $SplitGasBudget

$issue = $null
if ($IncludeKillProof.IsPresent) {
  if (-not $KillProofTimestampMs) {
    $KillProofTimestampMs = [UInt64][DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  }
  if (-not $KillDigest) {
    $KillDigest = ('0x' + ([guid]::NewGuid().ToString('N')))
  }

  $issue = Invoke-IssueKillProofTx `
    -Config $config `
    -Recipient $context.Address `
    -Killer $context.Address `
    -Victim $Target `
    -TimestampMs $KillProofTimestampMs `
    -SolarSystemId $KillProofSolarSystemId `
    -KillDigest $KillDigest `
    -GasBudget $IssueGasBudget `
    -GasObjectId $GasObjectId
}

Write-Host "register_hunter tx: $($register.TxDigest)"
Write-Host "create_bounty tx: $($create.TxDigest)"
if ($IncludeKillProof.IsPresent -and $issue) {
  Write-Host "issue_kill_proof tx: $($issue.TxDigest)"
}

[pscustomobject]@{
  packageId = $config.PackageId
  bountyBoardId = $config.BountyBoardId
  claimRegistryId = $config.ClaimRegistryId
  killProofIssuerCapId = $config.KillProofIssuerCapId
  activeEnv = $context.Env
  activeAddress = $context.Address
  fundingCoinId = $FundingCoinId
  gasObjectId = $GasObjectId
  registerHunterTx = $register.TxDigest
  hunterBadgeId = $register.HunterBadgeId
  createBountyTx = $create.TxDigest
  bountyId = $create.BountyId
  paymentCoinId = $create.PaymentCoinId
  issueKillProofTx = if ($issue) { $issue.TxDigest } else { $null }
  killProofId = if ($issue) { $issue.KillProofId } else { $null }
}
