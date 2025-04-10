import { useState, useEffect } from 'react';
import { databases, DATABASE_ID } from '../config/appwrite';
import { Query } from 'appwrite';
import BunnyUploader from './BunnyUploader';
import '../styles/components.css';
import '../styles/demoCourses.css';

const FREEVIDS_COLLECTION_ID = '67ef2305002ed7645278';

const DemoCoursesManagement = ({ currentUser }) => {
  const [freeVideos, setFreeVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    image: '',
    videoUrl: ''
  });

  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'upload'

  useEffect(() => {
    fetchFreeVideos();
  }, []);

  const fetchFreeVideos = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        FREEVIDS_COLLECTION_ID
      );
      
      setFreeVideos(response.documents);
      setError(null);
    } catch (err) {
      console.error('Error fetching free videos:', err);
      setError('Failed to load demo courses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVideo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUploadComplete = (imageUrl) => {
    console.log('Image upload complete, URL type:', typeof imageUrl);
    console.log('Image URL length:', imageUrl ? imageUrl.length : 0);
    
    // Ensure the URL is valid
    if (!imageUrl) {
      console.error('Received empty image URL');
      setUploadError('Failed to get image URL. Please try again.');
      return;
    }
    
    // Check if the image URL is too long for Appwrite (100,000 char limit)
    if (imageUrl.length > 90000) {
      console.error('Image URL is too long for Appwrite:', imageUrl.length, 'chars');
      setUploadError('Image is too large. Please use a smaller image or lower quality.');
      return;
    }
    
    setNewVideo(prev => ({
      ...prev,
      image: imageUrl
    }));
    setUploadError(null);
  };

  const handleImageUploadError = (error) => {
    console.error('Image upload error:', error);

    // Create a user-friendly error message
    let errorMessage = 'Failed to upload image to Bunny.net. ';

    if (typeof error === 'string') {
      errorMessage += error;
    } else if (error && error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Please try again or use a different image file.';
    }

    setUploadError(errorMessage);

    // Clear the image URL if there was an error
    setNewVideo(prev => ({
      ...prev,
      image: ''
    }));
  };

  const handleVideoUploadComplete = (videoUrl) => {
    console.log('Video upload complete, URL:', videoUrl);

    // Ensure the URL is valid
    if (!videoUrl) {
      console.error('Received empty video URL');
      setUploadError('Failed to get video URL. Please try again.');
      return;
    }

    // Log the URL for debugging
    console.log('Setting video URL in form:', videoUrl);
    console.log('URL type:', typeof videoUrl);
    console.log('URL length:', videoUrl.length);

    // Update the form state with the video URL
    setNewVideo(prev => {
      const updated = {
        ...prev,
        videoUrl: videoUrl
      };
      console.log('Updated video state:', updated);
      return updated;
    });

    // Clear any previous errors
    setUploadError(null);

    // Show success message
    alert('Video uploaded successfully!');
  };

  const handleVideoUploadError = (error) => {
    console.error('Video upload error:', error);

    // Create a user-friendly error message
    let errorMessage = 'Failed to upload video to Bunny.net. ';

    if (typeof error === 'string') {
      errorMessage += error;
    } else if (error && error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Please try again or use a different video file.';
    }

    // Set the error in state
    setUploadError(errorMessage);

    // Clear the video URL if there was an error
    setNewVideo(prev => ({
      ...prev,
      videoUrl: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newVideo.title || !newVideo.videoUrl) {
      setError('Title and Video URL are required');
      return;
    }

    try {
      setLoading(true);

      // Create new free video document
      await databases.createDocument(
        DATABASE_ID,
        FREEVIDS_COLLECTION_ID,
        'unique()',
        newVideo
      );

      // Reset form
      setNewVideo({
        title: '',
        description: '',
        image: '',
        videoUrl: ''
      });

      setShowAddForm(false);
      setError(null);
      setUploadError(null);

      // Refresh the list
      fetchFreeVideos();
    } catch (err) {
      console.error('Error adding demo course:', err);
      setError('Failed to add demo course: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this demo course?')) {
      try {
        setLoading(true);
        
        await databases.deleteDocument(
          DATABASE_ID,
          FREEVIDS_COLLECTION_ID,
          videoId
        );
        
        fetchFreeVideos();
        setError(null);
      } catch (err) {
        console.error('Error deleting demo course:', err);
        setError('Failed to delete demo course');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditVideo = (video) => {
    setSelectedVideo(video);
    setNewVideo({
      title: video.title,
      description: video.description || '',
      image: video.image || '',
      videoUrl: video.videoUrl || ''
    });
    setShowAddForm(true);
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();

    if (!newVideo.title || !newVideo.videoUrl) {
      setError('Title and Video URL are required');
      return;
    }

    try {
      setLoading(true);

      // Update existing video document
      await databases.updateDocument(
        DATABASE_ID,
        FREEVIDS_COLLECTION_ID,
        selectedVideo.$id,
        newVideo
      );

      // Reset form
      setNewVideo({
        title: '',
        description: '',
        image: '',
        videoUrl: ''
      });

      setSelectedVideo(null);
      setShowAddForm(false);
      setError(null);
      setUploadError(null);

      // Refresh the list
      fetchFreeVideos();
    } catch (err) {
      console.error('Error updating demo course:', err);
      setError('Failed to update demo course: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedVideo(null);
    setNewVideo({
      title: '',
      description: '',
      image: '',
      videoUrl: ''
    });
    setShowAddForm(false);
  };

  const validateVideoUrl = (url) => {
    // Basic validation for video URLs
    if (!url) return false;
    
    // Check for common video platforms
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+/;
    const mp4Regex = /\.(mp4|webm|ogg)(\?.*)?$/;
    
    return youtubeRegex.test(url) || vimeoRegex.test(url) || mp4Regex.test(url);
  };

  return (
    <div className="demo-courses-management">
      <h2>Dem<span style={{ color: 'red', fontWeight: 'bold' }}>O</span> Courses Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="management-actions">
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={loading}
        >
          {showAddForm ? 'Cancel' : 'Add New Dem⭕ Course'}
        </button>
      </div>
      
      {showAddForm && (
        <form onSubmit={selectedVideo ? handleUpdateVideo : handleSubmit} className="add-form">
          <h3>{selectedVideo ? 'Edit Dem⭕ Course' : 'Add New Dem⭕ Course'}</h3>
          
          <div className="form-group">
            <label htmlFor="title">Title*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={newVideo.title}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Enter video title"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={newVideo.description}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="Enter video description"
            />
          </div>
          
          <div className="form-group">
            <label>Video Source*</label>
            <div className="upload-method-selector" style={{ marginBottom: '10px' }}>
              <div className="radio-group" style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="uploadMethod"
                    value="url"
                    checked={uploadMethod === 'url'}
                    onChange={() => setUploadMethod('url')}
                    style={{ marginRight: '5px' }}
                  />
                  Enter URL
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="uploadMethod"
                    value="upload"
                    checked={uploadMethod === 'upload'}
                    onChange={() => setUploadMethod('upload')}
                    style={{ marginRight: '5px' }}
                  />
                  Upload Video
                </label>
              </div>
            </div>

            {uploadMethod === 'url' ? (
              <>
                <label htmlFor="videoUrl">Video URL*</label>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={newVideo.videoUrl}
                  onChange={handleInputChange}
                  required={uploadMethod === 'url'}
                  className="form-input"
                  placeholder="Enter video URL (YouTube, Vimeo, or direct MP4 link)"
                />
                {newVideo.videoUrl && !validateVideoUrl(newVideo.videoUrl) && (
                  <div className="input-warning">
                    URL doesn't appear to be a valid video link. Please check the format.
                  </div>
                )}
              </>
            ) : (
              <>
                <label>Upload Video File*</label>
                {newVideo.videoUrl ? (
                  <div className="video-preview" style={{ marginBottom: '10px' }}>
                    <div style={{
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '10px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>🎬</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>Video uploaded successfully</div>
                          <div style={{
                            fontSize: '12px',
                            wordBreak: 'break-all',
                            color: '#666',
                            marginTop: '5px'
                          }}>
                            {newVideo.videoUrl}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setNewVideo(prev => ({ ...prev, videoUrl: '' }))}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove Video
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <BunnyUploader
                    onUploadComplete={handleVideoUploadComplete}
                    onUploadError={handleVideoUploadError}
                    fileType="video"
                  />
                )}
              </>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="image">Thumbnail Image</label>
            {newVideo.image ? (
              <div className="image-preview" style={{ marginBottom: '10px' }}>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  overflow: 'hidden',
                  maxHeight: '150px'
                }}>
                  <img
                    src={newVideo.image}
                    alt="Thumbnail preview"
                    style={{
                      width: '100%',
                      maxHeight: '150px',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => setNewVideo(prev => ({ ...prev, image: '' }))}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentUrl = newVideo.image;
                        const newUrl = prompt('Edit image URL:', currentUrl);
                        if (newUrl && newUrl !== currentUrl) {
                          setNewVideo(prev => ({ ...prev, image: newUrl }));
                        }
                      }}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit URL
                    </button>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div>
                      {newVideo.image.startsWith('data:') 
                        ? 'Local image (will be stored with video data)' 
                        : (() => {
                            try {
                              return 'Remote image from: ' + new URL(newVideo.image).hostname;
                            } catch (e) {
                              return 'Invalid URL format';
                            }
                          })()
                      }
                    </div>
                    {!newVideo.image.startsWith('data:') && (
                      <div style={{
                        wordBreak: 'break-all',
                        backgroundColor: '#f5f5f5',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        maxHeight: '40px',
                        overflowY: 'auto'
                      }}>
                        {newVideo.image}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <BunnyUploader
                onUploadComplete={handleImageUploadComplete}
                onUploadError={handleImageUploadError}
                fileType="image"
              />
            )}
            {uploadError && (
              <div className="upload-error" style={{ color: 'red', marginTop: '5px' }}>{uploadError}</div>
            )}
          </div>
          
          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={loading}>
              {selectedVideo ? 'Update Dem⭕ Course' : 'Create Dem⭕ Course'}
            </button>
            <button type="button" className="cancel-button" onClick={handleCancelEdit} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      )}
      
      {loading && !showAddForm ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="demo-videos-grid">
          {freeVideos.length === 0 ? (
            <div className="no-videos">No Dem<span style={{ color: 'red', fontWeight: 'bold' }}>O</span> courses available</div>
          ) : (
            freeVideos.map((video) => (
              <div key={video.$id} className="video-card">
                <div className="video-image-container" style={{ position: 'relative', height: '150px', overflow: 'hidden', borderRadius: '4px 4px 0 0' }}>
                  {video.image ? (
                    <>
                      <img
                        src={video.image}
                        alt={video.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('Video thumbnail failed to load:', e);
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                      <div 
                        className="image-url-overlay"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '4px',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          maxHeight: '60px',
                          overflowY: 'auto',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                        <div>{video.image}</div>
                      </div>
                    </>
                  ) : (
                    <div className="video-image-placeholder" style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f0f0f0',
                      color: '#999'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '24px', display: 'block', marginBottom: '5px' }}>🎬</span>
                        <span>No Thumbnail</span>
                      </div>
                    </div>
                  )}
                  <div className="video-play-overlay" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: 'white',
                    fontSize: '36px',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(video.videoUrl, '_blank')}
                  >
                    ▶️
                  </div>
                </div>
                <div className="video-content" style={{ padding: '10px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{
                        color: 'red',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        border: '2px solid red',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                      }}>O</span>
                      {video.title}
                    </span>
                  </h3>
                  {video.description && (
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                      {video.description.length > 100 
                        ? `${video.description.substring(0, 100)}...` 
                        : video.description}
                    </p>
                  )}
                  <div className="video-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <button 
                      onClick={() => handleEditVideo(video)}
                      className="edit-button"
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteVideo(video.$id)}
                      className="delete-button"
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DemoCoursesManagement;