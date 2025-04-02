import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const BUNNY_API_KEY = '';
const STORAGE_ZONE_NAME = 'aaa-classes-lecture';
const LIBRARY_ID = 'your-library-id';

const FileUpload = ({ onUploadComplete, onUploadStart, onUploadEnd }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      onUploadStart?.();
      setError(null);
      
      // Step 1: Get upload URL from Bunny.net
      const uploadResponse = await fetch(`https://api.bunny.net/videolibrary/${LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: file.name,
        })
      });

      const uploadData = await uploadResponse.json();
      const { guid } = uploadData;

      // Step 2: Upload the file
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          // Step 3: Get the video URL
          const videoUrl = `https://${STORAGE_ZONE_NAME}.b-cdn.net/${guid}`;
          onUploadComplete?.(videoUrl);
          setUploadProgress(0);
          onUploadEnd?.();
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = () => {
        setError('Upload failed');
        onUploadEnd?.();
      };

      xhr.open('PUT', uploadData.uploadUrl);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload video');
      onUploadEnd?.();
    }
  }, [onUploadComplete, onUploadStart, onUploadEnd]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    multiple: false
  });

  return (
    <div className="file-upload">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the video file here...</p>
        ) : (
          <p>Drag and drop a video file here, or click to select</p>
        )}
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="upload-progress">
          <div 
            className="progress-bar" 
            style={{ width: `${uploadProgress}%` }}
          />
          <span>{uploadProgress}%</span>
        </div>
      )}

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 