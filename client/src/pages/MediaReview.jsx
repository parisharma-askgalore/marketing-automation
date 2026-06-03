import React, { useState } from 'react';

export default function MediaReview() {
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' or 'seed'

  // Analyze State
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // Seed State
  const [project, setProject] = useState('');
  const [seedMediaType, setSeedMediaType] = useState('image');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const API_BASE = 'http://localhost:8000/api/review';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (e.target.files[0].type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType('image');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Analysis request failed');
      }
      
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSeed = async () => {
    if (!feedbackInput.trim()) return;
    setIsSeeding(true);
    setSeedResult(null);
    setError(null);

    const feedbackLines = feedbackInput.split('\n').filter(line => line.trim().length > 0);

    try {
      const res = await fetch(`${API_BASE}/capture-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: project || 'Unknown Project',
          media_type: seedMediaType,
          feedback: feedbackLines
        }),
      });

      if (!res.ok) {
        throw new Error('Seed request failed');
      }

      const data = await res.json();
      setSeedResult(data);
      setFeedbackInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen text-gray-800 dark:text-gray-200">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Media Review Agent</h1>
        <p className="text-gray-500">Automated recurring issue detection for marketing creatives</p>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('analyze')}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${activeTab === 'analyze' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        >
          Analyze Media
        </button>
        <button 
          onClick={() => setActiveTab('seed')}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${activeTab === 'seed' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        >
          Seed Feedback Database
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-6">Upload Creative</h2>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange} 
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <span className="text-indigo-600 font-medium hover:text-indigo-500">Click to upload</span>
                <span className="text-sm text-gray-500 mt-2">MP4, JPG, PNG (Max 50MB)</span>
              </label>
            </div>
            
            {file && (
              <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded">
                    {mediaType === 'video' ? '🎥' : '🖼️'}
                  </div>
                  <span className="truncate font-medium">{file.name}</span>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className={`w-full mt-6 py-3 rounded-lg font-medium text-white transition-all ${!file || isAnalyzing ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Media...
                </span>
              ) : 'Run Analysis'}
            </button>
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-2xl font-semibold">Review Report</h2>
            </div>
            
            <div className="p-6 flex-grow overflow-y-auto">
              {!analysisResult ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p>Upload a file and run analysis to see the report</p>
                </div>
              ) : (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Recurring Issues */}
                  <div>
                    <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Recurring Issues Detected</h3>
                    {analysisResult.report.recurring_issues?.length > 0 ? (
                      <div className="space-y-3">
                        {analysisResult.report.recurring_issues.map((issue, idx) => (
                          <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 flex gap-4">
                            <div className="text-red-500 mt-1">🔴</div>
                            <div>
                              <p className="font-semibold text-red-800 dark:text-red-200">{issue.issue}</p>
                              <div className="flex gap-4 mt-2 text-sm text-red-600 dark:text-red-400">
                                <span>Confidence: {(issue.confidence_score * 100).toFixed(0)}%</span>
                                <span>Matches past reviews: {issue.historical_matches}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-300 font-medium">
                        ✨ No recurring issues detected!
                      </div>
                    )}
                  </div>

                  {/* Observations */}
                  <div>
                    <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Raw Observations</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto text-gray-600 dark:text-gray-300">
                      {JSON.stringify(analysisResult.observations, null, 2)}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seed' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-6">Seed Past Feedback</h2>
          <p className="text-gray-500 mb-6">Paste raw feedback from previous reviews. It will be converted into atomic rules and stored in the vector database to catch recurring mistakes.</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name (Optional)</label>
                <input 
                  type="text" 
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  placeholder="e.g. Holiday Creative 12"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Media Type</label>
                <select 
                  value={seedMediaType}
                  onChange={e => setSeedMediaType(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Raw Feedback (One per line)</label>
              <textarea 
                rows={6}
                value={feedbackInput}
                onChange={e => setFeedbackInput(e.target.value)}
                placeholder="CTA too close to bottom edge&#10;Avatar smile looks unnatural&#10;Logo appears too late"
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent resize-none font-mono text-sm"
              />
            </div>

            <button
              onClick={handleSeed}
              disabled={isSeeding || !feedbackInput.trim()}
              className={`w-full py-3 rounded-lg font-medium text-white transition-all ${isSeeding || !feedbackInput.trim() ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
            >
              {isSeeding ? 'Processing and Embedding...' : 'Save Feedback Rules'}
            </button>
          </div>

          {seedResult && (
            <div className="mt-8">
              <h3 className="font-bold text-green-600 mb-4">✓ Successfully saved {seedResult.rules.length} rules</h3>
              <div className="space-y-2">
                {seedResult.rules.map((rule, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                    <strong className="text-sm block text-indigo-600 dark:text-indigo-400">{rule.rule}</strong>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{rule.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
