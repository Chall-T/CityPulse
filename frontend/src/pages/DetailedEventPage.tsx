import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../lib/ApiClient';
import { useAuthStore } from '../store/authStore';
import type { Event, Message } from '../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import UserProfileIcon from '../components/UserProfileIcon';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const contactEmail = import.meta.env.VITE_APP_CONTACT_EMAIL;
const appVersion = import.meta.env.VITE_APP_VERSION;
const baseUrl = import.meta.env.VITE_GEOCODING_API;

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { isAuthenticated } = useAuthStore();
  console.log(messages)
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.getEventById(id);
        const eventData: Event = res.data;
        setEvent(res.data);

        // Handle coordinates
        if (eventData.coords !== null) {
          setCoords([eventData.lat, eventData.lng]);
        } else {
          const geoRes = await fetch(
            `${baseUrl}?format=json&q=${encodeURIComponent(eventData.location)}`,
            {
              headers: {
                'User-Agent': `CityPulse/${appVersion} (${contactEmail})`,
              },
            }
          );
          const geoData = await geoRes.json();
          if (Array.isArray(geoData) && geoData.length > 0) {
            setCoords([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError(err.message || 'Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };


    fetchEvent();
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;

    try {
      const res = await apiClient.createMessage(id, newMessage);
      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-600">{error || 'Event not found.'}</p>
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Event Title */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">{event.title}</h1>

        {event.creator && (
          <div className="flex items-center space-x-3 bg-gray-100 px-3 py-2 rounded-lg shadow-sm">
            <UserProfileIcon
              avatarUrl={event.creator.avatarUrl}
              username={event.creator.username}
              onClick={() => console.log('Creator profile clicked')}
            />
            <div>
              <p className="text-gray-800 font-medium">{event.creator.name}</p>
              <p className="text-gray-500 text-sm">@{event.creator.username}</p>
            </div>
          </div>
        )}
      </div>

      {/* Event Image */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <img
          src={event?.imageUrl || '/missingEventBig.png'}
          alt={event?.title || 'Event image'}
          className="w-full h-64 object-cover rounded-xl shadow-lg border border-gray-200"
        />
        {!event?.imageUrl && (
          <p className="text-center text-sm mt-2 text-gray-500 italic">
            No event image provided
          </p>
        )}
      </div>

      {/* Event Description */}
      <p className="text-gray-700 leading-relaxed">{event.description}</p>

      {/* Date & Time */}
      <p className="text-gray-600">
        <span className="font-semibold">Date & Time:</span>{' '}
        {new Date(event.dateTime).toLocaleString()}
      </p>

      {/* Location Address */}
      <p className="text-gray-600">
        <span className="font-semibold">Location:</span> {event.location}
      </p>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {event.categories.map((cat) => (
          <span
            key={cat.id}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </span>
        ))}
      </div>
      
      {/* OpenStreetMap Map (if coords are available) */}
      {coords && (
        <div className="mt-6">
          <MapContainer
            center={coords}
            zoom={13}
            scrollWheelZoom={false}
            className="w-full h-64 rounded-lg shadow"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={coords}>
              <Popup>{event.title}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {/* Chat Placeholder (shown only if user is authenticated) */}
      {isAuthenticated() && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chat</h2>
          <div className="border rounded-lg bg-gray-50 p-4 space-y-4">
            {/* Messages Container (empty for now) */}
            <div className="h-48 overflow-y-auto p-2 bg-white border rounded">
              {/* Real chat messages will be appended here once WebSocket is implemented */}
              <p className="text-gray-500 italic">No messages yet.</p>
            </div>

            {/* Input + Send Button */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;