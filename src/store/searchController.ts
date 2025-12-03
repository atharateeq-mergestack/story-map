import { StateController } from './stateController';

type ISearchState = {
  searchedLocation: {
    center: [number, number]; // [lng, lat]
    placeName: string;
  } | null;
};

const initialSearchState: ISearchState = {
  searchedLocation: null,
};

class SearchController extends StateController<ISearchState> {
  constructor() {
    super(initialSearchState);
  }

  setSearchedLocation(center: [number, number], placeName: string) {
    this.updateState({
      searchedLocation: {
        center,
        placeName,
      },
    });
  }

  clearSearchedLocation() {
    this.updateState({ searchedLocation: null });
  }
}

const searchController = new SearchController();
export default searchController;
