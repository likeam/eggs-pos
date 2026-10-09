import React, { useState } from "react";
import { db } from "../db/database";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Search, Plus, Loader2 } from "lucide-react";
import {
  formatCurrency,
  formatUrduDate,
  generateLedgerPDF,
} from "../utils/pdfGenerator";

export default function Ledger() {
  const clients = useLiveQuery(() => db.clients.toArray(), []) || [];
  const [selectedClientId, setSelectedClientId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [downloading, setDownloading] = useState(false);

  const client = clients.find((c) => c.id === Number(selectedClientId));
  const transactions =
    useLiveQuery(
      () =>
        selectedClientId
          ? db.transactions
              .where("clientId")
              .equals(Number(selectedClientId))
              .reverse()
              .sortBy("date")
          : [],
      [selectedClientId],
    ) || [];

  const filteredClients = clients.filter(
    (c) => c.name.includes(searchTerm) || c.phone?.includes(searchTerm),
  );

  const handleDownloadPDF = async () => {
    if (!client) {
      alert("پہلے کلائنٹ منتخب کریں");
      return;
    }
    setDownloading(true);
    try {
      // Sort transactions in ascending date order for the ledger
      const sorted = [...transactions].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );
      await generateLedgerPDF(client, sorted);
    } catch (err) {
      console.error("PDF error:", err);
      alert("PDF بنانے میں مسئلہ ہوا: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!client || !paymentAmount) return;
    const amount = Number(paymentAmount);
    const newBalance = Number(client.balance) - amount;
    await db.clients.update(client.id, { balance: newBalance });
    await db.transactions.add({
      clientId: client.id,
      type: "payment",
      amount: amount,
      date: new Date().toISOString(),
      description: paymentNote || "وصول شدہ رقم",
      balance: newBalance,
    });
    setShowPaymentModal(false);
    setPaymentAmount("");
    setPaymentNote("");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 leading-loose">
          لیجر / کھاتہ
        </h1>
        {client && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 leading-loose"
            >
              <Plus size={18} /> رقم وصول
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 leading-loose"
            >
              {downloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> بن رہی ہے...
                </>
              ) : (
                <>
                  <Download size={18} /> PDF ڈاؤن لوڈ
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Client List */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="relative mb-3">
            <Search
              className="absolute right-3 top-3 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="کلائنٹ تلاش کریں..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg pr-10 pl-3 py-2 leading-loose"
            />
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filteredClients.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClientId(c.id)}
                className={`w-full text-right p-3 rounded-lg transition leading-loose ${
                  Number(selectedClientId) === c.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <p className="font-semibold">{c.name}</p>
                <p
                  className={`text-xs mt-1 ${
                    Number(selectedClientId) === c.id
                      ? "text-blue-100"
                      : "text-red-600"
                  }`}
                >
                  بیلنس: {c.balance || 0}
                </p>
              </button>
            ))}
            {filteredClients.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6 leading-loose">
                کوئی کلائنٹ نہیں
              </p>
            )}
          </div>
        </div>

        {/* Ledger Details */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow p-4">
          {!client ? (
            <div className="text-center py-20 text-gray-400 leading-loose">
              کلائنٹ منتخب کریں
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold leading-loose">
                      {client.name}
                    </h2>
                    <p className="text-sm text-blue-100 leading-loose">
                      {client.phone || "—"}
                    </p>
                    <p className="text-sm text-blue-100 leading-loose">
                      {client.address || "—"}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-blue-100 leading-loose">
                      موجودہ بیلنس
                    </p>
                    <p className="text-2xl font-bold leading-loose">
                      {formatCurrency(client.balance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 leading-loose">#</th>
                      <th className="p-3 leading-loose">تاریخ</th>
                      <th className="p-3 text-right leading-loose">تفصیل</th>
                      <th className="p-3 leading-loose">نام</th>
                      <th className="p-3 leading-loose">جمع</th>
                      <th className="p-3 leading-loose">بیلنس</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-center">{i + 1}</td>
                        <td className="p-3 text-center">
                          {formatUrduDate(t.date)}
                        </td>
                        <td className="p-3 leading-loose">{t.description}</td>
                        <td className="p-3 text-center text-red-600">
                          {t.type === "sale" ? formatCurrency(t.amount) : "—"}
                        </td>
                        <td className="p-3 text-center text-green-600">
                          {t.type === "payment"
                            ? formatCurrency(t.amount)
                            : "—"}
                        </td>
                        <td className="p-3 text-center font-semibold">
                          {formatCurrency(t.balance)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-10 text-center text-gray-400 leading-loose"
                        >
                          کوئی ٹرانزیکشن نہیں
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 leading-loose">
              رقم وصول کریں
            </h2>
            <p className="text-sm text-gray-500 mb-4 leading-loose">
              کلائنٹ: {client?.name} — موجودہ بیلنس:{" "}
              {formatCurrency(client?.balance || 0)}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1 leading-loose">
                  رقم
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 leading-loose">
                  تفصیل (اختیاری)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 leading-loose"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={handleAddPayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg leading-loose"
              >
                محفوظ کریں
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg leading-loose"
              >
                منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
