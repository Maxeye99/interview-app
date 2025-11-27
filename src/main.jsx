import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BookOpen, User, Building, FileText, Send, ChevronRight, MessageSquare, Code, Users, HelpCircle, Download, CheckCircle, AlertCircle, Briefcase, Star, Target, Loader2, Layers, Sparkles, Plus } from 'lucide-react';

// ==========================================
// 🚀 DEPLOYMENT CONFIGURATION
// ==========================================

// OPTION 1: PREVIEW MODE (Current - Easiest for testing)

// OPTION 2: VERCEL DEPLOYMENT MODE (Secure)
// If you want to use the secure Vercel Vault, comment out Option 1 
// and uncomment the line below:
 const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ==========================================

// --- API Helpers ---

const callGeminiAPI = async (inputs) => {
  if (!apiKey) throw new Error("Missing API Key.");

  const { jd, resume, company, notes } = inputs;
  const userPrompt = `JOB DESCRIPTION:\n${jd}\n\nCANDIDATE RESUME:\n${resume}\n\nCOMPANY INFO:\n${company}\n\nUSER NOTES:\n${notes}`;

  const systemPrompt = `
    You are an expert Senior Technical Recruiter and Interview Coach.
    Goal: Generate a comprehensive interview prep script.
    
    CRITICAL INSTRUCTIONS:
    1. **Format:** Concise bullet points.
    2. **Quantity:** 5-6 questions per technical section.
    3. **Tech Stack:** Extract tools (e.g. Python, AWS) into a specific section.
    4. **Content:** Ensure every object in the 'content' array has valid 'text', 'points', or 'questions'. Do not output empty objects.

    Output JSON Schema:
    {
      "meta": { "role": "Role Title", "generatedAt": "Date" },
      "sections": [
        { "id": "intro", "title": "The Narrative", "content": [...] },
        { "id": "tech_stack", "title": "Tech Stack Drill", "content": [...] },
        { "id": "technical", "title": "Deep Dive", "content": [...] },
        { "id": "behavioral", "title": "Behavioral", "content": [...] },
        { "id": "reverse", "title": "Questions to Ask", "content": [...] }
      ]
    }
  `;

  return fetchGemini(systemPrompt, userPrompt);
};

const callRefinementAPI = async (originalContext, refineQuery) => {
  if (!apiKey) throw new Error("Missing API Key.");

  const systemPrompt = `
    You are a strict Interview Coach. 
    The candidate wants to REFINE their prep.
    
    CONTEXT:
    Role: ${originalContext.meta.role}
    
    USER REQUEST: "${refineQuery}"
    
    INSTRUCTIONS:
    1. Generate a NEW section of content based strictly on the request.
    2. Output MUST be valid JSON with a 'title' and a 'content' array.
    3. If generating questions, use 'type': 'qa' or 'question'.
    
    Output JSON Schema:
    {
      "title": "Title for this new section",
      "content": [ 
        // Array of objects. prefer type='qa' for questions.
      ]
    }
  `;

  return fetchGemini(systemPrompt, "Generate the refinement section now.");
};

const fetchGemini = async (sys, user) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: user }] }],
          systemInstruction: { parts: [{ text: sys }] },
          generationConfig: { responseMimeType: "application/json" }
        }),
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

// --- Components ---

const SectionCard = ({ title, icon: Icon, active, onClick, isRefinement }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-start gap-3 group print:hidden
      ${active 
        ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' 
        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 hover:border-blue-200'
      } ${isRefinement ? 'border-purple-200 bg-purple-50' : ''}`}
  >
    <div className={`p-2 rounded-lg flex-shrink-0 ${active ? 'bg-white/20' : (isRefinement ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500')} `}>
      <Icon size={20} />
    </div>
    <span className="font-semibold text-sm leading-tight py-1">{title}</span>
    <ChevronRight size={18} className={`transition-transform ml-auto flex-shrink-0 mt-1 ${active ? 'rotate-90' : 'text-gray-400'}`} />
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
  if (!data || data.length === 0) return <div className="text-gray-400 italic p-4">Select a section to view content.</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {data.map((item, idx) => {
        // Safety check: Ensure something exists to render
        const hasContent = item.text || item.points || item.questions || item.items || item.goodAnswerPoints || item.goodAnswer || item.question || item.stackName || item.answer;
        if (!hasContent) return null;

        // Determine content type robustly
        const isStackGroup = item.type === 'stack_group' || (item.stackName && item.questions);
        const isQA = item.type === 'qa' || (item.question && (item.goodAnswer || item.goodAnswerPoints || item.badAnswerPoints));
        const isSimpleQuestion = !isQA && !isStackGroup && item.question; // Fallback for simple Q&A

        return (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 print:shadow-none print:border-none print:p-0">
            
            {isStackGroup && (
               <div className="border-b border-gray-100 pb-2 mb-4">
                  <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                    <Code size={20} /> {item.stackName}
                  </h3>
               </div>
            )}

            {['guide', 'script', 'list'].includes(item.type) && (
              <div className="flex items-center gap-2 mb-2">
                {item.type === 'guide' && <BookOpen size={18} className="text-purple-500" />}
                {item.type === 'script' && <MessageSquare size={18} className="text-green-500" />}
                {item.type === 'list' && <Target size={18} className="text-orange-500" />}
                <h3 className="font-bold text-gray-800 text-lg">{item.title || item.question}</h3>
              </div>
            )}

            {item.text && <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.text}</p>}
            
            {item.points && (
              <ul className="space-y-2">
                {item.points.map((pt, i) => (
                  <li key={i} className="flex gap-2 text-gray-700 text-sm">
                    <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                    <span dangerouslySetInnerHTML={{__html: pt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
                  </li>
                ))}
              </ul>
            )}

            {/* Stack Group Questions */}
            {isStackGroup && item.questions && (
              <div className="space-y-6">
                {item.questions.map((q, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg print:border print:border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">{i + 1}. {q.question}</p>
                    <ul className="ml-4 space-y-1">
                      {(q.answerPoints || q.answer ? (q.answerPoints || [q.answer]) : []).map((ans, j) => (
                        <li key={j} className="text-sm text-gray-600 list-disc">{ans}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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

            {/* Advanced QA View (Good/Bad) */}
            {isQA && (
              <div className="grid md:grid-cols-2 gap-4 mt-4 print:block print:space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 print:border-green-200">
                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-2 text-sm">
                    <CheckCircle size={16} /> Good Approach
                  </div>
                  {item.goodAnswerPoints ? (
                     <ul className="list-disc ml-4 space-y-1">
                       {item.goodAnswerPoints.map((p, i) => (
                         <li key={i} className="text-sm text-green-800">{p}</li>
                       ))}
                     </ul>
                  ) : (
                    <p className="text-sm text-green-800">{item.goodAnswer || item.insight}</p>
                  )}
                </div>
                
                {/* Only show Bad Approach if data exists */}
                {(item.badAnswerPoints || item.badAnswer) && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100 print:border-red-200">
                    <div className="flex items-center gap-2 text-red-700 font-semibold mb-2 text-sm">
                      <AlertCircle size={16} /> Bad Approach
                    </div>
                    {item.badAnswerPoints ? (
                       <ul className="list-disc ml-4 space-y-1">
                         {item.badAnswerPoints.map((p, i) => (
                           <li key={i} className="text-sm text-red-800">{p}</li>
                         ))}
                       </ul>
                    ) : (
                      <p className="text-sm text-red-800">{item.badAnswer}</p>
                    )}
                  </div>
                )}

                {item.keywords && (
                  <div className="md:col-span-2 flex flex-wrap gap-2 mt-2 print:hidden">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hit these keywords:</span>
                    {item.keywords.map((k, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Simple/Fallback Question View */}
            {isSimpleQuestion && (
               <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <p className="font-bold text-gray-800 mb-2 text-lg">{item.question}</p>
                  {item.answer && <p className="text-sm text-gray-700 leading-relaxed">{item.answer}</p>}
                  {item.answerPoints && (
                    <ul className="ml-4 space-y-1">
                      {item.answerPoints.map((ans, j) => (
                        <li key={j} className="text-sm text-gray-700 list-disc">{ans}</li>
                      ))}
                    </ul>
                  )}
               </div>
            )}

          </div>
        );
      })}
    </div>
  );
};

export default function InterviewPrepApp() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('intro');
  const [generatedData, setGeneratedData] = useState(null);
  const [refineQuery, setRefineQuery] = useState('');
  
  // Inputs
  const [jd, setJd] = useState('');
  const [resume, setResume] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  const handleGenerate = async () => {
    if (!jd) return alert("Please provide at least a Job Description.");
    setLoading(true);
    setError(null);
    try {
      const result = await callGeminiAPI({ jd, resume, company, notes });
      setGeneratedData(result);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refineQuery.trim()) return;
    setRefining(true);
    try {
      const newSectionData = await callRefinementAPI(generatedData, refineQuery);
      
      const newSectionId = `refine_${Date.now()}`;
      const newSection = {
        id: newSectionId,
        title: newSectionData.title || "New Refinement",
        content: newSectionData.content,
        isRefinement: true
      };

      setGeneratedData(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
      
      setRefineQuery('');
      setActiveTab(newSectionId);
    } catch (err) {
      alert("Refinement failed. Try again.");
    } finally {
      setRefining(false);
    }
  };

  const handlePrint = () => window.print();

  const getActiveContent = () => {
    if (!generatedData) return [];
    return generatedData.sections.find(s => s.id === activeTab)?.content || [];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 print:bg-white">
      
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; font-size: 12pt; }
          header, .sidebar, .print-hidden { display: none !important; }
          .main-content { width: 100% !important; border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
          .print-full-width { display: block !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 print-hidden">
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

      <main className="max-w-6xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Comprehensive Interview Scripts</h2>
              <p className="text-gray-500">Feed in your data. Get a battle-tested game plan powered by Gemini.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
              <InputArea label="Job Description (Required)" icon={FileText} value={jd} onChange={setJd} placeholder="Paste the full JD here..." height="h-48" />
              <div className="grid md:grid-cols-2 gap-6">
                <InputArea label="Your Resume (Text)" icon={User} value={resume} onChange={setResume} placeholder="Paste resume text..." />
                <InputArea label="Company Info / Values" icon={Building} value={company} onChange={setCompany} placeholder="Key values..." />
              </div>
              <InputArea label="Extra Notes" icon={BookOpen} value={notes} onChange={setNotes} placeholder="Call notes, specific worries..." height="h-24" />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} />{error}
                </div>
              )}

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2
                  ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01]'}`}
              >
                {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <><Send size={20} /> Generate Prep Script</>}
              </button>
            </div>
          </div>
        )}

        {step === 2 && generatedData && (
          <div className="grid lg:grid-cols-12 gap-8 animate-slideUp print-full-width">
            
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-4 sidebar print:hidden">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-2">
                <h3 className="text-blue-900 font-bold text-lg mb-1">{generatedData.meta.role}</h3>
                <p className="text-blue-600 text-sm">Strategy Guide</p>
              </div>

              {/* Refinement Input */}
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl mb-6">
                <label className="text-xs font-bold text-purple-800 uppercase tracking-wide flex items-center gap-1 mb-2">
                  <Sparkles size={12} /> Ask the Coach
                </label>
                <div className="flex gap-2">
                  <input 
                    value={refineQuery}
                    onChange={(e) => setRefineQuery(e.target.value)}
                    placeholder="e.g. 'Harder SQL questions'..."
                    className="w-full text-sm p-2 rounded border border-purple-200 focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  />
                  <button 
                    onClick={handleRefine}
                    disabled={refining || !refineQuery}
                    className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {refining ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {generatedData.sections.map((section) => (
                  <SectionCard 
                    key={section.id}
                    title={section.title}
                    isRefinement={section.isRefinement}
                    icon={
                      section.id === 'intro' ? User : 
                      section.id === 'tech_stack' ? Layers :
                      section.id === 'technical' ? Code : 
                      section.id === 'behavioral' ? Users : 
                      section.isRefinement ? Sparkles : HelpCircle
                    }
                    active={activeTab === section.id}
                    onClick={() => setActiveTab(section.id)}
                  />
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button onClick={handlePrint} className="w-full py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                  <Download size={18} /> Export PDF
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8 main-content">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col print:border-none print:shadow-none">
                
                <div className="p-6 border-b border-gray-100 flex items-center gap-3 print-hidden">
                  <div className={`p-2 rounded-lg ${generatedData.sections.find(s => s.id === activeTab)?.isRefinement ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {generatedData.sections.find(s => s.id === activeTab)?.isRefinement ? <Sparkles size={24} /> : <Code size={24} />}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {generatedData.sections.find(s => s.id === activeTab)?.title}
                  </h2>
                </div>

                <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-4">
                   <h1 className="text-3xl font-bold text-gray-900 mb-2">{generatedData.meta.role}</h1>
                   <p className="text-gray-500">Interview Prep Guide • {generatedData.meta.generatedAt}</p>
                </div>

                <div className="p-6 bg-gray-50/50 flex-1 print:hidden">
                  <OutputContent data={getActiveContent()} />
                </div>

                {/* Master Print View */}
                <div className="hidden print:block space-y-8 p-0">
                  {generatedData.sections.map((section, idx) => (
                    <div key={section.id} className={idx > 0 ? "page-break pt-8" : ""}>
                      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-2">
                        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
                          {section.title}
                        </h2>
                      </div>
                      <OutputContent data={section.content} />
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// ⚠️ THIS SECTION MUST BE ACTIVE FOR YOUR DEPLOYED SITE TO WORK ⚠️
// Uncomment the following lines for local development and Vercel deployment
ReactDOM.createRoot(document.getElementById('root')).render(
   <React.StrictMode>
     <InterviewPrepApp />
   </React.StrictMode>,
 )