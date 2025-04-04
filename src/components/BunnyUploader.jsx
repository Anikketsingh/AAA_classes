import { useState, useRef } from 'react';
import '../styles/components.css';

const BunnyUploader = ({ onUploadComplete, onUploadError, fileType = 'video' }) => {
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
      console.log(`Starting ${fileType} upload to Bunny.net`);
      setIsUploading(true);
      setUploadProgress(0);

      // Get environment variables
      const BUNNY_STORAGE_ZONE = import.meta.env.VITE_BUNNY_STORAGE_ZONE;
      const BUNNY_API_KEY = import.meta.env.VITE_BUNNY_API_KEY;

      // Check if credentials are available
      if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY) {
        throw new Error('Missing Bunny.net credentials. Please check your environment variables.');
      }

      // Create a unique filename
      const timestamp = new Date().getTime();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}-${safeFileName}`;

      // According to Bunny.net docs, the endpoint is storage.bunnycdn.com
      const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${fileName}`;
      
      console.log('Uploading to:', uploadUrl);
      console.log('File type:', file.type);
      console.log('File size:', file.size);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Set up progress tracking with XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      
      // Set the AccessKey header exactly as specified in the docs
      xhr.setRequestHeader('AccessKey', BUNNY_API_KEY);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      // Create a promise to handle the response
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`${fileType} upload successful`);
            resolve();
          } else {
            console.error(`${fileType} upload failed with status:`, xhr.status);
            console.error('Response:', xhr.responseText);
            
            let errorMessage;
            try {
              const response = JSON.parse(xhr.responseText);
              errorMessage = `Upload failed with status ${xhr.status}: ${JSON.stringify(response)}`;
            } catch (e) {
              errorMessage = `Upload failed with status ${xhr.status}: ${xhr.statusText}`;
            }
            
            reject(new Error(errorMessage));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
        
        xhr.ontimeout = () => {
          reject(new Error('Upload timed out'));
        };
      });

      // Send the file as binary data
      xhr.send(file);
      
      // Wait for the upload to complete
      await uploadPromise;
      
      // Construct the CDN URL
      const cdnUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${fileName}`;
      console.log(`${fileType} upload successful, CDN URL:`, cdnUrl);
      
      // Call the callback with the URL
      onUploadComplete(cdnUrl);
      
    } catch (error) {
      console.error(`${fileType} upload error:`, error);
      onUploadError(error.message || `Failed to upload ${fileType}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) {
      onUploadError('No file detected');
      return;
    }
    
    const isCorrectType = fileType === 'video' 
      ? file.type.startsWith('video/') 
      : file.type.startsWith('image/');
    
    if (isCorrectType) {
      await uploadToBunny(file);
    } else {
      onUploadError(`Please upload a ${fileType} file`);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const isCorrectType = fileType === 'video' 
      ? file.type.startsWith('video/') 
      : file.type.startsWith('image/');
    
    if (isCorrectType) {
      await uploadToBunny(file);
    } else {
      onUploadError(`Please upload a ${fileType} file`);
    }
  };

  return (
    <div className={`${fileType}-uploader`}>
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
          accept={fileType === 'video' ? 'video/*' : 'image/*'}
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
            <span className="upload-icon">{fileType === 'video' ? '🎬' : '📷'}</span>
            <p>Drag and drop your {fileType} here or click to browse</p>
            <p className="upload-subtitle">
              {fileType === 'video' 
                ? 'Supported formats: MP4, WebM, MOV' 
                : 'Supported formats: JPEG, PNG, GIF'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BunnyUploader;