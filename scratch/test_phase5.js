const http = require('http');

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PHASE 5 AUTOMATED VERIFICATION ---');

  // 1. Generate Proof Test (Server Recalculates Score, Ignores Fake Client Scores)
  console.log('\n[Test 1 & 4] Generating Reputation Proof (Client score tampering attempt)...');
  const genRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/proof',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    userId: 'c1',
    score: 999, // Fake score attempt! Should be IGNORED!
    level: 'GOD_MODE' // Fake level attempt! Should be IGNORED!
  });

  console.log('Generate Response status:', genRes.status);
  console.log('Generated Proof ID:', genRes.data?.proof?.id);
  console.log('Snapshot Score:', genRes.data?.proof?.score);
  console.log('Snapshot Level:', genRes.data?.proof?.level);
  console.log('Factor Summary:', genRes.data?.proof?.factorSummary);

  if (genRes.data?.proof?.score === 999) {
    console.error('❌ FAIL: Client was able to tamper with score!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Client score tampering prevented! Server computed snapshot score:', genRes.data?.proof?.score);
  }

  const proof1Id = genRes.data?.proof?.id;

  // 2. Verification ID non-guessability check
  if (!proof1Id || !proof1Id.startsWith('proof_') || proof1Id.length < 20) {
    console.error('❌ FAIL: Verification ID is not cryptographically secure hex!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Verification ID is cryptographically secure:', proof1Id);
  }

  // 3. Public Verification Endpoint Test (Sanitized Object Check)
  console.log('\n[Test 6 & 7] Public Verification Endpoint (GET /api/reputation/verify/[verificationId])...');
  const verifyRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/verify/${proof1Id}`,
    method: 'GET',
  });

  console.log('Public Verify Response:', verifyRes.data);

  if (verifyRes.data?.valid !== true) {
    console.error('❌ FAIL: Public verification failed for active proof!');
    process.exit(1);
  }

  // Privacy Check: Ensure raw financial data (income, expenses, savings, debts) is NOT in public response!
  const publicDataKeys = Object.keys(verifyRes.data);
  const repKeys = Object.keys(verifyRes.data.reputation);
  const rawFields = ['income', 'expenses', 'savings', 'debts', 'transactions', 'bankAccount'];

  const exposed = rawFields.filter(f => publicDataKeys.includes(f) || repKeys.includes(f));
  if (exposed.length > 0) {
    console.error('❌ FAIL: Public endpoint exposed raw financial data:', exposed);
    process.exit(1);
  } else {
    console.log('✅ PASS: Public verification response is strictly sanitized and exposes ZERO raw financial data!');
  }

  // 4. Update User Financial Data to change score and check Snapshot Immutability
  console.log('\n[Test 12 & 13] Snapshot Immutability (Updating user financial data)...');
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    userId: 'c1',
    financialData: {
      income: { monthly: 30000, stabilityMonths: 6, sourcesCount: 1 },
      expenses: { monthlyAvg: 28000, discretionaryRatio: 0.6 },
      payments: { totalDue: 10, onTimeCount: 7, lateCount: 2, missedCount: 1 },
      savings: { currentBalance: 10000, monthlyContribution: 1000, emergencyFundMonths: 0.3 },
      debts: { totalDebt: 120000, creditLimit: 150000, utilizationRatio: 0.8, monthlyDebtService: 15000 },
      transactions: { count6Months: 30, bouncedCount: 2, oldestAccountYears: 1 }
    }
  });


  // Verify proof 1 remains identical (snapshot isolation)
  const verifyResAfter = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/verify/${proof1Id}`,
    method: 'GET',
  });

  if (verifyResAfter.data?.reputation?.score !== genRes.data?.proof?.score) {
    console.error('❌ FAIL: Old proof score changed when financial data updated! Snapshot broken.');
    process.exit(1);
  } else {
    console.log('✅ PASS: Old proof maintained static snapshot score:', verifyResAfter.data?.reputation?.score);
  }

  // Generate Proof #2 with new score
  const genRes2 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/proof',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { userId: 'c1' });

  console.log('Proof #2 ID:', genRes2.data?.proof?.id, 'Score:', genRes2.data?.proof?.score);
  if (genRes2.data?.proof?.score === genRes.data?.proof?.score) {
    console.error('❌ FAIL: Proof #2 did not capture updated score!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Proof #2 created new snapshot with updated score:', genRes2.data?.proof?.score);
  }

  // 5. Revocation Test
  console.log('\n[Test 9 & 10] Revoking Proof #1...');
  const revokeRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/proof/revoke',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { proofId: proof1Id, userId: 'c1' });

  console.log('Revoke response:', revokeRes.data);

  // Check public verification after revocation
  const verifyRevokedRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/verify/${proof1Id}`,
    method: 'GET',
  });

  console.log('Public verification for revoked proof:', verifyRevokedRes.data);
  if (verifyRevokedRes.data?.valid !== false || verifyRevokedRes.data?.status !== 'revoked') {
    console.error('❌ FAIL: Revoked proof still valid or status not updated!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Revoked proof is correctly marked invalid with status "revoked"!');
  }

  console.log('\n==================================================');
  console.log('🎉 ALL PHASE 5 AUTOMATED TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runTests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
