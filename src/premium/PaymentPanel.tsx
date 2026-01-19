import { useMemo, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { clearPaymentQrImage, loadPaymentQrImageDataUrl, loadPaymentUpiLink, savePaymentQrImageDataUrl, savePaymentUpiLink } from './paymentQr'

type Props = {
  amountInr?: number
}

async function fileToDataUrl(file: File) {
  const reader = new FileReader()
  return await new Promise<string>((resolve, reject) => {
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

export function PaymentPanel({ amountInr = 199 }: Props) {
  const [qrImage, setQrImage] = useState(() => loadPaymentQrImageDataUrl())
  const [upiLink, setUpiLink] = useState(() => loadPaymentUpiLink())
  const hasImage = Boolean(qrImage)
  const hasUpiLink = Boolean(upiLink)

  const helperText = useMemo(() => {
    if (hasImage) return 'Scan this QR to pay.'
    if (hasUpiLink) return 'Scan this QR (generated from your UPI link) to pay.'
    return 'Upload your PhonePe/UPI QR image, or paste your UPI payment link.'
  }, [hasImage, hasUpiLink])

  return (
    <div className="panel">
      <div className="panelTitle">Premium payment</div>
      <div className="muted">{helperText}</div>

      <div className="qrWrap">
        {hasImage ? (
          <img className="qrImg" src={qrImage} alt="Payment QR" />
        ) : hasUpiLink ? (
          <div className="qrGenerated">
            <QRCodeCanvas value={upiLink} size={220} />
          </div>
        ) : (
          <div className="qrPlaceholder">Add a QR to enable payments</div>
        )}
      </div>

      <div className="row">
        <label className="label">Upload QR image (recommended)</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const dataUrl = await fileToDataUrl(file)
            savePaymentQrImageDataUrl(dataUrl)
            setQrImage(dataUrl)
          }}
        />
      </div>

      <div className="row">
        <label className="label">Or paste UPI payment link</label>
        <input
          className="input"
          placeholder="upi://pay?pa=your@upi&pn=YourName&am=199&cu=INR"
          value={upiLink}
          onChange={(e) => {
            const v = e.target.value
            setUpiLink(v)
            savePaymentUpiLink(v)
          }}
        />
      </div>

      <div className="row">
        <div className="muted">
          Suggested amount: <b>₹{amountInr}</b>
        </div>
        <button
          className="btnSecondary"
          onClick={() => {
            clearPaymentQrImage()
            setQrImage('')
          }}
        >
          Clear uploaded QR
        </button>
      </div>
    </div>
  )
}

