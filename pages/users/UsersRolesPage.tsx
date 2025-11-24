import React, { useEffect, useState, useCallback } from 'react';
import { User, UserRole, ModalType } from '../../types';
import { userService } from '../../services/userService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';

const UsersRolesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserForEdit, setCurrentUserForEdit] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Omit<User, 'id' | 'token'>>({
    username: '', email: '', role: UserRole.GeneralStaff,
  });

  const { hasPermission } = useAuth();
  const canManageUsersRoles = hasPermission('canManageUsersRoles');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(`Failed to fetch users: ${err.message}`);
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setCurrentUserForEdit(user);
      setUserForm({ username: user.username, email: user.email, role: user.role });
    } else {
      setCurrentUserForEdit(null);
      setUserForm({ username: '', email: '', role: UserRole.GeneralStaff });
    }
    setIsModalOpen(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (currentUserForEdit) {
        await userService.updateUser({ ...userForm, id: currentUserForEdit.id } as User);
        alert('User updated successfully!');
      } else {
        await userService.addUser(userForm);
        alert('User added successfully!');
      }
      fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(`Failed to save user: ${err.message}`);
      console.error('Save user error:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!canManageUsersRoles) {
      alert('You do not have permission to delete users.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (err: any) {
      setError(`Failed to delete user: ${err.message}`);
      console.error('Delete user error:', err);
    }
  };

  const userColumns = [
    { key: 'username', header: 'Username', className: 'font-semibold' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (user: User) => (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold
        ${user.role === UserRole.Owner ? 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100' :
          user.role === UserRole.Admin ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' :
          user.role === UserRole.Manager ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
          'bg-gray-100 text-gray-800 dark:bg-[#4C769A] dark:text-[#F5F0E1]'
        }`}
      >
        {user.role}
      </span>
    )},
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => canManageUsersRoles ? (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openUserModal(user)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => deleteUser(user.id)}>Delete</Button>
        </div>
      ) : null,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading users...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Users & Roles Management</h1>

      {error && <div className="p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg mb-4 text-xl">{error}</div>}

      <div className="flex justify-end mb-6">
        {canManageUsersRoles && (
          <Button variant="primary" size="lg" onClick={() => openUserModal()}>
            + Add New User
          </Button>
        )}
      </div>

      <Table columns={userColumns} data={users} emptyMessage="No users found." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentUserForEdit ? 'Edit User' : 'Add New User'}
        size="md"
      >
        <form onSubmit={saveUser}>
          <Input label="Username" name="username" value={userForm.username} onChange={handleFormChange} required />
          <Input label="Email" name="email" type="email" value={userForm.email} onChange={handleFormChange} required />
          <Select
            label="Role"
            name="role"
            value={userForm.role}
            onChange={handleFormChange}
            options={Object.values(UserRole).map(role => ({ value: role, label: role }))}
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersRolesPage;