import React, { useState } from "react";
import { db } from "../db/database";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
} from "lucide-react";
import {
  formatCurrency,
  formatUrduDate,
  generateReportPDF,
} from "../utils/pdfGenerator";

export default function Reports() {
  const [period, setPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const allSales = useLiveQuery(() => db.sales.toArray(), []) || [];

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    let title = "";

    if (period === "daily") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      title = `روزانہ رپورٹ — ${formatUrduDate(now)}`;
    } else if (period === "weekly") {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      title = `ہفتہ وار رپورٹ (${formatUrduDate(start)} تا ${formatUrduDate(end)})`;
    } else if (period === "monthly") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      title = `ماہانہ رپورٹ — ${formatUrduDate(start)}`;
    } else if (period === "custom") {
      const d = new Date(selectedDate);
      start.setTime(d.getTime());
      start.setHours(0, 0, 0, 0);
      end.setTime(d.getTime());
      end.setHours(23, 59, 59, 999);
      title = `رپورٹ — ${formatUrduDate(d)}`;
    }

    return { start, end, title };
  };

  const { start, end, title } = getDateRange();

  const filteredSales = allSales.filter((s) => {
    const saleDate = new Date(s.date);
    return saleDate >= start && saleDate <= end;
  });

  const summary = {
    totalSales: filteredSales.reduce(
      (sum, s) => sum + Number(s.totalAmount || 0),
      0,
    ),
    totalPaid: filteredSales.reduce(
      (sum, s) => sum + Number(s.paidAmount || 0),
      0,
    ),
    totalDue: filteredSales.reduce(
      (sum, s) => sum + Number(s.dueAmount || 0),
      0,
    ),
    count: filteredSales.length,
    avgSale:
      filteredSales.length > 0
        ? filteredSales.reduce(
            (sum, s) => sum + Number(s.totalAmount || 0),
            0,
          ) / filteredSales.length
        : 0,
  };

  const handleDownload = async () => {
    const dateRange = `${formatUrduDate(start)} تا ${formatUrduDate(end)}`;
    await generateReportPDF(title, filteredSales, summary, dateRange);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 leading-loose">
          رپورٹس
        </h1>
        <button
          onClick={handleDownload}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow leading-loose"
        >
          <Download size={20} /> PDF ڈاؤن لوڈ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="font-semibold leading-loose">
            دورانیہ منتخب کریں:
          </span>
          {[
            { key: "daily", label: "روزانہ" },
            { key: "weekly", label: "ہفتہ وار" },
            { key: "monthly", label: "ماہانہ" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-5 py-2 rounded-lg leading-loose transition ${
                period === p.key
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-2 mr-auto">
            <Calendar size={18} className="text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPeriod("custom");
              }}
              className="border rounded-lg px-3 py-2"
            />
            <button
              onClick={() => setPeriod("custom")}
              className={`px-4 py-2 rounded-lg leading-loose ${
                period === "custom" ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              منتخب دن
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl shadow-lg p-5">
          <div className="flex justify-between items-center mb-2">
            <FileText size={28} className="opacity-70" />
          </div>
          <p className="text-sm opacity-90 leading-loose">کل بل</p>
          <p className="text-3xl font-bold leading-loose">{summary.count}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl shadow-lg p-5">
          <DollarSign size={28} className="opacity-70 mb-2" />
          <p className="text-sm opacity-90 leading-loose">کل سیلز</p>
          <p className="text-2xl font-bold leading-loose">
            {formatCurrency(summary.totalSales)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-xl shadow-lg p-5">
          <TrendingUp size={28} className="opacity-70 mb-2" />
          <p className="text-sm opacity-90 leading-loose">کل وصولی</p>
          <p className="text-2xl font-bold leading-loose">
            {formatCurrency(summary.totalPaid)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl shadow-lg p-5">
          <FileText size={28} className="opacity-70 mb-2" />
          <p className="text-sm opacity-90 leading-loose">کل باقی</p>
          <p className="text-2xl font-bold leading-loose">
            {formatCurrency(summary.totalDue)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="font-bold text-lg leading-loose">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-3 leading-loose">#</th>
                <th className="p-3 leading-loose">تاریخ</th>
                <th className="p-3 text-right leading-loose">کلائنٹ</th>
                <th className="p-3 text-right leading-loose">آئٹمز</th>
                <th className="p-3 leading-loose">کل رقم</th>
                <th className="p-3 leading-loose">وصول</th>
                <th className="p-3 leading-loose">باقی</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((s, i) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-center">{i + 1}</td>
                  <td className="p-3 text-center">{formatUrduDate(s.date)}</td>
                  <td className="p-3 leading-loose">{s.clientName}</td>
                  <td className="p-3 text-xs leading-loose">
                    {s.items?.map((it) => `${it.name} × ${it.qty}`).join("، ")}
                  </td>
                  <td className="p-3 text-center">
                    {formatCurrency(s.totalAmount)}
                  </td>
                  <td className="p-3 text-center text-green-600">
                    {formatCurrency(s.paidAmount || 0)}
                  </td>
                  <td className="p-3 text-center text-red-600 font-semibold">
                    {formatCurrency(s.dueAmount || 0)}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="p-10 text-center text-gray-400 leading-loose"
                  >
                    اس دورانیے میں کوئی سیل نہیں
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
