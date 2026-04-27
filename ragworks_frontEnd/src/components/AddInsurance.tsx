import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { insuranceAPI } from '../services/api';

const AddInsurance: React.FC = () => {
  const [insuranceName, setInsuranceName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PDF, DOCX, PPTX, or TXT file');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insuranceName || !selectedFile) {
      setError('Please provide both insurance name and file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await insuranceAPI.addInsurance(insuranceName, selectedFile);
      setSuccess('Insurance document uploaded successfully!');
      setInsuranceName('');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload insurance document');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Add Insurance Document
          </h1>
          <p className="text-gray-600">
            Upload your insurance policy documents to get personalized recommendations
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="insuranceName" className="block text-sm font-medium text-gray-700">
                Insurance Policy Name
              </label>
              <input
                type="text"
                id="insuranceName"
                value={insuranceName}
                onChange={(e) => setInsuranceName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Health Shield Pro"
                required
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                Policy Document
              </label>
              <input
                type="file"
                id="file"
                accept=".pdf,.docx,.pptx,.txt"
                onChange={handleFileSelect}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Supported formats: PDF, DOCX, PPTX, TXT
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/chat')}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Continue to Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddInsurance;