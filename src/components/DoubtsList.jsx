import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, DOUBTS_COLLECTION_ID, account } from '../config/appwrite';
import DoubtReplies from './DoubtReplies';
import '../styles/components.css';
import { Query } from 'appwrite';

const DoubtsList = () => {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedDoubt, setExpandedDoubt] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending'); // Default to showing pending doubts
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchDoubts();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const user = await account.get();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      setCurrentUser(null);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      // Fetch user details from the Users collection
      const response = await databases.listDocuments(
        DATABASE_ID,
        '67e58e94003546802bb8', // USERS_COLLECTION_ID
        [
          Query.equal('$id', userId)
        ]
      );
      
      if (response.documents.length > 0) {
        return response.documents[0].name;
      }
      return 'Unknown User';
    } catch (error) {
      console.error('Error fetching user details:', error);
      return 'Unknown User';
    }
  };

  const fetchDoubts = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        DOUBTS_COLLECTION_ID
      );

      // Fetch replies and user details for each doubt
      const doubtsWithStatus = await Promise.all(
        response.documents.map(async (doubt) => {
          const [replies, userName] = await Promise.all([
            databases.listDocuments(
              DATABASE_ID,
              '67e64c40003e69974dcb', // REPLIES_COLLECTION_ID
              [
                Query.equal('doubtId', doubt.$id)
              ]
            ),
            fetchUserDetails(doubt.userId)
          ]);

          // Mark as resolved if there's at least one teacher reply
          const hasTeacherReply = replies.documents.some(reply => reply.isTeacherReply);

          // Get the latest activity timestamp (either the latest reply or the doubt creation time)
          let latestActivityTime = new Date(doubt.$createdAt).getTime();
          if (replies.documents.length > 0) {
            const latestReplyTime = Math.max(...replies.documents.map(reply =>
              new Date(reply.$createdAt).getTime()
            ));
            latestActivityTime = Math.max(latestActivityTime, latestReplyTime);
          }

          return {
            ...doubt,
            userName,
            resolved: hasTeacherReply,
            priority: doubt.priority || 'medium', // Default to medium if not set
            replies: replies.documents,
            latestActivityTime: latestActivityTime,
            hasRecentActivity: (Date.now() - latestActivityTime) < (24 * 60 * 60 * 1000) // Activity in last 24 hours
          };
        })
      );
      
      setDoubts(doubtsWithStatus);
      setLoading(false);
      console.log('Fetched doubts:', doubtsWithStatus.length);
    } catch (error) {
      console.error('Error fetching doubts:', error);
      setError('Failed to load doubts');
      setLoading(false);
    }
  };

  const handleDoubtClick = (doubtId, event) => {
    if (!event.target.closest('.replies-container') && 
        !event.target.closest('.doubt-card-actions')) {
      setExpandedDoubt(expandedDoubt === doubtId ? null : doubtId);
    }
  };

  const filteredDoubts = () => {
    let filtered = [...doubts]; // Create a copy to avoid issues
    console.log('Filtering doubts, current filter:', activeFilter);
    console.log('Total doubts before filtering:', filtered.length);

    // Apply status filter
    if (activeFilter === 'pending') {
      // Show all doubts without a teacher reply in the pending section
      filtered = filtered.filter(doubt => !doubt.resolved);
    }
    // 'all' case - don't filter

    // Sort doubts by the latest reply date or creation date if no replies
    filtered.sort((a, b) => {
      // Get the latest reply date for each doubt
      const aLatestReply = a.replies && a.replies.length > 0
        ? Math.max(...a.replies.map(reply => new Date(reply.$createdAt).getTime()))
        : new Date(a.$createdAt).getTime();

      const bLatestReply = b.replies && b.replies.length > 0
        ? Math.max(...b.replies.map(reply => new Date(reply.$createdAt).getTime()))
        : new Date(b.$createdAt).getTime();

      // Sort in descending order (latest first)
      return bLatestReply - aLatestReply;
    });

    console.log('Doubts after filtering and sorting:', filtered.length);
    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Format as: DD MMM YYYY, HH:MM
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  const handleFilterChange = (filter) => {
    console.log('Changing filter to:', filter);
    setActiveFilter(filter);
    setShowFilterMenu(false);
  };

  if (loading) {
    return <div className="doubts-loading">Loading doubts...</div>;
  }

  if (error) {
    return <div className="doubts-error">{error}</div>;
  }

  const displayDoubts = filteredDoubts();
  console.log('Displaying doubts:', displayDoubts.length);

  return (
    <div className="doubts-container">
      <div className="doubts-header">
        <h2 className="doubts-title">
          {activeFilter === 'pending' ? 'Pending Student Doubts' : 'All Student Doubts'}
        </h2>
        <div className="filter-dropdown">
          <button 
            className="filter-button"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <i className="filter-icon"></i>
            + Filter
          </button>
          {showFilterMenu && (
            <div className="filter-menu">
              <button 
                className={`filter-option ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button
                className={`filter-option ${activeFilter === 'pending' ? 'active' : ''}`}
                onClick={() => handleFilterChange('pending')}
              >
                Pending Replies
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="doubts-list">
        {displayDoubts.length === 0 ? (
          <div className="no-doubts">No doubts found matching your criteria</div>
        ) : (
          displayDoubts.map((doubt) => (
            <div
              key={doubt.$id}
              className={`doubt-card ${expandedDoubt === doubt.$id ? 'expanded' : ''} ${doubt.hasRecentActivity ? 'recent-activity' : ''}`}
              onClick={(e) => handleDoubtClick(doubt.$id, e)}
            >
              <div className="doubt-header">
                <div className="user-avatar">{doubt.userName ? doubt.userName.charAt(0) : '?'}</div>
                <div className="doubt-user-name">{doubt.userName}</div>
                <div className="doubt-course">{doubt.courseName || 'Unknown Course'}</div>
                <div className="doubt-date">
                  {doubt.hasRecentActivity && <span className="recent-badge">New</span>}
                  {formatDate(doubt.latestActivityTime ? new Date(doubt.latestActivityTime) : doubt.$createdAt)}
                </div>
              </div>

              <h4 className="doubt-title">{doubt.title || 'No Title'}</h4>
              <p className="doubt-content">{doubt.content || 'No content provided'}</p>

              <div className="doubt-card-actions" onClick={e => e.stopPropagation()}>
                {!doubt.resolved && (
                  <button className="reply-button" onClick={() => setExpandedDoubt(doubt.$id)}>
                    Reply
                  </button>
                )}
              </div>

              {expandedDoubt === doubt.$id && (
                <div onClick={e => e.stopPropagation()}>
                  <DoubtReplies 
                    doubtId={doubt.$id} 
                    currentUser={currentUser}
                    userName={currentUser ? currentUser.name : ''} 
                    onReplyAdded={fetchDoubts}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoubtsList; 