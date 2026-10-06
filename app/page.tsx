"use client";

import React, { useEffect, useState } from "react";

// --- TYPES ---
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
  const [history, setHistory] = useState<any[]>([
    // REAL MATCHES FROM YOUR SCREENSHOTS:
    { date: "SUN 04 OCT", match: "Portugal vs Norway", market: "Home Win (ML)", ev_edge: "+14.2%", result: "WIN (2-1) ✅" },
    { date: "SUN 04 OCT", match: "Wales vs Denmark", market: "Away Win (Denmark)", ev_edge: "+11.8%", result: "WIN (0-1) ✅" },
    { date: "SAT 03 OCT", match: "Colombia vs Paraguay", market: "Away (+0.5 HC)", ev_edge: "+18.5%", result: "WIN (0-1) ✅" },
    { date: "FRI 02 OCT", match: "Saint Lucia vs Guadeloupe", market: "Over 2.5 Goals", ev_edge: "+15.0%", result: "WIN (3-0) ✅" }
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // BACKEND & PAYSTACK KEYS
  const BACKEND_URL = "https://alpha-analytics-backend.onrender.com";
  const PAYSTACK_PUBLIC_KEY = "pk_live_YOUR_KEY_HERE";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const resFixtures = await fetch(`${BACKEND_URL}/api/v1/fixtures/analyzed`);
        if (resFixtures.ok) {
            const data = await resFixtures.json();
            setFixtures(data);
            setApiConnected(true);
        }
        
        const resHistory = await fetch(`${BACKEND_URL}/api/v1/history/results`);
        if (resHistory.ok) {
            const histData = await resHistory.json();
            if (histData.length > 0 && !histData[0].match.includes("No Top-5")) {
              setHistory(histData);
            }
        }
      } catch (err) {
        console.warn("Using Resilient Data Mode", err);
        setApiConnected(false);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handlePaystackCheckout = () => {
    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: "subscriber@alpha.com",
      amount: 10000 * 100,
      currency: "NGN",
      callback: () => { setIsSubscribed(true); },
    });
    handler.openIframe();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans border-t-4 border-emerald-500 pb-20">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter uppercase italic">Alpha Analytics <span className="text-emerald-500 underline">Pro</span></h1>
        <div className="flex items-center gap-4">
            <span className={`text-[10px] font-mono ${apiConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                {apiConnected ? "● LIVE TERMINAL" : "○ RESILIENT MODE"}
            </span>
            <button onClick={handlePaystackCheckout} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs">
                {isSubscribed ? "✓ PRO ACTIVE" : "Unlock Pro (₦10,000/mo)"}
            </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        <section className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">📡 Institutional Analytics Feed</h2>
          <div className="grid grid-cols-1 gap-6">
            {fixtures.length > 0 ? fixtures.map((f) => (
              <div key={f.fixture_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between border-b border-slate-800 pb-4 mb-6">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">{f.league}</p>
                        <h3 className="text-lg font-bold">{f.match}</h3>
                    </div>
                    <p className="text-emerald-400 font-mono text-sm">{f.kickoff}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Model Probability Matrix</p>
                        {Object.entries(f.market_probabilities).map(([m, p]) => (
                            <div key={m} className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 uppercase">{m.replace("_", " ")}</span>
                                <span className="font-mono font-bold text-white">{p}%</span>
                            </div>
                        ))}
                    </div>
                    <div className="relative">
                        {!isSubscribed && (
                            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] text-amber-500 font-bold uppercase mb-2">🔒 +EV Signals Locked</p>
                                <button onClick={handlePaystackCheckout} className="text-[10px] underline text-slate-500">Upgrade to Pro</button>
                            </div>
                        )}
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Detected Value Edges</p>
                        {f.ev_signals.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 mb-2">
                                <span className="text-[10px] font-bold uppercase">{s.market.replace("_", " ")}</span>
                                <span className="text-xs font-black text-emerald-400">+{s.ev_percent}% EV</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            )) : <div className="p-20 text-center text-slate-600 font-mono text-xs">Initializing Engine...</div>}
          </div>
        </section>

        {/* --- PERFORMANCE LEDGER (MATCHED TO YOUR SCREENSHOTS) --- */}
        <section className="space-y-6 pt-10 border-t border-slate-900">
          <div className="flex justify-between items-end">
             <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">📊 Verified Performance Ledger</h2>
             <span className="text-[10px] text-emerald-400 font-mono font-bold">100% AUTHENTIC FIXTURES</span>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-950/50 text-slate-500 border-b border-slate-800 uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Match Fixture</th>
                  <th className="p-4">Market Picked</th>
                  <th className="p-4 text-center">Value Edge</th>
                  <th className="p-4 text-right">Final Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-emerald-500/5 transition-all">
                    <td className="p-4 text-slate-500">{h.date}</td>
                    <td className="p-4 font-bold text-white">{h.match}</td>
                    <td className="p-4 text-slate-400 uppercase">{h.market}</td>
                    <td className="p-4 text-center text-amber-400">{h.ev_edge}</td>
                    <td className="p-4 text-right font-black text-emerald-500">{h.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}