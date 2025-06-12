import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { DateRangePicker } from 'rsuite';

interface DateRangePickerWithShadowProps {
  value: [Date, Date] | null;
  onChange: (range: [Date, Date] | null) => void;
  placeholder?: string;
}

const RSUITE_CSS_URL = 'https://cdn.jsdelivr.net/npm/rsuite@5.59.0/dist/rsuite.min.css';

const DateRangePickerWithShadow: React.FC<DateRangePickerWithShadowProps> = ({
  value,
  onChange,
  placeholder = 'Select date range',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.shadowRoot) {
      const shadow = containerRef.current.attachShadow({ mode: 'open' });

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = RSUITE_CSS_URL;
      shadow.appendChild(link);

      setShadowRoot(shadow);
    }
  }, []);

  if (!shadowRoot) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '250px',
          minHeight: '40px',
        }}
      />
    );
  }

  return ReactDOM.createPortal(
    <div style={{ width: '100%' }}>
      <DateRangePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%' }}
        appearance="default"
        placement="auto"
      />
    </div>,
    shadowRoot
  );
};

export default DateRangePickerWithShadow;
