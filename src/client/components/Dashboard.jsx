import React, { useState, useEffect } from 'react';
import FormCard from './FormCard';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalForms: 0,
        newForms: 0,
        inProgressForms: 0,
        completedForms: 0
    });
    const [recentForms, setRecentForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [formsResponse, statsResponse] = await Promise.all([
                    fetch('/api/forms'),
                    fetch('/api/stats')
                ]);

                if (!formsResponse.ok || !statsResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const formsData = await formsResponse.json();
                const statsData = await statsResponse.json();

                setStats(statsData);
                setRecentForms(formsData.slice(0, 6)); // Get the 6 most recent forms
                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Forms</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stats.totalForms}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">New Forms</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stats.newForms}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stats.inProgressForms}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{stats.completedForms}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Forms */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Forms</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentForms.map(form => (
                            <FormCard key={form.taskId} form={form} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 