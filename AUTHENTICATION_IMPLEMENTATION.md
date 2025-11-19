# Authentication System Implementation

This document outlines the complete authentication system implementation for the Next.js application.

## 📁 Folder Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (public)
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx            # Login page (public)
│   │   └── signup/
│   │       └── page.tsx            # Signup page (public)
│   ├── dashboard/
│   │   ├── layout.tsx               # Protected layout wrapper
│   │   └── page.tsx                 # Dashboard (protected)
│   └── profile/
│       ├── layout.tsx               # Protected layout wrapper
│       └── page.tsx                 # Profile page (protected)
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx          # Login form (RHF + Yup)
│   │   └── SignUpForm.tsx          # Signup form (RHF + Yup)
│   ├── layout/
│   │   ├── Navigation.tsx          # Header navigation
│   │   └── ProtectedLayout.tsx     # Protected route wrapper
│   ├── profile/
│   │   └── ProfileForm.tsx          # Profile edit form (RHF + Yup)
│   └── ui/
│       ├── avatar.tsx               # Avatar component
│       ├── input-field.tsx          # Reusable InputField wrapper
│       └── ...                      # Other shadcn/ui components
├── hooks/
│   ├── useAuth.ts                   # Auth hook with redirects
│   └── useProfile.ts                # Profile management hook
└── lib/
    ├── supabase/
    │   ├── client.ts                # Browser Supabase client
    │   ├── server.ts                 # Server Supabase client (service role)
    │   └── server-auth.ts           # Server auth utilities (cookies)
    └── auth-utils.ts                # Auth utility functions
```

## 🔐 Server-Side Session Checking

### Server Components

Use the utilities in `src/lib/supabase/server-auth.ts`:

```typescript
import { getServerUser, isAuthenticated } from '@/lib/supabase/server-auth';

// Check if user is authenticated
const authenticated = await isAuthenticated();

// Get the current user
const user = await getServerUser();
```

### Example: Protected Page

```typescript
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase/server-auth';

export default async function ProtectedPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/');
  }

  return <div>Protected content</div>;
}
```

### Example: Public Page

```typescript
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/supabase/server-auth';

export default async function PublicPage() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect('/dashboard');
  }

  return <div>Public content</div>;
}
```

## 🔁 Redirect Logic

### Public Pages (Redirect if logged in)
- `/` → redirects to `/dashboard` if authenticated
- `/auth/login` → redirects to `/dashboard` if authenticated
- `/auth/signup` → redirects to `/dashboard` if authenticated

### Protected Pages (Redirect if not logged in)
- `/dashboard` → redirects to `/` if not authenticated
- `/profile` → redirects to `/` if not authenticated

## 🧩 Forms Implementation

### Sign In Form (`/auth/login`)

**Features:**
- React Hook Form integration
- Yup validation schema
- Email and password validation
- Error handling
- Auto-redirect to `/dashboard` on success

**Validation Rules:**
- Email: Required, valid email format
- Password: Required, minimum 6 characters

### Sign Up Form (`/auth/signup`)

**Features:**
- React Hook Form integration
- Yup validation schema
- Full name, email, password, confirm password fields
- Password strength validation
- Password match validation
- Creates user with Supabase Auth
- Creates profile via Drizzle ORM
- Auto-redirect to `/dashboard` on success

**Validation Rules:**
- Full Name: Required, 2-255 characters
- Email: Required, valid email format
- Password: Required, minimum 6 characters, must contain uppercase, lowercase, and number
- Confirm Password: Required, must match password

### Profile Form (`/profile`)

**Features:**
- React Hook Form integration
- Yup validation schema
- Full name and email fields
- Loads existing profile data
- Updates profile via API
- Success/error feedback

**Validation Rules:**
- Full Name: Optional, 2-255 characters if provided
- Email: Required, valid email format

## 🚪 Protected Route Handling

### Server Components

All protected pages use server-side session checking:

```typescript
// Example: src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase/server-auth';

export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) {
    redirect('/');
  }
  // ... rest of component
}
```

### Client Components

The `ProtectedLayout` component provides client-side protection:

```typescript
// Example: src/components/layout/ProtectedLayout.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // ... render logic
}
```

## 🧱 Reusable Components

### InputField

Wrapper around shadcn Input + Label + Error message:

```typescript
import { InputField } from '@/components/ui/input-field';

<InputField
  label="Email"
  type="email"
  error={errors.email?.message}
  required
/>
```

### Avatar

shadcn Avatar component with fallback:

```typescript
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src={user.avatar} />
  <AvatarFallback>{userInitials}</AvatarFallback>
</Avatar>
```

## 🛠️ API Routes

### Authentication Routes

- `POST /api/auth/signup` - Creates user and profile
- `POST /api/auth/signin` - Authenticates user
- `POST /api/auth/signout` - Signs out user

### Profile Routes

- `GET /api/profiles` - Get current user's profile
- `PUT /api/profiles/[userId]` - Update profile

## 📋 Pages Summary

### Public Pages

1. **Landing Page (`/`)**
   - Hero section with CTA buttons
   - Features section
   - Redirects to `/dashboard` if logged in

2. **Login Page (`/auth/login`)**
   - SignInForm component
   - Link to signup page
   - Redirects to `/dashboard` if logged in

3. **Signup Page (`/auth/signup`)**
   - SignUpForm component
   - Link to login page
   - Redirects to `/dashboard` if logged in

### Protected Pages

1. **Dashboard (`/dashboard`)**
   - Protected layout with navigation
   - "Coming Soon" placeholder
   - Shows user email

2. **Profile (`/profile`)**
   - Protected layout with navigation
   - ProfileForm component
   - Displays user ID and creation date

## 🎯 Best Practices

### UI Architecture
- All UI components use shadcn/ui
- Reusable components in `/components/ui`
- Consistent styling with Tailwind CSS
- Responsive design with mobile-first approach

### Form Validation
- React Hook Form for form state management
- Yup for schema validation
- Real-time validation feedback
- Clear error messages

### Session Handling
- Server-side session checking in Server Components
- Client-side session listening in Client Components
- Automatic redirects based on auth state
- Proper error handling

### Routing
- Server Components for initial page load
- Client Components for interactive features
- Middleware-ready architecture
- Proper redirect handling

## 🚀 Usage

### Starting the Application

```bash
pnpm dev
```

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
```

### Testing the Flow

1. Visit `/` - Should show landing page
2. Click "Sign Up" - Redirects to `/auth/signup`
3. Fill form and submit - Creates account and redirects to `/dashboard`
4. Visit `/profile` - Shows profile page with navigation
5. Click "Sign Out" - Redirects to `/`
6. Visit `/auth/login` - Shows login form
7. Login - Redirects to `/dashboard`
8. Try accessing `/dashboard` while logged out - Redirects to `/`

## 📝 Notes

- The server-side auth utilities use a simplified cookie-based approach. For production, consider using `@supabase/ssr` package for more robust cookie handling.
- All forms include proper accessibility attributes (aria-labels, autoComplete, etc.)
- Error messages are user-friendly and actionable
- Loading states are handled throughout the application
- TypeScript types are properly defined for all components
