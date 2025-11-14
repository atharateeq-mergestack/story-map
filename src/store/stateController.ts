import type { WritableAtom } from 'jotai';
import { atom, useAtom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { useHydrateAtoms } from 'jotai/utils';
import { store } from '@/provider/jotai-provider';

// Base Class for Jotai State Controller
export class StateController<T extends Record<string, any>> {
  store;
  state: WritableAtom<T, [T], void>;
  focusState: { [K in keyof T]: WritableAtom<T[K], [T[K]], void> };
  initialState: T;

  constructor(initialState: T) {
    this.store = store;
    this.initialState = initialState;
    this.state = atom(this.initialState);
    this.focusState = {} as { [K in keyof T]: WritableAtom<T[K], [T[K]], void> };
    Object.keys(initialState).forEach((key) => {
      this.getFocusItem(key);
    });
  }

  getFocusItem(key: keyof T) {
    if (!this.focusState[key]) {
      this.focusState[key] = focusAtom(this.state, optic =>
        (key as any).split('.').reduce((acc: any, part: any) => acc.prop(part), optic)) as WritableAtom<T[typeof key], [T[typeof key]], void>;
    }
    return this.focusState[key];
  }

  // eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
  useGenericHooks(keys: (keyof T)[]): Partial<T> {
    const keysVal: Partial<T> = {};
    keys.forEach((key) => {
      const [value] = useAtom(this.getFocusItem(key));
      (keysVal as T)[key] = value; // Type assertion to tell TypeScript this is valid
    });
    return keysVal;
  }

  useState(keys: (keyof T)[]) {
    return this.useGenericHooks(keys);
  }

  useScopeState(key: keyof T) {
    if (!this.focusState[key]) {
      this.focusState[key] = focusAtom(this.state, optic =>
        (key as any).split('.').reduce((acc: any, part: any) => acc.prop(part), optic)) as WritableAtom<T[typeof key], [T[typeof key]], void>;
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAtom(this.focusState[key]);
  }

  useHydration(state: T) {
    const hydratedStates: any[] = [];
    Object.keys(state).forEach((key) => {
      this.getFocusItem(key);
      hydratedStates.push([this.focusState[key], state[key]]);
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHydrateAtoms(hydratedStates);
    this.updateState(state);
  }

  setState(newState: Partial<T>) {
    Object.keys(newState).forEach((key) => {
      this.getFocusItem(key);
    });
    // Merge the inital state with the previous state
    const updatedState = { ...this.initialState, ...newState };

    // Set the updated state directly
    store.set(this.state, updatedState as T);
  }

  updateState(newState: Partial<T>) {
    Object.keys(newState).forEach((key) => {
      this.getFocusItem(key);
    });
    // Get the current state value
    const prevState = store.get(this.state);

    // Merge the new state with the previous state
    const updatedState = { ...prevState, ...newState };
    // Set the updated state directly
    store.set(this.state, updatedState as T);
  }

  getValues(keys: (keyof T)[]) {
    const returnValues = {} as Partial<T>;
    keys.forEach((key) => {
      returnValues[key] = store.get(this.focusState[key]);
    });
    return returnValues;
  }

  getValue = <K extends keyof T>(key: K): T[K] => {
    try {
      return this.focusState[key] ? store.get(this.focusState[key]) : (null as any);
    } catch {
      throw new Error(`Key: ${key as string} does not exist in initial State of`);
    }
  };

  resetAll() {
    store.set(this.state, this.initialState);
  }

  resetStates(keys: (keyof T)[]) {
    keys.forEach((key) => {
      store.set(this.focusState[key], this.initialState[key]);
    });
  }

  resetState(key: keyof T) {
    store.set(this.focusState[key], this.initialState[key]);
  }
}
