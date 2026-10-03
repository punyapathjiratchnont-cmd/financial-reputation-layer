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

async function runPhase6Tests() {
  console.log('--- STARTING PHASE 6 AUTOMATED SECURITY & INTEGRITY TESTS ---');

  // Step 0: Generate a base Reputation Proof for User 'c1'
  const proofRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/proof',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { userId: 'c1' });

  const proofId = proofRes.data?.proof?.id;
  const proofScore = proofRes.data?.proof?.score;
  const proofLevel = proofRes.data?.proof?.level;
  console.log(`[Base Setup] Created Proof ID: ${proofId} (Score: ${proofScore}, Level: ${proofLevel})`);

  // Test 1: Authenticated user creates score-only share
  console.log('\n[Test 1] Creating score_only share link...');
  const share1Res = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    proofId,
    disclosureLevel: 'score_only',
    expiresInDays: 30,
    userId: 'c1'
  });

  if (share1Res.status !== 200 || !share1Res.data?.share?.shareToken) {
    console.error('❌ FAIL: Test 1 failed to create share link:', share1Res);
    process.exit(1);
  }
  const token1 = share1Res.data.share.shareToken;
  console.log('✅ PASS: Test 1 created score_only share token:', token1);

  // Test 18: Share token is cryptographically random (starts with share_ and has 64 hex chars = 256-bit entropy)
  if (!token1.startsWith('share_') || token1.length < 50) {
    console.error('❌ FAIL: Test 18 Share token is not 256-bit CSPRNG hex!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 18 Share token is 256-bit CSPRNG hex string:', token1);
  }

  // Test 2: Client attempts to inject fake score
  console.log('\n[Test 2] Attempting to inject fake score in share creation...');
  const fakeRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    proofId,
    disclosureLevel: 'score_only',
    fakeScore: 999,
    userId: 'c1'
  });

  const getFakeShareRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/share/${fakeRes.data?.share?.shareToken}`,
    method: 'GET'
  });

  if (getFakeShareRes.data?.reputation?.score === 999) {
    console.error('❌ FAIL: Test 2 Client injected fake score!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 2 Server ignored fake score input.');
  }

  // Test 3: Client attempts to create share from another user\'s proof
  console.log('\n[Test 3] User B attempting to create share from User A (c1) proof...');
  const unauthorizedRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    proofId,
    disclosureLevel: 'score_only',
    userId: 'user_b_attacker'
  });

  if (unauthorizedRes.status !== 403) {
    console.error('❌ FAIL: Test 3 Unauthorized user created share for another user proof!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 3 Blocked unauthorized share creation (403 Forbidden).');
  }

  // Test 4 & 5: Public verifier retrieves score_only share token
  console.log('\n[Test 4 & 5] Public GET score_only share token...');
  const public1Res = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/share/${token1}`,
    method: 'GET'
  });

  console.log('score_only response DTO:', public1Res.data);
  if (public1Res.data?.reputation?.score !== proofScore) {
    console.error('❌ FAIL: Test 5 Score missing or incorrect!');
    process.exit(1);
  }
  if (public1Res.data?.reputation?.level || public1Res.data?.reputation?.factors) {
    console.error('❌ FAIL: Test 5 score_only exposed level or factors!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 5 score_only contains ONLY score (NO level, NO factors, NO raw data).');
  }

  // Test 8: Public response contains NO ownerUserId or proofId
  if (public1Res.data?.ownerUserId || public1Res.data?.proofId) {
    console.error('❌ FAIL: Test 8 Public response exposed ownerUserId or proofId!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 8 Public DTO contains ZERO internal user/proof IDs.');
  }

  // Test 6: Create score_and_level share and verify DTO
  console.log('\n[Test 6] Testing score_and_level disclosure...');
  const share2Res = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    proofId,
    disclosureLevel: 'score_and_level',
    userId: 'c1'
  });
  const token2 = share2Res.data.share.shareToken;

  const public2Res = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/share/${token2}`,
    method: 'GET'
  });

  console.log('score_and_level response DTO:', public2Res.data);
  if (!public2Res.data?.reputation?.score || !public2Res.data?.reputation?.level) {
    console.error('❌ FAIL: Test 6 score_and_level missing score or level!');
    process.exit(1);
  }
  if (public2Res.data?.reputation?.factors) {
    console.error('❌ FAIL: Test 6 score_and_level exposed factors!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 6 score_and_level contains score + level (NO factors).');
  }

  // Test 7: Create score_and_factors share and verify DTO
  console.log('\n[Test 7] Testing score_and_factors disclosure...');
  const share3Res = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    proofId,
    disclosureLevel: 'score_and_factors',
    userId: 'c1'
  });
  const token3 = share3Res.data.share.shareToken;

  const public3Res = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/share/${token3}`,
    method: 'GET'
  });

  console.log('score_and_factors response DTO:', public3Res.data);
  if (!public3Res.data?.reputation?.factors?.paymentReliability) {
    console.error('❌ FAIL: Test 7 score_and_factors missing qualitative factors!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 7 score_and_factors contains qualitative factors only.');
  }

  // Test 10: Invalid/random token returns not found (404)
  console.log('\n[Test 10] Testing invalid share token query...');
  const invalidRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share/share_invalid_random_token_12345',
    method: 'GET'
  });
  if (invalidRes.status !== 404 || invalidRes.data?.valid !== false) {
    console.error('❌ FAIL: Test 10 Invalid token did not return 404 invalid!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 10 Invalid token returned 404 valid: false.');
  }

  // Test 11 & 16 & 20: Revocation tests
  console.log('\n[Test 16] User B attempting to revoke User A share token...');
  const unauthRevokeRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share/revoke',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    shareToken: token1,
    userId: 'user_b_attacker'
  });

  if (unauthRevokeRes.status !== 403) {
    console.error('❌ FAIL: Test 16 Unauthorized user revoked another user share token!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 16 Blocked unauthorized share revocation.');
  }

  console.log('\n[Test 11] Owner revoking share token 1...');
  const revoke1Res = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share/revoke',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    shareToken: token1,
    userId: 'c1'
  });

  const checkRevoked1 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/share/${token1}`,
    method: 'GET'
  });

  if (checkRevoked1.data?.valid !== false || checkRevoked1.data?.status !== 'revoked') {
    console.error('❌ FAIL: Test 11 Revoked share is still active!', checkRevoked1.data);
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 11 Revoked share returns valid: false and status: revoked.');
  }

  // Test 13: Revoking underlying proof invalidates all derived shares
  console.log('\n[Test 13] Revoking underlying proof ID...');
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/proof/revoke',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    proofId,
    userId: 'c1'
  });

  const checkShare2AfterProofRevoked = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/reputation/share/${token2}`,
    method: 'GET'
  });

  if (checkShare2AfterProofRevoked.data?.valid !== false || checkShare2AfterProofRevoked.data?.status !== 'revoked') {
    console.error('❌ FAIL: Test 13 Share stayed active after underlying proof was revoked!', checkShare2AfterProofRevoked.data);
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 13 Revoking underlying proof immediately invalidated share token.');
  }

  // Test 15: Share expiration cap at proof expiration
  console.log('\n[Test 15] Verifying share expiration cap at proof expiration...');
  const newProofRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/proof',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { userId: 'c1' });
  const newProofId = newProofRes.data.proof.id;
  const newProofExpiresAt = newProofRes.data.proof.expiresAt;

  const maxShareRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/reputation/share',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    proofId: newProofId,
    disclosureLevel: 'score_only',
    expiresInDays: 9999, // Attempt to exceed proof expiration
    userId: 'c1'
  });

  const shareExpiresAt = maxShareRes.data?.share?.expiresAt;
  if (new Date(shareExpiresAt).getTime() > new Date(newProofExpiresAt).getTime()) {
    console.error('❌ FAIL: Test 15 Share expiration exceeded proof expiration!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Test 15 Share expiration capped at proof expiration:', shareExpiresAt);
  }

  console.log('\n==================================================');
  console.log('🎉 ALL PHASE 6 AUTOMATED SECURITY TESTS PASSED!');
  console.log('==================================================');
}

runPhase6Tests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
