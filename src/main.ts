// src/main.ts
import 'nouislider/dist/nouislider.css';
import 'bulma-switch-control/css/main.css';
import './style.css';
import './theme.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;