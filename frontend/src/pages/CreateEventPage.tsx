import React, { useEffect, useState, useCallback } from 'react';
import { useFilterStore } from '../store/eventStore';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { InputPicker, DatePicker, InputNumber, Uploader, Button, TagPicker, Stack } from 'rsuite';

import SpinnerIcon from '@rsuite/icons/legacy/Spinner';
import debounce from 'lodash/debounce';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ coords, zoom }: { coords: [number, number] | null, zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords) {
      map.setView(coords, zoom, { animate: true });
    }
  }, [coords, zoom, map]);
  return null;
}


interface LocationItem {
  label: string;
  value: string;
  coords: [number, number];
  type: string;
  osm_key: string;
  osm_value: string;
}

const contactEmail = import.meta.env.VITE_APP_CONTACT_EMAIL;
const appVersion = import.meta.env.VITE_APP_VERSION;



const useLocations = (defaultLocations: LocationItem[] = []) => {
  const [locations, setLocations] = React.useState<LocationItem[]>(defaultLocations);
  const [loading, setLoading] = React.useState(false);

  const fetchLocations = (query: string | number | boolean) => {
    if (!query || typeof query !== 'string') return setLocations([]);
    setLoading(true);

    // Photon API – better at handling fuzzy address queries
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query + ', Berlin')}&limit=5&lang=en`, {
      headers: {
        'User-Agent': `CityPulse/${appVersion} (${contactEmail})`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        const transformedLocations = data.features.map((feature: any) => {
          const props = feature.properties;

          const type = props.type || '';
          const osm_key = props.osm_key || '';
          const osm_value = props.osm_value || '';

          const street = props.street || '';
          const housenumber = props.housenumber || '';
          const postcode = props.postcode || '';      // ← grab the postal code if it exists
          const city = props.city || '';
          const country = props.country || '';
          const name = props.name || '';


          // Build label parts in the desired order:
          if (["railway"].includes(osm_key)) return null
          const labelParts: string[] = [];
          // if (["city", "street", "district", "other"].includes(type)) labelParts.push(name)
          if (name) labelParts.push(name);
          // if (osm_key == "tourism" && osm_value == "attraction") {
          //   labelParts.push(name);
          // } else {
          //   if (street) labelParts.push(street + (housenumber ? ` ${housenumber}` : ''));
          // }
          if (street) labelParts.push(street + (housenumber ? ` ${housenumber}` : ''));
          if (postcode) labelParts.push(postcode);
          if (city) labelParts.push(city);
          if (country) labelParts.push(country);



          return {
            label: labelParts.join(', '),  // e.g. "Bernauer Straße 112, 13355, Berlin, Germany"
            value: `${feature.geometry.coordinates[1].toFixed(6)},${feature.geometry.coordinates[0].toFixed(6)}`,
            coords: [
              feature.geometry.coordinates[1],
              feature.geometry.coordinates[0],
            ] as [number, number],
            type,
            osm_key,
            osm_value
          };
        }).filter((loc:any) => loc !== null);

        setLocations(transformedLocations);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return [locations, loading, fetchLocations] as const;
};


function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadius = 6371000; // meters
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadius * c; // distance in meters
  return distance;
}


const CreateEventPage: React.FC = () => {
  // Form state
  const now = new Date()
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState<Date | undefined>(undefined);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState('');       // Address string
  const [coords, setCoords] = useState<[number, number] | null>(null); // [lat, lon]
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [jsonResult, setJsonResult] = useState<any>(null);
  const [zoom, setZoom] = useState(12);
  const [originalCoords, setOriginalCoords] = useState<[number, number] | null>(null);
  const [maxPinMovable, setMaxPinMovable] = useState<number>(100);
  // Categories (from store)
  const { categories, fetchCategories } = useFilterStore();
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const [locations, loading, fetchLocations] = useLocations();

  // Images mapping (category ID to stock image URLs)
  const stockImagesByCat: { [catId: string]: string[] } = {
    // Example static mapping; replace with your actual category IDs and image URLs
    '1': ['https://source.unsplash.com/400x300/?concert', 'https://source.unsplash.com/400x300/?music'],
    '2': ['https://source.unsplash.com/400x300/?art', 'https://source.unsplash.com/400x300/?exhibition'],
    '3': ['https://source.unsplash.com/400x300/?food', 'https://source.unsplash.com/400x300/?restaurant'],
    '4': ['https://source.unsplash.com/400x300/?sports', 'https://source.unsplash.com/400x300/?stadium'],
    // Add more as needed
  };
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Berlin bounds (SW and NE corners for restricting the map/marker)
  const berlinBounds: [[number, number], [number, number]] = [
    [52.30, 13.00], // Southwest lat, lon
    [52.70, 13.90]  // Northeast lat, lon
  ];


  const handleMarkerDrag = (event: any) => {

    const marker = event.target;
    const position = marker.getLatLng();

    if (!originalCoords) {
      // fallback if somehow originalCoords not set
      setCoords([position.lat, position.lng]);
      return;
    }

    const dist = getDistanceMeters(
      originalCoords[0],
      originalCoords[1],
      position.lat,
      position.lng
    );

    if (dist > maxPinMovable) {
      // Reset marker position to original
      marker.setLatLng(originalCoords);
      alert(`You can only move the pin within ${maxPinMovable} meters of the original location.`);
    } else {
      setCoords([position.lat, position.lng]);
    }
  };

  // Toggle category selection (max 4)
  const handleCategoryChange = (catIds: string[]) => {
    setErrors(prev => ({ ...prev, categories: '' }));
    setSelectedImage(''); // reset image if categories change
    if (catIds.length <= 4) {
      setSelectedCats(catIds);
    } else {
      setErrors(prev => ({ ...prev, categories: 'You can select up to 4 categories only' }));
    }
  };

  // Handle image selection
  const handleImageClick = (url: string) => {
    setSelectedImage(prev => (prev === url ? '' : url));
  };

  // Form submission (prepare JSON without sending to server)
  const handleSubmit = () => {
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
    if (!location.trim()) {
      newErrors.location = 'Location is required';
      valid = false;
    }
    if (!coords) {
      newErrors.location = 'Please set a location on the map';
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

    // Prepare JSON result
    const eventData = {
      title,
      description,
      dateTime,
      location,
      lat: coords![0],
      lng: coords![1],
      capacity: capacity || undefined,
      categoryIds: selectedCats,
      imageUrl: selectedImage || undefined
    };
    setJsonResult(eventData);
  };

  const debouncedFetchLocations = useCallback(
    debounce((val: string) => {
      fetchLocations(val);
    }, 1000),
    []
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Create New Event</h1>

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
          rows={4}
          className="mt-1 p-2 border w-full rounded"
        />
        {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
      </div>

      {/* Location Input */}

      <div>
        <label className="block text-sm font-medium text-gray-700">Location (Berlin only)</label>
        <div className="flex space-x-2 mt-1">
          <InputPicker
            data={locations}
            style={{ width: '100%' }}
            menuStyle={{ zIndex: 20000 }}  // rsuite supports menuStyle prop
            labelKey="label"
            valueKey="value"
            placement="auto"
            onSearch={debouncedFetchLocations}
            shouldDisplayCreateOption={() => false}
            searchBy={() => true}
            onChange={(val) => {
              const selectedLocation = locations.find(loc => loc.value === val);
              if (selectedLocation) {
                setLocation(selectedLocation.label);
                setCoords(selectedLocation.coords);
                setOriginalCoords(selectedLocation.coords);

                let zoomLevel = 15;
                let radius = 100;

                switch (selectedLocation.type) {
                  case 'city':
                    zoomLevel = 12;
                    radius = 5000
                    break;
                  case 'street':
                    zoomLevel = 16;
                    radius = 1000
                    break;
                  case 'district':
                  case 'suburb':
                    zoomLevel = 13;
                    radius = 1000;
                    break;
                  case 'house':
                    zoomLevel = 18;
                    radius = 50
                    switch (selectedLocation.osm_key){
                      case 'amenity':
                        zoomLevel = 17;
                        radius = 50
                        break;
                      default:
                        zoomLevel = 18;
                        radius = 50
                    }
                    break;
                  case 'other':
                    zoomLevel = 13;
                    radius = 1000
                    break;
                  default:
                    zoomLevel = 15;
                    radius = 100
                }
                
                setMaxPinMovable(radius)
                setZoom(zoomLevel);
              }
            }}
          />
        </div>

        <div className="mt-4">
          <MapContainer
            center={coords || [52.52, 13.405]}
            zoom={zoom}
            scrollWheelZoom={false}
            className="w-full h-64 rounded-lg border"
            maxBounds={[[52.3383, 13.0884], [52.6755, 13.7611]]} // Berlin bounds
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {coords && (
              <Marker
                position={coords}
                draggable={true}
                eventHandlers={{ dragend: handleMarkerDrag }}
              >
                <Popup>Drag to adjust location</Popup>
              </Marker>
            )}
            {originalCoords && (
              <Circle
                center={originalCoords}
                radius={maxPinMovable}
                pathOptions={{ color: 'blue', fillColor: 'lightblue', fillOpacity: 0.2 }}
              />
            )}
            <MapUpdater coords={coords} zoom={zoom} />
          </MapContainer>
        </div>
        
        {errors.location && <p className="text-red-600 text-sm">{errors.location}</p>}
      </div>

      {/* Date & Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Date and Time
        </label>
        <DatePicker
          format="MM/dd/yyyy HH:mm"
          placeholder="Set the date and time of your event"
          value={dateTime}
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
            onChange={(val) =>
              setCapacity(val ? parseInt(val.toString()) : undefined)
            }
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

      {/* Image Selection (from stock images of chosen categories) */}
      {selectedCats.length > 0 && (
        <div>
          <span className="block text-sm font-medium text-gray-700">
            Select an Image (assigned to chosen categories)
          </span>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {selectedCats.flatMap(catId =>
              (stockImagesByCat[catId] || []).map((url, idx) => (
                <div
                  key={catId + '-' + idx}
                  onClick={() => handleImageClick(url)}
                  className={`cursor-pointer border rounded overflow-hidden ${selectedImage === url ? 'border-blue-500' : ''
                    }`}
                >
                  <img src={url} alt="Event" className="w-full h-32 object-cover" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Event (Prepare JSON)
        </button>
      </div>

      {/* JSON Result Output */}
      {jsonResult && (
        <div className="mt-6 p-4 bg-gray-100 border rounded">
          <h2 className="font-semibold mb-2">Event JSON Data:</h2>
          <pre className="text-sm bg-white p-2 border rounded">
            {JSON.stringify(jsonResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CreateEventPage;
