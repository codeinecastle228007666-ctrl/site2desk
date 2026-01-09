import { buyPremium } from './payments.js';

const grid = document.getElementById('grid');
const addBtn = document.getElementById('addShortcut');
const premiumBtn = document.getElementById('premiumBtn');

let shortcuts = JSON.parse(localStorage.getItem('shortcuts') || '[]');
let isPremium = localStorage.getItem('premium') === 'true';

// premium after payment
if (new URLSearchParams(location.search).get('premium')) {
  localStorage.setItem('premium', 'true');
  isPremium = true;
}

function save() {
  localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
}

function render() {
  grid.innerHTML = '';
  shortcuts.forEach(s => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div style="font-size:32px">🌐</div>
      <div>${s.name}</div>
    `;
    el.onclick = () => window.open(s.url, '_blank');
    grid.appendChild(el);
  });
}

addBtn.onclick = () => {
  if (!isPremium && shortcuts.length >= 3) {
    alert('Free limit reached. Upgrade to Premium.');
    buyPremium();
    return;
  }

  const name = prompt('Site name');
  const url = prompt('Site URL');
  if (!name || !url) return;

  shortcuts.push({ name, url });
  save();
  render();
};

premiumBtn.onclick = buyPremium;

render();

// drag & drop
new Sortable(grid, {
  animation: 150,
  onEnd() {
    const items = [...grid.children];
    shortcuts = items.map(el =>
      shortcuts.find(s => s.name === el.innerText)
    );
    save();
  }
});
