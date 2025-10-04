import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { apiClient } from '../lib/ApiClient';
import { useAuthStore } from '../store/authStore';
import type { Event, Message } from '../types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import UserProfileIcon from '../components/UserProfileIcon';
import ReportButton from '../components/ReportButton';
import 'leaflet/dist/leaflet.css';



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
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const { isAuthenticated, user } = useAuthStore();
  const [attendanceStatus, setAttendanceStatus] = useState<boolean>(false);
  const [attendingLoading, setAttendingLoading] = useState(false);
  const [showAttendeesPopup, setShowAttendeesPopup] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);

  const [showReportMenu, setShowReportMenu] = useState(false);
  const reportMenuRef = useRef<HTMLDivElement | null>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowAttendeesPopup(false);
      }
    };

    if (showAttendeesPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttendeesPopup]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target as Node)) {
        setShowReportMenu(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowReportMenu(false);
    };

    if (showReportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showReportMenu]);


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
        setEvent(eventData);
        if (eventData.rsvps && user && user.id) {
          const isAttending = eventData.rsvps.some(rsvp => rsvp.user.id === user.id);
          setAttendanceStatus(isAttending); // true or false
        }

        // Handle coordinates
        if (eventData.lat != null && eventData.lng != null) {
          setCoords([eventData.lat, eventData.lng]);
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

  useEffect(() => {
    if (!event) {
      return;
    }

    // If event already has coordinates, set them & mark loading done
    if (event.lat != null && event.lng != null) {
      setCoords([event.lat, event.lng]);
      return;
    }

    if (event.location) {

      setGeoLoading(true);

      fetch(`${baseUrl}?format=json&q=${encodeURIComponent(event.location)}`, {
        headers: {
          'User-Agent': `CityPulse/${appVersion} (${contactEmail})`,
        },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`Geocoding API error: ${res.status} ${res.statusText}`);

          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('Non-JSON response from geocoding API:', text);
            throw new Error('Unexpected response from geocoding API');
          }

          return res.json();
        })
        .then((geoData) => {
          if (Array.isArray(geoData) && geoData.length > 0) {
            setCoords([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)]);
          } else {
            console.warn('No geocoding results found');
            setCoords(null);  // Make sure coords is null if none found
          }
        })
        .catch((err) => {
          console.error('Geocoding error:', err);
          setCoords(null);
        })
    }
  }, [event]);


  function Recenter({ coords }: { coords: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
      if (coords) {
        map.setView(coords, map.getZoom(), { animate: true });
      }
    }, [coords, map]);

    return null;
  }

  const handleAttendanceUpdate = async (status: boolean) => {
    if (!id) return;

    try {
      setAttendingLoading(true);
      await apiClient.updateAttendance(id, status);
      setAttendanceStatus(status);

      setEvent((prevEvent) => {
        if (!prevEvent) return prevEvent;
        if (!prevEvent.rsvps) return prevEvent;
        if (!user) return prevEvent;

        const userAlreadyRSVPed = prevEvent.rsvps.some(rsvp => rsvp.user.id === user.id);

        let newRsvps;
        if (status) {
          // If user wants to attend & not already in the list, add them
          if (!userAlreadyRSVPed) {
            newRsvps = [...prevEvent.rsvps, { user: { id: user.id, name: user.name || '', username: user.username, avatarUrl: user.avatarUrl || '' } }];
          } else {
            newRsvps = prevEvent.rsvps;
          }
        } else {
          // If user wants to leave, remove their RSVP
          newRsvps = prevEvent.rsvps.filter(rsvp => rsvp.user.id !== user.id);
        }

        return {
          ...prevEvent,
          rsvps: newRsvps,
        };
      });
    } catch (err) {
      console.error("Failed to update attendance:", err);
    } finally {
      setAttendingLoading(false);
    }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;

    try {
      const res = await apiClient.createMessage(id, newMessage);
      setMessages((prev) => [...prev, res.data.message]);
      messages;
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };
  handleSendMessage();


  const handleVote = async (value: number) => {
    if (isAuthenticated() === false) {
      navigate('/login');
    }
    if (!id || !user) return;

    try {
      // Send vote to backend
      await apiClient.voteOnEvent(id, value);

      // Update local event state
      setEvent((prev) => {
        if (!prev) return prev;

        // Ensure votes array exists
        const votes = prev.votes ? [...prev.votes] : [];

        // Remove any previous vote by this user
        const filteredVotes = votes.filter((v) => v.userId !== user.id);

        // Add new vote
        filteredVotes.push({ userId: user.id, value });

        return {
          ...prev,
          votes: filteredVotes,
        };
      });
    } catch (err) {
      console.error("Failed to vote:", err);
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
        <h1 className="text-5xl font-bold text-gray-800 max-w-[100%] break-words">{event.title}</h1>
      </div>

      {/* Report Event */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-4">
        {event.creator && (
          <div className="flex items-center space-x-3 rounded-lg ">
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
        {/* Voting */}
        <div className="flex items-center justify-center gap-3 mt-6 ">

              <button
                onClick={() => handleVote(1)}
                className="p-2 rounded-full bg-gray-100 hover:bg-green-100 transition"
                title="Upvote"
              >
                <span className="text-green-600 text-xl">👍</span>
              </button>

              <span className="text-lg font-bold text-gray-800">
                {event.votes?.reduce((sum, v) => sum + v.value, 0) || 0}
              </span>

              <button
                onClick={() => handleVote(-1)}
                className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition"
                title="Downvote"
              >
                <span className="text-red-600 text-xl">👎</span>
              </button>


        </div>
        {isAuthenticated() && (
          <ReportButton id={event.id} />
        )}

      </div>
    

      {/* Event Image */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <img
          src={`${apiClient.baseURL}${event?.imageUrl}` || '/missingEventBig.png'}
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
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>

      {/* Date & Time */}
      <p className="text-gray-600">
        <span className="font-semibold">Date & Time:</span>{' '}
        {new Date(event.dateTime).toLocaleString()}
      </p>

      {/* Location Address */}
      <p className="text-gray-600">
        <span className="font-semibold">Location:</span> {event.location}
      </p>

      <p
        onClick={() => setShowAttendeesPopup(true)}
        className="text-gray-600 cursor-pointer hover:underline select-none"
        title="Click to see attendees"
      >
        <span className="font-semibold">Attendees:</span>{' '}
        {event.rsvps?.length || 0} {event.capacity ? `/ ${event.capacity}` : ''}
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

      <div className="mt-6 relative w-full h-64 rounded-lg shadow">
        {geoLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <p className="text-white text-xl font-bold">Loading map coordinates...</p>
          </div>
        )}
        <MapContainer
          center={coords ?? [52.52, 13.405]}  // Berlin fallback
          zoom={13}                           // Fixed zoom, no zoom change on coords update
          scrollWheelZoom={false}
          className="w-full h-full rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {coords && (
            <Marker position={coords}>
              <Popup>{event.title}</Popup>
            </Marker>
          )}
          <Recenter coords={coords} />
        </MapContainer>

      </div>


      {isAuthenticated() && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => handleAttendanceUpdate(true)}
            disabled={
              attendanceStatus === true ||
              attendingLoading ||
              !!(event.capacity && event.rsvps && event.rsvps.length >= event.capacity)
            }
            className={`px-5 py-2 rounded-full font-medium transition ${attendanceStatus === true
              ? "bg-green-600 text-white cursor-not-allowed"
              : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
          >
            I'LL BE THERE
          </button>

          <button
            onClick={() => handleAttendanceUpdate(false)}
            disabled={attendanceStatus === false || attendingLoading}
            className={`px-5 py-2 rounded-full font-medium transition ${attendanceStatus === false
              ? "bg-red-600 text-white cursor-not-allowed"
              : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
          >
            NOPE
          </button>
        </div>
      )}
      {event.rsvps && event.rsvps.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              if (!isAuthenticated()) {
                navigate('/login');
                return;
              }
              setShowAttendeesPopup(true);
            }}
            className="text-blue-600 underline hover:text-blue-800"
          >
            See who's coming ({event.rsvps.length})
          </button>
        </div>
      )}

      {showAttendeesPopup && event.rsvps && (
        <div className="fixed inset-0 z-[1000] bg-black bg-opacity-10 flex items-center justify-center">
          <div
            ref={popupRef}
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Attendees ({event.rsvps.length})
              </h2>
              <button
                onClick={() => setShowAttendeesPopup(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              {event.rsvps.map(({ user }) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <UserProfileIcon
                    avatarUrl={user.avatarUrl}
                    username={user.username}
                    onClick={() => console.log(`Clicked ${user.username}`)}
                  />
                  <div>
                    <p className="font-medium text-gray-800">{user.name || user.username}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* {isAuthenticated() && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chat</h2>
          <div className="border rounded-lg bg-gray-50 p-4 space-y-4">
            <div className="h-48 overflow-y-auto p-2 bg-white border rounded">
              <p className="text-gray-500 italic">No messages yet.</p>
            </div>
            {event.status === 'ACTIVE' &&
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
            }
          </div>
        </div>
      )} */}
    </div>
  );
};

export default EventDetailPage;