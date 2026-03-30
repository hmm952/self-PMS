import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useProject } from '../context/ProjectContext.jsx';
import { 
  BookOpen, Send, RefreshCw, FileText, MessageSquare, 
  Database, Clock, User, Trash2
} from 'lucide-react';

export default function KnowledgePage() {
  const { projectId } = useProject();
  const [activeTab, setActiveTab] = useState('qa');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // RAG问答状态
  const [question, setQuestion] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [answer, setAnswer] = useState(null);
  const [answering, setAnswering] = useState(false);
  const [qaHistory, setQaHistory] = useState([]);

  // 知识库文档状态
  const [documents, setDocuments] = useState([]);
  const [docPagination, setDocPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    loadProjects();
    if (activeTab === 'documents') {
      loadDocuments();
    } else if (activeTab === 'history') {
      loadQaHistory();
    }
  }, [activeTab, projectId]);

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data.data || res.data);
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: docPagination.page,
        pageSize: docPagination.pageSize,
      });
      if (projectId) {
        params.append('project_id', projectId);
      }
      const res = await api.get(`/api/knowledge/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data.data);
      setDocPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (error) {
      console.error('加载知识库文档失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQaHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (projectId) {
        params.append('project_id', projectId);
      }
      const res = await api.get(`/api/knowledge/qa-history?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQaHistory(res.data.data);
    } catch (error) {
      console.error('加载问答历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || answering) return;

    setAnswering(true);
    setAnswer(null);

    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/knowledge/qa', {
        question: question.trim(),
        project_id: selectedProject || projectId || null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnswer({
        question: question.trim(),
        answer: res.data.answer,
        sources: res.data.sources,
        confidence: res.data.confidence,
      });
      setQuestion('');
    } catch (error) {
      console.error('问答失败:', error);
      setAnswer({
        question: question.trim(),
        answer: '抱歉，问答服务暂时不可用，请稍后重试。',
        sources: [],
        confidence: 'low',
        error: true,
      });
    } finally {
      setAnswering(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm('确定要删除这个文档吗？')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/knowledge/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDocuments();
    } catch (error) {
      console.error('删除文档失败:', error);
      alert('删除失败');
    }
  };

  const getDocTypeLabel = (type) => {
    const labels = {
      meeting: '会议纪要',
      review: '评审记录',
      contract: '合同文档',
      spec: '需求规格',
      other: '其他',
    };
    return labels[type] || type;
  };

  const getEmbeddingStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '待处理', className: 'bg-slate-100 text-slate-700' },
      embedded: { label: '已索引', className: 'bg-green-100 text-green-700' },
      failed: { label: '索引失败', className: 'bg-red-100 text-red-700' },
    };
    const config = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">知识库与RAG问答</h1>
          <p className="text-slate-500 mt-1">
            基于会议纪要、评审记录等项目知识进行智能问答
          </p>
        </div>
      </div>

      {/* 功能标签页 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('qa')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
            activeTab === 'qa' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          智能问答
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
            activeTab === 'documents' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          知识库文档
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
            activeTab === 'history' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          问答历史
        </button>
      </div>

      {/* 智能问答 */}
      {activeTab === 'qa' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 问答输入区 */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="font-semibold mb-4">提出问题</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">关联项目（可选）</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">全部项目</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">问题</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder="输入您的问题，例如：上次评审会议确定了哪些待办事项？"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={answering || !question.trim()}
                    className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {answering ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-sm text-slate-500">
                <p>示例问题：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>项目当前有哪些未解决的风险？</li>
                  <li>上次决策会议做出了什么决定？</li>
                  <li>张三的待办事项有哪些？</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 答案展示区 */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="font-semibold mb-4">AI 回答</h3>
            {answer ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="font-medium mb-1 text-sm text-slate-500">问题</p>
                  <p className="text-sm">{answer.question}</p>
                </div>
                
                <div className={`rounded-lg p-4 ${answer.error ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className="font-medium mb-2 text-sm">回答</p>
                  <p className="text-sm whitespace-pre-wrap">{answer.answer}</p>
                </div>

                {answer.sources && answer.sources.length > 0 && (
                  <div>
                    <p className="font-medium mb-2 text-sm">参考来源</p>
                    <div className="space-y-2">
                      {answer.sources.map((source, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm bg-slate-50 rounded p-2">
                          <FileText className="w-4 h-4 mt-0.5 text-slate-400" />
                          <div>
                            <p className="font-medium">{source.title}</p>
                            <p className="text-slate-500 text-xs">{source.snippet}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${answer.confidence === 'high' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    置信度: {answer.confidence === 'high' ? '高' : '低'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <BookOpen className="w-12 h-12 mb-4" />
                <p>输入问题开始问答</p>
                <p className="text-sm mt-1">AI将基于知识库内容为您解答</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 知识库文档 */}
      {activeTab === 'documents' && (
        <div className="rounded-lg border bg-white">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-semibold">知识库文档列表</h3>
            <span className="text-sm text-slate-500">共 {docPagination.total} 个文档</span>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Database className="w-12 h-12 mb-4" />
                <p>知识库暂无文档</p>
                <p className="text-sm mt-1">会议纪要解析后可归档到知识库</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <h4 className="font-medium">{doc.title}</h4>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium">{getDocTypeLabel(doc.doc_type)}</span>
                        {getEmbeddingStatusBadge(doc.embedding_status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {doc.project_name && <span>项目: {doc.project_name}</span>}
                        <span>片段数: {doc.chunk_count}</span>
                        <span>创建时间: {new Date(doc.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 问答历史 */}
      {activeTab === 'history' && (
        <div className="rounded-lg border bg-white">
          <div className="p-6 border-b">
            <h3 className="font-semibold">问答历史记录</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : qaHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Clock className="w-12 h-12 mb-4" />
                <p>暂无问答历史</p>
              </div>
            ) : (
              <div className="space-y-4">
                {qaHistory.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.question}</p>
                        <p className="text-sm text-slate-500 mt-1">{item.answer}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          {item.project_name && <span>项目: {item.project_name}</span>}
                          {item.user_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.user_name}
                            </span>
                          )}
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
