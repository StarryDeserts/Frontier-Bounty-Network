<#
.SYNOPSIS
Creates a bounty on the canonical Route B testnet package.

.DESCRIPTION
Pass -PaymentCoinId if you already split a payment coin.
Otherwise pass -FundingCoinId and -RewardAmountMist so the script can split a payment coin first.

.EXAMPLE
pwsh ./scripts/testnet-create-bounty.ps1 -FundingCoinId 0xcoin -RewardAmountMist 50000000 -Target 0x000...0b0b

.EXAMPLE
pwsh ./scripts/testnet-create-bounty.ps1 -PaymentCoinId 0xpayment -Target 0x000...0b0b -Description 'RC smoke'
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Target,
  [string]$PackageId,
  [string]$BountyBoardId,
  [string]$ClockId,
  [UInt64]$DurationHours = 24,
  [string]$Description = 'RC smoke bounty',
  [UInt64]$GasBudget = 100000000,
  [string]$PaymentCoinId,
  [string]$FundingCoinId,
  [UInt64]$RewardAmountMist,
  [UInt64]$SplitGasBudget = 50000000,
  [string]$GasObjectId,
  [string]$SwitchEnv,
  [string]$SwitchAddress
)

. (Join-Path $PSScriptRoot 'testnet-common.ps1')

Set-SuiContextIfRequested -SwitchEnv $SwitchEnv -SwitchAddress $SwitchAddress
$config = Get-RouteBConfig -PackageId $PackageId -BountyBoardId $BountyBoardId -ClockId $ClockId
Write-RouteBContext -Config $config

$result = Invoke-CreateBountyTx `
  -Config $config `
  -Target $Target `
  -DurationHours $DurationHours `
  -Description $Description `
  -GasBudget $GasBudget `
  -PaymentCoinId $PaymentCoinId `
  -FundingCoinId $FundingCoinId `
  -RewardAmountMist $RewardAmountMist `
  -GasObjectId $GasObjectId `
  -SplitGasBudget $SplitGasBudget

Write-Host "create_bounty tx: $($result.TxDigest)"
if ($result.PaymentCoinId) {
  Write-Host "payment coin: $($result.PaymentCoinId)"
}
if ($result.BountyId) {
  Write-Host "bounty id: $($result.BountyId)"
}

$result
