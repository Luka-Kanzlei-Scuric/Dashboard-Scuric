import React from 'react';
import PropTypes from 'prop-types';

const FormCard = ({ form }) => {
    return (
        <div className="bg-white border rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{form.leadName}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    form.phase === 'Completed' ? 'bg-green-100 text-green-800' :
                    form.phase === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {form.phase}
                </span>
            </div>
            
            <div className="space-y-2">
                {form.email && (
                    <p className="text-gray-600">
                        <span className="font-medium">Email:</span> {form.email}
                    </p>
                )}
                {form.phone && (
                    <p className="text-gray-600">
                        <span className="font-medium">Phone:</span> {form.phone}
                    </p>
                )}
                {form.address && (
                    <p className="text-gray-600">
                        <span className="font-medium">Address:</span> {form.address}
                    </p>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                    {form.updatedAt && (
                        <span>Updated: {new Date(form.updatedAt).toLocaleDateString()}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

FormCard.propTypes = {
    form: PropTypes.shape({
        leadName: PropTypes.string.isRequired,
        phase: PropTypes.string.isRequired,
        email: PropTypes.string,
        phone: PropTypes.string,
        address: PropTypes.string,
        createdAt: PropTypes.string.isRequired,
        updatedAt: PropTypes.string
    }).isRequired
};

export default FormCard; 