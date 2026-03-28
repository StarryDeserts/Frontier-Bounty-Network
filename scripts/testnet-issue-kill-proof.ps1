<#
.SYNOPSIS
Issues a production KillProof on the canonical Route B testnet package.

.DESCRIPTION
-KillDigest accepts either a [1,2,3] vector literal or a hex string such as 0x11223344.
The active Sui address must control KILL_PROOF_ISSUER_CAP_ID.

.EXAMPLE
pwsh ./scripts/testnet-issue-kill-proof.ps1 -Recipient 0xme -Killer 0xme -Victim 0xdead -TimestampMs 1760000000000 -SolarSystemId 300001 -KillDigest 0x11223344
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Recipient,
  [Parameter(Mandatory = $true)][string]$Killer,
  [Parameter(Mandatory = $true)][string]$Victim,
  [Parameter(Mandatory = $true)][UInt64]$TimestampMs,
  [Parameter(Mandatory = $true)][UInt64]$SolarSystemId,
  [Parameter(Mandatory = $true)][string]$KillDigest,
  [string]$PackageId,
  [string]$KillProofIssuerCapId,
  [UInt64]$GasBudget = 100000000,
  [string]$GasObjectId,
  [string]$SwitchEnv,
  [string]$SwitchAddress
)

. (Join-Path $PSScriptRoot 'testnet-common.ps1')

Set-SuiContextIfRequested -SwitchEnv $SwitchEnv -SwitchAddress $SwitchAddress
$config = Get-RouteBConfig -PackageId $PackageId -KillProofIssuerCapId $KillProofIssuerCapId
Write-RouteBContext -Config $config

$result = Invoke-IssueKillProofTx `
  -Config $config `
  -Recipient $Recipient `
  -Killer $Killer `
  -Victim $Victim `
  -TimestampMs $TimestampMs `
  -SolarSystemId $SolarSystemId `
  -KillDigest $KillDigest `
  -GasBudget $GasBudget `
  -GasObjectId $GasObjectId

Write-Host "issue_kill_proof tx: $($result.TxDigest)"
if ($result.KillProofId) {
  Write-Host "kill proof id: $($result.KillProofId)"
}

$result
