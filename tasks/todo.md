# Security Fixes Plan

## Summary
Fix security vulnerabilities identified in code review: anonymous auth, duplicate writes, SSRF protection, and rate limiting.

---

## Todo

- [x] **1. Add Firebase Anonymous Auth**
  - Update `AuthContext.tsx` to auto sign-in anonymous users when no user is logged in
  - Use `signInAnonymously()` from Firebase Auth
  - This gives each anonymous user a unique UID for proper isolation

- [x] **2. Fix Storage Security Rules**
  - Remove the wide-open `anonymous-user` rule
  - All users (including anonymous) will now go through `request.auth.uid == userId`

- [x] **3. Fix Firestore Security Rules**
  - Ensure rules work correctly for anonymous users (they have valid `auth.uid`)

- [x] **4. Fix Duplicate Firestore Writes**
  - In `uploadService.ts`, change second `addDoc` to `updateDoc` (lines 64-68)
  - Same fix for compare mode (lines 121-125)

- [x] **5. Add SSRF Protection**
  - In `/api/analyze/route.ts`, validate that `fileUrl` is from `firebasestorage.googleapis.com`
  - Reject requests with URLs pointing elsewhere

- [x] **6. Add Rate Limiting**
  - Add simple rate limiting to `/api/analyze` endpoint
  - Limit: 10 requests per minute per user
  - Use in-memory store (sufficient for single instance)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | Add anonymous auth auto sign-in |
| `storage.rules` | Remove anonymous-user exception |
| `firestore.rules` | Verify rules work for anon users |
| `src/lib/uploadService.ts` | Fix duplicate writes (2 locations) |
| `src/app/api/analyze/route.ts` | Add SSRF protection + rate limiting |

---

## Review

### Summary of Changes

All 6 security fixes have been implemented:

| Fix | File | Change |
|-----|------|--------|
| Anonymous Auth | `AuthContext.tsx` | Added `signInAnonymously()` - auto signs in users without accounts, giving each a unique UID |
| Storage Rules | `storage.rules` | Removed wide-open `anonymous-user` folder, all users now require valid auth |
| Firestore Rules | `firestore.rules` | Updated comment, changed `write` to explicit `read, update, delete` for clarity |
| Duplicate Writes | `uploadService.ts` | Changed `addDoc` to `updateDoc` in 2 locations (lines 64, 120) |
| SSRF Protection | `analyze/route.ts` | Added `isValidStorageUrl()` - only allows URLs from `firebasestorage.googleapis.com` |
| Rate Limiting | `analyze/route.ts` | Added `isRateLimited()` - 10 requests per minute per user |

### Notes

- **Anonymous auth** uses Firebase's built-in anonymous authentication. Each browser session gets a unique UID that persists until they clear storage. Users can later upgrade to a real account.
- **Rate limiting** uses in-memory storage. This works for single-instance deployments. For multi-instance (e.g., serverless), consider Upstash Redis.
- **SSRF protection** validates hostname only. The full URL path is still user-controlled but constrained to your Firebase Storage bucket.
- **Deploy reminder**: Run `firebase deploy --only firestore:rules,storage` to deploy the updated security rules.
