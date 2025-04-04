import { useState, useRef } from 'react';
import '../styles/components.css';

const ImageUploader = ({ onUploadComplete, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
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

  // Function to compress an image before creating a data URL
  const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to data URL with compression
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          console.log('Compressed image size:', dataUrl.length, 'characters');

          resolve(dataUrl);
        };
      };
    });
  };

  const uploadToBunny = async (file) => {
    try {
      console.log('Starting image upload to Bunny.net using fetch API');
      setIsUploading(true);
      setUploadProgress(0);

      // Use import.meta.env for Vite environment variables
      const BUNNY_STORAGE_ZONE = import.meta.env.VITE_BUNNY_STORAGE_ZONE;
      const BUNNY_API_KEY = import.meta.env.VITE_BUNNY_API_KEY;

      console.log('Environment variables:', {
        BUNNY_STORAGE_ZONE: BUNNY_STORAGE_ZONE ? 'Set' : 'Not set',
        BUNNY_API_KEY: BUNNY_API_KEY ? 'Set' : 'Not set'
      });

      // If credentials are missing, show an error
      if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY) {
        console.error('Missing Bunny.net credentials. Cannot upload image.');
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

      // Set up headers for the request
      const headers = {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': file.type
      };
      
      console.log('Headers being sent:', Object.keys(headers).join(', '));

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
        console.log('Image upload successful, CDN URL:', cdnUrl);
        onUploadComplete(cdnUrl);
        
        // Keep the preview for a moment so user can see the image was processed
        setTimeout(() => {
          setPreviewUrl(null);
        }, 1000);
      } catch (fetchError) {
        clearInterval(progressInterval);
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      
      onUploadError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      console.log('Upload process completed (success or failure)');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const createPreview = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      createPreview(file);
      await uploadToBunny(file);
    } else {
      onUploadError('Please upload an image file (JPEG, PNG, etc.).');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      createPreview(file);
      await uploadToBunny(file);
    } else {
      onUploadError('Please upload an image file (JPEG, PNG, etc.).');
    }
  };

  return (
    <div className="image-uploader">
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
          accept="image/*"
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
        ) : previewUrl ? (
          <div className="image-preview">
            <img src={previewUrl} alt="Preview" />
          </div>
        ) : (
          <div className="upload-prompt">
            <span className="upload-icon">📁</span>
            <p>Drag and drop your image here or click to browse</p>
            <p className="upload-subtitle">Supported formats: JPEG, PNG, GIF</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;