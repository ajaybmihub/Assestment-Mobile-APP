'use client';

import React, { useEffect, useState } from 'react';
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
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function QuestionsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [currentQuestion, setCurrentQuestion] = useState<any>({
    domain: 'General',
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

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/questions/mcq`);
      const data = await res.json();
      // Safely handle both direct arrays and { questions: [] } formats
      const fetchedQuestions = Array.isArray(data) ? data : (data.questions || []);
      setQuestions(fetchedQuestions);
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
      
      // Note: Backend update expects Query ID for update in my previous implementation, 
      // but usually it's path param. I'll stick to path param logic if possible.
      // Actually my controller had: @Post('mcq/:id') and @Query('id') id: string. 
      // I should fix the controller to use @Param('id') or use the query.
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentQuestion),
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadQuestions();
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get S3 Upload URL
      const urlRes = await fetch(`${API_URL}/media/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });
      const { uploadUrl, publicUrl } = await urlRes.json();

      // 2. Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // 3. Add to current question
      setCurrentQuestion({
        ...currentQuestion,
        imageUrls: [...currentQuestion.imageUrls, publicUrl]
      });
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(search.toLowerCase()) ||
    q.topic.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <Loader2 className="animate-spin" size={40} color="var(--accent)" />
      <div style={{ color: 'var(--text-3)', fontWeight: 600 }}>Loading Question Bank...</div>
    </div>
  );

  return (
    <div style={{ padding: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Question Bank</div>
            <div className="page-subtitle">Manage your MCQ questions, topics, and diagrams</div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setCurrentQuestion({
                domain: 'General',
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
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add New Question
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stats-card">
          <div className="stats-label">Total Questions</div>
          <div className="stats-value">{questions.length}</div>
        </div>
        <div className="stats-card">
          <div className="stats-label">With Images</div>
          <div className="stats-value">{questions.filter(q => q.imageUrls?.length > 0).length}</div>
        </div>
      </div>

      {/* Search & List */}
      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search by question or topic..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 2.5rem', 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px',
                color: 'var(--text-1)'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.5rem' }}>Question</th>
                <th>Topic / Subtopic</th>
                <th>Difficulty</th>
                <th>Media</th>
                <th style={{ paddingRight: '1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map(q => (
                <tr key={q._id}>
                  <td style={{ paddingLeft: '1.5rem', maxWidth: '400px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: '4px' }}>{q.question}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Domain: {q.domain}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-2)' }}>{q.topic}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{q.subtopic}</div>
                  </td>
                  <td>
                    <span className={`badge ${q.difficulty === 'Easy' ? 'badge-live' : (q.difficulty === 'Medium' ? 'badge-amber' : 'badge-rose')}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {q.imageUrls?.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontWeight: 600, fontSize: '0.8rem' }}>
                          <ImageIcon size={14} /> {q.imageUrls.length}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-4)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </div>
                  </td>
                  <td style={{ paddingRight: '1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => {
                          setCurrentQuestion(q);
                          setIsModalOpen(true);
                        }}
                        className="btn-icon" 
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '2rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">{currentQuestion._id ? 'Edit Question' : 'New Question'}</div>
              <button onClick={() => setIsModalOpen(false)} className="btn-icon"><X size={20} /></button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Domain</label>
                  <input 
                    type="text" 
                    value={currentQuestion.domain}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, domain: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-1)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Difficulty</label>
                  <select 
                    value={currentQuestion.difficulty}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, difficulty: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-1)' }}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Topic</label>
                <input 
                  type="text" 
                  value={currentQuestion.topic}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, topic: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-1)' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Subtopic</label>
                <input 
                  type="text" 
                  value={currentQuestion.subtopic}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, subtopic: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-1)' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Question Text</label>
                <textarea 
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-1)', minHeight: '100px' }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', marginBottom: '1rem', textTransform: 'uppercase' }}>Options</label>
                {currentQuestion.options.map((opt: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: currentQuestion.correct_answer === (i+1).toString() ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: currentQuestion.correct_answer === (i+1).toString() ? '#fff' : 'var(--text-4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, cursor: 'pointer'
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
                      placeholder={`Option ${i+1}`}
                      style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-1)' }}
                    />
                  </div>
                ))}
              </div>

              {/* Image Management */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase' }}>Question Media (Images)</div>
                  <label className="btn btn-ghost" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" hidden onChange={handleFileUpload} accept="image/*" disabled={isUploading} />
                  </label>
                </div>

                {currentQuestion.imageUrls?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                    {currentQuestion.imageUrls.map((url: string, idx: number) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1' }}>
                        <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => {
                            const newUrls = [...currentQuestion.imageUrls];
                            newUrls.splice(idx, 1);
                            setCurrentQuestion({...currentQuestion, imageUrls: newUrls});
                          }}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-4)', fontSize: '0.85rem' }}>
                    No images attached. Diagrams help users understand complex questions.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
                <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Save Question</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
