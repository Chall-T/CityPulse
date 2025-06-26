import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Input, SelectPicker, DatePicker } from 'rsuite';
import { apiClient } from '../lib/ApiClient';
import { useAuthStore } from '../store/authStore';
import type { User, UpdateUser } from '../types/user';


const UserProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UpdateUser>({
        name: '',
        username: '',
        bio: null,
        avatarUrl: null
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch user data on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.getCurrentUser();
                setUser(response.data.user);
                setFormData({
                    name: response.data.name,
                    username: response.data.username || '', 
                    bio: response.data.bio || null,
                    avatarUrl: response.data.avatarUrl || null
                });
            } catch (error) {
                console.error('Error fetching user:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    const handleInputChange = (value: string, field: keyof UpdateUser) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            // Prepare the data to match UpdateUser type
            const updateData: UpdateUser = {
                name: formData.name,
                username: user?.username || '', // Provide fallback if username is undefined
                avatarUrl: user?.avatarUrl || null,
                bio: formData.bio || null,
            };

            const response = await apiClient.updateUserProfile(updateData);
            setUser(response.data);
            setEditMode(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            setErrors({ submit: 'Failed to update profile. Please try again.' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <p className="text-lg">User not found</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col items-center mb-6">
                    <Avatar
                        circle
                        size="lg"
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        className="mb-4"
                    />

                    {editMode ? (
                        <>
                            <Input
                                value={formData.name}
                                onChange={(value) => handleInputChange(value, 'name')}
                                placeholder="Full Name"
                                className="w-full mb-2"
                            />
                            {errors.name && <p className="text-red-500 text-sm mb-2">{errors.name}</p>}
                        </>
                    ) : (
                        <h2 className="text-xl font-bold text-center">{user.name}</h2>
                    )}

                    <div className="text-gray-500 text-sm mb-4">@{user.username}</div>

                    {editMode ? (
                        <Input
                            value={formData.username}
                            onChange={(value) => handleInputChange(value, 'username')}
                            placeholder="Username"
                            className="w-full mb-2"
                        />
                    ) : (
                        <div className="text-gray-600">{formData.username}</div>
                    )}
                    {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold mb-2">About</h3>
                    {editMode ? (
                        <Input
                            as="textarea"
                            value={formData.bio || ''}
                            onChange={(value) => handleInputChange(value, 'bio')}
                            placeholder="Tell others about yourself"
                            htmlSize={7}
                            className="w-full"
                            style={{ width: '100%' }}
                        />
                    ) : (
                        <p className="text-gray-600">{user.bio || 'No bio yet'}</p>
                    )}
                </div>

                <div className="pt-4 border-t">
                    {editMode ? (
                        <div className="flex gap-2">
                            <Button
                                appearance="primary"
                                onClick={handleSubmit}
                                className="w-full"
                            >
                                Save Changes
                            </Button>
                            <Button
                                appearance="default"
                                onClick={() => setEditMode(false)}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            appearance="primary"
                            onClick={() => setEditMode(true)}
                            className="w-full"
                        >
                            Edit Profile
                        </Button>
                    )}
                    {errors.submit && <p className="text-red-500 text-sm mt-2">{errors.submit}</p>}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;