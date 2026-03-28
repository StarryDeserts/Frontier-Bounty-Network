<#
.SYNOPSIS
Registers the current active Sui address as a hunter on the canonical Route B testnet package.

.EXAMPLE
pwsh ./scripts/testnet-register-hunter.ps1

.EXAMPLE
pwsh ./scripts/testnet-register-hunter.ps1 -GasObjectId 0xabc -GasBudget 60000000 -SwitchEnv testnet
#>
[CmdletBinding()]
param(
  [string]$PackageId,
  [UInt64]$GasBudget = 50000000,
  [string]$GasObjectId,
  [string]$SwitchEnv,
  [string]$SwitchAddress
)

. (Join-Path $PSScriptRoot 'testnet-common.ps1')

Set-SuiContextIfRequested -SwitchEnv $SwitchEnv -SwitchAddress $SwitchAddress
$config = Get-RouteBConfig -PackageId $PackageId
Write-RouteBContext -Config $config

$result = Invoke-RegisterHunterTx -Config $config -GasBudget $GasBudget -GasObjectId $GasObjectId
Write-Host "register_hunter tx: $($result.TxDigest)"
if ($result.HunterBadgeId) {
  Write-Host "hunter badge: $($result.HunterBadgeId)"
}

$result
