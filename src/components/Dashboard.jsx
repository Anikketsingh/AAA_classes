import { useState, useEffect } from 'react';
import { account } from '../config/appwrite';
import DoubtsList from './DoubtsList';
import CourseManagement from './CourseManagement';
import '../styles/components.css';

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [forceReset, setForceReset] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSectionChange = (section) => {
    if (section === 'courses') {
      window.localStorage.removeItem('selectedCourseId');
      setForceReset(Date.now());
    }
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <section className="doubts-section">
            <DoubtsList />
          </section>
        );
      case 'courses':
        return <CourseManagement currentUser={user} key={forceReset} />;
      default:
        return <div>Section under development</div>;
    }
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <h2>AAA Classes</h2>
          </div>
        </div>
        <nav className="sidebar-menu">
          <ul>
            <li>
              <button
                className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleSectionChange('dashboard')}
              >
                <i className="nav-icon dashboard-icon"></i>
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                className={`nav-item ${activeSection === 'courses' ? 'active' : ''}`}
                onClick={() => handleSectionChange('courses')}
              >
                <i className="nav-icon courses-icon"></i>
                <span>My Courses</span>
              </button>
            </li>
            <li>
              <button className="nav-item" onClick={handleLogout}>
                <i className="nav-icon logout-icon"></i>
                <span>Sign Out</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="content">
        <header className="header">
          <h1>Hey {user?.name || 'User'}</h1>
        </header>

        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard; 