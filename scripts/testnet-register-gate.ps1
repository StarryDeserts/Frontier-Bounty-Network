<#
.SYNOPSIS
Registers a Smart Gate bounty policy against the frozen Route B testnet baseline.

.DESCRIPTION
Creates a `gate_bounty::BountyGateConfig` object using the current package.

Modes:
- 0 = BLOCK
- 1 = SURCHARGE
- 2 = ALERT_ONLY

Recommended judge demo path: SURCHARGE.

.EXAMPLE
pwsh ./scripts/testnet-register-gate.ps1 -Mode 1 -SurchargeMist 5000000 -MinThresholdMist 25000000
#>
[CmdletBinding()]
param(
  [string]$PackageId,
  [string]$BountyBoardId,
  [string]$ClaimRegistryId,
  [string]$KillProofIssuerCapId,
  [string]$ClockId,
  [ValidateSet(0, 1, 2)][UInt32]$Mode = 1,
  [UInt64]$SurchargeMist = 5000000,
  [UInt64]$MinThresholdMist = 25000000,
  [UInt64]$GasBudget = 100000000,
  [string]$GasObjectId,
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
$response = Invoke-RegisterGateTx `
  -Config $config `
  -Mode $Mode `
  -SurchargeMist $SurchargeMist `
  -MinThresholdMist $MinThresholdMist `
  -GasBudget $GasBudget `
  -GasObjectId $GasObjectId

Write-Host "register_bounty_gate tx: $($response.TxDigest)"
if ($response.GateConfigId) {
  Write-Host "gate config id: $($response.GateConfigId)"
}

[pscustomobject]@{
  packageId = $config.PackageId
  bountyBoardId = $config.BountyBoardId
  claimRegistryId = $config.ClaimRegistryId
  mode = $Mode
  surchargeMist = $SurchargeMist
  minThresholdMist = $MinThresholdMist
  txDigest = $response.TxDigest
  gateConfigId = $response.GateConfigId
}
