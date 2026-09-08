import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export default function NavIcon({ name, color = '#64748b', size = 22, active = false }) {
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10.182V20a1 1 0 001 1h5v-6h6v6h5a1 1 0 001-1v-9.818a1 1 0 00-.36-.77l-8-6.545a1 1 0 00-1.28 0l-8 6.545a1 1 0 00-.36.77z"
            fill={active ? color : 'none'}
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'mock':
    case 'mock-settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
          <Circle
            cx="12"
            cy="12"
            r="5"
            stroke={color}
            strokeWidth="1.8"
            fill={active ? color : 'none'}
            fillOpacity={active ? 0.25 : 0}
          />
          <Circle cx="12" cy="12" r="2" fill={color} />
        </Svg>
      );

    case 'game': {
      const bodyColor = active ? '#ea580c' : '#f59e0b';
      const strokeColor = active ? '#c2410c' : '#d97706';
      return (
        <Svg width={size + 2} height={size + 2} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17.32 5H6.68C4.65 5 3 6.65 3 8.68V15.32C3 17.35 4.65 19 6.68 19C7.45 19 8.19 18.76 8.81 18.31L10.5 17H13.5L15.19 18.31C15.81 18.76 16.55 19 17.32 19C19.35 19 21 17.35 21 15.32V8.68C21 6.65 19.35 5 17.32 5Z"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M6.2 12H9.8M8 10.2V13.8"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="14.8" cy="12.5" r="1.1" fill="#ffffff" />
          <Circle cx="17.2" cy="10.5" r="1.1" fill="#ffffff" />
        </Svg>
      );
    }

    case 'ranking':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 3H18V8C18 11.314 15.314 14 12 14C8.686 14 6 11.314 6 8V3Z"
            stroke={color}
            strokeWidth="1.8"
            fill={active ? color : 'none'}
            fillOpacity={active ? 0.25 : 0}
            strokeLinejoin="round"
          />
          <Path
            d="M6 5H3.5C2.672 5 2 5.672 2 6.5C2 8.433 3.567 10 5.5 10H6"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path
            d="M18 5H20.5C21.328 5 22 5.672 22 6.5C22 8.433 20.433 10 18.5 10H18"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path d="M12 14V18M8 21H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );

    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="7"
            r="4"
            stroke={color}
            strokeWidth="1.8"
            fill={active ? color : 'none'}
            fillOpacity={active ? 0.25 : 0}
          />
          <Path
            d="M4 21C4 17.134 7.582 14 12 14C16.418 14 20 17.134 20 21"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'admin-profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="7.5"
            r="4"
            stroke="#ffffff"
            strokeWidth="2"
            fill="rgba(255, 255, 255, 0.25)"
          />
          <Path
            d="M4.5 19.5C4.5 15.5 8 13.5 12 13.5C16 13.5 19.5 15.5 19.5 19.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );

    // Admin Icons
    case 'dashboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" fill={active ? color : 'none'} stroke={color} strokeWidth="1.8" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" fill={active ? color : 'none'} stroke={color} strokeWidth="1.8" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" fill={active ? color : 'none'} stroke={color} strokeWidth="1.8" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" fill={active ? color : 'none'} stroke={color} strokeWidth="1.8" />
        </Svg>
      );

    case 'questions':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill={active ? color : 'none'} fillOpacity={active ? 0.2 : 0} />
          <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <Circle cx="12" cy="17" r="0.8" fill={color} />
        </Svg>
      );

    case 'weekly':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" fill={active ? color : 'none'} fillOpacity={active ? 0.2 : 0} />
          <Path d="M16 2V6M8 2V6M3 10H21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );

    case 'students':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" fill={active ? color : 'none'} fillOpacity={active ? 0.2 : 0} />
          <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );

    case 'results':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 11l3 3L22 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );

    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
        </Svg>
      );
  }
}