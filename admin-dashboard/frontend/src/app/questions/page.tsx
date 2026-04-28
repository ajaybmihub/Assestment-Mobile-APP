'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  Edit3, 
  Loader2, 
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  MoreVertical,
  AlertCircle
} from 'lucide-react';

export default function QuestionsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  // Data State
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalBank, setTotalBank] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Filters State
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic] = useState('');
  const [domain, setDomain] = useState('');
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [currentQuestion, setCurrentQuestion] = useState<any>({
    domain: '',
    topic: '',
    subtopic: '',
    question: '',
    options: [
      { option: '1', value: '' },
      { option: '2', value: '' },
      { option: '3', value: '' },
      { option: '4', value: '' },
    ],
    correct_answer: '1',
    difficulty: 'Easy',
    imageUrls: [],
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
      loadQuestions();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const [hierarchy, setHierarchy] = useState<any[]>([]);
  
  const loadMetadata = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/questions/metadata`, { cache: 'no-store' });
      const data = await res.json();
      console.log('[DEBUG] Metadata Hierarchy:', data);
      if (data) setHierarchy(data);
    } catch (e) {
      console.error('Metadata load failed:', e);
    }
  }, [API_URL]);

  // Derived metadata based on selections
  const availableDomains = useMemo(() => hierarchy.map(h => h.domain).sort(), [hierarchy]);
  
  const availableTopics = useMemo(() => {
    const d = isModalOpen ? currentQuestion.domain : domain;
    const domainData = hierarchy.find(h => h.domain === d);
    return (domainData?.topics?.map((t: any) => t.topic) || []).sort();
  }, [hierarchy, domain, currentQuestion.domain, isModalOpen]);

  const availableSubtopics = useMemo(() => {
    const d = isModalOpen ? currentQuestion.domain : domain;
    const t = isModalOpen ? currentQuestion.topic : topic;
    const domainData = hierarchy.find(h => h.domain === d);
    const topicData = domainData?.topics?.find((top: any) => top.topic === t);
    return (topicData?.subtopics || []).sort();
  }, [hierarchy, domain, topic, currentQuestion.domain, currentQuestion.topic, isModalOpen]);

  // Reload on other filter changes
  useEffect(() => {
    loadQuestions();
  }, [page, difficulty, topic, domain]);

  // Load metadata for modal
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  async function loadQuestions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search.trim(),
        difficulty: difficulty === 'All Difficulty' ? '' : difficulty,
        topic,
        domain
      });

      const res = await fetch(`${API_URL}/questions/mcq?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setQuestions(data.questions || []);
        setTotal(data.total || 0);
        setTotalBank(data.totalBank || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (e) {
      console.error('Failed to load questions:', e);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      const url = currentQuestion._id 
        ? `${API_URL}/questions/mcq/${currentQuestion._id}` 
        : `${API_URL}/questions/mcq`;
      
      console.log(`[DEBUG] Saving question to: ${url}`);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentQuestion),
        mode: 'cors',
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadQuestions();
        loadMetadata(); 
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('[DEBUG] Save failed with status:', res.status, errorData);
        alert(`Save failed: ${res.statusText}`);
      }
    } catch (e) {
      console.error('Save failed:', e);
      alert('Network error: Could not connect to backend.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const res = await fetch(`${API_URL}/questions/mcq/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadQuestions();
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log(`Attempting upload to: ${API_URL}/media/upload`);
      const res = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();

      setCurrentQuestion({
        ...currentQuestion,
        imageUrls: [...currentQuestion.imageUrls, data.url]
      });
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Upload failed. Please check backend logs.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderPagination = () => {
    if (total === 0) return null;

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.25rem 1.5rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-elevated)'
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
          Showing <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{total > 0 ? (page - 1) * limit + 1 : 0}</span> to <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{Math.min(page * limit, total)}</span> of <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{total}</span> results
        </div>
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn-icon-sq ${page === 1 ? 'btn-disabled' : ''}`}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                if (pageNum <= 0 || pageNum > totalPages) return null;

                return (
                  <button 
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                      background: page === pageNum ? 'var(--accent)' : 'transparent',
                      color: page === pageNum ? 'white' : 'var(--text-3)',
                      fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button 
              className={`btn-icon-sq ${page === totalPages ? 'btn-disabled' : ''}`}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="main-content-fade" style={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header Section */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="breadcrumb">
              <Layers size={14} /> <span>Admin</span> <ChevronRight size={12} /> <span>Question Bank</span>
            </div>
            <h1 className="page-title">Question Repository</h1>
            <p className="page-subtitle">Manage MCQ assessments, technical topics, and visual diagrams</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setCurrentQuestion({
                domain: '',
                topic: '',
                subtopic: '',
                question: '',
                options: [
                  { option: '1', value: '' },
                  { option: '2', value: '' },
                  { option: '3', value: '' },
                  { option: '4', value: '' },
                ],
                correct_answer: '1',
                difficulty: 'Easy',
                imageUrls: [],
              });
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} /> <span>Create Question</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-icon icon-purple"><BookOpen size={20} /></div>
          <div>
            <div className="stat-label">Total Bank</div>
            <div className="stat-value">{totalBank}</div>
            <div className="stat-meta">Lifetime questions added</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue"><ImageIcon size={20} /></div>
          <div>
            <div className="stat-label">Rich Media</div>
            <div className="stat-value">{questions.filter(q => q.imageUrls?.length > 0).length}</div>
            <div className="stat-meta">Questions with diagrams (current page)</div>
          </div>
        </div>
      </div>

      {/* Filter & List Card */}
      <div className="card" style={{ marginBottom: '2rem', overflow: 'visible' }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Question Details Filter */}
            <div style={{ position: 'relative', flex: '1.5', minWidth: '280px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} size={18} />
              <input 
                type="text" 
                className="search-input"
                placeholder="Filter Question Details..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.75rem' }}
              />
            </div>

            {/* Classification Filter */}
            <select 
              className="search-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{ width: 'auto', paddingLeft: '1rem', minWidth: '160px' }}
            >
              <option value="">Filter Classification...</option>
              {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Level Filter */}
            <select 
              className="search-input" 
              style={{ width: 'auto', paddingLeft: '1rem', minWidth: '140px' }}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">Filter Level...</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Domain Filter */}
            <select 
              className="search-input"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setTopic(''); // Reset children on parent change
              }}
              style={{ width: 'auto', paddingLeft: '1rem', minWidth: '160px' }}
            >
              <option value="">Filter Domain...</option>
              {availableDomains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {(search || difficulty || topic || domain) && (
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setSearch('');
                  setDifficulty('');
                  setTopic('');
                  setDomain('');
                  setPage(1);
                }}
                style={{ color: 'var(--rose)' }}
                title="Clear All Filters"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Table Content - Removed internal scroll wrapper if possible, or made it only horizontal */}
        <div style={{ position: 'relative', overflow: 'visible' }}>
          {loading && (
            <div style={{ 
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
              backdropFilter: 'blur(2px)'
            }}>
              <div className="spinner"></div>
            </div>
          )}

          <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Question Details</th>
                <th style={{ width: '20%' }}>Classification</th>
                <th style={{ width: '15%' }}>Level</th>
                <th style={{ width: '10%' }}>Media</th>
                <th style={{ textAlign: 'right', width: '10%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length > 0 ? questions.map(q => (
                <tr key={q._id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ 
                        fontWeight: 600, color: 'var(--text-1)', fontSize: '0.9rem', lineHeight: '1.4',
                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                      }}>
                        {q.question}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                         <span style={{ fontSize: '0.72rem', color: 'var(--text-4)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                           ID: {q._id.slice(-6)}
                         </span>
                         {q.correct_answer && (
                           <span style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600 }}>
                             Ans: Option {q.correct_answer}
                           </span>
                         )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.topic}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subtopic || 'No subtopic'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${q.difficulty === 'Easy' ? 'badge-live' : (q.difficulty === 'Medium' ? 'badge-amber' : 'badge-rose')}`}>
                      <span className="badge-dot"></span>
                      {q.difficulty}
                    </span>
                  </td>
                  <td>
                    {q.imageUrls?.length > 0 ? (
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', 
                        padding: '4px 8px', background: 'var(--accent-subtle)', 
                        borderRadius: '6px', color: 'var(--accent)', width: 'fit-content'
                      }}>
                        <ImageIcon size={14} />
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{q.imageUrls.length}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-4)', fontSize: '0.75rem' }}>Text only</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => {
                          setCurrentQuestion(q);
                          setIsModalOpen(true);
                        }}
                        className="btn-icon-sq" 
                        title="Edit Question"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(q._id)}
                        className="btn-icon-sq" 
                        style={{ color: 'var(--rose)' }}
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : !loading && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-icon">📂</div>
                      <div className="empty-title">No questions found</div>
                      <div className="empty-sub">Adjust your filters or search terms to find what you're looking for.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Premium Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(30, 27, 75, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: '850px', maxHeight: '92vh', 
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ 
              padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--bg-elevated)'
            }}>
              <div>
                <div className="card-title" style={{ fontSize: '1.1rem' }}>
                  {currentQuestion._id ? 'Refine Question' : 'Draft New Question'}
                </div>
                <div className="card-subtitle">Configure assessment details and correct answers</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn-icon-sq" style={{ border: 'none', background: 'transparent' }}>
                <X size={22} />
              </button>
            </div>
            
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="progress-row">
                  <label className="stat-label">Domain</label>
                  <input 
                    type="text" 
                    className="search-input"
                    list="domains-list"
                    value={currentQuestion.domain}
                    onChange={(e) => setCurrentQuestion({
                      ...currentQuestion, 
                      domain: e.target.value,
                      topic: '', // Reset child
                      subtopic: '' // Reset child
                    })}
                    style={{ width: '100%', paddingLeft: '1rem' }}
                    placeholder="Select or type new domain"
                  />
                  <datalist id="domains-list">
                    {availableDomains.map(d => <option key={d} value={d}>{d}</option>)}
                  </datalist>
                </div>
                <div className="progress-row">
                  <label className="stat-label">Difficulty Level</label>
                  <select 
                    className="search-input"
                    value={currentQuestion.difficulty}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, difficulty: e.target.value})}
                    style={{ width: '100%', paddingLeft: '1rem' }}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="progress-row">
                  <label className="stat-label">Main Topic</label>
                  <input 
                    type="text" 
                    className="search-input"
                    list="topics-list"
                    value={currentQuestion.topic}
                    onChange={(e) => setCurrentQuestion({
                      ...currentQuestion, 
                      topic: e.target.value,
                      subtopic: '' // Reset child
                    })}
                    style={{ width: '100%', paddingLeft: '1rem' }}
                    placeholder="Select or type new topic"
                  />
                  <datalist id="topics-list">
                    {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                  </datalist>
                </div>
                <div className="progress-row">
                  <label className="stat-label">Subtopic (Optional)</label>
                  <input 
                    type="text" 
                    className="search-input"
                    list="subtopics-list"
                    value={currentQuestion.subtopic}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, subtopic: e.target.value})}
                    style={{ width: '100%', paddingLeft: '1rem' }}
                    placeholder="Select or type new subtopic"
                  />
                  <datalist id="subtopics-list">
                    {availableSubtopics.map(s => <option key={s} value={s}>{s}</option>)}
                  </datalist>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label className="stat-label">Question Stem</label>
                <textarea 
                  className="search-input"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                  style={{ width: '100%', padding: '1rem', minHeight: '120px', lineHeight: '1.6' }}
                  placeholder="Type the question content here..."
                />
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="stat-label">Multiple Choice Options</label>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>Select the circle to mark correct answer</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {currentQuestion.options.map((opt: any, i: number) => (
                    <div key={i} style={{ 
                      display: 'flex', gap: '0.75rem', alignItems: 'center', 
                      background: 'var(--bg-elevated)', padding: '0.75rem', 
                      borderRadius: '12px', border: currentQuestion.correct_answer === (i+1).toString() ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ 
                        width: '28px', height: '28px', borderRadius: '50%', 
                        background: currentQuestion.correct_answer === (i+1).toString() ? 'var(--accent)' : 'var(--border-strong)',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem'
                      }} onClick={() => setCurrentQuestion({...currentQuestion, correct_answer: (i+1).toString()})}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <input 
                        type="text" 
                        value={opt.value}
                        onChange={(e) => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[i].value = e.target.value;
                          setCurrentQuestion({...currentQuestion, options: newOpts});
                        }}
                        placeholder={`Choice ${i+1}`}
                        style={{ 
                          flex: 1, border: 'none', background: 'transparent', 
                          outline: 'none', color: 'var(--text-1)', fontSize: '0.875rem' 
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Media Section */}
              <div style={{ 
                marginBottom: '1rem', padding: '1.5rem', background: 'var(--bg-elevated)', 
                borderRadius: '16px', border: '2px dashed var(--border-strong)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={18} className="text-purple-500" />
                    <span className="stat-label" style={{ marginBottom: 0 }}>Visual Assets</span>
                  </div>
                  <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.75rem', borderRadius: '8px' }}>
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                    {isUploading ? 'Syncing...' : 'Add Diagram'}
                    <input type="file" hidden onChange={handleFileUpload} accept="image/*" disabled={isUploading} />
                  </label>
                </div>

                {currentQuestion.imageUrls?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                    {currentQuestion.imageUrls.map((url: string, idx: number) => (
                      <div key={idx} style={{ 
                        position: 'relative', borderRadius: '12px', overflow: 'hidden', 
                        border: '1px solid var(--border)', aspectRatio: '1',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => {
                            const newUrls = [...currentQuestion.imageUrls];
                            newUrls.splice(idx, 1);
                            setCurrentQuestion({...currentQuestion, imageUrls: newUrls});
                          }}
                          style={{ 
                            position: 'absolute', top: '6px', right: '6px', 
                            background: 'rgba(239, 68, 68, 0.9)', color: '#fff', 
                            border: 'none', borderRadius: '6px', padding: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-4)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    No visual diagrams attached to this question.
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              padding: '1.25rem 2rem', background: 'var(--bg-elevated)', 
              borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', 
              justifyContent: 'flex-end', alignItems: 'center'
            }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Discard</button>
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.7rem 2.5rem' }}>
                {currentQuestion._id ? 'Update Question' : 'Publish Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .main-content-fade {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-icon-sq {
           display: flex;
           align-items: center;
           justify-content: center;
           transition: all 0.2s;
        }
        .btn-icon-sq:hover {
          background: var(--bg-elevated);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
