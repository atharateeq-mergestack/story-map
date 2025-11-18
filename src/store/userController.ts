/**
 * User Controller
 *
 * Manages user state using Jotai StateController.
 * All Supabase operations are done server-side via API routes.
 */

import type { Profile } from '@/db/schema';
import { StateController } from './stateController';

export type IUserState = {
  user: Profile | null;
  loading: boolean;
};

const initialUserState: IUserState = {
  user: null,
  loading: true,
};

class UserController extends StateController<IUserState> {
  constructor() {
    super(initialUserState);
  }

  /**
   * Updates the user profile.
   * This calls the API route to update the profile server-side.
   */
  async updateProfile(updates: Partial<Profile>) {
    const user = this.getValue('user');

    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`/api/profiles/${user.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();

      if (data.profile) {
        const updated = {
          ...this.getValue('user'),
          ...data.profile,
        } as Profile;

        this.updateState({ user: updated });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}

const userController = new UserController();

export default userController;
