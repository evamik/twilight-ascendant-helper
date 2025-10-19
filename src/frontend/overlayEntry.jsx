import React from 'react';
import { createRoot } from 'react-dom/client';
import Overlay from './Overlay';

const OverlayEntry = () => <Overlay visible={true} />;

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<OverlayEntry />);
