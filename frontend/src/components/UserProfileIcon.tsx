import React, { useState } from 'react';

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
  username: string;
  onClick?: () => void;
  refProp?: React.Ref<HTMLDivElement>;
  size?: number;
}

const UserProfileIcon: React.FC<UserProfileIconProps> = ({
  avatarUrl,
  username,
  onClick,
  refProp,
  size = 36, // default to 36px if not provided
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowImage = avatarUrl && !imageFailed;

  return (
    <div
      ref={refProp}
      onClick={onClick}
      className="rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold text-white select-none cursor-pointer"
      style={{
        width: size,
        height: size,
        backgroundColor: stringToColor(username),
        fontSize: size / 2.5, // scale text size with avatar
      }}
    >
      {shouldShowImage ? (
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        username[0].toUpperCase()
      )}
    </div>
  );
};

export default UserProfileIcon;
