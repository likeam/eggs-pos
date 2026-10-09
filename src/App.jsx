import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import POS from "./components/POS";
import Products from "./components/Products";
import Clients from "./components/Clients";
import Reports from "./components/Reports";
import Ledger from "./components/Ledger";
import { initializeDatabase } from "./db/database";

export default function App() {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-400">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
