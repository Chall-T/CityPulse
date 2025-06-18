import React from 'react';
import ContentLoader from 'react-content-loader';
import type { IContentLoaderProps } from 'react-content-loader';

const UpworkJobLoader = ((props: IContentLoaderProps) => (
  <ContentLoader
    viewBox="0 0 400 20"
    height={400}
    width={20}
    backgroundColor="transparent"
    {...props}
  >
    <rect x="10" y="0" rx="0" ry="0" width="400" height="15" />
  </ContentLoader>
)) as React.FC<IContentLoaderProps> & { metadata?: object };

export default UpworkJobLoader