import React from 'react';

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 50%)`;
  return color;
}

interface UserProfileIconProps {
  avatarUrl?: string | null;
  username: string;  // Usually first letter of name/username
  onClick?: () => void;
  refProp?: React.Ref<HTMLDivElement>;
}

const UserProfileIcon: React.FC<UserProfileIconProps> = ({ avatarUrl, username, onClick, refProp }) => {
  return (
    <div
      ref={refProp}
      onClick={onClick}
      className="w-9 h-9 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center text-sm font-semibold text-white select-none cursor-pointer"
      style={{
        backgroundColor: stringToColor(username),
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        username[0].toUpperCase()
      )}
    </div>
  );
};

export default UserProfileIcon;