import React, { useState } from "react";
import { db } from "../db/database";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Edit2, Trash2, X, Phone, MapPin } from "lucide-react";
import { formatCurrency } from "../utils/pdfGenerator";

export default function Clients() {
  const clients = useLiveQuery(() => db.clients.toArray(), []) || [];
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    balance: 0,
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", address: "", balance: 0 });
    setShowModal(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm(client);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return alert("نام درج کریں");
    const data = {
      ...form,
      balance: Number(form.balance) || 0,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    if (editing) {
      await db.clients.update(editing.id, data);
    } else {
      await db.clients.add(data);
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (confirm("کیا آپ واقعی یہ کلائنٹ ڈیلیٹ کرنا چاہتے ہیں؟")) {
      await db.clients.delete(id);
      await db.transactions.where("clientId").equals(id).delete();
    }
  };

  const totalOutstanding = clients.reduce(
    (sum, c) => sum + (Number(c.balance) || 0),
    0,
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 leading-loose">
            کلائنٹس
          </h1>
          <p className="text-sm text-gray-500 leading-loose">
            کل واجب الادا:{" "}
            <span className="font-bold text-red-600">
              {formatCurrency(totalOutstanding)}
            </span>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow leading-loose"
        >
          <Plus size={20} /> نیا کلائنٹ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => {
          const balance = Number(client.balance) || 0;
          return (
            <div
              key={client.id}
              className="bg-amber-200 rounded-xl shadow p-5 border-r-4 border-blue-600"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800 leading-loose">
                  {client.name}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(client)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {client.phone && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1 leading-loose">
                  <Phone size={14} /> {client.phone}
                </p>
              )}
              {client.address && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-3 leading-loose">
                  <MapPin size={14} /> {client.address}
                </p>
              )}
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-gray-500 leading-loose">
                  لاجر بیلنس
                </p>
                <p
                  className={`text-xl font-bold ${balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : "text-gray-600"}`}
                >
                  {balance > 0
                    ? `${formatCurrency(balance)} (وصول کرنا ہے)`
                    : balance < 0
                      ? `${formatCurrency(Math.abs(balance))} (دینا ہے)`
                      : "حساب صاف"}
                </p>
              </div>
            </div>
          );
        })}
        {clients.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            کوئی کلائنٹ نہیں ملا — نیا کلائنٹ شامل کریں
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold leading-loose">
                {editing ? "کلائنٹ میں تبدیلی" : "نیا کلائنٹ"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:bg-gray-100 p-2 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1 leading-loose">
                  نام
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 leading-loose"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 leading-loose">
                  فون
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 leading-loose">
                  پتہ
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 leading-loose"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 leading-loose">
                  ابتدائی بیلنس (روپے)
                </label>
                <input
                  type="number"
                  value={form.balance}
                  onChange={(e) =>
                    setForm({ ...form, balance: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg leading-loose"
              >
                محفوظ کریں
              </button>
              <button
                onClick={() => setShowModal(false)}
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
