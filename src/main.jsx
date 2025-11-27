import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BookOpen, User, Building, FileText, Send, ChevronRight, MessageSquare, Code, Users, HelpCircle, Download, CheckCircle, AlertCircle, Briefcase, Star, Target, Loader2, Layers, Sparkles, Plus, Shield, Zap, Key, Stethoscope, Coffee, TrendingUp, Cpu } from 'lucide-react';

// ==========================================
// 🚀 CONFIGURATION
// ==========================================

// OPTION 1: PREVIEW MODE (Current)


// OPTION 2: VERCEL DEPLOYMENT MODE (Secure)
 const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ==========================================

// --- API Helpers ---

const cleanJsonText = (text) => {
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose !== -1) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }
  return cleaned.trim();
};

const callGeminiAPI = async (inputs) => {
  if (!apiKey) throw new Error("Missing API Key.");

  const { jd, resume, company, notes, industry } = inputs;
  const notesText = notes ? `TRANSCRIPT / NOTES:\n${notes}` : "TRANSCRIPT / NOTES: N/A";
  
  const userPrompt = `INDUSTRY: ${industry}\nJOB DESCRIPTION:\n${jd}\n\nCANDIDATE RESUME:\n${resume}\n\nCOMPANY INFO:\n${company}\n\n${notesText}`;

  // DYNAMIC PROMPT GENERATION BASED ON INDUSTRY
  let roleContext = "";
  let section3Label = "3. What They Will Test You On";
  
  if (industry === 'Tech') {
    roleContext = "You are an elite CTO / Technical Interview Coach. Focus on System Design, Scalability, Algorithms, Tech Stack depth, and Engineering Leadership.";
    section3Label = "3. What They Will Test You On (Tech & Architecture)";
  } else if (industry === 'Hospitality') {
    roleContext = "You are a top-tier General Manager or Hospitality Consultant. Focus on Guest Experience (GX), Operations Excellence, P&L Management, Staff Leadership, and Crisis Resolution.";
    section3Label = "3. What They Will Test You On (Operations & Service)";
  } else if (industry === 'Healthcare') {
    roleContext = "You are a Chief Medical Officer or Senior Nursing Director. Focus on Patient Care Standards, Clinical Governance, Compliance, Triage Protocols, and Empathy.";
    section3Label = "3. What They Will Test You On (Clinical & Protocol)";
  } else {
    roleContext = "You are a C-Level Executive Coach (CEO/COO/CRO). Focus on Strategic Vision, Revenue Growth, Stakeholder Management, KPI Drivers, and Organizational Leadership.";
    section3Label = "3. What They Will Test You On (Strategy & Functional)";
  }

  const systemPrompt = `
    ${roleContext}
    Goal: Generate a "Gold Standard" Interview Strategy Guide, structured exactly like a high-level briefing document.
    
    CRITICAL INSTRUCTIONS:
    1. **Industry Specificity:** Use the exact jargon of the ${industry} industry (e.g., for Hospitality use "RevPAR", "Mise en place"; for Tech use "Microservices", "CI/CD").
    2. **Section 3 (Test Areas):** This must be a SUMMARY of required skill sets. For each skill/category, provide a list of "Quick-Fire Questions" and "Summarised Short Answers".
    3. **Section 4 (High-Impact):** Provide detailed, structured answers for the most critical/complex questions.
    4. **Structure:** Follow the JSON schema exactly.

    Output JSON Schema:
    {
      "meta": { "role": "Extracted Role Title", "generatedAt": "Date" },
      "sections": [
        { 
          "id": "context", 
          "title": "1. Role Context (The 'Hidden' Job)", 
          "content": [
            { "type": "guide", "title": "The Core Challenge", "text": "Analyze the hidden requirements. What is the *real* problem they are hiring you to solve?" }
          ] 
        },
        { 
          "id": "positioning", 
          "title": "2. How to Position Yourself", 
          "content": [
            { "type": "list", "title": "3 Key Strengths to Highlight", "items": ["Strength 1 (linked to JD)", "Strength 2", "Strength 3"] }
          ] 
        },
        { 
          "id": "competency_drill", 
          "title": "${section3Label}", 
          "content": [
            { 
              "type": "stack_group", 
              "stackName": "A. Primary Domain / Technical Focus", 
              "description": "Summary of core skills required (e.g., Architecture patterns, Clinical procedures).",
              "questions": [
                { "question": "Quick Question 1?", "answerPoints": ["Short, punchy answer point 1", "Short answer point 2"] },
                { "question": "Quick Question 2?", "answerPoints": ["..."] },
                { "question": "Quick Question 3?", "answerPoints": ["..."] }
              ]
            },
            { 
              "type": "stack_group", 
              "stackName": "B. Process / Operational / Data Flow", 
              "description": "Summary of operational/process knowledge required.",
              "questions": [
                { "question": "Quick Question 1?", "answerPoints": ["..."] },
                { "question": "Quick Question 2?", "answerPoints": ["..."] }
              ]
            },
             { 
              "type": "stack_group", 
              "stackName": "C. Leadership / Governance / Quality", 
              "description": "Summary of leadership or quality assurance expectations.",
              "questions": [
                { "question": "Quick Question 1?", "answerPoints": ["..."] },
                { "question": "Quick Question 2?", "answerPoints": ["..."] }
              ]
            }
          ] 
        },
        { 
          "id": "high_impact", 
          "title": "4. Suggested High-Impact Answers", 
          "content": [
             { 
              "type": "qa", 
              "question": "The 'Killer' Question for this Role?", 
              "goodAnswer": "**The Gold Standard Approach:**\\n1. Framework...\\n2. Action...\\n3. Result...", 
              "badAnswer": "Generic response." 
            },
            { 
              "type": "qa", 
              "question": "Complex Scenario / Crisis Question?", 
              "goodAnswer": "**Step 1:** Triage...\\n**Step 2:** Communicate...\\n**Step 3:** Resolve...", 
              "badAnswer": "Panic/Blame." 
            }
          ] 
        },
        { 
          "id": "questions_to_ask", 
          "title": "5. Questions You Should Ask", 
          "content": [{ "type": "list", "items": ["Strategic Q1", "Strategic Q2", "Strategic Q3"] }] 
        },
        { 
          "id": "closing", 
          "title": "6. Final Key Messages", 
          "content": [{ "type": "guide", "text": "Final strategic advice..." }] 
        }
      ]
    }
  `;

  return fetchGemini(systemPrompt, userPrompt);
};

const callRefinementAPI = async (originalContext, refineQuery) => {
  if (!apiKey) throw new Error("Missing API Key.");

  const systemPrompt = `
    You are a strict Interview Coach. The candidate wants to REFINE their prep.
    CONTEXT: Role: ${originalContext.meta.role}
    USER REQUEST: "${refineQuery}"
    INSTRUCTIONS: Generate a NEW section. Use 'qa' format for questions. Output valid JSON.
    Output JSON Schema: { "title": "Title", "content": [ { "type": "qa", "question": "...", "goodAnswer": "...", "badAnswer": "..." } ] }
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
    const rawText = data.candidates[0].content.parts[0].text;
    
    try {
      const cleanedText = cleanJsonText(rawText);
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.log("Raw AI Text:", rawText);
      throw new Error("Failed to parse AI response. Please try again.");
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

// --- Components ---

const MarkdownText = ({ text }) => {
  if (!text) return null;
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-sm">
      {text.split('\n').map((line, i) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={i} className={line.trim().startsWith('-') ? 'ml-4' : ''}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};

const SectionCard = ({ title, icon: Icon, active, onClick, isRefinement }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-start gap-3 group print:hidden
      ${active 
        ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' 
        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-100 hover:border-indigo-200'
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
      <Icon size={16} className="text-indigo-500" />
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none ${height} text-sm`}
    />
  </div>
);

const OutputContent = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 italic p-4">Select a section to view content.</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {data.map((item, idx) => {
        const hasContent = item.text || item.points || item.questions || item.items || item.goodAnswerPoints || item.goodAnswer || item.question || item.stackName || item.answer || item.title || item.heading;
        if (!hasContent) return null;

        const isStackGroup = item.type === 'stack_group' || (item.stackName && item.questions);
        const isQA = item.type === 'qa' || (item.question && (item.goodAnswer || item.badAnswer));
        const isList = item.type === 'list' || item.items;
        const isGuide = item.type === 'guide' || item.points || item.text;
        const isScript = item.type === 'script';
        const isGeneric = !isStackGroup && !isQA && !isList && !isGuide && !isScript;

        return (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 print:shadow-none print:border-none print:p-0">
            
            {/* Group Header (e.g. Architecture Thinking) */}
            {isStackGroup && (
               <div className="border-b border-gray-100 pb-2 mb-4">
                  <h3 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                    <Layers size={20} /> {item.stackName}
                  </h3>
                  {item.description && <p className="text-gray-600 text-sm mt-1 italic">{item.description}</p>}
               </div>
            )}

            {/* Standard Titles */}
            {(item.title || item.heading) && (
              <h3 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
                {isGuide && <BookOpen size={18} className="text-purple-500" />}
                {isScript && <MessageSquare size={18} className="text-green-500" />}
                {isList && <Target size={18} className="text-orange-500" />}
                {item.title || item.heading}
              </h3>
            )}

            {/* Script / Text Block */}
            {isScript && item.text && (
               <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500 italic text-gray-700">
                  <MarkdownText text={item.text} />
               </div>
            )}

            {/* Generic Text Block */}
            {isGeneric && item.text && <div className="text-gray-700 leading-relaxed"><MarkdownText text={item.text} /></div>}
            
            {/* Bullet Points (Guide) */}
            {isGuide && item.points && (
              <ul className="space-y-2">
                {item.points.map((pt, i) => (
                  <li key={i} className="flex gap-2 text-gray-700 text-sm">
                    <span className="text-indigo-500 mt-1 flex-shrink-0">•</span>
                    <MarkdownText text={pt} />
                  </li>
                ))}
              </ul>
            )}

            {isGuide && item.text && <div className="text-gray-700 leading-relaxed"><MarkdownText text={item.text} /></div>}

            {/* Lists */}
            {isList && item.items && (
              <ul className="space-y-3">
                {item.items.map((pt, i) => (
                  <li key={i} className="flex gap-3 text-gray-700 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-orange-500 font-bold">?</span>
                    <MarkdownText text={pt} />
                  </li>
                ))}
              </ul>
            )}

            {/* Stack Group Questions (Section 3 Style) */}
            {isStackGroup && item.questions && (
              <div className="space-y-4">
                {item.questions.map((q, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-bold text-gray-800 mb-2">{q.question}</p>
                    <ul className="ml-4 space-y-1">
                      {(q.answerPoints || []).map((ans, j) => (
                        <li key={j} className="text-sm text-gray-600 list-disc"><MarkdownText text={ans} /></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* High Impact QA View (Section 4 Style) */}
            {isQA && (
              <div>
                <div className="mb-4">
                   <h4 className="font-bold text-gray-900 text-lg">{item.question}</h4>
                   {item.insight && <p className="text-sm text-gray-500 mt-1 italic">{item.insight}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 print:block print:space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 print:border-green-200">
                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2 text-sm">
                      <CheckCircle size={16} /> Good Approach
                    </div>
                    <div className="text-sm text-green-800 mt-1">
                      <MarkdownText text={item.goodAnswer} />
                    </div>
                  </div>
                  
                  {(item.badAnswer || item.badAnswerPoints) && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 print:border-red-200">
                      <div className="flex items-center gap-2 text-red-700 font-semibold mb-2 text-sm">
                        <AlertCircle size={16} /> Bad Approach
                      </div>
                      <div className="text-sm text-red-800 mt-1">
                        <MarkdownText text={item.badAnswer} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Universal Fallback */}
            {isGeneric && (
                <div className="bg-gray-50 p-4 rounded-lg mt-2 border border-gray-200">
                    {Object.entries(item).map(([key, val], k) => {
                        if (['type', 'id'].includes(key)) return null;
                        if (typeof val === 'string') return <div key={k} className="text-sm text-gray-700 mb-1"><MarkdownText text={val} /></div>;
                        return null;
                    })}
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
  const [activeTab, setActiveTab] = useState('context');
  const [generatedData, setGeneratedData] = useState(null);
  const [refineQuery, setRefineQuery] = useState('');
  const [industry, setIndustry] = useState('Tech');
  
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
      const result = await callGeminiAPI({ jd, resume, company, notes, industry });
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

  const IndustryCard = ({ name, icon: Icon, selected, onClick }) => (
    <button 
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-3
        ${selected 
          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm' 
          : 'border-gray-100 bg-white text-gray-500 hover:border-indigo-200 hover:bg-gray-50'
        }`}
    >
      <div className={`p-2 rounded-lg w-fit ${selected ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
        <Icon size={24} />
      </div>
      <span className="font-semibold">{name}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 print:bg-white">
      
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
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Briefcase size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">PrepMaster <span className="text-indigo-600">Pro</span></h1>
          </div>
          {step === 2 && (
             <button 
               onClick={() => setStep(1)}
               className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
             >
               Start New Prep
             </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Ultimate Interview Strategy</h2>
              <p className="text-gray-500">Select your industry for tailored, executive-level preparation.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <IndustryCard name="Tech" icon={Cpu} selected={industry === 'Tech'} onClick={() => setIndustry('Tech')} />
              <IndustryCard name="Hospitality" icon={Coffee} selected={industry === 'Hospitality'} onClick={() => setIndustry('Hospitality')} />
              <IndustryCard name="Healthcare" icon={Stethoscope} selected={industry === 'Healthcare'} onClick={() => setIndustry('Healthcare')} />
              <IndustryCard name="Corporate" icon={TrendingUp} selected={industry === 'Corporate'} onClick={() => setIndustry('Corporate')} />
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
              <InputArea label="Job Description (Required)" icon={FileText} value={jd} onChange={setJd} placeholder={`Paste the ${industry} JD here...`} height="h-48" />
              <div className="grid md:grid-cols-2 gap-6">
                <InputArea label="Your Resume (Text)" icon={User} value={resume} onChange={setResume} placeholder="Paste resume text..." />
                <InputArea label="Company Info / Values" icon={Building} value={company} onChange={setCompany} placeholder="Key values..." />
              </div>
              <InputArea label="Transcript / Notes / Context (Optional)" icon={BookOpen} value={notes} onChange={setNotes} placeholder="Paste interview transcripts, raw notes, or specific context..." height="h-24" />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} />{error}
                </div>
              )}

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2
                  ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01]'}`}
              >
                {loading ? <><Loader2 size={20} className="animate-spin" /> Generating Strategy...</> : <><Send size={20} /> Generate Strategy</>}
              </button>
            </div>
          </div>
        )}

        {step === 2 && generatedData && (
          <div className="grid lg:grid-cols-12 gap-8 animate-slideUp print-full-width">
            
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-4 sidebar print:hidden">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-2">
                <h3 className="text-indigo-900 font-bold text-lg mb-1">{generatedData.meta.role}</h3>
                <p className="text-indigo-600 text-sm">{industry} Strategy Guide</p>
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
                    placeholder="e.g. 'More detailed answers'..."
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
                      section.id === 'context' ? BookOpen : 
                      section.id === 'positioning' ? Star :
                      section.id === 'competency_drill' ? Shield : 
                      section.id === 'high_impact' ? Zap : 
                      section.id === 'culture' ? Users :
                      section.id === 'questions_to_ask' ? HelpCircle :
                      section.isRefinement ? Sparkles : Layers
                    }
                    active={activeTab === section.id}
                    onClick={() => setActiveTab(section.id)}
                  />
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button onClick={handlePrint} className="w-full py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                  <Download size={18} /> Export PDF
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8 main-content">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col print:border-none print:shadow-none">
                
                <div className="p-6 border-b border-gray-100 flex items-center gap-3 print-hidden">
                  <div className={`p-2 rounded-lg ${generatedData.sections.find(s => s.id === activeTab)?.isRefinement ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {generatedData.sections.find(s => s.id === activeTab)?.isRefinement ? <Sparkles size={24} /> : <Layers size={24} />}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {generatedData.sections.find(s => s.id === activeTab)?.title}
                  </h2>
                </div>

                <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-4">
                   <h1 className="text-3xl font-bold text-gray-900 mb-2">{generatedData.meta.role}</h1>
                   <p className="text-gray-500">Universal Strategy Guide • {generatedData.meta.generatedAt}</p>
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