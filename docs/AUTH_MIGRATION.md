# Authentication System Migration Guide

## Overview

The authentication system has been completely overhauled to use Telegram's initData approach, providing cryptographic security and proper validation. This migration improves security by validating all requests against Telegram's signature.

## Key Changes

### 1. New Dependencies
- Added `@telegram-apps/sdk-react` for official Telegram SDK integration

### 2. Authentication Flow

#### Old System:
- Used simple `X-User-Id` header without validation
- Stored user ID in localStorage
- No cryptographic verification
- Vulnerable to spoofing

#### New System:
- Uses `X-Telegram-Init-Data` header with full init data
- Validates signature using HMAC-SHA256
- No client-side storage of sensitive data
- Cryptographically secure

### 3. Components Changed

#### Added:
- `/src/lib/telegram/init.ts` - Telegram SDK initialization
- `/src/lib/telegram/auth-validation.ts` - Server-side validation
- `/src/lib/telegram/get-user.ts` - User extraction helpers
- `/src/lib/api/auth.ts` - Unified authentication for API routes
- `/src/components/TelegramInit/` - SDK initialization component
- `/src/components/TelegramAuthProvider/` - Authentication context provider

#### Updated:
- `/src/middleware.ts` - Now checks for `X-Telegram-Init-Data`
- `/src/app/api/**/route.ts` - All API routes use `authenticateRequest()`
- `/src/lib/auth/client.ts` - Updated to use init data
- `/src/hooks/useUser.ts` - Now uses `useTelegramAuth()`
- `/src/components/Root/Root.tsx` - Includes TelegramInit and TelegramAuthProvider

#### Deprecated:
- `/src/components/AuthProvider/` - Replaced by TelegramAuthProvider
- Old `getUserIdFromRequest()` functions
- localStorage-based authentication

### 4. Environment Variables

**Required:**
```
TELEGRAM_BOT_TOKEN=your-bot-token
```

This token is essential for validating the cryptographic signature of init data.

### 5. Development Mode

The system includes a mock environment for development:
- Automatically activates when not in Telegram
- Creates mock user data
- Allows testing without Telegram

### 6. API Changes

All API requests now require the `X-Telegram-Init-Data` header:

```javascript
// Old way
headers: {
  'X-User-Id': '12345'
}

// New way
headers: {
  'X-Telegram-Init-Data': 'auth_date=123456789&hash=...'
}
```

### 7. Client Usage

```javascript
// Old way
import { getTelegramUserId } from '@/lib/auth/client';
const userId = getTelegramUserId();

// New way
import { useTelegramAuth } from '@/components/TelegramAuthProvider';
const { user, isLoading, error } = useTelegramAuth();
```

## Migration Steps

1. **Update Environment Variables**
   - Add `TELEGRAM_BOT_TOKEN` to your `.env.local`

2. **Update Client Code**
   - Replace `getTelegramUserId()` with `useTelegramAuth()` hook
   - Update API calls to use `getAuthHeaders()` from the updated client

3. **Test Authentication**
   - In development: Mock environment should work automatically
   - In production: Must be accessed through Telegram

## Security Improvements

1. **Cryptographic Validation**: All requests are validated against Telegram's signature
2. **No Client Storage**: Sensitive data is not stored in localStorage
3. **Server-Side Validation**: All authentication happens on the server
4. **Fresh Data Checks**: Init data expiration is validated (24 hours by default)
5. **User Data Sync**: User data is automatically synced with Supabase on each request

## Troubleshooting

1. **"Missing Telegram init data" error**
   - Ensure the app is opened through Telegram
   - Check that init data is being passed in the URL

2. **"Invalid hash" error**
   - Verify `TELEGRAM_BOT_TOKEN` is correct
   - Ensure init data hasn't been tampered with

3. **Development issues**
   - Mock environment should activate automatically
   - Check console for initialization messages

## Benefits

- ✅ Cryptographically secure authentication
- ✅ Automatic user data synchronization
- ✅ No manual session management
- ✅ Protection against replay attacks
- ✅ Consistent authentication across all endpoints