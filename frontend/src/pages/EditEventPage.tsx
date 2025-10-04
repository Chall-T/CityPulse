import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker, InputNumber, TagPicker } from 'rsuite';
import type { Event } from '../types';
import { searchStockImages } from '../assets/images/';
import { useFilterStore } from '../store/eventStore';
import { apiClient } from '../lib/ApiClient';


const EditEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const now = new Date();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState<Date | undefined>(undefined);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const { categories, fetchCategories } = useFilterStore();
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const [stockImages, setStockImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [randomSeed] = useState(() => Math.random().toString(36).substring(2, 15));
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Fetch event data on mount
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await apiClient.getEventById(eventId!);
        if (response.data) {
          const event: Event = response.data;
          setTitle(event.title);
          setDescription(event.description);
          setDateTime(new Date(event.dateTime));
          setCapacity(event.capacity || undefined);
          setSelectedCats(event.categories.map(cat => cat.id) || []);
          setSelectedImage(event.imageUrl || '');

        }
      } catch (error) {
        console.error("Error fetching event data:", error);
        navigate(`/events/${eventId}`, { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
    fetchCategories();
  }, [eventId, fetchCategories, navigate]);

  // Images mapping
  useEffect(() => {
    if (selectedCats.length > 0) {
      setIsLoadingImages(true);
      const fetchImages = async () => {
        try {
          const images = await searchStockImages(
            title,
            categories.filter(c => selectedCats.includes(c.id)),
            randomSeed
          );
          const uniqueImages = [...new Set(images)];
          
          // Include the existing image if it's not in the stock images
          if (selectedImage && !uniqueImages.includes(selectedImage)) {
            uniqueImages.unshift(selectedImage);
          }
          
          setStockImages(uniqueImages);
        } catch (error) {
          console.error("Error fetching stock images:", error);
        } finally {
          setIsLoadingImages(false);
        }
      };

      fetchImages();
    } else {
      setStockImages([]);
    }
  }, [selectedCats, title, categories, selectedImage]);


  const handleCategoryChange = (catIds: string[]) => {
    setErrors(prev => ({ ...prev, categories: '' }));
    if (catIds.length <= 4) {
      setSelectedCats(catIds);
    } else {
      setErrors(prev => ({ ...prev, categories: 'You can select up to 4 categories only' }));
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(prev => (prev === url ? '' : url));
  };

  const handleSubmit = async () => {
    let valid = true;
    const newErrors: { [key: string]: string } = {};
    setErrors({});
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
      valid = false;
    }
    if (!description.trim() || description.length < 30) {
      newErrors.description = 'Description is required (min 30 characters)';
      valid = false;
    }
    if (!dateTime) {
      newErrors.dateTime = 'Date and time are required';
      valid = false;
    }
    if (selectedCats.length === 0) {
      newErrors.categories = 'Select at least one category';
      valid = false;
    }
    
    if (!valid) {
      setErrors(newErrors);
      return;
    }

    try {
      const trimmedUrl = selectedImage.startsWith(apiClient.baseURL) ? selectedImage.slice(apiClient.baseURL.length) : selectedImage;
      const eventData = {
        title,
        description,
        dateTime: dateTime?.toISOString() ?? '',
        capacity: capacity || null,
        categoryIds: selectedCats,
        imageUrl: trimmedUrl || null
      };
      
      const result = await apiClient.updateEvent(eventId!, eventData);
      if (result.status === 200 || result.status === 204) {
        navigate(`/events/${eventId}`);
      }
    } catch (error) { 
      console.error("Error updating event:", error);
      setErrors({ submit: 'Failed to update event. Please try again.' });
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Event title"
          className="mt-1 p-2 border w-full rounded"
        />
        {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description (min 30 chars)
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={10}
          className="mt-1 p-2 border w-full rounded"
        />
        {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
      </div>

      {/* Location Input */}


      {/* Date & Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Date and Time
        </label>
        <DatePicker
          format="MM/dd/yyyy HH:mm"
          placeholder="Set the date and time of your event"
          value={dateTime}
          placement="auto"
          menuStyle={{ zIndex: 20000 }}
          onChange={(val) => setDateTime(val as Date)}
          appearance="default"
          style={{ width: '100%' }}
          shouldDisableDate={(date) => {
            return date < now;
          }}
        />
        {errors.dateTime && <p className="text-red-600 text-sm">{errors.dateTime}</p>}
      </div>

      {/* Capacity (optional) */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700">
          Capacity (optional)
        </label>
        <div className="w-full">
          <InputNumber
            max={50}
            min={2}
            value={capacity}
            onChange={(val) => setCapacity(val ? parseInt(val.toString()) : undefined)}
            className="!w-full"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Categories (up to 4) */}
      <div>
        <span className="block text-sm font-medium text-gray-700">
          Categories (select up to 4)
        </span>
        <div className="w-full">
          <TagPicker
            placeholder="Select Categories"
            data={categories.map((cat) => ({
              label: `${cat.emoji} ${cat.name}`,
              value: cat.id
            }))}
            placement="auto"
            menuStyle={{ zIndex: 20000 }}
            value={selectedCats}
            onChange={(val) => handleCategoryChange(val)}
            className="!w-full"
            style={{ width: '100%' }}
            disabledItemValues={
              selectedCats.length >= 4
                ? categories
                  .map((cat) => cat.id)
                  .filter((id) => !selectedCats.includes(id))
                : []
            }
          />
        </div>
        {errors.categories && <p className="text-red-600 text-sm">{errors.categories}</p>}
      </div>

      {/* Image Selection */}
      {selectedCats.length > 0 && (
        <div>
          <span className="block text-sm font-medium text-gray-700">
            Select an Image
          </span>
          {isLoadingImages ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : stockImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 mt-2">
              {Array.from(new Set(stockImages)).map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  onClick={() => handleImageClick(image)}
                  className={`cursor-pointer border rounded overflow-hidden relative ${
                    selectedImage === image ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <img
                    src={`${apiClient.baseURL}${image}`}
                    alt={`Event image ${index}`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      // (e.target as HTMLImageElement).src = 'fallback-image-url.jpg';
                      console.log(image)
                      console.log(e)
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm mt-2">
              No images found for selected categories.
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 flex space-x-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Update Event
        </button>
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
      {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}
    </div>
  );
};

export default EditEventPage;