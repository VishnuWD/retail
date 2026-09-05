'use client';

import { useState } from 'react';
import { Send, Bot, User, ShieldAlert, Sparkles, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Namaste! I am your Kirana Smart Assistant. I can help you check low stock items, review today\'s sales & profit margins, inspect customer udhaar ledgers, or find best-selling products. How can I assist you right now?',
      context: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Recommendations extracted from messages for approval demonstration
  const [recommendations, setRecommendations] = useState([
    { id: 1, type: 'PURCHASE', desc: 'Order 30 units of Aashirvaad Atta 5kg from National FMCG Distributors', approved: false },
    { id: 2, type: 'REMINDER', desc: 'Send WhatsApp payment reminder to Rajesh Nair (₹2,850.50 pending)', approved: false }
  ]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const json = await apiClient.post('/api/assistant', { message: userText });
      if (json.success && json.data) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: json.data.reply || json.data.response || 'Action processed.',
            context: json.data.contextUsed
          }
        ]);
        
        // Dynamically simulate adding a recommendation if relevant
        if (userText.toLowerCase().includes('stock') || userText.toLowerCase().includes('reorder')) {
          setRecommendations(prev => [
            ...prev,
            { id: Date.now(), type: 'PURCHASE_DRAFT', desc: 'Generate reorder PO for Daawat Basmati Rice (20 units)', approved: false }
          ]);
        }
      } else {
        throw new Error(json.error?.message || 'Failed to get assistant response.');
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Error: ${error.message}. Please try again.`,
          context: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id) => {
    setRecommendations(prev =>
      prev.map(rec => (rec.id === id ? { ...rec, approved: true } : rec))
    );
    alert('Action approved! Triggering authorized transaction execution.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Left 2 Columns: Chat Stream */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                Safe Retail Assistant <Sparkles size={14} className="text-amber-500 fill-amber-500" />
              </h2>
              <p className="text-slate-400 text-xs">AI-Ready context search • Human-in-the-loop confirmation</p>
            </div>
          </div>
          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
            ReadOnly Mode Enabled
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                msg.sender === 'user' ? 'bg-slate-700' : 'bg-indigo-600'
              }`}>
                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div className="space-y-1">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Show DB Query Context if available */}
                {msg.context && (
                  <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-2.5 text-xs text-indigo-800 font-mono scale-95 origin-top-left">
                    <div className="font-bold text-[10px] uppercase text-indigo-400 mb-1">Context Query Parameters</div>
                    {msg.context}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white">
                <Bot size={14} />
              </div>
              <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-none border border-slate-200 p-4 text-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span>Searching local records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="border-t border-slate-200 p-4 flex gap-2">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Ask about sales today, inventory, or overdue balances..."
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-9 w-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 transition-all shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Right Column: Guardrails & Action Approvals */}
      <div className="space-y-6">
        {/* Guardrails Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldAlert className="text-amber-500" size={16} /> AI Assistant Safety Rules
          </h3>
          <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
            <li>Assistant runs in isolated scope: can access only active tenant data.</li>
            <li>No raw database writing or deletion operations can be executed via AI prompts.</li>
            <li>AI can recommend actions, but cannot complete transactions directly.</li>
            <li>All financial and inventory edits require explicit authorized human confirmation.</li>
          </ul>
        </div>

        {/* Recommendations Action List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Action Approval Queue</h3>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                    {rec.type}
                  </span>
                  {rec.approved && (
                    <span className="text-green-600 flex items-center gap-0.5 text-xs font-semibold">
                      <CheckCircle2 size={12} /> Approved
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-normal">{rec.desc}</p>
                {!rec.approved && (
                  <button
                    onClick={() => handleApprove(rec.id)}
                    className="w-full bg-indigo-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-indigo-500 flex items-center justify-center gap-1"
                  >
                    Confirm Action <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
