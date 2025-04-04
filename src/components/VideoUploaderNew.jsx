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
      console.log('Starting video upload to Bunny.net using fetch API');
      setIsUploading(true);
      setUploadProgress(0);

      // Use import.meta.env for Vite environment variables
      const BUNNY_STORAGE_ZONE = import.meta.env.VITE_BUNNY_STORAGE_ZONE;
      const BUNNY_API_KEY = import.meta.env.VITE_BUNNY_API_KEY;
      console.log('Checking environment variables');
        
      console.log('Environment variables:', {
        BUNNY_STORAGE_ZONE: BUNNY_STORAGE_ZONE ? 'Set' : 'Not set',
        BUNNY_API_KEY: BUNNY_API_KEY ? 'Set' : 'Not set'
      });

      // If credentials are missing, show an error
      if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY) {
        console.error('Missing Bunny.net credentials. Cannot upload video.');
        onUploadError('Missing Bunny.net credentials. Please check your environment variables.');
        return;
      }

      // Create a unique filename
      const timestamp = new Date().getTime();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}-${safeFileName}`;

      console.log('Generated filename for upload:', fileName);

      // Create a URL for the upload
      const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${fileName}`;
      console.log('Uploading to:', uploadUrl);
      console.log('File type:', file.type);
      console.log('File size:', file.size);
      console.log('Using API Key (first 5 chars):', BUNNY_API_KEY.substring(0, 5) + '...');
      console.log('Storage Zone:', BUNNY_STORAGE_ZONE);

      // Try a different approach with the API key
      // According to Bunny.net docs, the API key should be in the AccessKey header
      const headers = new Headers();
      headers.append('AccessKey', BUNNY_API_KEY);
      headers.append('Content-Type', file.type);
      
      console.log('Headers being sent:', [...headers.keys()].join(', '));

      // Simulate progress since fetch doesn't have progress events
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress; // Cap at 90% until complete
        });
      }, 500);

      try {
        // Use fetch API to upload the file
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: headers,
          body: file,
          credentials: 'omit' // Don't send cookies
        });

        clearInterval(progressInterval);
        
        // Check if the request was successful
        if (!response.ok) {
          console.error('Upload failed with status:', response.status);
          
          let errorText = '';
          try {
            const errorData = await response.text();
            console.error('Error response:', errorData);
            errorText = errorData;
          } catch (e) {
            console.error('Could not read error response');
          }
          
          throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
        }

        // Set progress to 100% when complete
        setUploadProgress(100);
        
        // Construct the CDN URL
        const cdnUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${fileName}`;
        console.log('Video upload successful, CDN URL:', cdnUrl);
        onUploadComplete(cdnUrl);
      } catch (fetchError) {
        clearInterval(progressInterval);
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error.message || 'Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    console.log('File dropped');
    const file = e.dataTransfer.files[0];
    
    if (file) {
      console.log('Dropped file:', file.name, 'Type:', file.type, 'Size:', file.size);
    } else {
      console.error('No file in drop event');
      onUploadError('No file detected. Please try again.');
      return;
    }

    if (file && file.type.startsWith('video/')) {
      console.log('Valid video file detected, starting upload');
      try {
        await uploadToBunny(file);
        console.log('Upload to Bunny completed successfully');
      } catch (error) {
        console.error('Error in uploadToBunny:', error);
        onUploadError('Failed to upload video: ' + error.message);
      }
    } else {
      console.error('Invalid file type dropped:', file ? file.type : 'unknown');
      onUploadError('Please upload a video file (MP4, WebM, etc.).');
    }
  };

  const handleFileSelect = async (e) => {
    console.log('Video file selected via input');
    const file = e.target.files[0];

    if (file) {
      console.log('Selected video file:', file.name, 'Type:', file.type, 'Size:', file.size);
    } else {
      console.error('No file selected');
      return;
    }

    if (file && file.type.startsWith('video/')) {
      console.log('Starting video upload process');
      try {
        await uploadToBunny(file);
        console.log('Upload to Bunny completed successfully');
      } catch (error) {
        console.error('Error in uploadToBunny:', error);
        onUploadError('Failed to upload video: ' + error.message);
      }
    } else {
      console.error('Invalid video file type selected');
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