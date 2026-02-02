import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';
import adminService from '../../services/adminService';

/**
 * AdminSpeakingQuestions - CRUD Speaking Questions Management
 */
function AdminSpeakingQuestions() {
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    topic_id: '',
    part: 'free',
    question: '',
    keywords: '',
    difficulty: 'medium',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, tRes] = await Promise.all([
        adminService.getSpeakingQuestions(),
        adminService.getTopics(),
      ]);
      setQuestions(qRes.data.data || qRes.data);
      setTopics(tRes.data.data || tRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        keywords: formData.keywords.split(',').map((k) => k.trim()),
      };
      if (editingId) {
        await adminService.updateSpeakingQuestion(editingId, payload);
        alert('Question updated successfully');
      } else {
        await adminService.createSpeakingQuestion(payload);
        alert('Question created successfully');
      }
      handleCancel();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question');
    }
  };

  const handleEdit = (question) => {
    setFormData({
      topic_id: question.topic_id,
      part: question.part,
      question: question.question,
      keywords: Array.isArray(question.keywords) ? question.keywords.join(', ') : '',
      difficulty: question.difficulty,
      is_active: question.is_active,
    });
    setEditingId(question._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await adminService.deleteSpeakingQuestion(id);
      alert('Question deleted successfully');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      topic_id: '',
      part: 'free',
      question: '',
      keywords: '',
      difficulty: 'medium',
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Speaking Questions Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FiPlus size={20} />
          New Question
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Question' : 'Create New Question'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Topic *</label>
                <select
                  name="topic_id"
                  value={formData.topic_id}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a topic</option>
                  {topics.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Part *</label>
                <select
                  name="part"
                  value={formData.part}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="free">Free</option>
                  <option value="1">Part 1</option>
                  <option value="2">Part 2</option>
                  <option value="3">Part 3</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Question *</label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleFormChange}
                required
                rows="3"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                placeholder="Enter the question..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., interest, experience, hobby"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty *</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleFormChange}
                className="w-4 h-4 rounded border-gray-600 text-indigo-600 cursor-pointer"
              />
              <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                Active
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No questions found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Question</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Difficulty</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-750 transition">
                    <td className="px-6 py-4 text-sm max-w-xs truncate">{q.question}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          q.difficulty === 'easy'
                            ? 'bg-green-900/30 text-green-300'
                            : q.difficulty === 'medium'
                            ? 'bg-yellow-900/30 text-yellow-300'
                            : 'bg-red-900/30 text-red-300'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          q.is_active
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {q.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => handleEdit(q)}
                        className="p-2 hover:bg-gray-700 rounded transition text-blue-400"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="p-2 hover:bg-gray-700 rounded transition text-red-400"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSpeakingQuestions;
