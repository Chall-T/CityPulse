import React, { useState } from 'react';
import { Input, DatePicker, InputPicker, Uploader, Button, TagPicker, Schema } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/ApiClient';

const { StringType } = Schema.Types;

const now = new Date();
now.setHours(0, 0, 0, 0);

const model = Schema.Model({
  title: StringType().isRequired('Title is required'),
  description: StringType().isRequired('Description is required'),
  location: StringType().isRequired('Location is required'),
});

const CreateEventPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: new Date(),
    categories: [] as string[],
    image: null as File | null,
  });

  const navigate = useNavigate();

  const handleChange = (value: any, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('location', formData.location);
      if (formData.date < now) {
        alert("Event needs to be in the future")
      }
      formData.categories.forEach((cat) => form.append('categories[]', cat));
      if (formData.image) {
        form.append('image', formData.image);
      }
    //   await apiClient.createEvent(form);
    console.log("event create")
    console.log(form)
    //   navigate('/'); // or to the event detail page
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Create New Event</h2>

      <div className="space-y-4">
        <Input
          placeholder="Event Title"
          value={formData.title}
          onChange={(val) => handleChange(val, 'title')}
        />

        <Input
          as="textarea"
          rows={4}
          placeholder="Event Description"
          value={formData.description}
          onChange={(val) => handleChange(val, 'description')}
        />

        <Input
          placeholder="Location"
          value={formData.location}
          onChange={(val) => handleChange(val, 'location')}
        />

        <DatePicker
          format="MM/dd/yyyy HH:mm"
          placeholder="Select Date Range"
          value={formData.date as Date}
          onChange={(val) => handleChange(val, 'date')}
          appearance="default"
          style={{ width: '100%' }}
          shouldDisableDate={(date) => {
              return date < now;
            }}
        />

        <TagPicker
          placeholder="Select Categories"
          data={[
            { label: '🎉 Party', value: 'party' },
            { label: '🎤 Music', value: 'music' },
            { label: '🎓 Education', value: 'education' },
            { label: '🏃 Sport', value: 'sport' },
            { label: '🎨 Art', value: 'art' },
          ]}
          value={formData.categories}
          onChange={(val) => handleChange(val, 'categories')}
          block
        />

        {/* <Uploader
          autoUpload={false}
          fileListVisible={true}
          onChange={(fileList) => {
            handleChange(fileList[0]?.blobFile || null, 'image');
          }}
          accept="image/*"
        >
          <button className="rs-btn rs-btn-default">Upload Event Image</button>
        </Uploader> */}

        <Button appearance="primary" block onClick={handleSubmit}>
          Create Event
        </Button>
      </div>
    </div>
  );
};

export default CreateEventPage;
