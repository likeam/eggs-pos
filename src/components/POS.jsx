import React, { useState } from "react";
import { db } from "../db/database";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, Plus, Minus, ShoppingBag, User } from "lucide-react";
import { formatCurrency, formatUrduDate } from "../utils/pdfGenerator";

export default function POS() {
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const clients = useLiveQuery(() => db.clients.toArray(), []) || [];

  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [showReceipt, setShowReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const addToCart = (product) => {
    const existing = cart.find(
      (c) => c.productId === product.id && c.unit === product.unit,
    );
    if (existing) {
      setCart(
        cart.map((c) =>
          c.productId === product.id && c.unit === product.unit
            ? { ...c, qty: c.qty + 1, subtotal: (c.qty + 1) * c.price }
            : c,
        ),
      );
    } else {
      const price =
        product.unit === "درجن" ? product.pricePerDozen : product.pricePerEgg;
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          qty: 1,
          price: price,
          unit: product.unit,
          subtotal: price,
        },
      ]);
    }
  };

  const updateQty = (index, delta) => {
    setCart(
      cart.map((c, i) => {
        if (i === index) {
          const newQty = Math.max(1, c.qty + delta);
          return { ...c, qty: newQty, subtotal: newQty * c.price };
        }
        return c;
      }),
    );
  };

  const updateQtyDirect = (index, value) => {
    const qty = Math.max(1, Number(value) || 1);
    setCart(
      cart.map((c, i) =>
        i === index ? { ...c, qty, subtotal: qty * c.price } : c,
      ),
    );
  };

  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.subtotal, 0);
  const discountAmount = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);
  const paid = Number(paidAmount) || 0;
  const due = total - paid;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("کارٹ خالی ہے");
      return;
    }

    const client = clients.find((c) => c.id === Number(selectedClient));
    const sale = {
      clientId: client?.id || null,
      clientName: client?.name || "واک اِن",
      items: cart,
      subtotal,
      discount: discountAmount,
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      date: new Date().toISOString(),
      type: "sale",
    };

    const saleId = await db.sales.add(sale);

    for (const item of cart) {
      const product = await db.products.get(item.productId);
      if (product) {
        await db.products.update(item.productId, {
          stock: Math.max(0, product.stock - item.qty),
        });
      }
    }

    if (client) {
      const newBalance = (client.balance || 0) + due;
      await db.clients.update(client.id, { balance: newBalance });

      await db.transactions.add({
        clientId: client.id,
        type: "sale",
        amount: total,
        date: new Date().toISOString(),
        description: `سیل - بل نمبر ${saleId}`,
        balance: newBalance,
      });

      if (paid > 0) {
        await db.transactions.add({
          clientId: client.id,
          type: "payment",
          amount: paid,
          date: new Date().toISOString(),
          description: `سیل کے وقت وصولی - بل نمبر ${saleId}`,
          balance: newBalance,
        });
      }
    }

    setShowReceipt({ ...sale, id: saleId });
    setCart([]);
    setPaidAmount("");
    setDiscount("");
    setSelectedClient("");
  };

  const printReceipt = () => {
    if (!showReceipt) return;
    const receiptWindow = window.open("", "_blank", "width=400,height=600");
    const items = showReceipt.items
      .map(
        (it) => `
      <tr style="border-bottom: 1px dashed #DAA520;">
        <td style="padding: 6px; text-align: right;">${it.name}</td>
        <td style="padding: 6px; text-align: center;">${it.qty}</td>
        <td style="padding: 6px; text-align: center;">${it.price}</td>
        <td style="padding: 6px; text-align: center;">${it.subtotal}</td>
      </tr>
    `,
      )
      .join("");

    receiptWindow.document.write(`
      <html dir="rtl"><head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
        <style>body { font-family: 'Noto Nastaliq Urdu', serif; padding: 20px; }</style>
      </head><body>
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">
          <h2 style="margin: 0;">🥚 انڈہ ہول سیل شاپ</h2>
          <p style="margin: 5px 0; font-size: 12px;">بل نمبر: ${showReceipt.id}</p>
          <p style="margin: 5px 0; font-size: 12px;">${formatUrduDate(showReceipt.date)}</p>
        </div>
        <p style="font-size: 13px;"><strong>کلائنٹ:</strong> ${showReceipt.clientName}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead><tr style="background: #eee;">
            <th style="padding: 6px;">آئٹم</th><th style="padding: 6px;">تعداد</th>
            <th style="padding: 6px;">قیمت</th><th style="padding: 6px;">کل</th>
          </tr></thead>
          <tbody>${items}</tbody>
        </table>
        <div style="margin-top: 15px; border-top: 2px solid #333; padding-top: 10px; font-size: 13px;">
          <p style="display: flex; justify-content: space-between;"><span>کل رقم:</span><span>${formatCurrency(showReceipt.totalAmount)}</span></p>
          <p style="display: flex; justify-content: space-between;"><span>وصول:</span><span>${formatCurrency(showReceipt.paidAmount)}</span></p>
          <p style="display: flex; justify-content: space-between; font-weight: bold;"><span>باقی:</span><span>${formatCurrency(showReceipt.dueAmount)}</span></p>
        </div>
        <p style="text-align: center; margin-top: 20px; font-size: 11px;">شکریہ! دوبارہ تشریف لائیں</p>
      </body></html>
    `);
    receiptWindow.document.close();
    setTimeout(() => receiptWindow.print(), 500);
  };

  return (
    <div className="flex gap-4 h-screen p-6 overflow-hidden">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col">
        <div className=" rounded-xl shadow p-4 mb-4">
          <input
            type="text"
            placeholder="🔍 پروڈکٹ تلاش کریں..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-loose"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg transition leading-loose ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {cat === "all" ? "تمام" : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-[#B8860B] rounded-xl shadow hover:shadow-lg p-4 text-right transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="text-3xl mb-2 text-center">🥚</div>
                <h3 className="font-bold text-gray-800 leading-loose text-sm">
                  {product.name}
                </h3>
                <p className="text-blue-600 font-bold mt-2">
                  {formatCurrency(
                    product.unit === "درجن"
                      ? product.pricePerDozen
                      : product.pricePerEgg,
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  اسٹاک: {product.stock}
                </p>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-3 text-center py-20 text-gray-400">
                کوئی پروڈکٹ نہیں ملا
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="w-96 bg-white rounded-xl shadow flex flex-col">
        <div className="p-4 border-b bg-blue-900 text-white rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2 leading-loose">
            <ShoppingBag size={22} /> موجودہ بل
          </h2>
        </div>

        <div className="p-4 border-b">
          <label className="block text-sm font-semibold mb-2 text-gray-700 leading-loose flex items-center gap-2">
            <User size={16} /> کلائنٹ منتخب کریں
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-loose"
          >
            <option value="">واک اِن کسٹمر</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.balance > 0 ? `(باقی: ${c.balance})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
              <p className="leading-loose">کارٹ خالی ہے</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm leading-loose flex-1">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(i, -1)}
                        className="bg-white border rounded w-7 h-7 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateQtyDirect(i, e.target.value)}
                        className="w-14 text-center border rounded py-1 text-sm"
                      />
                      <button
                        onClick={() => updateQty(i, 1)}
                        className="bg-white border rounded w-7 h-7 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.price)} × {item.qty}
                      </p>
                      <p className="font-bold text-blue-700">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="leading-loose">کل رقم:</span>
            <span className="font-bold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="leading-loose">رعایت:</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="w-24 text-center border rounded px-2 py-1"
            />
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span className="leading-loose">کل قابل ادائیگی:</span>
            <span className="text-blue-700">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="leading-loose">وصول شدہ:</span>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0"
              className="w-24 text-center border rounded px-2 py-1"
            />
          </div>
          <div className="flex justify-between text-base font-bold text-red-600">
            <span className="leading-loose">باقی:</span>
            <span>{formatCurrency(due)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-bold text-lg shadow transition leading-loose"
          >
            بل مکمل کریں
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <div className="text-center border-b-2 border-dashed pb-4 mb-4">
              <div className="text-4xl">🥚</div>
              <h2 className="text-xl font-bold leading-loose">
                انڈہ ہول سیل شاپ
              </h2>
              <p className="text-sm text-gray-500">بل نمبر: {showReceipt.id}</p>
              <p className="text-sm text-gray-500">
                {formatUrduDate(showReceipt.date)}
              </p>
            </div>
            <p className="mb-3 leading-loose">
              <strong>کلائنٹ:</strong> {showReceipt.clientName}
            </p>
            <table className="w-full text-sm mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-right leading-loose">آئٹم</th>
                  <th className="p-2 leading-loose">تعداد</th>
                  <th className="p-2 leading-loose">کل</th>
                </tr>
              </thead>
              <tbody>
                {showReceipt.items.map((it, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 leading-loose">{it.name}</td>
                    <td className="p-2 text-center">{it.qty}</td>
                    <td className="p-2 text-center">
                      {formatCurrency(it.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t-2 border-dashed pt-3 space-y-1">
              <p className="flex justify-between leading-loose">
                <span>کل:</span>
                <span>{formatCurrency(showReceipt.totalAmount)}</span>
              </p>
              <p className="flex justify-between leading-loose">
                <span>وصول:</span>
                <span>{formatCurrency(showReceipt.paidAmount)}</span>
              </p>
              <p className="flex justify-between font-bold text-red-600 leading-loose">
                <span>باقی:</span>
                <span>{formatCurrency(showReceipt.dueAmount)}</span>
              </p>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={printReceipt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg leading-loose"
              >
                پرنٹ کریں
              </button>
              <button
                onClick={() => setShowReceipt(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg leading-loose"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
