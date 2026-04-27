import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { insuranceAPI, AddInsuranceData } from '../services/api';

interface CompanyInsurance {
  company_name: string;
  insurance_available: string[];
}

const Setup: React.FC = () => {
  const [availableCompanies, setAvailableCompanies] = useState<CompanyInsurance[]>([]);
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableInsurances();
  }, []);

  const fetchAvailableInsurances = async () => {
    try {
      const response = await insuranceAPI.getAvailable();
      setAvailableCompanies(response.insurance_available);
    } catch (err: any) {
      setError('Failed to load available insurances');
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceSelect = (insuranceName: string) => {
    setSelectedInsurances(prev =>
      prev.includes(insuranceName)
        ? prev.filter(name => name !== insuranceName)
        : [...prev, insuranceName]
    );
  };

  const handleConfirm = async () => {
    if (selectedInsurances.length === 0) {
      navigate('/add-insurance');
      return;
    }

    setSubmitting(true);
    try {
      // Add each selected insurance
      for (const insuranceName of selectedInsurances) {
        const data: AddInsuranceData = {
          insurance_name: insuranceName,
          insurance_date: new Date().toISOString().split('T')[0], // Today's date
        };
        await insuranceAPI.addObtained(data);
      }
      navigate('/add-insurance');
    } catch (err: any) {
      setError('Failed to add insurances');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/add-insurance');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading available insurances...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Select Your Insurance Policies
          </h1>
          <p className="text-gray-600">
            Choose the insurance policies you already have from the companies below
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {availableCompanies.map((company, index) => (
            <div
              key={index}
              className="border rounded-lg p-6 bg-white shadow-sm"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                {company.company_name}
              </h3>
              <div className="space-y-3">
                {company.insurance_available.map((insurance, insuranceIndex) => (
                  <div key={insuranceIndex} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${company.company_name}-${insurance}`}
                      checked={selectedInsurances.includes(insurance)}
                      onChange={() => handleInsuranceSelect(insurance)}
                      className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`${company.company_name}-${insurance}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {insurance.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Adding Policies...' : selectedInsurances.length === 0 ? 'Continue' : `Add ${selectedInsurances.length} Selected Polic${selectedInsurances.length === 1 ? 'y' : 'ies'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;