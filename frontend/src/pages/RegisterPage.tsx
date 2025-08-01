import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/ApiClient';
import { useAuthStore } from '../store/authStore';
import config from '../lib/config';

export const RegistrationPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' })); // Clear field error on change
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Terms and Conditions.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    try {
      const res = await apiClient.register(formData.email, formData.password);

      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      if (err?.response && err.response.data) {
        console.error(err.response.data.error.message);
        setSubmitError(err.response.data.error.message || 'Registration failed. Please try again.');
      } else {
        setSubmitError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-xl mt-7 bg-white border border-gray-200 rounded-xl shadow-2xs dark:bg-neutral-900 dark:border-neutral-700 w-1/2 mx-auto bg-gray-200 p-4">
      <div className="p-4 sm:p-7">
        <div className="text-center">
          <h1 className="block text-2xl font-bold text-gray-800 dark:text-white">Sign up</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
            Already have an account?
            <a className="text-blue-600 hover:underline dark:text-blue-500 cursor-pointer" onClick={() => navigate('/login')}>
              Sign in here
            </a>
          </p>
        </div>

        <div className="mt-5">
          <button type="button" onClick={() => window.location.href = `${config.apiUrl}/auth/google`} className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800">
            <svg className="w-4 h-auto" width="46" height="47" viewBox="0 0 46 47" fill="none">
              <path d="M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z" fill="#4285F4" />
              <path d="M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z" fill="#34A853" />
              <path d="M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z" fill="#FBBC05" />
              <path d="M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z" fill="#EB4335" />
            </svg>
            Sign up with Google
          </button>

          <div className="py-3 flex items-center text-xs text-gray-400 uppercase before:flex-1 before:border-t before:border-gray-200 before:me-6 after:flex-1 after:border-t after:border-gray-200 after:ms-6 dark:text-neutral-500 dark:before:border-neutral-600 dark:after:border-neutral-600">Or</div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-y-4">
              <div>
                <label htmlFor="email" className="block text-sm mb-2 dark:text-white">Email address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`py-2.5 px-4 block w-full border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400`}
                />
                {errors.email && <p className="text-xs text-red-600 mt-2">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm mb-2 dark:text-white">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`py-2.5 px-4 block w-full border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400`}
                />
                {errors.password && <p className="text-xs text-red-600 mt-2">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm mb-2 dark:text-white">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`py-2.5 px-4 block w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400`}
                />
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-2">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-center">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className={`shrink-0 mt-0.5 border ${errors.acceptTerms ? 'border-red-500' : 'border-gray-200'} rounded-sm text-blue-600 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700`}
                />
                <label htmlFor="acceptTerms" className="ml-3 text-sm dark:text-white">
                  I accept the <a href="#" className="text-blue-600 hover:underline dark:text-blue-500">Terms and Conditions</a>
                </label>
              </div>
              {errors.acceptTerms && <p className="text-xs text-red-600 mt-2">{errors.acceptTerms}</p>}

              {submitError && <p className="text-xs text-red-600 text-center">{submitError}</p>}

              <button type="submit" className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none">
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


export default RegistrationPage