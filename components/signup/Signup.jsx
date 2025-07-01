"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiCalendar, FiPhone, FiLock } from 'react-icons/fi';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.dob,
        formData.phone
      );
      router.push('/login');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join us today
          </p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          {/* Names container */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="firstName"
                required
                placeholder="First Name"
                className="w-full px-10 py-2 border border-gray-300 rounded-lg text-center"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="relative flex-1">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="lastName"
                required
                placeholder="Last Name"
                className="w-full px-10 py-2 border border-gray-300 rounded-lg text-center"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              required
              placeholder="Email address"
              className="w-full px-10 py-2 border border-gray-300 rounded-lg text-center"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="dob"
              required
              placeholder="Date of Birth"
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = 'text'
              }}
              className="w-full px-10 py-2 border border-gray-300 rounded-lg text-center"
              value={formData.dob}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              name="phone"
              required
              placeholder="Phone Number"
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit phone number"
              className="w-full px-10 py-2 border border-gray-300 rounded-lg text-center"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              name="password"
              required
              placeholder="Password"
              className="w-full px-10 py-2 border border-gray-300 rounded-lg text-center"
              value={formData.password}
              onChange={handleChange}
              minLength="6"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 ease-in-out"
          >
            {loading ? 'Processing...' : 'Sign up'}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
