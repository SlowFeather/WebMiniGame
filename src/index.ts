import { greetA } from './moduleA';
import { greetB } from './moduleB';

const appDiv = document.getElementById('app');
if (appDiv) {
  appDiv.innerHTML = `
    <p>${greetA('Alice')}</p>
    <p>${greetB('Bob')}</p>
  `;
}
