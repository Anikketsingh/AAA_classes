import { useState, useEffect } from 'react';
import { databases, DATABASE_ID } from '../config/appwrite';
import VideoUploader from './VideoUploader';
import ImageUploader from './ImageUploader';
import '../styles/components.css';

const DEMO_COLLECTION_ID = '67ef2305002ed7645278';

const DemoVideoManagement = () => {
  const [demoVideos, setDemoVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    videoUrl: '',
    image: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);

  useEffect(() => {
    fetchDemoVideos();
  }, []);

  const fetchDemoVideos = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        DEMO_COLLECTION_ID
      );
      setDemoVideos(response.documents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching demo videos:', error);
      setError('Failed to load demo videos. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (editMode) {
      setEditingVideo({
        ...editingVideo,
        [name]: type === 'checkbox' ? checked : value
      });
    } else {
      setNewVideo({
        ...newVideo,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating new demo video:', newVideo);
      
      await databases.createDocument(
        DATABASE_ID,
        DEMO_COLLECTION_ID,
        'unique()',
        newVideo
      );
      
      setNewVideo({
        title: '',
        description: '',
        videoUrl: '',
        image: ''
      });
      
      setShowAddForm(false);
      setShowVideoUploader(false);
      setShowImageUploader(false);
      fetchDemoVideos();
    } catch (error) {
      console.error('Error adding demo video:', error);
      setError('Failed to add demo video. Please try again.');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating demo video:', editingVideo);
      
      await databases.updateDocument(
        DATABASE_ID,
        DEMO_COLLECTION_ID,
        editingVideo.$id,
        {
          title: editingVideo.title,
          description: editingVideo.description,
          videoUrl: editingVideo.videoUrl,
          image: editingVideo.image
        }
      );
      
      setEditMode(false);
      setEditingVideo(null);
      setShowVideoUploader(false);
      setShowImageUploader(false);
      fetchDemoVideos();
    } catch (error) {
      console.error('Error updating demo video:', error);
      setError('Failed to update demo video. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this demo video?')) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          DEMO_COLLECTION_ID,
          id
        );
        
        fetchDemoVideos();
      } catch (error) {
        console.error('Error deleting demo video:', error);
        setError('Failed to delete demo video. Please try again.');
      }
    }
  };

  const startEditing = (video) => {
    setEditingVideo(video);
    setEditMode(true);
    setShowAddForm(false);
  };

  const cancelEditing = () => {
    setEditingVideo(null);
    setEditMode(false);
    setShowVideoUploader(false);
    setShowImageUploader(false);
  };

  const handleVideoUpload = (url) => {
    console.log('Video uploaded:', url);
    if (editMode) {
      setEditingVideo({
        ...editingVideo,
        videoUrl: url
      });
    } else {
      setNewVideo({
        ...newVideo,
        videoUrl: url
      });
    }
    setShowVideoUploader(false);
  };

  const handleImageUpload = (url) => {
    console.log('Thumbnail uploaded:', url);
    if (editMode) {
      setEditingVideo({
        ...editingVideo,
        image: url
      });
    } else {
      setNewVideo({
        ...newVideo,
        image: url
      });
    }
    setShowImageUploader(false);
  };

  const handleUploadError = (error) => {
    setError(error);
    setTimeout(() => setError(null), 3000);
  };

  if (loading) {
    return <div className="demo-loading">Loading demo videos...</div>;
  }

  return (
    <div className="demo-videos-container">
      <div className="demo-header">
        <h2 className="demo-title">Demo Videos Management</h2>
        <p className="demo-description">
          Manage demo videos that will be publicly available to showcase your courses.
        </p>
        {!editMode && (
          <button
            className="filter-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Demo Video'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && !editMode && (
        <form className="demo-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Video Title*</label>
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

            <div className="form-group full-width">
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
          </div>

          <div className="form-group">
            <label>Video File</label>
            {!showVideoUploader && !newVideo.videoUrl ? (
              <button
                type="button"
                className="upload-button"
                onClick={() => setShowVideoUploader(true)}
              >
                Upload Video
              </button>
            ) : !showVideoUploader && newVideo.videoUrl ? (
              <div className="video-preview">
                <p className="video-url-preview">Video URL: {newVideo.videoUrl}</p>
                <button
                  type="button"
                  className="edit-video-button"
                  onClick={() => setShowVideoUploader(true)}
                >
                  Change Video
                </button>
              </div>
            ) : (
              <div className="video-uploader-container">
                <VideoUploader
                  onUploadComplete={handleVideoUpload}
                  onUploadError={handleUploadError}
                />
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowVideoUploader(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Thumbnail Image</label>
            {!showImageUploader && !newVideo.image ? (
              <button
                type="button"
                className="upload-button"
                onClick={() => setShowImageUploader(true)}
              >
                Upload Thumbnail
              </button>
            ) : !showImageUploader && newVideo.image ? (
              <div className="image-preview-container">
                <img src={newVideo.image} alt="Thumbnail" className="current-image-preview" />
                <p className="image-url-preview">Image URL: {newVideo.image}</p>
                <button
                  type="button"
                  className="edit-thumbnail-button"
                  onClick={() => setShowImageUploader(true)}
                >
                  Change Thumbnail
                </button>
              </div>
            ) : (
              <div className="image-uploader-container">
                <ImageUploader
                  onUploadComplete={handleImageUpload}
                  onUploadError={handleUploadError}
                />
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowImageUploader(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={!newVideo.videoUrl}>
              Add Demo Video
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowAddForm(false);
                setNewVideo({
                  title: '',
                  description: '',
                  videoUrl: '',
                  image: ''
                });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {editMode && editingVideo && (
        <form className="demo-form" onSubmit={handleEdit}>
          <h3 className="edit-title">Edit Demo Video</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="edit-title">Video Title*</label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={editingVideo.title}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Enter video title"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                name="description"
                value={editingVideo.description}
                onChange={handleInputChange}
                className="form-input"
                rows="3"
                placeholder="Enter video description"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Video File</label>
            {!showVideoUploader && (
              <div className="video-preview">
                <p className="video-url-preview">Video URL: {editingVideo.videoUrl}</p>
                <button
                  type="button"
                  className="edit-video-button"
                  onClick={() => setShowVideoUploader(true)}
                >
                  Change Video
                </button>
              </div>
            )}
            {showVideoUploader && (
              <div className="video-uploader-container">
                <VideoUploader
                  onUploadComplete={handleVideoUpload}
                  onUploadError={handleUploadError}
                />
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowVideoUploader(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Thumbnail Image</label>
            {!showImageUploader && (
              <div className="image-preview-container">
                {editingVideo.image && (
                  <>
                    <img src={editingVideo.image} alt="Thumbnail" className="current-image-preview" />
                    <p className="image-url-preview">Image URL: {editingVideo.image}</p>
                  </>
                )}
                <button
                  type="button"
                  className="edit-thumbnail-button"
                  onClick={() => setShowImageUploader(true)}
                >
                  {editingVideo.image ? 'Change Thumbnail' : 'Add Thumbnail'}
                </button>
              </div>
            )}
            {showImageUploader && (
              <div className="image-uploader-container">
                <ImageUploader
                  onUploadComplete={handleImageUpload}
                  onUploadError={handleUploadError}
                />
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowImageUploader(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              Save Changes
            </button>
            <button type="button" className="cancel-button" onClick={cancelEditing}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="demo-videos-grid">
        {demoVideos.length === 0 && !showAddForm && !editMode ? (
          <div className="no-demos">No demo videos available. Add one to get started.</div>
        ) : (
          !showAddForm && !editMode && (
            <div className="demo-videos-list">
              {demoVideos.map((video) => (
                <div key={video.$id} className="demo-video-card">
                  <div className="demo-video-thumbnail">
                    {video.image ? (
                      <img src={video.image} alt={video.title} className="demo-thumbnail" />
                    ) : (
                      <div className="demo-thumbnail-placeholder">
                        <span>No Thumbnail</span>
                      </div>
                    )}
                  </div>
                  <div className="demo-video-details">
                    <h3 className="demo-video-title">{video.title}</h3>
                    {video.description && (
                      <p className="demo-video-description">{video.description}</p>
                    )}
                    <div className="demo-video-url">
                      <small>Video URL: {video.videoUrl}</small>
                    </div>
                    <div className="demo-video-actions">
                      <button
                        className="edit-button"
                        onClick={() => startEditing(video)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(video.$id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DemoVideoManagement;