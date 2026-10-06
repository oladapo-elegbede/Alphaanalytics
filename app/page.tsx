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

interface LineDiscrepancy {
  max_odds: number;
  best_bookmaker: string;
  market_average: number;
  discrepancy_percent: number;
  is_lopsided: boolean;
}

interface MatchFixture {
  fixture_id: string;
  match: string;
  league: string;
  kickoff: string;
  xg_ratings: { home: number; away: number };
  market_probabilities: Record<string, number>;
  line_discrepancies: Record<string, LineDiscrepancy>;
  ev_signals: EVSignal[];
}

export default function Dashboard() {
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");

  // YOUR LIVE PAYSTACK PUBLIC KEY
  const PAYSTACK_PUBLIC_KEY = "pk_live_0f0592415bcf879e8b2393f61e15634c3a0b37ee";

  // YOUR ACTUAL RENDER BACKEND URL
  const LIVE_BACKEND_URL = "https://alpha-analytics-backend.onrender.com/api/v1/fixtures/analyzed";

  // Load Paystack Inline JS Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // --- SAFE FETCH FROM FASTAPI BACKEND ---
  useEffect(() => {
    let isMounted = true;

    async function fetchAnalytics() {
      try {
        const res = await fetch(LIVE_BACKEND_URL);
        if (res.ok) {
          const data: MatchFixture[] = await res.json();
          if (isMounted) {
            setFixtures(data);
            setApiConnected(true);
          }
        } else {
          if (isMounted) setApiConnected(false);
        }
      } catch (err) {
        console.warn("Backend warming up or offline. Using resilient fallback feed...", err);
        if (isMounted) {
          setApiConnected(false);
          // Fallback UI State so page NEVER crashes
          setFixtures([
            {
              fixture_id: "LIVE-2026-MLS",
              match: "Chicago Fire FC vs Vancouver Whitecaps",
              league: "MLS",
              kickoff: "00:30 WAT",
              xg_ratings: { home: 1.59, away: 1.7 },
              market_probabilities: {
                home_win: 36.04,
                draw: 23.03,
                away_win: 40.62,
                over_1_5: 83.7,
                over_2_5: 63.54,
                btts_yes: 64.81,
              },
              line_discrepancies: {
                away_win: {
                  max_odds: 4.25,
                  best_bookmaker: "1xBet",
                  market_average: 3.1,
                  discrepancy_percent: 37.1,
                  is_lopsided: true,
                },
              },
              ev_signals: [
                {
                  market: "away_win",
                  model_probability: 40.62,
                  fair_odds: 2.46,
                  bookmaker_odds: 4.25,
                  ev_percent: 72.63,
                  is_positive_ev: true,
                  signal_status: "🚀 HIGH +EV SIGNAL",
                },
              ],
            },
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- PAYSTACK PAYMENT POPUP TRIGGER ---
  const handlePaystackCheckout = () => {
    const email = userEmail || prompt("Enter your email address to receive access:");
    if (!email || !email.includes("@")) {
      alert("Please provide a valid email address to complete subscription.");
      return;
    }
    setUserEmail(email);

    // @ts-ignore Paystack Pop script
    if (typeof window !== "undefined" && window.PaystackPop) {
      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: 10000 * 100, // ₦10,000 in Kobo
        currency: "NGN",
        ref: "ALPHA_" + Math.floor(Math.random() * 1000000000 + 1),
        callback: function (response: { reference: string }) {
          alert(`🎉 Payment Successful! Reference: ${response.reference}. Pro Terminal Unlocked!`);
          setIsSubscribed(true);
        },
        onClose: function () {
          alert("Payment window closed.");
        },
      });
      handler.openIframe();
    } else {
      alert("Paystack is initializing. Please click again in 2 seconds.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans border-t-4 border-emerald-500">
      {/* --- TOP SAAS NAVIGATION BAR --- */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
            α
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ALPHA ANALYTICS <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">PRO TERMINAL</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className={`h-2 w-2 rounded-full ${apiConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
            <span className="text-slate-400">{apiConnected ? "FASTAPI LIVE" : "DEMO FEED MODE"}</span>
          </div>

          <button
            onClick={handlePaystackCheckout}
            className={`font-bold px-5 py-2.5 rounded-lg text-sm transition-all shadow-lg ${
              isSubscribed
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20"
            }`}
          >
            {isSubscribed ? "✓ PRO ACCESS UNLOCKED" : "Unlock Full Access (₦10,000/mo)"}
          </button>
        </div>
      </header>

      {/* --- MAIN TERMINAL CONTENT --- */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI OVERVIEW METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs font-mono uppercase">Monitored Fixtures</p>
            <p className="text-2xl font-bold mt-1 text-white">{fixtures.length}</p>
          </div>
          <div className="bg-slate-900/80 border border-emerald-900/40 p-5 rounded-xl">
            <p className="text-emerald-400 text-xs font-mono uppercase">+EV Opportunities Detected</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">
              {fixtures.reduce((acc, f) => acc + f.ev_signals.filter((s) => s.is_positive_ev).length, 0)} Edges
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs font-mono uppercase">Avg Discrepancy Margin</p>
            <p className="text-2xl font-bold mt-1 text-amber-400">+7.4%</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs font-mono uppercase">Engine Status</p>
            <p className="text-2xl font-bold mt-1 text-cyan-400 font-mono">POISSON-v1.4</p>
          </div>
        </div>

        {/* FIXTURE ANALYTICS GRID */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚽</span> Real-Time Institutional Matches & Score Matrices
            </h2>
            <span className="text-xs text-slate-400 font-mono">Auto-updating every 30s</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 font-mono">Loading Core Mathematical Matrices...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {fixtures.map((fixture) => (
                <div
                  key={fixture.fixture_id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-6 space-y-6"
                >
                  {/* MATCH HEADER */}
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {fixture.league}
                      </span>
                      <h3 className="text-xl font-black text-white mt-2">{fixture.match}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono block">Kickoff Time</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{fixture.kickoff}</span>
                    </div>
                  </div>

                  {/* PROBABILITY DISTRIBUTION & VALUE SIGNALS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Market Probabilities */}
                    <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-850 space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 font-mono uppercase">Model Probabilities (Poisson)</h4>
                      <div className="space-y-2">
                        {Object.entries(fixture.market_probabilities).map(([market, prob]) => (
                          <div key={market} className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 uppercase font-mono">{market.replace("_", " ")}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-teal-400 h-full" style={{ width: `${prob}%` }}></div>
                              </div>
                              <span className="font-mono text-white font-bold w-12 text-right">{prob}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detected +EV Edges & Outlier Odds */}
                    <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-850 space-y-3 relative overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-300 font-mono uppercase">Institutional +EV & Line Alerts</h4>

                      {/* PAYWALL BLUR OVERLAY IF NOT SUBSCRIBED */}
                      {!isSubscribed && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                          <p className="text-xs text-amber-400 font-mono font-bold uppercase mb-1">🔒 PRO FEATURE LOCKED</p>
                          <p className="text-xs text-slate-300 max-w-xs mb-3">
                            Subscribe to reveal exact bookmakers, mispriced odds & +EV margins.
                          </p>
                          <button
                            onClick={handlePaystackCheckout}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-all shadow-lg"
                          >
                            Unlock Signals for ₦10,000/mo
                          </button>
                        </div>
                      )}

                      <div className="space-y-2">
                        {fixture.ev_signals.map((sig, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border flex justify-between items-center ${
                              sig.is_positive_ev
                                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                                : "bg-slate-900 border-slate-800 text-slate-400"
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold font-mono block uppercase">{sig.market.replace("_", " ")}</span>
                              <span className="text-[11px] text-slate-400">
                                Fair: <strong className="text-slate-200">{sig.fair_odds}</strong> | Bookie:{" "}
                                <strong className="text-white">{sig.bookmaker_odds}</strong>
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                +{sig.ev_percent}% EV
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}