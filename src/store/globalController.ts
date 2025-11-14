import { StateController } from '@/store/stateController';

type IGlobalState = {
  count: number;
};

const globalInitialState: IGlobalState = {
  count: 0,
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
}

const globalController = new GlobalController();
export default globalController;
