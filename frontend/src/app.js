import * as ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'mobx-react';

import 'styles/main.scss';
import 'styles/antd-reset.scss';

import STORE from 'store';
import RENDERER from 'renderer';
import Dreamview from 'components/Dreamview';

ReactDOM.render(
    <Provider store={STORE}>
        <Dreamview />
    </Provider>,
    document.getElementById('root'),
);

window.updateRoot = () => {
  STORE.reset();
  RENDERER.reset();
  const rootElement = document.getElementById('root');
  ReactDOM.unmountComponentAtNode(rootElement);
  document.removeEventListener('keydown', window.keyDownHandler);
  document.removeEventListener('keydown', window.spaceKeydownHandler);
  keyDownHandler = null;
  spaceKeydownHandler = null;
  ReactDOM.render(
          <Provider store={STORE}>
              <Dreamview />
          </Provider>,
          rootElement,
  );
};
