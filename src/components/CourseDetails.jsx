import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, SUBFOLDERS_COLLECTION_ID } from '../config/appwrite';
import VideoUploader from './VideoUploader';
import ImageUploader from './ImageUploader';
import '../styles/components.css';

const COURSES_COLLECTION_ID = '67e58e94003546802bb8';
const LESSONS_COLLECTION_ID = '67e5942e002d2c10b7b8';

const CourseDetails = ({ courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddSubfolder, setShowAddSubfolder] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [editedCourse, setEditedCourse] = useState(null);
  const [newLesson, setNewLesson] = useState({
    title: '',
    type: 'Video',
    order: 0,
    videoUrl: '',
    subfolderId: ''
  });
  const [newSubfolder, setNewSubfolder] = useState({
    name: '',
    courseId: ''
  });
  const [uploadError, setUploadError] = useState(null);
  const [activeSubfolderId, setActiveSubfolderId] = useState('all');

  useEffect(() => {
    fetchCourseAndLessons();
  }, [courseId]);

  const fetchCourseAndLessons = async () => {
    try {
      const courseResponse = await databases.getDocument(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        courseId
      );
      setCourse(courseResponse);
      setEditedCourse(courseResponse);

      // Fetch subfolders for this course
      const subfoldersResponse = await databases.listDocuments(
        DATABASE_ID,
        SUBFOLDERS_COLLECTION_ID
      );

      const courseSubfolders = subfoldersResponse.documents.filter(
        subfolder => subfolder.courseId === courseId
      );

      setSubfolders(courseSubfolders);

      // Fetch lessons
      const lessonsResponse = await databases.listDocuments(
        DATABASE_ID,
        LESSONS_COLLECTION_ID
      );

      const courseLessons = lessonsResponse.documents.filter(
        lesson => lesson.courseId === courseId
      );

      setLessons(courseLessons);

      // Update the course's totalLessons count if it doesn't match
      if (courseResponse.totalLessons !== courseLessons.length) {
        await databases.updateDocument(
          DATABASE_ID,
          COURSES_COLLECTION_ID,
          courseId,
          {
            totalLessons: courseLessons.length
          }
        );

        // Update the local course state with the correct count
        setCourse(prev => ({
          ...prev,
          totalLessons: courseLessons.length
        }));

        setEditedCourse(prev => ({
          ...prev,
          totalLessons: courseLessons.length
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching course details:', error);
      setError('Failed to load course details');
      setLoading(false);
    }
  };

  const handleCourseEdit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        title: editedCourse.title,
        description: editedCourse.description,
        duration: editedCourse.duration,
        price: editedCourse.price,
        totalLessons: editedCourse.totalLessons,
        isPopular: editedCourse.isPopular,
        isNew: editedCourse.isNew,
        image: editedCourse.image
      };

      console.log('Updating course with data:', updateData);
      console.log('Image URL:', editedCourse.image);

      await databases.updateDocument(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        courseId,
        updateData
      );

      setCourse({
        ...course,
        ...updateData
      });
      setEditMode(false);
      setShowImageUploader(false);
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Failed to update course');
    }
  };

  const handleAddSubfolder = async (e) => {
    e.preventDefault();
    try {
      const subfolderData = {
        name: newSubfolder.name,
        courseId: courseId
      };

      await databases.createDocument(
        DATABASE_ID,
        SUBFOLDERS_COLLECTION_ID,
        'unique()',
        subfolderData
      );

      setNewSubfolder({
        name: '',
        courseId: courseId
      });
      setShowAddSubfolder(false);

      fetchCourseAndLessons();
    } catch (error) {
      console.error('Error adding subfolder:', error);
      setError('Failed to add subfolder');
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    try {
      const lessonData = {
        courseId,
        title: newLesson.title,
        type: newLesson.type,
        order: lessons.length + 1,
        videoUrl: newLesson.videoUrl || '',
        subfolderId: newLesson.subfolderId || null
      };

      await databases.createDocument(
        DATABASE_ID,
        LESSONS_COLLECTION_ID,
        'unique()',
        lessonData
      );

      // Update the course's totalLessons count
      const updatedTotalLessons = lessons.length + 1;
      await databases.updateDocument(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        courseId,
        {
          totalLessons: updatedTotalLessons
        }
      );

      setNewLesson({
        title: '',
        type: 'Video',
        order: 0,
        videoUrl: '',
        subfolderId: ''
      });
      setShowAddLesson(false);

      fetchCourseAndLessons();
    } catch (error) {
      console.error('Error adding lesson:', error);
      setError('Failed to add lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          LESSONS_COLLECTION_ID,
          lessonId
        );

        // Update the course's totalLessons count
        const updatedTotalLessons = Math.max(0, lessons.length - 1);
        await databases.updateDocument(
          DATABASE_ID,
          COURSES_COLLECTION_ID,
          courseId,
          {
            totalLessons: updatedTotalLessons
          }
        );

        fetchCourseAndLessons();
      } catch (error) {
        console.error('Error deleting lesson:', error);
        setError('Failed to delete lesson');
      }
    }
  };

  const handleDeleteSubfolder = async (subfolderId) => {
    if (window.confirm('Are you sure you want to delete this subfolder? This will NOT delete the lessons inside it.')) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          SUBFOLDERS_COLLECTION_ID,
          subfolderId
        );
        fetchCourseAndLessons();
      } catch (error) {
        console.error('Error deleting subfolder:', error);
        setError('Failed to delete subfolder');
      }
    }
  };

  const handleVideoUploadComplete = (videoUrl) => {
    setNewLesson(prev => ({
      ...prev,
      videoUrl
    }));
    setUploadError(null);
  };

  const handleVideoUploadError = (error) => {
    setUploadError(error);
  };

  const getFilteredLessons = () => {
    if (activeSubfolderId === 'all') {
      return lessons;
    } else if (activeSubfolderId === 'none') {
      return lessons.filter(lesson => !lesson.subfolderId);
    } else {
      return lessons.filter(lesson => lesson.subfolderId === activeSubfolderId);
    }
  };

  if (loading) {
    return <div className="course-details-loading">Loading course details...</div>;
  }

  if (error) {
    return <div className="course-details-error">{error}</div>;
  }

  return (
    <div className="course-details">
      <div className="course-details-header">
        <button onClick={onBack} className="back-button">
          ← Back to Courses
        </button>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="filter-button">
            <i className="edit-icon"></i>
            Edit Course
          </button>
        )}
      </div>

      {editMode ? (
        <form onSubmit={handleCourseEdit} className="course-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Course Title*</label>
              <input
                type="text"
                id="title"
                value={editedCourse.title}
                onChange={(e) => setEditedCourse({...editedCourse, title: e.target.value})}
                required
                className="form-input"
                placeholder="Enter course title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration*</label>
              <input
                type="text"
                id="duration"
                value={editedCourse.duration}
                onChange={(e) => setEditedCourse({...editedCourse, duration: e.target.value})}
                required
                className="form-input"
                placeholder="e.g., 8 weeks"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price*</label>
              <input
                type="number"
                id="price"
                value={editedCourse.price}
                onChange={(e) => setEditedCourse({...editedCourse, price: parseFloat(e.target.value)})}
                required
                className="form-input"
                min="0"
                step="0.01"
                placeholder="Course price"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={editedCourse.description}
                onChange={(e) => setEditedCourse({...editedCourse, description: e.target.value})}
                className="form-input"
                rows="3"
                placeholder="Enter course description"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={editedCourse.isPopular}
                  onChange={(e) => setEditedCourse({...editedCourse, isPopular: e.target.checked})}
                />
                Mark as Popular
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={editedCourse.isNew}
                  onChange={(e) => setEditedCourse({...editedCourse, isNew: e.target.checked})}
                />
                Mark as New
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Course Thumbnail Image</label>
            {!showImageUploader && editedCourse.image ? (
              <div className="current-image-container">
                <p className="current-image-label">Current Thumbnail:</p>
                <img src={editedCourse.image} alt="Course thumbnail" className="current-image-preview" />
                <button
                  type="button"
                  className="edit-thumbnail-button"
                  onClick={() => setShowImageUploader(true)}
                >
                  Edit Thumbnail
                </button>
              </div>
            ) : (
              <>
                <ImageUploader
                  onUploadComplete={(imageUrl) => {
                    console.log('Image upload completed in CourseDetails. URL:', imageUrl);
                    setEditedCourse({
                      ...editedCourse,
                      image: imageUrl
                    });
                    setShowImageUploader(false);
                  }}
                  onUploadError={(errorMessage) => {
                    setError(errorMessage);
                    setTimeout(() => setError(null), 3000);
                  }}
                />
                {editedCourse.image && (
                  <button
                    type="button"
                    className="cancel-thumbnail-button"
                    onClick={() => setShowImageUploader(false)}
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">Save Changes</button>
            <button type="button" onClick={() => setEditMode(false)} className="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="course-info">
          {course.image && (
            <>
              <div className="course-detail-image-container">
                <img src={course.image} alt={course.title} className="course-detail-image" />
              </div>
              <p className="image-url-display">Image URL: {course.image}</p>
              {console.log('Displaying course with image URL:', course.image)}
            </>
          )}
          <h1 className="course-title">{course.title}</h1>
          <p className="course-description">{course.description}</p>
          <div className="course-meta">
            <span className="course-duration">⏱️ {course.duration}</span>
            <span className="course-price">💰 ${course.price}</span>
            <span className="course-lessons">📚 {lessons.length} lessons</span>
            {course.isPopular && <span className="course-badge popular">Popular</span>}
            {course.isNew && <span className="course-badge new">New</span>}
          </div>
        </div>
      )}

      {/* Subfolders Section */}
      <div className="subfolders-section">
        <div className="subfolders-header">
          <h2 className="subfolders-title">Course Subfolders</h2>
          <button
            className="filter-button"
            onClick={() => setShowAddSubfolder(!showAddSubfolder)}
          >
            <i className="add-icon"></i>
            + Add Subfolder
          </button>
        </div>

        {showAddSubfolder && (
          <form onSubmit={handleAddSubfolder} className="course-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="subfolderName">Subfolder Name*</label>
                <input
                  type="text"
                  id="subfolderName"
                  value={newSubfolder.name}
                  onChange={(e) => setNewSubfolder({...newSubfolder, name: e.target.value})}
                  required
                  className="form-input"
                  placeholder="Enter subfolder name"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button">
                Add Subfolder
              </button>
              <button type="button" className="cancel-button" onClick={() => setShowAddSubfolder(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="subfolders-filter">
          <button
            className={`subfolder-filter-btn ${activeSubfolderId === 'all' ? 'active' : ''}`}
            onClick={() => setActiveSubfolderId('all')}
          >
            All Lessons
          </button>
          <button
            className={`subfolder-filter-btn ${activeSubfolderId === 'none' ? 'active' : ''}`}
            onClick={() => setActiveSubfolderId('none')}
          >
            Uncategorized
          </button>
          {subfolders.map(subfolder => (
            <div key={subfolder.$id} className="subfolder-filter-item">
              <button
                className={`subfolder-filter-btn ${activeSubfolderId === subfolder.$id ? 'active' : ''}`}
                onClick={() => setActiveSubfolderId(subfolder.$id)}
              >
                {subfolder.name}
              </button>
              <button
                onClick={() => handleDeleteSubfolder(subfolder.$id)}
                className="delete-subfolder-button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lessons Section */}
      <div className="lessons-section">
        <div className="lessons-header">
          <h2 className="lessons-title">Course Lessons</h2>
          <button
            className="filter-button"
            onClick={() => setShowAddLesson(!showAddLesson)}
          >
            <i className="add-icon"></i>
            + Add Lesson
          </button>
        </div>

        {showAddLesson && (
          <form onSubmit={handleAddLesson} className="course-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="lessonTitle">Lesson Title*</label>
                <input
                  type="text"
                  id="lessonTitle"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                  required
                  className="form-input"
                  placeholder="Enter lesson title"
                />
              </div>



              <div className="form-group">
                <label htmlFor="lessonType">Type*</label>
                <select
                  id="lessonType"
                  value={newLesson.type}
                  onChange={(e) => setNewLesson({...newLesson, type: e.target.value})}
                  required
                  className="form-input"
                >
                  <option value="Video">Video</option>
                  <option value="Quiz">Quiz</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subfolderId">Subfolder</label>
                <select
                  id="subfolderId"
                  value={newLesson.subfolderId}
                  onChange={(e) => setNewLesson({...newLesson, subfolderId: e.target.value})}
                  className="form-input"
                >
                  <option value="">None (Uncategorized)</option>
                  {subfolders.map(subfolder => (
                    <option key={subfolder.$id} value={subfolder.$id}>
                      {subfolder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="videoUrl">Video</label>
                {newLesson.videoUrl ? (
                  <div className="video-preview">
                    <input
                      type="text"
                      value={newLesson.videoUrl}
                      className="form-input"
                      readOnly
                    />
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => setNewLesson(prev => ({ ...prev, videoUrl: '' }))}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <VideoUploader
                    onUploadComplete={handleVideoUploadComplete}
                    onUploadError={handleVideoUploadError}
                  />
                )}
                {uploadError && (
                  <div className="upload-error">{uploadError}</div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button">
                Add Lesson
              </button>
              <button type="button" className="cancel-button" onClick={() => setShowAddLesson(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="lessons-list">
          {getFilteredLessons().length === 0 ? (
            <div className="no-lessons">No lessons available in this section</div>
          ) : (
            getFilteredLessons().map((lesson, index) => {
              // Find subfolder name if lesson has a subfolderId
              const subfolder = subfolders.find(sf => sf.$id === lesson.subfolderId);
              const subfolderName = subfolder ? subfolder.name : 'Uncategorized';

              return (
                <div key={lesson.$id} className="lesson-card">
                  <div className="lesson-info">
                    <span className="lesson-number">Lesson {index + 1}</span>
                    <h3 className="lesson-title">{lesson.title}</h3>
                    <div className="lesson-meta">
                      <span className="lesson-type">{lesson.type}</span>
                      <span className="lesson-subfolder">Folder: {subfolderName}</span>
                    </div>
                    {lesson.videoUrl && (
                      <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="video-link">
                        Watch Video
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLesson(lesson.$id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;