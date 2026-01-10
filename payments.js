export function buyPremium() {
  const url =
    "https://yoomoney.ru/quickpay/confirm.xml" +
    "?receiver=4100119447724449" +
    "&sum=199" +
    "&label=site2desk_premium" +
    "&targets=Site2Desk+Premium" +
    "&quickpay-form=shop" +
    "&paymentType=AC";

  window.location.href = url;
}
