'use client';

import type { User } from '@supabase/supabase-js';
import type { IUserState } from '@/store/userController';
import { useEffect, useMemo } from 'react';
import userController from '@/store/userController';

type ClientStateProps = {
  props: {
    profile: IUserState['user'];
    session: { user: User | null } | null;
  };
};

export const ClientState = ({ props }: ClientStateProps) => {
  const hydrationState = useMemo(
    () =>
      ({
        user: props.profile,
        loading: false,
      }) as IUserState,
    [props.profile],
  );

  userController.useHydration(hydrationState);

  // Update state in useEffect to avoid render-time state updates
  // This ensures state is updated after render, not during render
  useEffect(() => {
    userController.updateState(hydrationState);
  }, [hydrationState]);

  return null;
};
