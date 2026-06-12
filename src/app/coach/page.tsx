'use client';

import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { askCoach, scanReceipt } from '../../lib/api';
import { MessageSquare, UploadCloud, Volume2, VolumeX, Sparkles, Send, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CoachPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [messages, setMessages] = useState<any[]>([
    { role: 'model', parts: [{ text: "Hello! I am your EcoTrack AI Coach. How can I help you build green habits or reduce your carbon emissions today?" }] }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scanner states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!voiceEnabled) return;

    const cleanText = text.replace(/[\*#_`\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !user) return;

    if (!textToSend) setInputMessage('');

    const userMsg = { role: 'user', parts: [{ text }] };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: m.parts
      }));

      const res = await askCoach(history, text);
      const coachReply = { role: 'model', parts: [{ text: res.reply }] };
      
      setMessages([...updatedMessages, coachReply]);
      speakText(res.reply);
    } catch (e) {
      console.error(e);
      setMessages([...updatedMessages, { role: 'model', parts: [{ text: "I'm having trouble connecting to the coach service right now. Please check if the backend is running." }] }]);
    } finally {
      setLoading(false);
    }
  };

  const presetQuestions = [
    "How can I reduce my daily car carbon footprint?",
    "What are simple household energy saving hacks?",
    "How does a vegetarian diet reduce global emissions?"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setScanResult(null);
    }
  };

  const handleUploadScan = async () => {
    if (!selectedFile || !user) return;

    setScanning(true);
    try {
      const res = await scanReceipt(selectedFile);
      setScanResult(res);
      setSelectedFile(null);

      // Trigger navbar points update
      window.dispatchEvent(new Event('ecotrack-user-updated'));

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: `### 📄 Receipt Scanned Successfully!\n\nI processed your uploaded file (**${res.scan.fileName}**):\n\n* **Extracted Consumption**: ${res.result.amount} units\n* **Estimated CO₂ Footprint**: **${res.result.co2Estimate.toFixed(1)} kg CO₂**\n\n*Awarded +30 XP Eco Points!*` }]
        }
      ]);
    } catch (e) {
      console.error(e);
      alert('Failed to scan receipt. Ensure backend server is running and GEMINI_API_KEY is configured.');
    } finally {
      setScanning(false);
    }
  };

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
      {/* Receipt Scanner */}
      <div className="glass-panel p-6 border-white/5 bg-gray-950/40 h-fit space-y-6">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
          <UploadCloud className="w-4 h-4" />
          <span>AI Carbon Receipt Scanner</span>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-white">Upload Bills & Invoices</h2>
          <p className="text-gray-400 text-xs mt-1 font-semibold leading-relaxed">
            Upload an image of an electricity bill or fuel receipt. Gemini Vision AI will automatically parse the quantities, estimate emissions, and award Eco Points.
          </p>
        </div>

        <div className="border border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl p-6 text-center transition-all bg-white/5 relative">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            id="file-upload"
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Upload utility bill or receipt"
          />
          <UploadCloud className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-300">
            {selectedFile ? selectedFile.name : 'Click or Drag receipt here'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1 uppercase font-black">Supports JPEG, PNG, PDF</p>
        </div>

        {selectedFile && (
          <button
            onClick={handleUploadScan}
            disabled={scanning}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            {scanning ? 'Scanning Receipts...' : 'Analyze Carbon Footprint'}
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* Scan Results */}
        {scanResult && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Scanning Results Summary</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Estimated CO₂</span>
                <span className="text-xl font-black text-white">{scanResult.result.co2Estimate.toFixed(1)} kg</span>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">XP Awarded</span>
                <span className="text-xl font-black text-emerald-400">+30 XP</span>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-gray-400 leading-relaxed border-t border-white/5 pt-3">
              <span className="text-gray-300 font-bold block mb-1">Extracted Text Summary:</span>
              {scanResult.result.rawText}
            </div>
          </div>
        )}
      </div>

      {/* Coach Chatbot */}
      <div className="lg:col-span-2 glass-panel border-white/5 bg-gray-950/40 flex flex-col h-[75vh] relative overflow-hidden">
        {/* Chat Header */}
        <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-gray-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Eco-Sustainability Coach</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Gemini 1.5 Flash Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSpeaking && (
              <div className="h-4 flex items-end">
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
                <span className="audio-bar" />
              </div>
            )}
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) window.speechSynthesis.cancel();
              }}
              className={`p-2.5 rounded-xl border transition-all ${
                voiceEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={voiceEnabled ? "Mute Voice Assistant" : "Enable Voice Assistant"}
              aria-label={voiceEnabled ? "Mute Voice Assistant" : "Enable Voice Assistant"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Chat Bubbles */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => {
            const isModel = m.role === 'model';
            return (
              <div
                key={idx}
                className={`flex ${isModel ? 'justify-start' : 'justify-end'} animate-in fade-in duration-100`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm font-semibold leading-relaxed shadow-sm ${
                    isModel
                      ? 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none'
                      : 'bg-emerald-500 text-white rounded-tr-none'
                  }`}
                >
                  {m.parts[0].text.split('\n').map((line: string, lIdx: number) => {
                    if (line.startsWith('### ')) {
                      return <h3 key={lIdx} className="font-extrabold text-base text-emerald-400 mt-2 mb-1">{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('* ')) {
                      return <li key={lIdx} className="ml-4 list-disc text-gray-300">{line.replace('* ', '')}</li>;
                    }
                    return <p key={lIdx} className={line === '' ? 'h-3' : 'mb-1 text-gray-300'}>{line}</p>;
                  })}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 text-gray-400 rounded-2xl rounded-tl-none px-5 py-3 text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-200" />
                <span>Coach is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Inputs */}
        <div className="border-t border-white/5 p-4 space-y-4 bg-gray-900/10">
          {messages.length === 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Eco-Prompts Recommendations</p>
              <div className="flex flex-col sm:flex-row gap-2">
                {presetQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-left text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 text-gray-300 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 transition-all"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the Eco Coach..."
              className="flex-1 glass-input text-sm font-semibold focus:border-emerald-500"
              aria-label="Ask the Eco Coach"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputMessage.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white p-3 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
