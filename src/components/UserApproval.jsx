import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, USER_METADATA_COLLECTION_ID } from '../config/appwrite';
import { Query } from 'appwrite';
import '../styles/userApproval.css';

const UserApproval = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Using constants imported from config

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        USER_METADATA_COLLECTION_ID,
        [
          Query.equal('isApproved', false) // Only fetch users that are not approved yet
        ]
      );

      // Log the response to see what data we're getting
      console.log('User data:', response.documents);

      setUsers(response.documents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again later.');
      setLoading(false);
    }
  };

  const approveUser = async (userId, documentId) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        USER_METADATA_COLLECTION_ID,
        documentId,
        {
          isApproved: true
        }
      );
      
      // Update the local state to remove the approved user from the list
      setUsers(users.filter(user => user.$id !== documentId));
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Failed to approve user. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-approval-container">
      <div className="user-approval-header">
        <h2>User Approval</h2>
        <button
          className="refresh-button"
          onClick={fetchUsers}
          title="Refresh user list"
        >
          🔄 Refresh
        </button>
      </div>

      {users.length === 0 ? (
        <p>No pending users to approve.</p>
      ) : (
        <div className="users-list">
          {users.map(user => (
            <div key={user.$id} className="user-card">
              <div className="user-info">
                <h3>{user.username || 'No Username'}</h3>
                <p className="user-email">{user.email || 'No Email'}</p>
                <p className="user-id">User ID: {user.userId}</p>
                <p className="user-created">Created: {new Date(user.$createdAt).toLocaleString()}</p>
              </div>
              <div className="user-actions">
                <button
                  className="approve-button"
                  onClick={() => approveUser(user.userId, user.$id)}
                >
                  Approve User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserApproval;