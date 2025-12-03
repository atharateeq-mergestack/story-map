import { StateController } from './stateController';

type IDestinationState = {
  selectedDestinationId: string | null;
  activeDate: string | null;
};

const initialDestinationState: IDestinationState = {
  selectedDestinationId: null,
  activeDate: null,
};

class DestinationController extends StateController<IDestinationState> {
  constructor() {
    super(initialDestinationState);
  }

  setSelectedDestination(destinationId: string | null) {
    this.updateState({ selectedDestinationId: destinationId });
  }

  clearSelectedDestination() {
    this.updateState({ selectedDestinationId: null });
  }

  setActiveDate(date: string | null) {
    this.updateState({ activeDate: date });
  }

  clearActiveDate() {
    this.updateState({ activeDate: null });
  }
}

const destinationController = new DestinationController();
export default destinationController;
