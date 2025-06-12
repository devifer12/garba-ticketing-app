const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  const displayName = user?.displayName || user?.name || 'User';
  const email = user?.email;
  const photoURL = user?.photoURL || user?.profilePicture;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={displayName}
          className={`${sizes[size]} rounded-full object-cover border-2 border-navratri-orange/50`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-r from-navratri-orange to-navratri-yellow flex items-center justify-center text-white font-bold`}>
          {displayName.charAt(0)}
        </div>
      )}
      <div className="text-left">
        <p className="text-white font-medium">{displayName}</p>
        {email && <p className="text-slate-400 text-sm">{email}</p>}
      </div>
    </div>
  );
};

export default UserAvatar;