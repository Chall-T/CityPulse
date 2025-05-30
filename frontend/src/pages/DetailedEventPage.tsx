import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../lib/ApiClient';
import { useAuthStore } from '../store/authStore';
import type { Event, Message } from '../types';
import { CalendarDays, MapPin } from 'lucide-react';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!id) {
          console.error('Event ID is required');
          return;
        }
        const res = await apiClient.getEventById(id);
        console.log('Fetched event:', res.data);
        setEvent(res.data);
        // setMessages(res.data.event.messages ?? []);
      } catch (err) {
        console.error('Failed to fetch event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
        if (!id) {
          console.error('Event ID is required');
          return;
        }
      const res = await apiClient.createMessage(id, newMessage);

      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading event...</p>;
  if (!event) return <p className="text-center mt-10">Event not found.</p>;

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-8">
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-64 object-cover rounded-2xl pointer-events-none select-none"
          draggable={false}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <CalendarDays className="w-5 h-5" />
          {new Date(event.dateTime).toLocaleString()}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-5 h-5" />
          {event.location}
        </div>
      </div>

      <p className="text-lg text-gray-700">{event.description}</p>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Chat</h2>

        <div className="bg-gray-100 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="bg-white rounded-lg p-2 shadow">
                <p className="text-sm text-gray-800">{msg.content}</p>
                <p className="text-xs text-gray-400 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>

        {isAuthenticated() && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 border rounded-xl px-4 py-2"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default EventDetailPage;
