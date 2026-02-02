import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';
import adminService from '../../services/adminService';

/**
 * AdminTopics - Simplified version for testing
 */
function AdminTopicsSimple() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await adminService.getTopics();
      console.log('Topics response:', res.data);
      setTopics(res.data.data || res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(err.response?.data?.message || 'Failed to fetch topics');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Admin Topics (Simple)</h2>
      
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 mb-4">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-4">
        {topics.length === 0 ? (
          <p className="text-gray-400">No topics found</p>
        ) : (
          <ul className="space-y-2">
            {topics.map((topic) => (
              <li key={topic._id} className="text-white p-2 bg-gray-700 rounded">
                {topic.name} - Level: {topic.level} - Active: {topic.is_active ? 'Yes' : 'No'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminTopicsSimple;
