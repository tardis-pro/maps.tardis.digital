import { items } from '../bits/Navigation'

const initialState = {
    activeStates: Array(items.length).fill(true),
  };
  
  const rootReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'UPDATE_ACTIVE_STATES':
        return {
          ...state,
          activeStates: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default rootReducer;
  