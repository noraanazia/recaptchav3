import { createStore, applyMiddleware, combineReducers } from 'redux';
import {thunk} from 'redux-thunk';

// Initial state for authentication
const initialAuthState = {
  isAuthenticated: false,
};

// Authentication reducer
const authReducer = (state = initialAuthState, action) => {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    default:
      return state;
  }
};

// Combine reducers (if you have more in the future)
const rootReducer = combineReducers({
  auth: authReducer,
});

// Create store
const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;