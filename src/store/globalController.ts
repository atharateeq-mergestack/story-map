import { StateController } from '@/store/stateController';

type IGlobalState = {
  count: number;
  isLoading: boolean;
  loadingMessage?: string;
};

const globalInitialState: IGlobalState = {
  count: 0,
  isLoading: false,
  loadingMessage: undefined,
};

class GlobalController extends StateController<IGlobalState> {
  constructor() {
    super(globalInitialState);
  }

  increment() {
    const current = this.getValue('count');
    this.updateState({ count: current + 1 });
  }

  decrement() {
    const current = this.getValue('count');
    this.updateState({ count: current - 1 });
  }

  reset() {
    this.updateState({ count: 0 });
  }

  setLoading(isLoading: boolean, message?: string) {
    this.updateState({
      isLoading,
      loadingMessage: message,
    });
  }

  startLoading(message?: string) {
    this.setLoading(true, message);
  }

  stopLoading() {
    this.setLoading(false);
  }
}

const globalController = new GlobalController();
export default globalController;
