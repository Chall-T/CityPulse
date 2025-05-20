
import config from '../lib/config';
const GoogleLogin = () => {
  // const login = useAuthStore((state) => state.login);

  const handleGoogleLogin = async () => {
    try {
      // Redirect user to Google OAuth2 login page
      const googleLoginUrl = `${config.apiUrl}/auth/google`;
      window.location.href = googleLoginUrl;
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
    >
      Login with Google
    </button>
  );
};

export default GoogleLogin;
