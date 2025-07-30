# Admin Authentication System - Temporary Password Mode

## Current Setup
The admin authentication is currently using a **temporary password system** instead of the role-based email authentication.

### Admin Access
- **Password**: `admin123` (change this in `src/components/TempPasswordAdminLogin.tsx`)
- **Login URL**: `/temp-admin-login`

### Files Modified for Temporary Auth:
1. `src/components/TempPasswordAdminLogin.tsx` - New password login component
2. `src/hooks/useTempAdminAuth.tsx` - New temporary auth hook
3. `src/components/TempAdminProtectedRoute.tsx` - New protection wrapper
4. `src/App.tsx` - Updated routes and lazy loading
5. `src/pages/Dashboard.tsx` - Updated admin button to use temp auth
6. `src/pages/AdminFeedback.tsx` - Updated to use temp auth
7. `src/pages/AdminModeration.tsx` - Updated to use temp auth

## To Revert Back to Original Email-Based System:

### 1. Update Dashboard.tsx
```typescript
// Change import
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Change the hook usage
const { checkAdminRole } = useAdminAuth();
const [isAdmin, setIsAdmin] = useState(false);

// Add back role checking in useEffect
useEffect(() => {
  if (user) {
    checkAdminRole().then(setIsAdmin).catch(() => setIsAdmin(false));
  }
}, [user, checkAdminRole]);

// Change admin button navigation
onClick={() => navigate('/dashboard/admin/feedback')}
```

### 2. Update AdminFeedback.tsx
```typescript
// Change import
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { SecureAdminLogin } from '@/components/SecureAdminLogin';

// Change hook usage
const { isAdminAuthenticated, adminLoading, revokeAdminSession } = useAdminAuth();

// Add back auth checks
useEffect(() => {
  if (isAdminAuthenticated) {
    fetchFeedback();
  } else {
    setLoading(false);
  }
}, [isAdminAuthenticated]);

// Change logout handler
const handleLogout = async () => {
  await revokeAdminSession();
  window.location.href = '/dashboard/admin/feedback';
};

// Add back authentication checks in render
if (adminLoading || loading) {
  return <div>Loading...</div>;
}

if (!isAdminAuthenticated) {
  return <SecureAdminLogin />;
}
```

### 3. Update AdminModeration.tsx
Similar changes as AdminFeedback.tsx

### 4. Update App.tsx
Remove temp routes and protection:
```typescript
// Remove these imports
import { TempPasswordAdminLogin } from "./components/TempPasswordAdminLogin";
import { TempAdminProtectedRoute } from "./components/TempAdminProtectedRoute";

// Change routes back to
<Route path="/dashboard/admin/feedback" element={
  <Suspense fallback={<LoadingSpinner />}>
    <AdminFeedback />
  </Suspense>
} />
<Route path="/dashboard/admin/moderation" element={
  <Suspense fallback={<LoadingSpinner />}>
    <AdminModeration />
  </Suspense>
} />
```

### 5. Ensure Admin Role is Set
Make sure `marshallgould303030@gmail.com` has admin role in the database:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE au.email = 'marshallgould303030@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### 6. Delete Temporary Files
- `src/components/TempPasswordAdminLogin.tsx`
- `src/hooks/useTempAdminAuth.tsx`
- `src/components/TempAdminProtectedRoute.tsx`
- This file (`ADMIN_AUTH_REVERT.md`)

## Password Security Notice
If continuing with password auth, change the password in `TempPasswordAdminLogin.tsx` from `admin123` to something secure.