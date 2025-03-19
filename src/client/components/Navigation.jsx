import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-xl font-bold text-gray-900">
                                Scuric
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                to="/"
                                className={`${
                                    isActive('/')
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/forms"
                                className={`${
                                    isActive('/forms')
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                Forms
                            </Link>
                            <Link
                                to="/settings"
                                className={`${
                                    isActive('/settings')
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation; 