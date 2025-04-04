import { useState, useEffect } from 'react';
import { databases, DATABASE_ID } from '../config/appwrite';
import CourseDetails from './CourseDetails';
import ImageUploader from './ImageUploader';
import '../styles/components.css';

const COURSES_COLLECTION_ID = '67e58e94003546802bb8';
const LESSONS_COLLECTION_ID = '67e5942e002d2c10b7b8';

const CourseManagement = ({ currentUser }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    instructor: currentUser?.name || '',
    teacherId: currentUser?.$id || '',
    duration: '',
    students: 0,
    price: 0,
    isPopular: false,
    isNew: true,
    image: ''
  });

  useEffect(() => {
    window.localStorage.removeItem('selectedCourseId');
    setSelectedCourseId(null);
    setShowAddForm(false);
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COURSES_COLLECTION_ID
      );
      setCourses(response.documents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCourse(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating new course with data:', newCourse);
      console.log('Image URL:', newCourse.image);

      await databases.createDocument(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        'unique()',
        newCourse
      );
      
      setNewCourse({
        title: '',
        instructor: currentUser?.name || '',
        teacherId: currentUser?.$id || '',
        duration: '',
        totalLessons: 0,
        students: 0,
        price: 0,
        isPopular: false,
        isNew: true
      });
      
      setShowAddForm(false);
      fetchCourses();
    } catch (error) {
      console.error('Error adding course:', error);
      setError('Failed to add course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all associated lessons.')) {
      try {
        const lessonsResponse = await databases.listDocuments(
          DATABASE_ID,
          LESSONS_COLLECTION_ID
        );

        const courseLessons = lessonsResponse.documents.filter(
          lesson => lesson.courseId === courseId
        );

        for (const lesson of courseLessons) {
          await databases.deleteDocument(
            DATABASE_ID,
            LESSONS_COLLECTION_ID,
            lesson.$id
          );
        }

        await databases.deleteDocument(
          DATABASE_ID,
          COURSES_COLLECTION_ID,
          courseId
        );

        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Failed to delete course');
      }
    }
  };

  const handleBack = () => {
    setSelectedCourseId(null);
    window.localStorage.removeItem('selectedCourseId');
    fetchCourses();
  };

  if (selectedCourseId) {
    return (
      <CourseDetails 
        courseId={selectedCourseId} 
        onBack={handleBack}
      />
    );
  }

  if (loading) {
    return <div className="courses-loading">Loading courses...</div>;
  }

  if (error) {
    return <div className="courses-error">{error}</div>;
  }

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h2 className="courses-title">My Courses</h2>
        <button 
          className="filter-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Course'}
        </button>
      </div>

      {showAddForm && (
        <form className="course-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Course Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newCourse.title}
                onChange={handleInputChange}
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
                name="duration"
                value={newCourse.duration}
                onChange={handleInputChange}
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
                name="price"
                value={newCourse.price}
                onChange={handleInputChange}
                required
                className="form-input"
                min="0"
                step="0.01"
                placeholder="Course price"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isPopular"
                  checked={newCourse.isPopular}
                  onChange={handleInputChange}
                />
                Mark as Popular
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isNew"
                  checked={newCourse.isNew}
                  onChange={handleInputChange}
                />
                Mark as New
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Course Thumbnail Image</label>
            <ImageUploader
              onUploadComplete={(imageUrl) => {
                console.log('Image upload completed in CourseManagement. URL:', imageUrl);
                setNewCourse({
                  ...newCourse,
                  image: imageUrl
                });
              }}
              onUploadError={(errorMessage) => {
                setError(errorMessage);
                setTimeout(() => setError(null), 3000);
              }}
            />
            {newCourse.image && (
              <p className="image-url-preview">Image URL: {newCourse.image}</p>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              Create Course
            </button>
            <button type="button" className="cancel-button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="no-courses">No courses available</div>
        ) : (
          courses.map((course) => (
            <div key={course.$id} className="course-card-simple">
              <div className="course-image-container">
                {course.image ? (
                  <img src={course.image} alt={course.title} className="course-image" />
                ) : (
                  <div className="course-image-placeholder">
                    <span>300</span>
                    <span>×</span>
                    <span>150</span>
                  </div>
                )}
              </div>
              <div className="course-card-simple-content">
                <h3 className="course-card-simple-title">{course.title}</h3>
                <div className="course-card-simple-stats">
                  <span className="course-students">{course.students} Students</span>
                  <span className="course-lessons">{course.totalLessons} Lessons</span>
                </div>
                <div className="course-card-simple-actions">
                  <button 
                    className="edit-course-button"
                    onClick={() => setSelectedCourseId(course.$id)}
                  >
                    Edit Course
                  </button>
                  <button 
                    className="delete-course-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCourse(course.$id);
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
    </div>
  );
};

export default CourseManagement; 