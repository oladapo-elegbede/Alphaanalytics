"use client";

import React, { useEffect, useState } from "react";

// --- TYPES FOR FASTAPI PAYLOAD ---
interface EVSignal {
  market: string;
  model_probability: number;
  fair_odds: number;
  bookmaker_odds: number;
  ev_percent: number;
  is_positive_ev: boolean;
  signal_status: string;
}

interface MatchFixture {
  fixture_id: string;
  match: string;
  league: string;
  kickoff: string;
  xg_ratings: { home: number; away: number };
  market_probabilities: Record<string, number>;
  ev_signals: EVSignal[];
}

export default function Dashboard() {
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // --- CONFIGURATION ---
  const PAYSTACK_PUBLIC_KEY = "pk_live_YOUR_LIVE_KEY_HERE";
  const BACKEND_URL = "https://alpha-analytics-backend.onrender.com";

  // Load Paystack Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // --- FETCH DATA ---
  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Live Fixtures
        const resFixtures = await fetch(`${BACKEND_URL}/api/v1/fixtures/analyzed`);
        if (resFixtures.ok) {
          setFixtures(await resFixtures.json());
          setApiConnected(true);
        }

        // 2. Fetch Historical Results
        const resHistory = await fetch(`${BACKEND_URL}/api/v1/history/results`);
        if (resHistory.ok) {
          setHistory(await resHistory.json());
        }
      } catch (err) {
        console.warn("API Offline, using demo mode", err);
        setApiConnected(false);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handlePaystackCheckout = () => {
    const email = prompt("Enter email for PRO access:");
    if (!email) return;

    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: 10000 * 100,
      currency: "NGN",
      callback: () => {
        alert("PRO Access Unlocked!");
        setIsSubscribed(true);
      },
    });
    handler.openIframe();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans border-t-4 border-emerald-500 pb-20">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter uppercase">Alpha Analytics <span className="text-emerald-500">Pro</span></h1>
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-slate-500">{apiConnected ? "● FASTAPI LIVE" : "○ DEMO MODE"}</span>
            <button 
                onClick={handlePaystackCheckout}
                className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs"
            >
                {isSubscribed ? "✓ PRO ACTIVE" : "Unlock Pro (₦10,000/mo)"}
            </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* LIVE FIXTURES SECTION */}
        <section className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span> Real-Time Analytics Feed
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {fixtures.map((f) => (
              <div key={f.fixture_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex justify-between border-b border-slate-800 pb-4 mb-6">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">{f.league}</p>
                        <h3 className="text-lg font-bold">{f.match}</h3>
                    </div>
                    <p className="text-emerald-400 font-mono text-sm">{f.kickoff}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Probabilities */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Poisson Model Probabilities</p>
                        {Object.entries(f.market_probabilities).map(([m, p]) => (
                            <div key={m} className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 uppercase">{m.replace("_", " ")}</span>
                                <span className="font-mono font-bold text-white">{p}%</span>
                            </div>
                        ))}
                    </div>

                    {/* Paywall Signals */}
                    <div className="relative">
                        {!isSubscribed && (
                            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                                <p className="text-[10px] text-amber-500 font-bold uppercase mb-2">🔒 Signals Locked</p>
                                <button onClick={handlePaystackCheckout} className="text-[10px] underline text-slate-400">Subscribe to view +EV Edges</button>
                            </div>
                        )}
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Institutional Value Edges</p>
                        {f.ev_signals.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 mb-2">
                                <span className="text-[10px] font-bold uppercase">{s.market.replace("_", " ")}</span>
                                <span className="text-xs font-black text-emerald-400">+{s.ev_percent}% EV</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- DYNAMIC HISTORICAL LEDGER (THIS IS THE NEW SECTION) --- */}
        <section className="space-y-6 pt-10 border-t border-slate-900">
          <div className="flex justify-between items-end">
             <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">📊 Yesterday's Performance Ledger</h2>
             <span className="text-[10px] text-slate-600 font-mono italic">Verified Results Only</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-950/50 text-slate-500 border-b border-slate-800 uppercase">
                <tr>
                  <th className="p-4">Match</th>
                  <th className="p-4">Market</th>
                  <th className="p-4 text-center">Edge</th>
                  <th className="p-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.length > 0 ? history.map((h, i) => (
                  <tr key={i} className="hover:bg-emerald-500/5">
                    <td className="p-4 font-bold text-white">{h.match}</td>
                    <td className="p-4 text-slate-400 uppercase">{h.market}</td>
                    <td className="p-4 text-center text-amber-400">{h.ev_edge}</td>
                    <td className="p-4 text-right font-black text-emerald-500">{h.result}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-600">No historical data found for yesterday.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}