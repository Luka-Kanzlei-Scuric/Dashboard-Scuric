import React, { useState, useEffect } from 'react';

const Settings = () => {
    const [settings, setSettings] = useState({
        notifications: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // For now, we'll use a hardcoded userId. In a real app, this would come from authentication
                const userId = 'default-user';
                const response = await fetch(`/api/settings/${userId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch settings');
                }
                const data = await response.json();
                setSettings(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching settings:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // For now, we'll use a hardcoded userId. In a real app, this would come from authentication
            const userId = 'default-user';
            const response = await fetch(`/api/settings/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
            const updatedSettings = await response.json();
            setSettings(updatedSettings);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

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
        <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Notifications</label>
                            <p className="text-sm text-gray-500">Receive notifications about form updates</p>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="notifications"
                                checked={settings.notifications}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Dark Mode</label>
                            <p className="text-sm text-gray-500">Enable dark mode for the dashboard</p>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="darkMode"
                                checked={settings.darkMode}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Language</label>
                        <select
                            name="language"
                            value={settings.language}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="en">English</option>
                            <option value="de">German</option>
                            <option value="fr">French</option>
                            <option value="es">Spanish</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Timezone</label>
                        <select
                            name="timezone"
                            value={settings.timezone}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="UTC">UTC</option>
                            <option value="CET">Central European Time</option>
                            <option value="EST">Eastern Standard Time</option>
                            <option value="PST">Pacific Standard Time</option>
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                saving ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings; 