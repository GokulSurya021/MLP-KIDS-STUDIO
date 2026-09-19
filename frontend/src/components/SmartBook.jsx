import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import './SmartBook.css';

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  content: "✨ Hi! I'm **MLP SmartBook** — your AI assistant for MLP Kids Studio.\n\nAsk me anything about:\n• 📸 Services & packages\n• 💰 Pricing details\n• 📅 How to book a shoot\n• 📍 Location & hours\n• 📞 Contact & cancellation\n\nWhat would you like to know?",
  timestamp: new Date()
};

const formatMsg = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/•/g, '•')
    .replace(/\n/g, '<br/>');
};

const cleanTextForSpeech = (text) => {
  return text
    .replace(/[*#_`~[\]()]/g, ' ')
    .replace(/•/g, ', ')
    .replace(/₹(\d+)/g, '$1 rupees')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
};

const SmartBook = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Voice Search (Speech-to-Text) State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Voice Speech (Text-to-Speech) State
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open, minimized]);

  // Clean up speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Text-To-Speech Function
  const speakText = (text, msgId = null) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Voice speech is not supported in this browser.');
      return;
    }

    if (speakingMsgId === msgId && msgId !== null) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
  };

  // Voice Search (Speech-to-Text) Toggle
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in your browser. Try Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Stop speaking if bot is currently talking
    stopSpeech();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        toast('Listening... Speak now', { icon: '🎙️', duration: 2500 });
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission was denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          toast('No speech detected. Please try again.', { icon: 'ℹ️' });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      toast.error('Could not initialize microphone');
    }
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    // Stop microphone if currently listening
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    // Stop prior speech
    stopSpeech();

    const userMsg = { id: Date.now(), role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/chat', { message: msg, history });
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

      // Automatically speak the response if voice is enabled
      if (voiceEnabled) {
        speakText(res.data.reply, botMsg.id);
      }
    } catch (err) {
      const errorReply = "I'm having trouble connecting right now. Please call us at **9515651718** or visit us at Samalkot.";
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorReply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      if (voiceEnabled) {
        speakText(errorReply, errorMsg.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What are your packages?",
    "What are your timings?",
    "How to book a shoot?",
    "What is the advance payment?",
  ];

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className={`smartbook-window ${minimized ? 'smartbook-minimized' : ''} animate-fade`}>
          {/* Header */}
          <div className="smartbook-header">
            <div className="smartbook-header-info">
              <div className="smartbook-avatar">
                <Bot size={18} />
              </div>
              <div>
                <div className="smartbook-title">MLP SmartBook</div>
                <div className="smartbook-status">
                  <span className="status-dot" /> AI Assistant with Voice
                </div>
              </div>
            </div>
            <div className="smartbook-header-actions">
              {/* Voice On/Off Toggle Button */}
              <button
                onClick={() => {
                  if (voiceEnabled) stopSpeech();
                  setVoiceEnabled(!voiceEnabled);
                  toast(voiceEnabled ? 'Voice speech muted' : 'Voice speech enabled', {
                    icon: voiceEnabled ? '🔇' : '🔊',
                    duration: 1500
                  });
                }}
                className={`smartbook-action-btn ${voiceEnabled ? 'voice-active' : ''}`}
                aria-label={voiceEnabled ? 'Mute AI voice' : 'Enable AI voice'}
                title={voiceEnabled ? 'AI Voice Speech: ON' : 'AI Voice Speech: OFF'}
              >
                {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              <button
                onClick={() => setMinimized(!minimized)}
                className="smartbook-action-btn"
                aria-label={minimized ? 'Maximize' : 'Minimize'}
              >
                {minimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                onClick={() => { stopSpeech(); setOpen(false); }}
                className="smartbook-action-btn"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="smartbook-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}`}>
                    {msg.role === 'assistant' && (
                      <div className="chat-avatar chat-avatar-bot">
                        <Bot size={13} />
                      </div>
                    )}
                    <div className="chat-bubble-container">
                      <div
                        className="chat-bubble"
                        dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }}
                      />
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => speakText(msg.content, msg.id)}
                          className={`bubble-voice-btn ${speakingMsgId === msg.id ? 'speaking' : ''}`}
                          title={speakingMsgId === msg.id ? 'Stop speaking' : 'Read message aloud'}
                        >
                          {speakingMsgId === msg.id ? (
                            <>
                              <VolumeX size={12} />
                              <span className="audio-wave">
                                <span /><span /><span />
                              </span>
                            </>
                          ) : (
                            <Volume2 size={12} />
                          )}
                        </button>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="chat-avatar chat-avatar-user">
                        <User size={13} />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="chat-msg chat-msg-bot">
                    <div className="chat-avatar chat-avatar-bot">
                      <Bot size={13} />
                    </div>
                    <div className="chat-bubble chat-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 1 && (
                <div className="smartbook-quick">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      className="quick-btn"
                      onClick={() => { setInput(q); setTimeout(sendMessage, 50); }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Listening Indicator Bar */}
              {isListening && (
                <div className="smartbook-listening-bar animate-fade">
                  <span className="listening-pulse-dot" />
                  <span className="listening-text">Listening to your voice... Speak your query</span>
                  <button onClick={toggleListening} className="listening-cancel">Cancel</button>
                </div>
              )}

              {/* Input */}
              <div className="smartbook-input-area">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={isListening ? 'Listening to voice...' : 'Ask or speak (e.g. package prices)...'}
                  className={`smartbook-input ${isListening ? 'input-listening' : ''}`}
                  disabled={loading}
                />

                {/* Voice Search Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`smartbook-mic-btn ${isListening ? 'mic-listening' : ''}`}
                  title={isListening ? 'Stop listening' : 'Voice Search (Click & Speak)'}
                  aria-label="Voice Search"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="smartbook-send"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 size={16} className="animate-spin-icon" /> : <Send size={16} />}
                </button>
              </div>
              <div className="smartbook-footer-text">
                🎙️ Voice Search & 🔊 Speech Synthesis Enabled · Powered by MLP SmartBook AI
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB Button */}
      <div className="smartbook-fab-wrap">
        {!open && (
          <div className="smartbook-fab-label">Chat with AI 🎙️</div>
        )}
        <button
          className={`smartbook-fab ${open ? 'smartbook-fab-open' : ''}`}
          onClick={() => {
            if (open) stopSpeech();
            setOpen(!open);
            setMinimized(false);
          }}
          aria-label="Open AI Chat"
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
          {!open && <span className="fab-pulse" />}
        </button>
      </div>
    </>
  );
};

export default SmartBook;
