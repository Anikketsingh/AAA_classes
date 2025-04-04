import { useState, useEffect } from 'react';
import { databases, DATABASE_ID } from '../config/appwrite';
import { Query } from 'appwrite';
import '../styles/components.css';

const COURSES_COLLECTION_ID = '67e58e94003546802bb8';
const CAROUSEL_COLLECTION_ID = '67ef058800352a0744a5';

const CarouselManager = () => {
  const [courses, setCourses] = useState([]);
  const [carouselCourses, setCarouselCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all courses
      const coursesResponse = await databases.listDocuments(
        DATABASE_ID,
        COURSES_COLLECTION_ID
      );

      // Fetch carousel settings
      let carouselResponse;
      try {
        carouselResponse = await databases.listDocuments(
          DATABASE_ID,
          CAROUSEL_COLLECTION_ID
        );
      } catch (error) {
        console.error('Error fetching carousel collection:', error);
        // If the collection doesn't exist yet, use an empty array
        carouselResponse = { documents: [] };
      }

      // Get the list of course IDs that are in the carousel
      const carouselCourseIds = carouselResponse.documents.map(item => item.courseId);

      setCourses(coursesResponse.documents);
      setCarouselCourses(carouselCourseIds);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load courses or carousel settings');
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (courseId, isChecked) => {
    try {
      setSaving(true);
      setSaveMessage(null);

      if (isChecked) {
        // Add course to carousel
        await databases.createDocument(
          DATABASE_ID,
          CAROUSEL_COLLECTION_ID,
          'unique()',
          { courseId }
        );

        // Refresh data instead of just updating local state
        await fetchData();
        setSaveMessage('Course added to carousel');
      } else {
        // Find the carousel document with this courseId
        const carouselResponse = await databases.listDocuments(
          DATABASE_ID,
          CAROUSEL_COLLECTION_ID,
          [Query.equal('courseId', courseId)]
        );

        if (carouselResponse.documents.length > 0) {
          const documentId = carouselResponse.documents[0].$id;

          // Delete the document from carousel collection
          await databases.deleteDocument(
            DATABASE_ID,
            CAROUSEL_COLLECTION_ID,
            documentId
          );

          // Refresh data instead of just updating local state
          await fetchData();
          setSaveMessage('Course removed from carousel');
        } else {
          console.error('No carousel document found with courseId:', courseId);
          setSaveMessage('Error: Could not find course in carousel');
          // Refresh data to ensure UI is in sync with database
          await fetchData();
        }
      }
    } catch (error) {
      console.error('Error updating carousel:', error);
      setSaveMessage('Error updating carousel');
    } finally {
      setSaving(false);

      // Clear the message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    }
  };

  if (loading) {
    return <div className="carousel-loading">Loading courses...</div>;
  }

  if (error) {
    return <div className="carousel-error">{error}</div>;
  }

  return (
    <div className="carousel-manager">
      <div className="carousel-header">
        <h2 className="carousel-title">Carousel Management</h2>
        <p className="carousel-description">
          Select which courses should appear in the carousel.
        </p>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
          {saveMessage}
        </div>
      )}

      <div className="carousel-courses-list">
        {courses.length === 0 ? (
          <p>No courses available</p>
        ) : (
          courses.map(course => (
            <div key={course.$id} className="carousel-course-item">
              <label className="carousel-checkbox-label">
                <input
                  type="checkbox"
                  checked={carouselCourses.includes(course.$id)}
                  onChange={(e) => handleCheckboxChange(course.$id, e.target.checked)}
                  disabled={saving}
                  className="carousel-checkbox"
                  id={`carousel-checkbox-${course.$id}`}
                />
                <div className="carousel-course-info">
                  <div className="carousel-course-details">
                    <h3 className="carousel-course-title">{course.title}</h3>
                    <p className="carousel-course-instructor">By {course.instructor}</p>
                  </div>
                </div>
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CarouselManager;