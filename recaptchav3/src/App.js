import './App.css';
import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import { RouteComponent } from './RouteComponent';
import GoogleCaptchaWrapper from './GoogleCaptchWrapper';

function App() {

  return (
    <Provider store={store}>
        <GoogleCaptchaWrapper> 
        <div className="App">
          <RouteComponent />
        </div>
    </GoogleCaptchaWrapper>
      </Provider>
  );
}

export default App;
