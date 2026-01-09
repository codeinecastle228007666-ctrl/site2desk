const isRU =
  navigator.language.startsWith('ru') ||
  Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Moscow');

export function buyPremium() {
  if (isRU) {
    window.location.href =
      'https://yoomoney.ru/to/4100119447724449'; // твой кошелёк
  } else {
    window.location.href =
      'https://buy.stripe.com/XXXXXXXX'; // Stripe Checkout
  }
}
