const KEY_PAYMENT_QR_IMAGE = 'fitnessAI.paymentQrImage.v1'
const KEY_PAYMENT_UPI_LINK = 'fitnessAI.paymentUpiLink.v1'

export function loadPaymentQrImageDataUrl() {
  return localStorage.getItem(KEY_PAYMENT_QR_IMAGE) ?? ''
}

export function savePaymentQrImageDataUrl(dataUrl: string) {
  localStorage.setItem(KEY_PAYMENT_QR_IMAGE, dataUrl)
}

export function clearPaymentQrImage() {
  localStorage.removeItem(KEY_PAYMENT_QR_IMAGE)
}

export function loadPaymentUpiLink() {
  return localStorage.getItem(KEY_PAYMENT_UPI_LINK) ?? ''
}

export function savePaymentUpiLink(link: string) {
  localStorage.setItem(KEY_PAYMENT_UPI_LINK, link)
}

