import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import type { ReceiptData } from '../components/InvoiceReceiptModal';

/**
 * Builds high-definition, branded HTML invoice template
 */
export function buildReceiptHtml(data: ReceiptData): string {
  const property = data.propertyName || 'PG.mate PG & Co-Living';
  const invoiceNo = data.invoiceNumber || `INV-${data.invoiceId.slice(0, 8).toUpperCase()}`;
  const dateStr =
    data.paymentDate ||
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const isPaid = data.status === 'PAID' || data.balanceAmount <= 0;
  const statusColor = isPaid ? '#10B981' : data.status === 'PARTIAL' ? '#F59E0B' : '#EF4444';
  const statusBg = isPaid ? '#ECFDF5' : data.status === 'PARTIAL' ? '#FFFBEB' : '#FEF2F2';
  const statusText = isPaid ? 'PAID & VERIFIED' : data.status === 'PARTIAL' ? 'PARTIALLY PAID' : 'PAYMENT DUE';

  const lineItemsHtml = data.lineItems
    .map(
      (item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; color: #1E293B; font-weight: 500; font-size: 14px;">
          ${item.description}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #0F172A; font-weight: 600; font-size: 14px;">
          ₹${item.amount.toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - ${invoiceNo}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 24px;
      color: #0F172A;
      background-color: #FFFFFF;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 780px;
      margin: 0 auto;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      background: #FFFFFF;
    }
    .header-table {
      width: 100%;
      margin-bottom: 28px;
      border-bottom: 2px solid #F1F5F9;
      padding-bottom: 24px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #4F46E5;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .brand-subtitle {
      font-size: 14px;
      color: #64748B;
      margin: 0;
      font-weight: 500;
    }
    .receipt-title {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      background-color: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor}33;
    }
    .info-grid {
      width: 100%;
      margin-bottom: 32px;
    }
    .info-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px 20px;
      vertical-align: top;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748B;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .info-val-strong {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 2px;
    }
    .info-val {
      font-size: 13px;
      color: #334155;
      margin-bottom: 2px;
    }
    .table-container {
      width: 100%;
      margin-bottom: 28px;
      border-collapse: collapse;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      overflow: hidden;
    }
    .table-header {
      background-color: #4F46E5;
      color: #FFFFFF;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
      font-weight: 700;
    }
    .table-header th {
      padding: 12px 16px;
    }
    .summary-table {
      width: 100%;
      margin-bottom: 28px;
    }
    .total-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px 20px;
      width: 320px;
      float: right;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: #475569;
    }
    .total-row.highlight {
      border-top: 2px dashed #CBD5E1;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
    }
    .payment-meta {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 10px;
      padding: 14px 18px;
      margin-top: 16px;
      font-size: 12px;
      color: #1E40AF;
    }
    .footer {
      clear: both;
      border-top: 1px solid #E2E8F0;
      padding-top: 24px;
      margin-top: 36px;
      text-align: center;
      color: #94A3B8;
      font-size: 11px;
    }
    .stamp {
      display: inline-block;
      border: 2px solid ${statusColor};
      color: ${statusColor};
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      transform: rotate(-4deg);
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <h1 class="brand-title">PG.mate</h1>
          <p class="brand-subtitle">${property}</p>
          <div style="margin-top: 6px; font-size: 12px; color: #64748B;">
            Automated Accommodation & Co-Living Management
          </div>
        </td>
        <td style="text-align: right; vertical-align: top;">
          <div class="receipt-title">Payment Receipt</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">
            <b>Receipt No:</b> ${invoiceNo}
          </div>
          <div><span class="receipt-badge">${statusText}</span></div>
        </td>
      </tr>
    </table>

    <table class="info-grid" cellpadding="0" cellspacing="0">
      <tr>
        <td class="info-box" style="width: 48%;">
          <div class="info-label">Resident Details (Billed To)</div>
          <div class="info-val-strong">${data.residentName}</div>
          ${data.residentPhone ? `<div class="info-val">📱 ${data.residentPhone}</div>` : ''}
          <div class="info-val">🛏️ <b>Room:</b> ${data.roomNumber} ${data.bedNumber ? `| <b>Bed:</b> ${data.bedNumber}` : ''}</div>
          <div class="info-val">🏢 ${property}</div>
        </td>
        <td style="width: 4%;"></td>
        <td class="info-box" style="width: 48%;">
          <div class="info-label">Invoice & Payment Info</div>
          <div class="info-val"><b>Issue Date:</b> ${dateStr}</div>
          ${data.periodStart && data.periodEnd ? `<div class="info-val"><b>Period:</b> ${data.periodStart} to ${data.periodEnd}</div>` : ''}
          ${data.paymentMethod ? `<div class="info-val"><b>Payment Mode:</b> ${data.paymentMethod}</div>` : ''}
          ${data.transactionId ? `<div class="info-val"><b>Txn Ref:</b> ${data.transactionId}</div>` : ''}
        </td>
      </tr>
    </table>

    <table class="table-container" cellpadding="0" cellspacing="0">
      <thead class="table-header">
        <tr>
          <th style="text-align: left;">Item Description</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <div style="width: 100%; overflow: hidden;">
      <div style="float: left; width: 45%; margin-top: 10px;">
        <div class="payment-meta">
          <b>Payment Verification Note:</b><br />
          This is a computer-generated digital receipt issued via PG.mate.
          No physical signature is required.
        </div>
        <div style="margin-top: 16px;">
          <span class="stamp">${isPaid ? 'PAID & RECORDED' : 'PARTIALLY RECORDED'}</span>
        </div>
      </div>

      <div class="total-card">
        <table style="width: 100%;" cellpadding="4" cellspacing="0">
          <tr>
            <td style="color: #64748B; font-size: 13px;">Total Billed Amount:</td>
            <td style="text-align: right; font-weight: 600; color: #0F172A; font-size: 13px;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="color: #10B981; font-weight: 600; font-size: 13px;">Amount Paid:</td>
            <td style="text-align: right; font-weight: 700; color: #10B981; font-size: 13px;">₹${data.paidAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-top: 1px solid #E2E8F0;">
            <td style="padding-top: 8px; color: ${data.balanceAmount > 0 ? '#EF4444' : '#64748B'}; font-weight: 700; font-size: 14px;">Balance Due:</td>
            <td style="padding-top: 8px; text-align: right; font-weight: 800; color: ${data.balanceAmount > 0 ? '#EF4444' : '#10B981'}; font-size: 15px;">₹${data.balanceAmount.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px 0;">Thank you for staying at <b>${property}</b>!</p>
      <p style="margin: 0;">For queries or support, please contact PG Management. Generated via PG.mate App.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates branded PDF file from ReceiptData
 */
export async function generateReceiptPdf(data: ReceiptData): Promise<string> {
  const html = buildReceiptHtml(data);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  return uri;
}

/**
 * Generates and opens native sharing sheet (WhatsApp, Email, Files, AirDrop, etc.)
 */
export async function shareReceiptPdf(data: ReceiptData): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sharing Unavailable', 'Native file sharing is not supported on this device.');
      return;
    }

    const pdfUri = await generateReceiptPdf(data);
    const invoiceNo = data.invoiceNumber || `INV-${data.invoiceId.slice(0, 8).toUpperCase()}`;

    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Payment_Receipt_${invoiceNo}.pdf`,
      UTI: 'com.adobe.pdf',
    });
  } catch (error: any) {
    console.error('Error sharing receipt PDF:', error);
    Alert.alert('Error', 'Could not generate or share receipt PDF. Please try again.');
  }
}

/**
 * Opens native print preview dialog
 */
export async function printReceiptPdf(data: ReceiptData): Promise<void> {
  try {
    const html = buildReceiptHtml(data);
    await Print.printAsync({ html });
  } catch (error: any) {
    console.error('Error printing receipt:', error);
    Alert.alert('Error', 'Could not print receipt. Please try again.');
  }
}
