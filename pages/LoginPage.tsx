import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authService } from '../services/authService';
import { useAuthStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/common/Card';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await authService.login(username, password);
      login(user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#1F2D3A] p-4 md:p-8">
      <div className="relative w-full max-w-md bg-white dark:bg-[#3B5974] rounded-xl shadow-2xl p-6 md:p-10 border border-gray-200 dark:border-[#2A3C4C]">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-700 dark:text-[#C7C0B0]">
            {theme === 'light' ? '☀️' : '🌙'}
          </Button>
        </div>
        <h1 className="text-4xl font-extrabold text-center text-blue-600 dark:text-[#5C86AA] mb-8">
          HotelNest Login
        </h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
            className="text-lg md:text-xl"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            className="text-lg md:text-xl"
          />
          {error && <p className="text-red-600 dark:text-red-400 text-base mb-4">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-6 text-xl md:text-2xl"
          >
            Login
          </Button>
        </form>
        <p className="mt-8 text-center text-gray-600 dark:text-[#C7C0B0] text-base md:text-lg">
          Hint: Try `owner`, `admin`, `manager`, `cashier`, `staff`, or `ca` with password <strong>password</strong> (all lowercase).
        </p>
      </div>
    </div>
  );
};

export default LoginPage;