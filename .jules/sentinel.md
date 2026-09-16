# Jules Sentinel — Authorization-Bypass Finding

## Finding: Unauthenticated Marker Issuance

**Severity:** Critical  
**File:** `src/app/api/badges/issuer/route.ts`  
**Date:** 2026-09-16

### Issue
The `POST /api/badges/issuer` endpoint issued verification markers without verifying that the caller had permission to issue markers for the target profile. An attacker could mint markers for arbitrary BH-IDs.

### Root Cause
The route handler did not validate the caller's role or the relationship between the issuer and the target profile before calling `notifyMarkerIssued()` and persisting the marker.

### Fix Applied
Added role-based access control check before marker issuance. The issuer must be an admin or a verified mentor for the target cohort. Unauthorized requests now return `403`.

### Rule Added
> **sentinel-rule:** No marker may be issued without verifying `issuer.role === 'admin' || issuer.role === 'mentor' && issuer.cohortId === target.cohortId`. This check must run in the middleware layer, not just the handler body.

---

*Do not delete this file. It records a rule that prevents a real authorization bypass.*
