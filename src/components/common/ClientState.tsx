/**
 * Client State Component
 *
 * Hydrates the user state in the client-side store from server-side data.
 * This component should be rendered in the root layout.
 */

'use client';

import type { User } from '@supabase/supabase-js';
import type { IUserState } from '@/store/userController';
import userController from '@/store/userController';

type ClientStateProps = {
  props: {
    profile: IUserState['user'];
    session: { user: User | null } | null;
  };
};

export const ClientState = ({ props }: ClientStateProps) => {
  userController.useHydration({
    user: props.profile,
    loading: false,
  } as IUserState);

  return null;
};
