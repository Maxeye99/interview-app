import React, { useState, useEffect } from 'react';
import { BookOpen, User, Building, FileText, Send, ChevronRight, MessageSquare, Code, Users, HelpCircle, Download, CheckCircle, AlertCircle, Briefcase, Star, Target, Loader2 } from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const callGeminiAPI = async (inputs) => {
  // Check if key is missing (for the Vercel scenario)
  if (!apiKey) {
    throw new Error("Missing API Key. Please check: 1. You uncommented Option 2. 2. You added VITE_GEMINI_API_KEY to Vercel Settings.");
  }

  const { jd, resume, company, notes } = inputs;

  const systemPrompt = `
    You are an expert Senior Technical Recruiter and Interview Coach.
    Your goal is to analyze the provided Job Description (JD), Candidate Resume, Company Info, and Notes to generate a high-level interview preparation script.
    
    You must output ONLY valid JSON. The JSON structure must match this schema exactly:
    {
      "meta": {
        "role": "Extracted Role Title",
        "generatedAt": "Current Date"
      },
      "sections": [
        {
          "id": "intro",
          "title": "The Narrative & Self-Intro",
          "content": [
            {
              "type": "guide",
              "title": "The 'Tell Me About Yourself' Strategy",
              "text": "Strategic advice on how to frame their intro.",
              "points": ["Hook (Present)...", "Bridge (Past)...", "Goal (Future)..."]
            },
            {
              "type": "script",
              "title": "Draft Script (Customized)",
              "text": "A first-person draft script the candidate can say."
            }
          ]
        },
        {
          "id": "technical",
          "title": "Technical & Role Competency",
          "content": [
            // Array of 3-4 specific technical/skill questions found in the JD
            {
              "type": "qa",
              "question": "Specific question about a skill in the JD",
              "insight": "Why this is asked",
              "goodAnswer": "What a top 1% candidate would say",
              "badAnswer": "A red flag answer",
              "keywords": ["Keyword1", "Keyword2"]
            }
          ]
        },
        {
          "id": "behavioral",
          "title": "Behavioral & Culture Fit",
          "content": [
            { "type": "guide", "title": "Culture Map", "text": "Analysis of the company culture based on text provided." },
            { "type": "qa", "question": "Behavioral question", "insight": "...", "method": "STAR Method", "tips": "..." }
          ]
        },
        {
          "id": "reverse",
          "title": "Questions to Ask Interviewer",
          "content": [
            { "type": "list", "title": "Strategic Questions", "items": ["Question 1", "Question 2"] },
            { "type": "list", "title": "Culture Checks", "items": ["Question 1", "Question 2"] }
          ]
        }
      ]
    }
  `;

  const userPrompt = `
    JOB DESCRIPTION:
    ${jd}

    CANDIDATE RESUME:
    ${resume}

    COMPANY INFO:
    ${company}

    USER NOTES:
    ${notes}
    
    Generate the JSON response now.
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON (it typically comes as a string)
    return JSON.parse(generatedText);

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Return a fallback or error state structure if needed, or rethrow
    throw error;
  }
};


// --- Components ---

const SectionCard = ({ title, children, icon: Icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between group
      ${active 
        ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' 
        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 hover:border-blue-200'
      }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-500 group-hover:text-blue-600'}`}>
        <Icon size={20} />
      </div>
      <span className="font-semibold">{title}</span>
    </div>
    <ChevronRight size={18} className={`transition-transform ${active ? 'rotate-90' : 'text-gray-400'}`} />
  </button>
);

const InputArea = ({ label, value, onChange, placeholder, icon: Icon, height = "h-32" }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <Icon size={16} className="text-blue-500" />
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none ${height} text-sm`}
    />
  </div>
);

const OutputContent = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {data.map((item, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {item.type === 'guide' && <BookOpen size={18} className="text-purple-500" />}
            {item.type === 'script' && <MessageSquare size={18} className="text-green-500" />}
            {item.type === 'qa' && <HelpCircle size={18} className="text-blue-500" />}
            {item.type === 'list' && <Target size={18} className="text-orange-500" />}
            <h3 className="font-bold text-gray-800 text-lg">{item.title || item.question}</h3>
          </div>

          {item.text && <p className="text-gray-600 leading-relaxed">{item.text}</p>}
          
          {item.points && (
            <ul className="space-y-2">
              {item.points.map((pt, i) => (
                <li key={i} className="flex gap-2 text-gray-700 text-sm">
                  <span className="text-blue-500 mt-1">•</span>
                  <span dangerouslySetInnerHTML={{__html: pt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
                </li>
              ))}
            </ul>
          )}

          {item.items && (
            <ul className="space-y-3">
              {item.items.map((pt, i) => (
                <li key={i} className="flex gap-3 text-gray-700 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-orange-500 font-bold">?</span>
                  "{pt.replace(/"/g, '')}"
                </li>
              ))}
            </ul>
          )}

          {item.type === 'qa' && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-2 text-sm">
                  <CheckCircle size={16} /> Good Approach
                </div>
                <p className="text-sm text-green-800">{item.goodAnswer || item.insight}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-2 text-sm">
                  <AlertCircle size={16} /> Bad Approach
                </div>
                <p className="text-sm text-red-800">{item.badAnswer || "Avoiding the core of the question."}</p>
              </div>
              {item.keywords && (
                <div className="md:col-span-2 flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hit these keywords:</span>
                  {item.keywords.map((k, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{k}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function InterviewPrepApp() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('intro');
  const [generatedData, setGeneratedData] = useState(null);

  // Inputs
  const [jd, setJd] = useState('');
  const [resume, setResume] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  const handleGenerate = async () => {
    if (!jd) {
      alert("Please provide at least a Job Description to generate a script.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await callGeminiAPI({ jd, resume, company, notes });
      setGeneratedData(result);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Failed to generate script. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getActiveContent = () => {
    if (!generatedData) return [];
    return generatedData.sections.find(s => s.id === activeTab)?.content || [];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Briefcase size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">PrepMaster <span className="text-blue-600">AI</span></h1>
          </div>
          {step === 2 && (
             <button 
               onClick={() => setStep(1)}
               className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
             >
               Start New Prep
             </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* INPUT MODE */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Comprehensive Interview Scripts</h2>
              <p className="text-gray-500">Feed in your data. Get a battle-tested game plan powered by Gemini.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
              <InputArea 
                label="Job Description (Required)" 
                icon={FileText} 
                value={jd} 
                onChange={setJd} 
                placeholder="Paste the full JD here..." 
                height="h-48"
              />
              
              <div className="grid md:grid-cols-2 gap-6">
                <InputArea 
                  label="Your Resume (Text)" 
                  icon={User} 
                  value={resume} 
                  onChange={setResume} 
                  placeholder="Paste resume text highlighting experience..." 
                />
                <InputArea 
                  label="Company Info / Values" 
                  icon={Building} 
                  value={company} 
                  onChange={setCompany} 
                  placeholder="Key values from website, 'About Us' page..." 
                />
              </div>

              <InputArea 
                label="Extra Notes / Past Transcript" 
                icon={BookOpen} 
                value={notes} 
                onChange={setNotes} 
                placeholder="Any previous call notes, recruiter hints, or specific worries..." 
                height="h-24"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2
                  ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01]'}`}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Analyzing with Gemini...
                  </>
                ) : (
                  <>
                    <Send size={20} /> Generate Prep Script
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* OUTPUT MODE */}
        {step === 2 && generatedData && (
          <div className="grid lg:grid-cols-12 gap-8 animate-slideUp">
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                <h3 className="text-blue-900 font-bold text-lg mb-1">{generatedData.meta.role}</h3>
                <p className="text-blue-600 text-sm">Generated Strategy Guide</p>
              </div>

              <div className="space-y-2">
                {generatedData.sections.map((section) => (
                  <SectionCard 
                    key={section.id}
                    title={section.title}
                    icon={section.id === 'intro' ? User : section.id === 'technical' ? Code : section.id === 'behavioral' ? Users : HelpCircle}
                    active={activeTab === section.id}
                    onClick={() => setActiveTab(section.id)}
                  />
                ))}
              </div>

              <div className="pt-6 border-t border-gray-200 mt-6">
                <button className="w-full py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                  <Download size={18} /> Export PDF
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
                {/* Content Header */}
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    {activeTab === 'intro' && <User size={24} />}
                    {activeTab === 'technical' && <Code size={24} />}
                    {activeTab === 'behavioral' && <Users size={24} />}
                    {activeTab === 'reverse' && <HelpCircle size={24} />}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {generatedData.sections.find(s => s.id === activeTab)?.title}
                  </h2>
                </div>

                {/* Content Body */}
                <div className="p-6 bg-gray-50/50 flex-1">
                  <OutputContent data={getActiveContent()} />
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
      `}</style>
    </div>
  );
}