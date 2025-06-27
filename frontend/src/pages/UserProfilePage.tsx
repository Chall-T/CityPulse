import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Input } from 'rsuite';
import { apiClient } from '../lib/ApiClient';
import { useAuthStore } from '../store/authStore';
import type { User, UpdateUser } from '../types/user';
import type { Event } from '../types/event';
import { EventCard } from '../components/EventCard';
import Swal from 'sweetalert2'

const UserProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UpdateUser>({
        name: '',
        username: '',
        bio: null,
        avatarUrl: null
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [userEvents, setUserEvents] = useState<Event[]>([]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await apiClient.getCurrentUser();
                const fetchedUser = response.data.user;
                setUser(fetchedUser);
                setFormData({
                    name: fetchedUser.name || '',
                    username: fetchedUser.username || '',
                    bio: fetchedUser.bio || null,
                    avatarUrl: fetchedUser.avatarUrl || null
                });
                setUserEvents(fetchedUser.events || []);
            } catch (error) {
                console.error('Error fetching user or events:', error);
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
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const updateData: UpdateUser = {
                name: formData.name,
                username: formData.username,
                avatarUrl: formData.avatarUrl,
                bio: formData.bio
            };
            if (!user) return
            const response = await apiClient.updateUserProfile(user?.id, updateData);
            setUser(response.data);
            setEditMode(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            setErrors({ submit: 'Failed to update profile. Please try again.' });
        }
    };

    const handleCancelEvent = async (eventId: string) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, cancel it!"
        });

        if (result.isConfirmed) {
            try {
                await apiClient.cancelEvent(eventId);
                Swal.fire({
                    title: "Canceled!",
                    text: "Your event has been canceled.",
                    icon: "success"
                });
                const userResponse = await apiClient.getCurrentUser();
                setUserEvents(userResponse.data.user.events);
            } catch (error) {
                console.error('Failed to cancel event:', error);
                Swal.fire({
                    title: "Error!",
                    text: "Failed to cancel the event. Please try again.",
                    icon: "error"
                });
            }
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

    const now = new Date();
    const activeEvents = userEvents.filter(e => e.status === 'ACTIVE' && new Date(e.dateTime) >= now);
    const inactiveEvents = userEvents.filter(e => e.status !== 'ACTIVE' || new Date(e.dateTime) < now);

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
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
                        <>
                            <Input
                                value={formData.username}
                                onChange={(value) => handleInputChange(value, 'username')}
                                placeholder="Username"
                                className="w-full mb-2"
                            />
                            {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
                        </>
                    ) : (
                        <div className="text-gray-600">{formData.username}</div>
                    )}
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
                        <p className="text-gray-600 whitespace-pre-line">{user.bio || 'No bio yet'}</p>
                    )}
                </div>

                <div className="pt-4 border-t">
                    {editMode ? (
                        <div className="flex gap-2">
                            <Button appearance="primary" onClick={handleSubmit} className="w-full">
                                Save Changes
                            </Button>
                            <Button appearance="default" onClick={() => setEditMode(false)} className="w-full">
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button appearance="primary" onClick={() => setEditMode(true)} className="w-full">
                            Edit Profile
                        </Button>
                    )}
                    {errors.submit && <p className="text-red-500 text-sm mt-2">{errors.submit}</p>}
                </div>
            </div>

            {/* My Events Section */}
            <div className="mt-12">
                <h3 className="text-2xl font-semibold mb-4">My Events</h3>

                {userEvents.length === 0 ? (
                    <p className="text-gray-500">You haven't created any events yet.</p>
                ) : (
                    <>
                        {/* Active */}
                        <div className="mb-8">
                            <h4 className="text-xl font-semibold text-green-700 mb-4">Active Events</h4>
                            <div className="flex flex-wrap gap-4">
                                {activeEvents.map((event) => (
                                    <div key={event.id} className="relative">
                                        <EventCard event={event} />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <Button
                                                appearance="primary"
                                                size="md"
                                                className="px-6 py-2"
                                                onClick={() => navigate(`/events/${event.id}/edit`)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                appearance="ghost"
                                                color="red"
                                                size="md"
                                                className="px-6 py-2 bg-red-200/50 text-red font-semibold border border-red-500"
                                                // style={{ backgroundColor: 'rgba(255, 0, 0, 0.22)' }}
                                                onClick={() => handleCancelEvent(event.id)}
                                            >
                                                Cancel
                                            </Button>


                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Inactive */}
                        <div>
                            <h4 className="text-xl font-semibold text-gray-500 mb-4">Archived / Canceled</h4>
                            <div className="flex flex-wrap gap-4">
                                {inactiveEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="opacity-70"
                                    >
                                        <EventCard event={event} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfilePage;
