import { useState, useEffect } from 'react';
import { databases, DATABASE_ID } from '../config/appwrite';
import { Query } from 'appwrite';
import '../styles/components.css';

const REPLIES_COLLECTION_ID = '67e64c40003e69974dcb';
const USERS_COLLECTION_ID = '67e58e94003546802bb8';

const DoubtReplies = ({ doubtId, currentUser, userName, onReplyAdded }) => {
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userNames, setUserNames] = useState({}); // Cache for user names

  useEffect(() => {
    if (doubtId) {
      fetchReplies();
    } else {
      setReplies([]);
      setLoading(false);
    }
  }, [doubtId]);

  // Function to fetch user details by ID
  const fetchUserName = async (userId) => {
    // Check if we already have this user's name in cache
    if (userNames[userId]) {
      return userNames[userId];
    }

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('$id', userId)]
      );

      if (response.documents.length > 0) {
        const name = response.documents[0].name;
        // Update the cache
        setUserNames(prev => ({...prev, [userId]: name}));
        return name;
      }
      return 'Unknown User';
    } catch (error) {
      console.error('Error fetching user details:', error);
      return 'Unknown User';
    }
  };

  const fetchReplies = async () => {
    try {
      if (!doubtId) {
        console.error('No doubtId provided');
        setError('Cannot load replies: Missing doubt ID');
        setLoading(false);
        return;
      }

      console.log('Fetching replies for doubtId:', doubtId);

      const response = await databases.listDocuments(
        DATABASE_ID,
        REPLIES_COLLECTION_ID,
        [
          // Query to filter replies by doubtId
          Query.equal('doubtId', doubtId)
        ]
      );

      console.log('Replies fetched:', response.documents.length);

      // Fetch user names for each reply
      const repliesWithUserNames = await Promise.all(
        response.documents.map(async (reply) => {
          // Fetch the user name if we don't have it cached
          if (!userNames[reply.userId]) {
            await fetchUserName(reply.userId);
          }
          return reply;
        })
      );

      setReplies(repliesWithUserNames);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching replies:', error);
      setError('Failed to load replies');
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || !currentUser) return;
    if (!doubtId) {
      setError('Cannot add reply: Missing doubt ID');
      return;
    }

    try {
      // Create a reply object with the specific doubtId
      const replyData = {
        doubtId: doubtId, // Explicitly set the doubtId to ensure correct association
        userId: currentUser.$id,
        content: newReply.trim(),
        isTeacherReply: currentUser.labels && currentUser.labels.includes('teacher') || false // Dynamically determine if it's a teacher reply
      };

      const newReplyDoc = await databases.createDocument(
        DATABASE_ID,
        REPLIES_COLLECTION_ID,
        'unique()',
        replyData
      );

      console.log('New reply added:', newReplyDoc.$id);
      setNewReply('');
      await fetchReplies(); // Refresh the replies list

      // Notify parent component to update doubt status and re-sort the list
      if (onReplyAdded) {
        onReplyAdded();
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply');
    }
  };

  if (loading) {
    return <div className="replies-loading">Loading replies...</div>;
  }

  if (error) {
    return <div className="replies-error">{error}</div>;
  }

  if (!currentUser) {
    return <div className="replies-error">Please log in to reply</div>;
  }

  return (
    <div className="replies-container">
      <h3 className="replies-title">Replies</h3>
      
      <div className="replies-list">
        {!doubtId ? (
          <p className="no-replies">Select a doubt to view replies</p>
        ) : replies.length === 0 ? (
          <p className="no-replies">No replies yet for this doubt</p>
        ) : (
          replies.map((reply) => (
            <div
              key={reply.$id}
              className={`reply-card ${reply.isTeacherReply ? 'teacher-reply' : ''}`}
            >
              <div className="reply-content">{reply.content}</div>
              <div className="reply-meta">
                <span className="reply-badge">
                  {reply.isTeacherReply ? 'Teacher' : 'Student'}
                </span>
                <span className="reply-user">
                  {userNames[reply.userId] || 'User'}
                </span>
                <span className="reply-date">
                  {new Date(reply.$createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {doubtId && (
        <form className="reply-form" onSubmit={handleSubmitReply}>
          <textarea
            className="reply-input"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Write your reply..."
            rows="3"
            required
          />
          <button type="submit" className="reply-button">
            Post Reply
          </button>
        </form>
      )}
    </div>
  );
};

export default DoubtReplies; 