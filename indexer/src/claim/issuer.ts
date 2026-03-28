import { config } from '../config.js';
import type { ProofIssuancePlan, ResolvedKillRecord } from './types.js';

export interface ProofIssuer {
  readonly mode: 'manual';
  issue(input: { hunter: string; proof: ResolvedKillRecord }): ProofIssuancePlan;
}

const hexToByteArrayLiteral = (hex: string): string => {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length === 0) {
    return '[]';
  }

  const bytes: number[] = [];
  for (let index = 0; index < normalized.length; index += 2) {
    bytes.push(Number.parseInt(normalized.slice(index, index + 2), 16));
  }
  return `[${bytes.join(',')}]`;
};

const powershellCall = (args: string[], gasBudget: number): string => {
  const issuerCapId = config.killProofIssuerCapId ?? '<KILL_PROOF_ISSUER_CAP_ID>';

  return [
    'sui client call `',
    `--package ${config.packageId} `,
    '--module bounty_verify `',
    '--function issue_kill_proof `',
    `--args ${issuerCapId} ${args.join(' ')} `,
    `--gas-budget ${gasBudget}`,
  ].join('\n');
};

export class ManualProofIssuer implements ProofIssuer {
  readonly mode = 'manual' as const;

  issue(input: { hunter: string; proof: ResolvedKillRecord }): ProofIssuancePlan {
    const gasBudget = 100_000_000;
    const vectorLiteral = hexToByteArrayLiteral(input.proof.killDigestHex);
    const args = [
      input.hunter,
      input.proof.killer,
      input.proof.victim,
      String(input.proof.timestampMs),
      String(input.proof.solarSystemId),
      vectorLiteral,
    ];

    return {
      mode: this.mode,
      moveCall: {
        packageId: config.packageId,
        module: 'bounty_verify',
        function: 'issue_kill_proof',
        target: `${config.packageId}::bounty_verify::issue_kill_proof`,
        args: [config.killProofIssuerCapId ?? '<KILL_PROOF_ISSUER_CAP_ID>', ...args],
        gasBudget,
      },
      powershellCommand: powershellCall(args, gasBudget),
    };
  }
}
