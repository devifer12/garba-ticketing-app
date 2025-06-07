import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const UserStateDebug = () => {
  const { user, backendUser, loading, syncInProgress } = useAuth();

  useEffect(() => {
    console.log('🐛 User State Debug:', {
      timestamp: new Date().toISOString(),
      firebaseUser: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      } : null,
      backendUser: backendUser ? {
        firebaseUID: backendUser.firebaseUID,
        email: backendUser.email,
        name: backendUser.name,
        _id: backendUser._id
      } : null,
      loading,
      syncInProgress
    });
  }, [user, backendUser, loading, syncInProgress]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-md">
      <h4 className="font-bold mb-2">🐛 Debug Info</h4>
      <div className="space-y-1">
        <div>
          <strong>Firebase:</strong> {user ? `${user.email} (${user.uid})` : 'None'}
        </div>
        <div>
          <strong>Backend:</strong> {backendUser ? `${backendUser.email} (${backendUser.firebaseUID})` : 'None'}
        </div>
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Syncing:</strong> {syncInProgress ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  );
};

export default UserStateDebug;