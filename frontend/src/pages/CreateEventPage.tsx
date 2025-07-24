import React, { useEffect, useState, useCallback } from 'react';
import { useFilterStore } from '../store/eventStore';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, Polygon } from 'react-leaflet';
import { InputPicker, DatePicker, InputNumber, TagPicker } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { searchStockImages } from '../assets/images/';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../lib/ApiClient';
import OneLineLoader from '../components/Loader/OneLine';
import Swal from 'sweetalert2'
import MD5 from 'crypto-js/md5';
import { all } from 'axios';
import { set } from 'lodash';


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
          const osm_id = props.osm_id || 0;
          const osm_type = props.osm_type || '';
          const osm_key = props.osm_key || '';
          const osm_value = props.osm_value || '';

          const street = props.street || '';
          const housenumber = props.housenumber || '';
          const postcode = props.postcode || '';
          const city = props.city || '';
          const country = props.country || '';
          const name = props.name || '';


          if (city && city.toLowerCase() !== "berlin") return null;

          if (["railway"].includes(osm_key)) return null

          const labelParts: string[] = [];
          if (name) labelParts.push(name);
          if (street) labelParts.push(street + (housenumber ? ` ${housenumber}` : ''));
          if (postcode) labelParts.push(postcode);
          if (city) labelParts.push(city);
          if (country) labelParts.push(country);



          return {
            label: labelParts.join(', '),  //  address or place
            value: `${feature.geometry.coordinates[1].toFixed(6)},${feature.geometry.coordinates[0].toFixed(6)}`,
            coords: [
              feature.geometry.coordinates[1],
              feature.geometry.coordinates[0],
            ] as [number, number],
            type,
            osm_type,
            osm_id,
            osm_key,
            osm_value
          };
        }).filter((loc: any) => loc !== null);

        setLocations(transformedLocations);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return [locations, loading, fetchLocations] as const;
};

function fetchOverpassData(osm_type: string, osm_id: number): Promise<any> {
  let osm_type_name = ''
  switch (osm_type) {
    case 'N':
      osm_type_name = 'node';
      break;
    case 'W':
      osm_type_name = 'way';
      break;
    case 'R':
      osm_type_name = 'relation';
      break;
    default:
      console.error('Unsupported OSM type:', osm_type);
      return Promise.resolve(null);
  }
  const query = `[out:json];${osm_type_name}(${osm_id});out tags;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  return fetch(url)
    .then(res => res.json())
    .catch(err => {
      console.error('Failed fetching Overpass data:', err);
      return null;
    });
}
interface OsmMember {
  type: string;
  ref: string;
  role: string;
}

interface OsmObject {
  type: string;
  id: string;
  visible?: string;
  version?: string;
  changeset?: string;
  timestamp?: string;
  user?: string;
  uid?: string;
  tags: Record<string, string>;
  nodes?: string[];
  members?: OsmMember[];
}

function fetchOSMData(osm_type: string, osm_id: number): Promise<OsmObject | null> {
  let osm_type_name = ''
  switch (osm_type) {
    case 'N':
      osm_type_name = 'node';
      break;
    case 'W':
      osm_type_name = 'way';
      break;
    case 'R':
      osm_type_name = 'relation';
      break;
    default:
      console.error('Unsupported OSM type:', osm_type);
      return Promise.resolve(null);
  }

  const url = `https://api.openstreetmap.org/api/0.6/${osm_type_name}/${osm_id}`;

  return fetch(url)
    .then(res => res.text())
    .then(str => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(str, "application/xml");
      const osmObject = xml.querySelector(osm_type_name);
      if (!osmObject) return null;

      // Extract attributes
      const attrs: Partial<OsmObject> = {};
      for (const attr of Array.from(osmObject.attributes)) {
        (attrs as any)[attr.name] = attr.value;
      }

      // Extract tags
      const tags: Record<string, string> = {};
      osmObject.querySelectorAll('tag').forEach(tag => {
        const k = tag.getAttribute('k');
        const v = tag.getAttribute('v');
        if (k && v) tags[k] = v;
      });

      // Extract nodes if way
      let nodes: string[] | undefined;
      if (osm_type_name === 'way') {
        nodes = [];
        osmObject.querySelectorAll('nd').forEach(nd => {
          const ref = nd.getAttribute('ref');
          if (ref) nodes!.push(ref);
        });
      }

      // Extract members if relation
      let members: OsmMember[] | undefined;
      if (osm_type_name === 'relation') {
        members = [];
        osmObject.querySelectorAll('member').forEach(m => {
          const type = m.getAttribute('type');
          const ref = m.getAttribute('ref');
          const role = m.getAttribute('role');
          if (type && ref && role !== null) {
            members!.push({ type, ref, role });
          }
        });
      }

      return {
        type: osm_type_name,
        id: attrs.id!,
        visible: attrs.visible,
        version: attrs.version,
        changeset: attrs.changeset,
        timestamp: attrs.timestamp,
        user: attrs.user,
        uid: attrs.uid,
        tags,
        nodes,
        members
      };
    })
    .catch(err => {
      console.error('Failed fetching OSM data:', err);
      return null;
    });

}

async function fetchWikiData(id: string): Promise<any> {
  const response = await apiClient.getWikiData(id);
  return response.data;
}


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
  const now = new Date()
  const navigate = useNavigate()
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState<Date | undefined>(undefined);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState('');
  const [locationDetailed, setLocationDetailed] = useState<{ [key: string]: any }>({});
  const [coords, setCoords] = useState<[number, number] | null>([52.510885, 13.3989367]); // Berlin
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [zoom, setZoom] = useState(12);
  const [originalCoords, setOriginalCoords] = useState<[number, number] | null>(null);
  const [maxPinMovable, setMaxPinMovable] = useState<number>(100);
  const [defaultImage] = useState("/missingEvent.png");


  const { categories, fetchCategories } = useFilterStore();
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const [locations, loading, fetchLocations] = useLocations();

  const [stockImages, setStockImages] = useState<string[]>([defaultImage]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const [randomSeed] = useState(() => Math.random().toString(36).substring(2, 15));
  const [typingLocation, setTypingLocation] = useState<boolean>(false);


  const [wayCoords, setWayCoords] = useState([]);
  const [wikiDataImages, setWikiDataImages] = useState<string[]>([]);

  // images with fetchOverpassData
  // useEffect(() => {
  //   if (locationDetailed.osm_type && locationDetailed.osm_id && isLoadingImages == false) {
  //     setIsLoadingImages(true);
  //     console.log("Fetching Overpass data for:", locationDetailed.osm_type, locationDetailed.osm_id);
  //     fetchOSMData(locationDetailed.osm_type, locationDetailed.osm_id).then(data => {
  //       console.log("OSM Data:", data);
  //     });
  //     const overpassData = fetchOverpassData(locationDetailed.osm_type, locationDetailed.osm_id);
  //     overpassData.then(data => {
  //       if (data && data.elements && data.elements.length > 0) {
  //         for (const element of data.elements) {
  //           if (element.tags) {
  //             if (element.tags['wikidata']) {
  //               fetchWikiData(element.tags['wikidata']).then(wikiData => {
  //                 if (wikiData && wikiData.entities) {
  //                   const entity = wikiData.entities[element.tags['wikidata']];
  //                   const allImages: string[] = [];

  //                   for (const key in entity.claims) {
  //                     const claims = entity.claims[key];

  //                     if (!Array.isArray(claims)) continue;

  //                     const mediaClaims = claims
  //                       .filter((claim: any) =>
  //                         claim.mainsnak?.datatype === 'commonsMedia' &&
  //                         typeof claim.mainsnak.datavalue?.value === 'string'
  //                       )
  //                       .map((claim: any) => claim.mainsnak.datavalue.value as string)
  //                       .filter((img: string) => {
  //                         if (!img) return false;
  //                         const lower = img.toLowerCase();
  //                         return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
  //                       })
  //                       .map((img: string) => {
  //                         const cleanName = img.replace(/\s+/g, '_');
  //                         const hash = MD5(cleanName).toString();
  //                         return `https://upload.wikimedia.org/wikipedia/commons/${hash.substring(0, 1)}/${hash.substring(0, 2)}/${cleanName}`;
  //                       });

  //                     allImages.push(...mediaClaims);
  //                   }

  //                   console.log("WikiData images:", allImages);
  //                   setWikiDataImages(allImages);
  //                   setIsLoadingImages(false);
  //                 }
  //               });


  //             }

  //           }
  //         }
  //         const element = data.elements[0];
  //         if (element.type === 'way' && element.geometry) {

  //         }
  //       }
  //     });
  //     setIsLoadingImages(false);
  //   }
  // }, [locationDetailed]);

  useEffect(() => {
    if (locationDetailed.osm_type && locationDetailed.osm_id && !isLoadingImages) {
      setWikiDataImages([]);
      setIsLoadingImages(true);
      console.log("Fetching OSM data for:", locationDetailed.osm_type, locationDetailed.osm_id);

      fetchOSMData(locationDetailed.osm_type as 'node' | 'way' | 'relation', locationDetailed.osm_id)
        .then(osmObject => {
          console.log("OSM Object:", osmObject);
          if (osmObject && osmObject.tags && osmObject.tags['wikidata']) {
            const wikidataId = osmObject.tags['wikidata'];
            fetchWikiData(wikidataId).then(wikiData => {
              if (wikiData && wikiData.entities) {
                const entity = wikiData.entities[wikidataId];
                const allImages: string[] = [];

                for (const key in entity.claims) {
                  const claims = entity.claims[key];
                  if (!Array.isArray(claims)) continue;

                  const mediaClaims = claims
                    .filter((claim: any) =>
                      claim.mainsnak?.datatype === 'commonsMedia' &&
                      typeof claim.mainsnak.datavalue?.value === 'string'
                    )
                    .map((claim: any) => claim.mainsnak.datavalue.value as string)
                    .filter((img: string) => {
                      if (!img) return false;
                      const lower = img.toLowerCase();
                      return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
                    })
                    .map((img: string) => {
                      const cleanName = img.replace(/\s+/g, '_');
                      const hash = MD5(cleanName).toString();
                      // return `https://upload.wikimedia.org/wikipedia/commons/${hash.substring(0, 1)}/${hash.substring(0, 2)}/${cleanName}`;
                      return `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash.substring(0, 1)}/${hash.substring(0, 2)}/${cleanName}/800px-${cleanName}`
                    });

                  allImages.push(...mediaClaims);
                }

                console.log("WikiData images:", allImages);
                setWikiDataImages(allImages);
                setIsLoadingImages(false)
              }

            }).catch(err => {
              console.error('Failed fetching WikiData:', err);
              setIsLoadingImages(false);
            });
          } else {
            // No wikidata tag found
            const overpassData = fetchOverpassData(locationDetailed.osm_type, locationDetailed.osm_id);
            console.log(`fetching overpassData`)
            overpassData.then(data => {
              if (data && data.elements && data.elements.length > 0) {
                for (const element of data.elements) {
                  if (element.tags) {
                    const website = element.tags["website"] || element.tags["contact:website"] || element.tags["url"];
                    

                  }
                }
                const element = data.elements[0];
                if (element.type === 'way' && element.geometry) {

                }
              }
            });
            setWikiDataImages([]);
            setIsLoadingImages(false);
          }
        })
        .catch(err => {
          console.error('Failed fetching OSM object:', err);
          setIsLoadingImages(false);
        });
    }

  }, [locationDetailed]);


  useEffect(() => {
    // Always set the first image as selected when stockImages changes
    if (stockImages.length > 0 && !selectedImage) {
      setSelectedImage(stockImages[0]);
    }
  }, [stockImages]);


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
          setStockImages([defaultImage, ...wikiDataImages, ...uniqueImages]);
        } catch (error) {
          console.error("Error fetching stock images:", error);
          setStockImages([defaultImage, ...wikiDataImages]);
        } finally {
          setIsLoadingImages(false);
        }
      };
      fetchImages();
    } else {
      setStockImages([defaultImage, ...wikiDataImages]);
    }
  }, [selectedCats, title, categories, wikiDataImages]);

  const [selectedImage, setSelectedImage] = useState<string>('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);



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
    const eventData: any = {
      title,
      description,
      dateTime: dateTime?.toISOString() ?? '',
      location,
      lat: coords![0],
      lng: coords![1],
      capacity: capacity || null,
      categoryIds: selectedCats,
      imageUrl: null
    };
    if (selectedImage && selectedImage !== defaultImage) eventData.imageUrl = selectedImage
    try {
      const result = await apiClient.createEvent(eventData)
      if (result.status == 200 || result.status == 201) {
        navigate(`/events/${result.data.id}`)
      } else {
        console.log(result.data)
        if (result.data && result.data.error) {
          Swal.fire({
            icon: "error",
            title: result.data.error.errorCode,
            text: result.data.error.message,
          });
        }
      }
    } catch (error: any) {
      console.log(error)
      if (error.response.data && error.response.data.error) {
        Swal.fire({
          icon: "error",
          title: error.response.data.error.message,
          text: error.response.data.error.errorCode,
        });
      }
    }
    // setJsonResult(eventData);
  };

  const debouncedFetchLocations = useCallback(
    debounce((val: string) => {
      fetchLocations(val);
      setTypingLocation(false)
    }, 1000),
    []
  );
  const handleLocationSearch = (val: string) => {
    setTypingLocation(true);
    debouncedFetchLocations(val);
  };

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
            menuStyle={{ zIndex: 20000 }}
            labelKey="label"
            valueKey="value"
            placement="auto"
            onSearch={handleLocationSearch}
            shouldDisplayCreateOption={() => false}
            searchBy={() => true}
            className='custom-picker-colour'
            renderMenu={(menu) => {
              if (loading || typingLocation) {
                return (
                  <div style={{ textAlign: 'center' }}>
                    <OneLineLoader height={38} width={400} />
                  </div>
                );
              }
              return menu;
            }}
            onChange={(val) => {
              const selectedLocation = locations.find(loc => loc.value === val);
              if (selectedLocation) {
                setLocation(selectedLocation.label);
                setLocationDetailed(selectedLocation);
                setCoords(selectedLocation.coords);
                setOriginalCoords(selectedLocation.coords);

                let zoomLevel = 15;
                let radius = 100;

                switch (selectedLocation.type) {
                  case 'city':
                    zoomLevel = 11;
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
                    switch (selectedLocation.osm_key) {
                      case 'amenity':
                        zoomLevel = 17;
                        radius = 100
                        break;
                      case 'attraction':
                        zoomLevel = 17;
                        radius = 100
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
            maxBounds={[[52.3383, 13.0884], [52.6755, 13.7611]]}
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
              wayCoords.length > 2 && (
                // Check if shape is closed
                JSON.stringify(wayCoords[0]) === JSON.stringify(wayCoords[wayCoords.length - 1]) ? (
                  <Polygon
                    positions={wayCoords}
                    pathOptions={{ color: 'blue', fillColor: 'lightblue', fillOpacity: 0.2 }}
                  />
                ) : (
                  <Polyline
                    positions={wayCoords}
                    pathOptions={{ color: 'blue' }}
                  />
                )
              )
            )}

            {originalCoords && wayCoords.length === 0 && (
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
      {/* Image Selection (from stock images of chosen categories) */}
      {stockImages.length > 0 && (
        <div>
          <span className="block text-sm font-medium text-gray-700">
            Select an Image
          </span>
          {isLoadingImages ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : stockImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 mt-2">
              {Array.from(new Set(stockImages)).map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  onClick={() => handleImageClick(image)}
                  className={`cursor-pointer border rounded overflow-hidden relative ${selectedImage === image ? 'ring-2 ring-blue-500' : ''
                    }`}
                >
                  <img
                    src={image}
                    alt={`Event image ${index}`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'fallback-image-url.jpg';
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
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Event
        </button>
      </div>
    </div>
  );
};

export default CreateEventPage;
