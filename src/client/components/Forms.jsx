import React, { useState, useEffect } from 'react';
import FormCard from './FormCard';

const Forms = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await fetch('/api/forms');
                if (!response.ok) {
                    throw new Error('Failed to fetch forms');
                }
                const data = await response.json();
                setForms(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching forms:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchForms();
    }, []);

    const filteredForms = forms.filter(form => {
        const matchesFilter = filter === 'all' || form.phase === filter;
        const matchesSearch = form.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            form.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            form.phone?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Forms</h2>
                    <div className="flex space-x-4">
                        <input
                            type="text"
                            placeholder="Search forms..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="all">All Phases</option>
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {filteredForms.map(form => (
                            <li key={form.taskId}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    form.phase === 'Completed' ? 'bg-green-100 text-green-800' :
                                                    form.phase === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {form.phase}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-medium text-gray-900">{form.leadName}</h3>
                                                <div className="mt-1 text-sm text-gray-500">
                                                    {form.email && <p>Email: {form.email}</p>}
                                                    {form.phone && <p>Phone: {form.phone}</p>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Created: {new Date(form.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {filteredForms.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No forms found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Forms; 