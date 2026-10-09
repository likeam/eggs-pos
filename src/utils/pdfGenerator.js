import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

// Roman number formatter
export function toUrduNumber(num) {
  return String(num);
}

// Format currency with Roman numbers
export function formatCurrency(amount) {
  const num = Number(amount || 0);
  return `Rs ${num.toLocaleString("en-US")}`;
}

// Format date in Urdu month names with Roman numbers
export function formatUrduDate(date) {
  const d = new Date(date);
  const months = [
    "جنوری",
    "فروری",
    "مارچ",
    "اپریل",
    "مئی",
    "جون",
    "جولائی",
    "اگست",
    "ستمبر",
    "اکتوبر",
    "نومبر",
    "دسمبر",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Wait for fonts + paint
async function waitForRender() {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {}
  }
  await new Promise((r) => requestAnimationFrame(() => r()));
  await new Promise((r) => requestAnimationFrame(() => r()));
  await new Promise((r) => setTimeout(r, 800));
}

// Mount container — visible to browser, hidden from user
function mountContainer(html) {
  const wrapper = document.createElement("div");
  wrapper.id = "pdf-render-wrapper";
  wrapper.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    overflow: hidden;
    z-index: 999999;
    pointer-events: none;
  `;

  const container = document.createElement("div");
  container.id = "pdf-render-root";
  container.style.cssText = `
    width: 800px;
    padding: 40px;
    background: #ffffff;
    font-family: 'Noto Nastaliq Urdu', serif;
    direction: rtl;
    color: #000000;
    line-height: 2;
  `;
  container.innerHTML = html;

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  return { wrapper, container };
}

// Convert modern color functions (oklch/lab/lch) to rgb
function fixModernColors(root) {
  const nodes = root.querySelectorAll("*");
  const props = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
  ];
  const ctx = document.createElement("canvas").getContext("2d");

  const convert = (val) => {
    if (!val) return null;
    if (
      val.includes("oklch") ||
      val.includes("oklab") ||
      val.includes("lab(") ||
      val.includes("lch(")
    ) {
      try {
        ctx.fillStyle = "#000";
        ctx.fillStyle = val;
        return ctx.fillStyle;
      } catch {
        return null;
      }
    }
    return null;
  };

  [root, ...nodes].forEach((el) => {
    const cs = window.getComputedStyle(el);
    props.forEach((prop) => {
      const converted = convert(cs[prop]);
      if (converted) el.style[prop] = converted;
    });
  });
}

// Capture element → image → PDF
export async function generatePDFFromElement(element, filename) {
  await waitForRender();
  fixModernColors(element);
  void element.offsetHeight;
  await new Promise((r) => setTimeout(r, 200));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  if (!canvas.width || !canvas.height) {
    throw new Error("Canvas is empty — content did not render");
  }

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgWidth = pdfWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - margin * 2;
  }

  pdf.save(filename);
}

// Generate Ledger PDF
export async function generateLedgerPDF(
  client,
  transactions,
  shopName = "انڈہ ہول سیل شاپ",
) {
  let totalDebit = 0;
  let totalCredit = 0;

  const rows = transactions
    .map((t, i) => {
      if (t.type === "sale") totalDebit += Number(t.amount);
      if (t.type === "payment") totalCredit += Number(t.amount);

      return `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px; text-align: center;">${formatUrduDate(t.date)}</td>
        <td style="padding: 10px; text-align: right;">${t.description}</td>
        <td style="padding: 10px; text-align: center;">${t.type === "sale" ? formatCurrency(t.amount) : "-"}</td>
        <td style="padding: 10px; text-align: center;">${t.type === "payment" ? formatCurrency(t.amount) : "-"}</td>
        <td style="padding: 10px; text-align: center;">${formatCurrency(t.balance)}</td>
      </tr>
    `;
    })
    .join("");

  const balance = Number(client.balance);
  const balanceText =
    balance > 0
      ? `${formatCurrency(balance)} وصول کرنا ہے`
      : balance < 0
        ? `${formatCurrency(Math.abs(balance))} دینا ہے`
        : "حساب صاف ہے";

  const html = `
    <div style="text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 20px;">
      <h1 style="font-size: 32px; margin: 0; color: #1e40af;">${shopName}</h1>
      <p style="font-size: 16px; margin: 10px 0 0 0; color: #666;">کلائنٹ لیجر / کھاتہ</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f0f4ff; border-radius: 8px;">
      <div>
        <p style="margin: 5px 0; font-size: 16px;"><strong>کلائنٹ:</strong> ${client.name}</p>
        <p style="margin: 5px 0; font-size: 16px;"><strong>فون:</strong> ${client.phone || "—"}</p>
        <p style="margin: 5px 0; font-size: 16px;"><strong>پتہ:</strong> ${client.address || "—"}</p>
      </div>
      <div style="text-align: left;">
        <p style="margin: 5px 0; font-size: 16px;"><strong>تاریخ:</strong> ${formatUrduDate(new Date())}</p>
        <p style="margin: 5px 0; font-size: 16px;"><strong>کل بیلنس:</strong> ${balanceText}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <thead>
        <tr style="background: #1e40af; color: #ffffff;">
          <th style="padding: 12px; text-align: center;">نمبر</th>
          <th style="padding: 12px; text-align: center;">تاریخ</th>
          <th style="padding: 12px; text-align: right;">تفصیل</th>
          <th style="padding: 12px; text-align: center;">نام (رقم)</th>
          <th style="padding: 12px; text-align: center;">جمع (رقم)</th>
          <th style="padding: 12px; text-align: center;">بیلنس</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6" style="padding: 20px; text-align: center;">کوئی ٹرانزیکشن نہیں</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background: #f0f4ff; font-weight: bold;">
          <td colspan="3" style="padding: 12px; text-align: right;">کل</td>
          <td style="padding: 12px; text-align: center;">${formatCurrency(totalDebit)}</td>
          <td style="padding: 12px; text-align: center;">${formatCurrency(totalCredit)}</td>
          <td style="padding: 12px; text-align: center;">${formatCurrency(balance)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p>یہ کمپیوٹر سے تیار کردہ لیجر ہے — ${formatUrduDate(new Date())}</p>
    </div>
  `;

  const { wrapper, container } = mountContainer(html);
  try {
    await generatePDFFromElement(container, `ledger-${client.name}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}

// Generate Sales Report PDF
export async function generateReportPDF(title, data, summary, dateRange) {
  const rows = data
    .map(
      (s, i) => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px; text-align: center;">${i + 1}</td>
      <td style="padding: 10px; text-align: center;">${formatUrduDate(s.date)}</td>
      <td style="padding: 10px; text-align: right;">${s.clientName || "واک اِن"}</td>
      <td style="padding: 10px; text-align: right;">${s.items?.map((it) => `${it.name} × ${it.qty}`).join(", ") || "—"}</td>
      <td style="padding: 10px; text-align: center;">${formatCurrency(s.totalAmount)}</td>
      <td style="padding: 10px; text-align: center;">${formatCurrency(s.paidAmount || 0)}</td>
      <td style="padding: 10px; text-align: center;">${formatCurrency(s.dueAmount || 0)}</td>
    </tr>
  `,
    )
    .join("");

  const html = `
    <div style="text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 20px;">
      <h1 style="font-size: 30px; margin: 0; color: #1e40af;">انڈہ ہول سیل شاپ</h1>
      <p style="font-size: 18px; margin: 10px 0 0 0; color: #333;">${title}</p>
      <p style="font-size: 14px; margin: 5px 0 0 0; color: #666;">${dateRange}</p>
    </div>

    <div style="display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #f0f4ff; border-radius: 8px;">
      <div style="text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #666;">کل سیلز</p>
        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1e40af;">${formatCurrency(summary.totalSales)}</p>
      </div>
      <div style="text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #666;">کل وصولی</p>
        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #16a34a;">${formatCurrency(summary.totalPaid)}</p>
      </div>
      <div style="text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #666;">کل باقی</p>
        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #dc2626;">${formatCurrency(summary.totalDue)}</p>
      </div>
      <div style="text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #666;">کل بل</p>
        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #333;">${summary.count}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
      <thead>
        <tr style="background: #1e40af; color: #ffffff;">
          <th style="padding: 10px; text-align: center;">نمبر</th>
          <th style="padding: 10px; text-align: center;">تاریخ</th>
          <th style="padding: 10px; text-align: right;">کلائنٹ</th>
          <th style="padding: 10px; text-align: right;">آئٹمز</th>
          <th style="padding: 10px; text-align: center;">کل رقم</th>
          <th style="padding: 10px; text-align: center;">وصول</th>
          <th style="padding: 10px; text-align: center;">باقی</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="7" style="padding: 20px; text-align: center;">کوئی ریکارڈ نہیں</td></tr>'}
      </tbody>
    </table>

    <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p>یہ کمپیوٹر سے تیار کردہ رپورٹ ہے — ${formatUrduDate(new Date())}</p>
    </div>
  `;

  const { wrapper, container } = mountContainer(html);
  try {
    await generatePDFFromElement(container, `${title}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}
