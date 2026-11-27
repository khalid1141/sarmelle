export interface InvoiceCustomer {
  fullName: string;
  email: string;
}

export function downloadInvoicePdf(order: any, customer: InvoiceCustomer) {
  const items = (order.items || []).map((it: any) => `
    <tr>
      <td><img src="${it.image}" alt="${it.name}" style="width:48px;height:48px;object-fit:cover;border-radius:6px" /></td>
      <td>${it.name}</td>
      <td>${it.size || '-'}</td>
      <td>${it.color || '-'}</td>
      <td style="text-align:center">${it.quantity}</td>
      <td style="text-align:right">₹${Number(it.price).toLocaleString('en-IN')}</td>
      <td style="text-align:right">₹${(Number(it.price)*it.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('');
  const total = Number(order.totalAmount || 0);
  const html = `<!doctype html><html><head><title>Invoice ${order.orderNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif;padding:32px;color:#1a1a1a;background:#fff}h1{margin:0;font-size:28px;font-weight:700} .sub{color:#666;margin:4px 0 20px} table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e5e5e5;padding:10px;font-size:13px}th{background:#f8f8f8;font-weight:600} .meta p{margin:4px 0;font-size:13px} .right{text-align:right} .total{margin-top:20px;font-size:16px;font-weight:700;text-align:right} .footer{margin-top:28px;font-size:12px;color:#888}</style></head>
  <body>
    <h1>Sarmelle</h1><p>Invoice</p>
    <div class="meta">
      <p><strong>Order No:</strong> ${order.orderNumber}</p>
      <p><strong>Date:</strong> ${order.date}</p>
      <p><strong>Customer:</strong> ${customer.fullName}</p>
      <p><strong>Email:</strong> ${customer.email}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      ${order.carrier ? `<p><strong>Courier:</strong> ${order.carrier} (${order.trackingNumber})</p>` : ''}
    </div>
    <table><thead><tr><th>Image</th><th>Item</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${items}</tbody></table>
    <p class="right" style="margin-top:16px;font-weight:bold">Grand Total: ₹${total.toLocaleString('en-IN')}</p>
    <p style="margin-top:24px;font-size:12px;color:#666">Thank you for shopping with Sarmelle.</p>
  </body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}