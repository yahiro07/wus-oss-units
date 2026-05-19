// @flow
import App from './App.jsx';
import React from 'react';
import { createRoot } from 'react-dom/client';
import FontFaceObserver from 'fontfaceobserver';

const font = new FontFaceObserver('Cute Font');

const root = document.getElementById('root');

// Observer to fade in page after font loads
font.load().then(function () {
  document.body.classList.remove('preload');
  root.classList.add('font-loaded');
});

if (root !== null) {
  createRoot(root).render(<App />);
}
