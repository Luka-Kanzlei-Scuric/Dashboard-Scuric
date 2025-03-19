import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Settings from './components/Settings';
import Forms from './components/Forms';
import Dashboard from './components/Dashboard';

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/forms" element={<Forms />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>
        </div>
    );
}

export default App; 