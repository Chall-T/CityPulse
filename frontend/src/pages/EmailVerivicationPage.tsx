import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import config from '../lib/config';

export const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const res = await fetch(`${config.apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage(data.message || 'Verification failed. Please try again.');
        } else {
          setStatus('success');
          setMessage('Your email has been verified! Redirecting to login...');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-neutral-900 px-4">
      <div className="w-full max-w-xl sm:w-3/4 md:w-2/3 lg:w-1/2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xs p-6 sm:p-7 text-center">
        {status === 'pending' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Verifying Email...</h1>
            <p className="text-gray-600 dark:text-neutral-400">Please wait while we confirm your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">Email Verified!</h1>
            <p className="text-gray-600 dark:text-neutral-400">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Verification Failed</h1>
            <p className="text-gray-600 dark:text-neutral-400">{message}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-hidden"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
