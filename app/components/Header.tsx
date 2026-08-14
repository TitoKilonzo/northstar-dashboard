"use client";

import { useState, useEffect } from "react";
import { Icons } from "./Icons";

type ActiveModal = "help" | "account" | "settings" | null;

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "What is the return window?",
    a: "Orders delivered within the last 30 days are eligible for self-service returns, provided items are unused and in original packaging.",
  },
  {
    q: "Why is an item marked 'Final Sale' non-returnable?",
    a: "Clearance and final sale items are offered at steep discounts and cannot be returned or exchanged under our store policy.",
  },
  {
    q: "How long do refunds take to process?",
    a: "Once your returned item is received and inspected at our warehouse, refunds are issued back to your original payment method within 3–5 business days.",
  },
  {
    q: "Can I return an item that arrived damaged?",
    a: "Yes! If an item arrived damaged or defective, please submit a support ticket below or contact our team directly for an immediate replacement.",
  },
];

export function Header() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ collapse state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Support ticket form state inside Help modal
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSent, setTicketSent] = useState(false);

  // Account modal editable state
  const [customerName, setCustomerName] = useState("A. Njoroge");
  const [email, setEmail] = useState("a.njoroge@northstar.co.ke");
  const [phone, setPhone] = useState("+254 712 345 678");
  const [shippingAddress, setShippingAddress] = useState("45 Kimathi Street, Suite 3B, Nairobi, Kenya");
  const [addressSaved, setAddressSaved] = useState(false);

  // Settings state
  const [currency, setCurrency] = useState("NGN (₦)");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveModal(null);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSendTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSent(true);
    setTimeout(() => {
      setTicketSubject("");
      setTicketMessage("");
    }, 3000);
  }

  function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressSaved(true);
    setTimeout(() => setAddressSaved(false), 2500);
  }

  function handleClearCache() {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                N
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-none">NorthStar</h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Order &amp; Return Desk</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setActiveModal("help")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeModal === "help"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icons.HelpCircle />
                Help
              </button>

              <button
                onClick={() => setActiveModal("account")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeModal === "account"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icons.User />
                Account
              </button>

              <button
                onClick={() => setActiveModal("settings")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeModal === "settings"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icons.Settings />
                Settings
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <Icons.Menu />
            </button>
          </div>

          {/* Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 border-t border-gray-100 mt-3 space-y-1">
              <button
                onClick={() => {
                  setActiveModal("help");
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Icons.HelpCircle />
                Help &amp; FAQs
              </button>
              <button
                onClick={() => {
                  setActiveModal("account");
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Icons.User />
                My Account
              </button>
              <button
                onClick={() => {
                  setActiveModal("settings");
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Icons.Settings />
                Dashboard Settings
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MODAL BACKDROP */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* HELP MODAL */}
            {activeModal === "help" && (
              <div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                    <Icons.HelpCircle />
                    <span>Help &amp; Customer Support</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
                  >
                    <Icons.X />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Frequently Asked Questions */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                      Frequently Asked Questions
                    </h3>
                    <div className="space-y-2">
                      {FAQS.map((faq, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-medium text-sm text-gray-900"
                          >
                            <span>{faq.q}</span>
                            <span
                              className={`transform transition-transform ${
                                openFaq === index ? "rotate-180" : ""
                              }`}
                            >
                              <Icons.ChevronDown />
                            </span>
                          </button>
                          {openFaq === index && (
                            <div className="px-4 py-3 bg-white text-sm text-gray-600 border-t border-gray-200">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Support Ticket Form */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Icons.Mail />
                      Contact Support Desk
                    </h3>

                    {ticketSent ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
                        <Icons.CheckCircle />
                        <span>Support ticket submitted! Our team will respond within 24 hours.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSendTicket} className="space-y-3">
                        <div>
                          <label htmlFor="ticket-subject" className="block text-xs font-medium text-gray-700 mb-1">
                            Subject
                          </label>
                          <input
                            id="ticket-subject"
                            type="text"
                            placeholder="e.g. Issue with Order NS-90001"
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="ticket-message" className="block text-xs font-medium text-gray-700 mb-1">
                            Message Details
                          </label>
                          <textarea
                            id="ticket-message"
                            rows={3}
                            placeholder="Describe how we can assist you..."
                            value={ticketMessage}
                            onChange={(e) => setTicketMessage(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                        >
                          Submit Ticket
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT MODAL */}
            {activeModal === "account" && (
              <div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                    <Icons.User />
                    <span>Customer Account Profile</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
                  >
                    <Icons.X />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Account Summary Card */}
                  <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                      {customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{customerName}</h4>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Icons.ShieldCheck />
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{email} • {phone}</p>
                    </div>
                  </div>

                  {/* Shipping Address Editor */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                      Default Shipping Address
                    </h3>
                    <form onSubmit={handleSaveAddress} className="space-y-3">
                      <textarea
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <div className="flex items-center justify-between">
                        {addressSaved ? (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <Icons.CheckCircle /> Saved successfully!
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          type="submit"
                          className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          Update Address
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Recent Activity Stats */}
                  <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium">Total Orders Placed</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">14 Orders</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium">Return Status</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">In Good Standing</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS MODAL */}
            {activeModal === "settings" && (
              <div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                    <Icons.Settings />
                    <span>Dashboard Preferences</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
                  >
                    <Icons.X />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Regional & Currency Preferences */}
                  <div>
                    <label htmlFor="setting-currency" className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                      Display Currency
                    </label>
                    <select
                      id="setting-currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="NGN (₦)">Nigerian Naira (NGN ₦)</option>
                      <option value="KES (KSh)">Kenyan Shilling (KES KSh)</option>
                      <option value="USD ($)">US Dollar (USD $)</option>
                      <option value="EUR (€)">Euro (EUR €)</option>
                    </select>
                  </div>

                  {/* Notification Toggles */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                      Notifications &amp; Alerts
                    </h3>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Order Updates</p>
                        <p className="text-xs text-gray-500">Receive return status changes via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => setEmailAlerts(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-gray-900">SMS Tracking Alerts</p>
                        <p className="text-xs text-gray-500">Get text notifications for delivery timelines</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={smsAlerts}
                        onChange={(e) => setSmsAlerts(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  {/* System & Cache Info */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                      System Diagnosis
                    </h3>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Database connection:</span>
                        <span className="font-mono text-emerald-600 font-semibold">LibSQL / SQLite Online</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">API Endpoint Latency:</span>
                        <span className="font-mono text-gray-900">8 ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Security Headers:</span>
                        <span className="font-mono text-emerald-600 font-semibold">Active (strict-origin)</span>
                      </div>
                    </div>

                    <button
                      onClick={handleClearCache}
                      className="w-full bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      {cacheCleared ? (
                        <>
                          <Icons.CheckCircle />
                          <span>Local Cache Cleared!</span>
                        </>
                      ) : (
                        <span>Clear Cached Session Data</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
