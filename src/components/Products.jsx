import React, { useState } from "react";
import { db } from "../db/database";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { formatCurrency } from "../utils/pdfGenerator";

export default function Products() {
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    pricePerDozen: "",
    pricePerEgg: "",
    stock: "",
    unit: "درجن",
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      category: "",
      pricePerDozen: "",
      pricePerEgg: "",
      stock: "",
      unit: "درجن",
    });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm(product);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return alert("نام درج کریں");
    const data = {
      ...form,
      pricePerDozen: Number(form.pricePerDozen),
      pricePerEgg: Number(form.pricePerEgg),
      stock: Number(form.stock),
    };
    if (editing) {
      await db.products.update(editing.id, data);
    } else {
      await db.products.add(data);
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (confirm("کیا آپ واقعی یہ پروڈکٹ ڈیلیٹ کرنا چاہتے ہیں؟")) {
      await db.products.delete(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 leading-loose">
          پروڈکٹس کا انتظام
        </h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow leading-loose"
        >
          <Plus size={20} /> نیا پروڈکٹ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-right leading-loose">نام</th>
              <th className="p-4 leading-loose">کیٹیگری</th>
              <th className="p-4 leading-loose">یونٹ</th>
              <th className="p-4 leading-loose">قیمت/درجن</th>
              <th className="p-4 leading-loose">قیمت/انڈہ</th>
              <th className="p-4 leading-loose">اسٹاک</th>
              <th className="p-4 leading-loose">اقدامات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-4 leading-loose">{p.name}</td>
                <td className="p-4 text-center leading-loose">{p.category}</td>
                <td className="p-4 text-center leading-loose">{p.unit}</td>
                <td className="p-4 text-center">
                  {formatCurrency(p.pricePerDozen)}
                </td>
                <td className="p-4 text-center">
                  {formatCurrency(p.pricePerEgg)}
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      p.stock > 100
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded mx-1"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded mx-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold leading-loose">
                {editing ? "پروڈکٹ میں تبدیلی" : "نیا پروڈکٹ"}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1 leading-loose">
                    کیٹیگری
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 leading-loose"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 leading-loose">
                    یونٹ
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 leading-loose"
                  >
                    <option value="درجن">درجن</option>
                    <option value="انڈے">انڈے</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1 leading-loose">
                    قیمت/درجن
                  </label>
                  <input
                    type="number"
                    value={form.pricePerDozen}
                    onChange={(e) =>
                      setForm({ ...form, pricePerDozen: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 leading-loose">
                    قیمت/انڈہ
                  </label>
                  <input
                    type="number"
                    value={form.pricePerEgg}
                    onChange={(e) =>
                      setForm({ ...form, pricePerEgg: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 leading-loose">
                    اسٹاک
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-8">
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
