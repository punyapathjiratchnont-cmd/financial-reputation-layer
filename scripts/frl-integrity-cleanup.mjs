/**
 * FRL one-off integrity cleanup.
 *
 * Run:  node scripts/frl-integrity-cleanup.mjs --apply
 *       (omit --apply for a read-only dry run)
 *
 * STEP 1 — Legacy reputation proofs.
 *   Any proof with no `policyVersion` was minted before the strict six-factor
 *   evidence policy. Those proofs may carry scores produced from fabricated
 *   default data (for example 808-828 from an empty profile).
 *
 *   Such proofs are stamped `policyVersion: "pre-task-2"` and revoked.
 *   Their score and level are left exactly as they are: this script never
 *   recalculates, revalidates or re-derives a score. Records are preserved so
 *   the history stays auditable.
 *
 *   Revocation alone is not enough on its own, so the serving layer must also
 *   refuse to return a reputation payload for a proof that is not valid.
 *
 * STEP 2 — Seeded demo score history.
 *   db.ts seeded four fabricated baseline points (720 -> 762) for c1. They were
 *   served through the real /api/reputation response and plotted as a real
 *   reputation trend. They are removed here and the seed is disabled in code.
 *   Demo score history for demo mode is unaffected: that lives in
 *   src/lib/mockFinancialData.ts and is shown only behind an explicit demo mode.
 *
 * STEP 3 — Runtime test artifacts.
 *   Removes the throwaway users created while verifying the live API, their
 *   proofs and shares, and the leftover seeded demo financial record for c1.
 *   The legacy proofs stamped pre-task-2 are deliberately KEPT as the audit
 *   trail. No source file and no demo fixture is touched.
 */

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const DB_PATH = path.join(process.cwd(), 'local-db.json');

/** The exact ids db.ts seeds. Anything written later uses `hist_${Date.now()}`. */
const SEEDED_HISTORY_IDS = new Set(['hist_1', 'hist_2', 'hist_3', 'hist_4']);

/**
 * Throwaway user ids created while verifying the live API during development.
 * These are runtime artifacts, never source fixtures.
 */
const TEST_USER_IDS = ['live-complete-user', 'live-partial-user', 'no-data-user-xyz'];

/**
 * c1 is a demo company. Its financial record and score history came from a
 * seed that has since been removed from db.ts, so any copy still sitting in
 * local-db.json is leftover demo state rather than real evidence.
 */
const DEMO_USER_ID = 'c1';

function summarise(label, details) {
  console.log(`\n${label}`);
  if (details.length === 0) {
    console.log('  nothing to do');
    return;
  }
  for (const line of details) console.log(`  ${line}`);
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.log(`No database at ${DB_PATH}. Nothing to clean.`);
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  const proofChanges = [];
  const historyChanges = [];
  const evidenceChanges = [];
  const artifactChanges = [];

  // --- STEP 1: stamp + revoke legacy proofs -------------------------------
  const proofs = Array.isArray(db.reputationProofs) ? db.reputationProofs : [];
  for (const proof of proofs) {
    if (proof.policyVersion) continue;

    proof.policyVersion = 'pre-task-2';
    proofChanges.push(
      `${proof.id}  score=${proof.score} level=${proof.level}  ${proof.status} -> revoked`
    );
    proof.status = 'revoked';
  }

  // --- STEP 2: drop seeded demo score history ------------------------------
  const scoreHistory = db.scoreHistory && typeof db.scoreHistory === 'object' ? db.scoreHistory : {};
  for (const [userId, entries] of Object.entries(scoreHistory)) {
    if (!Array.isArray(entries)) continue;
    const kept = entries.filter((entry) => !SEEDED_HISTORY_IDS.has(entry.id));
    const removed = entries.length - kept.length;
    if (removed === 0) continue;

    if (kept.length === 0) delete scoreHistory[userId];
    else scoreHistory[userId] = kept;

    historyChanges.push(`${userId}: removed ${removed} seeded demo point(s), kept ${kept.length}`);
  }
  db.scoreHistory = scoreHistory;

  // --- STEP 3: remove runtime test artifacts + leftover demo evidence ------
  const financialData =
    db.financialData && typeof db.financialData === 'object' ? db.financialData : {};

  // Evidence state to clear: throwaway test users plus the demo company.
  const evidenceUserIds = new Set([...TEST_USER_IDS, DEMO_USER_ID]);

  for (const userId of evidenceUserIds) {
    if (financialData[userId]) {
      evidenceChanges.push(`financialData["${userId}"] removed (seeded/demo evidence)`);
      delete financialData[userId];
    }
    const history = scoreHistory[userId];
    if (Array.isArray(history) && history.length > 0) {
      evidenceChanges.push(`scoreHistory["${userId}"] removed (${history.length} demo/test point(s))`);
      delete scoreHistory[userId];
    }
  }
  db.financialData = financialData;

  // Proofs and shares created by the live verification runs ONLY.
  // c1 is deliberately NOT in this set: it owns the legacy proofs that are the
  // audit trail for this whole cleanup, and they must survive.
  const keptProofs = proofs.filter((p) => !TEST_USER_IDS.includes(p.ownerUserId));
  const removedProofIds = new Set(
    proofs.filter((p) => TEST_USER_IDS.includes(p.ownerUserId)).map((p) => p.id)
  );
  if (removedProofIds.size > 0) {
    artifactChanges.push(`${removedProofIds.size} test proof(s) removed`);
  }
  db.reputationProofs = keptProofs;

  const shares = Array.isArray(db.reputationShares) ? db.reputationShares : [];
  const keptShares = shares.filter((s) => !removedProofIds.has(s.proofId));
  if (keptShares.length !== shares.length) {
    artifactChanges.push(`${shares.length - keptShares.length} test share(s) removed`);
  }
  db.reputationShares = keptShares;

  const activeAfter = keptProofs.filter((p) => p.status === 'active').length;

  summarise('STEP 1 — legacy proofs stamped pre-task-2 and revoked', proofChanges);
  summarise('STEP 2 — seeded demo score history removed', historyChanges);
  summarise('STEP 3 — leftover demo financial evidence removed', evidenceChanges);
  summarise('STEP 4 — live-test artifacts removed', artifactChanges);

  console.log('\nAfter cleanup:');
  console.log(`  financialData users : ${Object.keys(db.financialData).join(', ') || '(none)'}`);
  console.log(`  scoreHistory users  : ${Object.keys(db.scoreHistory).join(', ') || '(none)'}`);
  console.log(`  proofs total        : ${keptProofs.length}`);
  console.log(`  proofs active       : ${activeAfter}`);
  console.log(`  legacy audit trail  : ${keptProofs.filter((p) => p.policyVersion === 'pre-task-2').length} pre-task-2 proof(s) kept`);
  console.log(
    `  shares referencing a revoked proof are refused by the share endpoint automatically`
  );

  if (!APPLY) {
    console.log('\nDRY RUN — nothing written. Re-run with --apply to persist.');
    return;
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log(`\nApplied. Wrote ${DB_PATH}`);
}

main();
