import aboutHtml from '../about.md';

document.addEventListener('DOMContentLoaded', () => {
  const aboutContentElement = document.getElementById('about-content');
  if (aboutContentElement) {
    aboutContentElement.innerHTML = aboutHtml;
  }

  const appVersionElement = document.getElementById('app-version');
  if (appVersionElement) {
    appVersionElement.textContent = __APP_VERSION__;
  }
});