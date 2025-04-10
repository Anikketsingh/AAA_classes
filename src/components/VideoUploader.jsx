import { useState, useRef } from 'react';
import '../styles/components.css';

const VideoUploader = ({ onUploadComplete, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const uploadToBunny = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Use import.meta.env for Vite environment variables
      const BUNNY_STORAGE_ZONE = import.meta.env.VITE_BUNNY_STORAGE_ZONE;
      const BUNNY_API_KEY = import.meta.env.VITE_BUNNY_API_KEY;
      const BUNNY_REGION = import.meta.env.VITE_BUNNY_REGION || 'sg';

      if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY) {
        throw new Error('Missing Bunny.net credentials. Please check your environment variables.');
      }

      // Create a unique filename
      const timestamp = new Date().getTime();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}-${safeFileName}`;

      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };

      // Create a promise to handle the XHR request
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let errorMessage = `Upload failed with status ${xhr.status}`;
            try {
              const response = JSON.parse(xhr.responseText);
              errorMessage += `: ${response.message || xhr.statusText}`;
            } catch (e) {
              errorMessage += `: ${xhr.statusText}`;
            }
            reject(new Error(errorMessage));
          }
        };
        xhr.onerror = () => reject(new Error('Network error occurred during upload'));
      });

      // Open and send the request
      const uploadUrl = `https://${BUNNY_REGION}.storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${fileName}`;
      xhr.open('PUT', uploadUrl);
      
      // Set required headers for Bunny.net
      xhr.setRequestHeader('AccessKey', BUNNY_API_KEY);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('Accept', 'application/json');
      
      // Log the request details for debugging
      console.log('Uploading to:', uploadUrl);
      console.log('File type:', file.type);
      console.log('File size:', file.size);
      
      xhr.send(file);

      // Wait for the upload to complete
      await uploadPromise;

      // Construct the CDN URL with the correct format
      const cdnUrl = `https://aaa-classes.b-cdn.net/${fileName}`;
      console.log('Video uploaded successfully. URL:', cdnUrl);
      onUploadComplete(cdnUrl);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error.message || 'Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      await uploadToBunny(file);
    } else {
      onUploadError('Please upload a video file.');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      await uploadToBunny(file);
    } else {
      onUploadError('Please upload a video file.');
    }
  };

  return (
    <div className="video-uploader">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="video/*"
          style={{ display: 'none' }}
        />
        {isUploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        ) : (
          <div className="upload-prompt">
            <span className="upload-icon">📁</span>
            <p>Drag and drop your video here or click to browse</p>
            <p className="upload-subtitle">Supported formats: MP4, WebM, MOV</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader; 