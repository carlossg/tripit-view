import React, { useState, useCallback } from 'react';
import { Upload, FileJson } from 'lucide-react';

const FileUpload = ({ onDataLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFile = (file) => {
        if (!file) return;

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setError('Please upload a valid JSON file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                onDataLoaded(json);
            } catch (err) {
                setError('Error parsing JSON file. Please ensure it is valid.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const handleFileInput = (e) => {
        setError(null);
        const file = e.target.files[0];
        processFile(file);
    };

    return (
        <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '3rem' }}>
                <div style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                    <FileJson size={64} />
                </div>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }} className="text-gradient">TripIt Viewer</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Upload your <code style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>tripit.json</code> file to visualize your travel statistics.
                    <br /><span style={{ fontSize: '0.875rem' }}>Data stays in your browser.</span>
                </p>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)'}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: '3rem',
                        backgroundColor: isDragging ? 'var(--color-primary-light)' : 'transparent',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                >
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileInput}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer'
                        }}
                    />
                    <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Click to upload or drag and drop</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>JSON files only</p>
                </div>

                {error && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
