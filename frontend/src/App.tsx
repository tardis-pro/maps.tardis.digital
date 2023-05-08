import React from 'react';
import {BaseMap} from './bits/BaseMap';
import { MantineProvider } from '@mantine/core';
import { Sidebar } from './bits/Sidebar';

export const App: React.FC = () => {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <BaseMap viewState={{
        "longitude": 72,
        "latitude": 18,
        "zoom": 6.6,
        "minZoom": 2,
        "maxZoom": 22,
        "pitch": 0,
        "bearing": 0
      }} />
      <Sidebar />
    </MantineProvider>
      
  )
}