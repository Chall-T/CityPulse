import React from 'react';
import ContentLoader from 'react-content-loader';
import type { IContentLoaderProps } from 'react-content-loader';

const ThreeDots = ((props: IContentLoaderProps) => (
  <ContentLoader
    viewBox="0 0 400 160"
    width={400}
    height={20}
    backgroundColor="transparent"
    {...props}
  >
    <circle cx="150" cy="86" r="8" />
    <circle cx="194" cy="86" r="8" />
    <circle cx="238" cy="86" r="8" />
  </ContentLoader>
)) as React.FC<IContentLoaderProps> & { metadata?: object };

ThreeDots.metadata = {
  name: 'RioF',
  github: 'clariokids',
  description: 'Three Dots',
  filename: 'ThreeDots',
};

export default ThreeDots;
