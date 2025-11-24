import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Language } from '../../types';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { hasPermission } = useAuth();
  const canManageSettings = hasPermission('canManageSettings');

  const [generalSettings, setGeneralSettings] = useState({
    hotelName: 'HotelNest Grand',
    defaultCurrency: 'INR',
    gstRate: 18, // percentage
    defaultLanguage: 'en' as Language,
  });

  const handleGeneralSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const saveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) {
      alert('You do not have permission to save settings.');
      return;
    }
    // In a real app, this would send data to a backend API
    console.log('Saving general settings:', generalSettings);
    alert('General settings saved successfully (simulated)!');
  };

  return (
    <div className="p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Application Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings Card */}
        <Card title="General Settings">
          <form onSubmit={saveGeneralSettings}>
            <Input
              label="Hotel Name"
              name="hotelName"
              value={generalSettings.hotelName}
              onChange={handleGeneralSettingChange}
              disabled={!canManageSettings}
            />
            <Select
              label="Default Currency"
              name="defaultCurrency"
              value={generalSettings.defaultCurrency}
              onChange={handleGeneralSettingChange}
              options={[{ value: 'INR', label: 'Indian Rupee (INR)' }, { value: 'USD', label: 'US Dollar (USD)' }]}
              disabled={!canManageSettings}
            />
            <Input
              label="Default GST Rate (%)"
              name="gstRate"
              type="number"
              value={generalSettings.gstRate}
              onChange={handleGeneralSettingChange}
              min="0"
              max="100"
              step="0.1"
              disabled={!canManageSettings}
            />
            <Select
              label="Default Language"
              name="defaultLanguage"
              value={generalSettings.defaultLanguage}
              onChange={handleGeneralSettingChange}
              options={[{ value: 'en', label: 'English' }, { value: 'kn', label: 'Kannada' }]}
              disabled={!canManageSettings}
            />
            {canManageSettings && (
              <Button type="submit" variant="primary" size="lg" className="mt-4">
                Save General Settings
              </Button>
            )}
          </form>
        </Card>

        {/* User Interface Settings Card */}
        <Card title="User Interface Settings">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-[#F5F0E1] mb-3">Theme</h3>
            <div className="flex gap-4 items-center">
              <Button
                variant={theme === 'light' ? 'primary' : 'secondary'}
                size="lg"
                onClick={() => setTheme('light')}
              >
                ☀️ Light Mode
              </Button>
              <Button
                variant={theme === 'dark' ? 'primary' : 'secondary'}
                size="lg"
                onClick={() => setTheme('dark')}
              >
                🌙 Dark Mode
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-[#F5F0E1] mb-3">Font Size (Conceptual)</h3>
            <p className="text-lg text-gray-700 dark:text-[#C7C0B0]">
              This application is designed with large, tablet-friendly fonts by default.
              Font size adjustment can be implemented here if needed.
            </p>
            {/* Example of a font size selector if implemented */}
            {/* <Select
              label="Text Size"
              name="textSize"
              value="md"
              onChange={() => {}}
              options={[
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
              ]}
            /> */}
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-[#F5F0E1] mb-3">Accessibility</h3>
            <p className="text-lg text-gray-700 dark:text-[#C7C0B0]">
              High contrast UI is applied by default in both light and dark modes for better readability.
            </p>
          </div>
        </Card>
      </div>

      {/* Placeholder for other settings like Audit Logs, API Integrations, etc. */}
      {/* <Card title="Advanced Settings" className="mt-6">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Audit Logs</h3>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          All critical operations are logged for auditing purposes.
          <Button variant="secondary" size="md" className="ml-4">View Audit Logs</Button>
        </p>

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Printer Configuration</h3>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Configure POS and invoice printers here. Auto-print functionality is enabled for compatible printers.
        </p>
      </Card> */}
    </div>
  );
};

export default SettingsPage;