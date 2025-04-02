import { useState, useEffect } from 'react';
import { databases, DATABASE_ID } from '../config/appwrite';
import VideoUploader from './VideoUploader';
import '../styles/components.css';

const COURSES_COLLECTION_ID = '67e58e94003546802bb8';
const LESSONS_COLLECTION_ID = '67e5942e002d2c10b7b8';

const CourseDetails = ({ courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editedCourse, setEditedCourse] = useState(null);
  const [newLesson, setNewLesson] = useState({
    title: '',
    duration: '',
    type: 'Video',
    order: 0,
    videoUrl: ''
  });
  const [uploadError, setUploadError] = useState(null);

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

      const lessonsResponse = await databases.listDocuments(
        DATABASE_ID,
        LESSONS_COLLECTION_ID
      );

      const courseLessons = lessonsResponse.documents.filter(
        lesson => lesson.courseId === courseId
      );
      
      setLessons(courseLessons);
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
        isNew: editedCourse.isNew
      };
      
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
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Failed to update course');
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    try {
      const lessonData = {
        courseId,
        title: newLesson.title,
        duration: newLesson.duration,
        type: newLesson.type,
        order: lessons.length + 1,
        videoUrl: newLesson.videoUrl || ''
      };

      await databases.createDocument(
        DATABASE_ID,
        LESSONS_COLLECTION_ID,
        'unique()',
        lessonData
      );

      setNewLesson({
        title: '',
        duration: '',
        type: 'Video',
        order: 0,
        videoUrl: ''
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
        fetchCourseAndLessons();
      } catch (error) {
        console.error('Error deleting lesson:', error);
        setError('Failed to delete lesson');
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
          <h1 className="course-title">{course.title}</h1>
          <p className="course-description">{course.description}</p>
          <div className="course-meta">
            <span className="course-duration">⏱️ {course.duration}</span>
            <span className="course-price">💰 ${course.price}</span>
            <span className="course-lessons">📚 {lessons.length} lessons</span>
          </div>
        </div>
      )}

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
                <label htmlFor="lessonDuration">Duration*</label>
                <input
                  type="text"
                  id="lessonDuration"
                  value={newLesson.duration}
                  onChange={(e) => setNewLesson({...newLesson, duration: e.target.value})}
                  required
                  className="form-input"
                  placeholder="e.g., 45 minutes"
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
          {lessons.length === 0 ? (
            <div className="no-lessons">No lessons available</div>
          ) : (
            lessons.map((lesson, index) => (
              <div key={lesson.$id} className="lesson-card">
                <div className="lesson-info">
                  <span className="lesson-number">Lesson {index + 1}</span>
                  <h3 className="lesson-title">{lesson.title}</h3>
                  <div className="lesson-meta">
                    <span className="lesson-type">{lesson.type}</span>
                    <span className="lesson-duration">{lesson.duration}</span>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails; 