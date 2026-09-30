import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/open-sauce-one/400.css';
import '@fontsource/open-sauce-one/500.css';
import '@fontsource/open-sauce-one/600.css';
import '@fontsource/open-sauce-one/700.css';
import './styles/global.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
