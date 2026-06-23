/**
 * Integration Icons
 *
 * One component per provider icon. Add new icons here as new providers are added.
 * Each icon accepts a `className` prop for sizing. Default renders at w-8 h-8.
 *
 * Usage:
 *   import { IntegrationIcon } from '@/components/icons/integration-icons';
 *   <IntegrationIcon provider="gmail" className="w-6 h-6" />
 */

import React from 'react';

export function NotionIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 48 48" fill="none">
      <path fill="#fff" fillRule="evenodd" d="M11.553 11.099c1.232 1.001 1.694.925 4.008.77l21.812-1.31c.463 0 .078-.461-.076-.538l-3.622-2.619c-.694-.539-1.619-1.156-3.391-1.002l-21.12 1.54c-.77.076-.924.461-.617.77l3.006 2.389zm1.309 5.083v22.95c0 1.233.616 1.695 2.004 1.619l23.971-1.387c1.388-.076 1.543-.925 1.543-1.927V14.641c0-1-.385-1.54-1.234-1.463l-25.05 1.463c-.925.077-1.234.54-1.234 1.541z" clipRule="evenodd" />
      <path fill="#424242" fillRule="evenodd" d="M11.553 11.099c1.232 1.001 1.694.925 4.008.77l21.812-1.31c.463 0 .078-.461-.076-.538l-3.622-2.619c-.694-.539-1.619-1.156-3.391-1.002l-21.12 1.54c-.77.076-.924.461-.617.77l3.006 2.389zm1.309 5.083v22.95c0 1.233.616 1.695 2.004 1.619l23.971-1.387c1.388-.076 1.543-.925 1.543-1.927V14.641c0-1-.385-1.54-1.234-1.463l-25.05 1.463c-.925.077-1.234.54-1.234 1.541zm23.664 1.231c.154.694 0 1.387-.695 1.465l-1.155.23v16.943c-1.003.539-1.928.847-2.698.847-1.234 0-1.543-.385-2.467-1.54l-7.555-11.86v11.475l2.391.539s0 1.386-1.929 1.386l-5.317.308c-.154-.308 0-1.078.539-1.232l1.388-.385V20.418l-1.927-.154c-.155-.694.23-1.694 1.31-1.772l5.704-.385 7.862 12.015V19.493l-2.005-.23c-.154-.848.462-1.464 1.233-1.54l5.32-.31zM7.389 5.862l21.968-1.618c2.698-.231 3.392-.076 5.087 1.155l7.013 4.929C42.614 11.176 43 11.407 43 12.33v27.032c0 1.694-.617 2.696-2.775 2.849l-25.512 1.541c-1.62.077-2.391-.154-3.239-1.232l-5.164-6.7C5.385 34.587 5 33.664 5 32.585V8.556C5 7.171 5.617 6.015 7.389 5.862z" clipRule="evenodd" />
    </svg>
  );
}


export function GmailIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 192 192">
      <path fill="url(#a)" d="M146 44h38v110c0 6.627-5.373 12-12 12h-20a6 6 0 0 1-6-6z" />
      <path fill="#fc413d" d="M46 44H8v110c0 6.627 5.373 12 12 12h20a6 6 0 0 0 6-6z" />
      <path fill="url(#b)" d="M39.226 30.456c-8.033-6.752-20.018-5.714-26.77 2.319-6.752 8.032-5.714 20.017 2.319 26.77l76.078 63.949a8 8 0 0 0 10.295 0l76.078-63.95c8.032-6.752 9.07-18.737 2.318-26.77-6.752-8.032-18.737-9.07-26.769-2.318L96 78.18z" />
      <defs>
        <linearGradient id="a" x1="165" x2="165" y1="44" y2="166" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60d673" />
          <stop offset=".17" stopColor="#42c868" />
          <stop offset=".39" stopColor="#0ebc5f" />
          <stop offset=".62" stopColor="#00a9bb" />
          <stop offset=".86" stopColor="#3c90ff" />
          <stop offset="1" stopColor="#3186ff" />
        </linearGradient>
        <linearGradient id="b" x1="8" x2="184" y1="46.13" y2="46.13" gradientUnits="userSpaceOnUse">
          <stop offset=".08" stopColor="#ff63a0" />
          <stop offset=".3" stopColor="#fc413d" />
          <stop offset=".5" stopColor="#fc413d" />
          <stop offset=".65" stopColor="#fc413d" />
          <stop offset=".72" stopColor="#fc5c30" />
          <stop offset=".86" stopColor="#feb10c" />
          <stop offset=".91" stopColor="#fec700" />
          <stop offset=".96" stopColor="#ffdb0f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function GoogleCalendarIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 192 192">
      <path fill="#bbe2ff" d="M32 36.8C32 20.894 44.894 8 60.8 8h70.4C147.106 8 160 20.894 160 36.8v30.4c0 15.906-12.894 28.8-28.8 28.8H60.8C44.894 96 32 83.106 32 67.2z" />
      <path fill="#3c90ff" d="M19.867 49.392C17.818 33.82 29.94 20 45.645 20h100.71c15.706 0 27.827 13.82 25.778 29.392L166 96l6.133 46.608C174.182 158.18 162.061 172 146.355 172H45.645c-15.706 0-27.827-13.82-25.778-29.392L26 96z" />
      <mask id="cal-a" width="154" height="152" x="19" y="20" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
        <path fill="#3c90ff" d="M19.867 49.392C17.818 33.82 29.94 20 45.645 20h100.71c15.706 0 27.827 13.82 25.778 29.392L166 96l6.133 46.608C174.182 158.18 162.061 172 146.355 172H45.645c-15.706 0-27.827-13.82-25.778-29.392L26 96z" />
      </mask>
      <g mask="url(#cal-a)">
        <path fill="url(#cal-b)" d="M0 0h166v76H0z" transform="matrix(1 0 0 -1 13 172)" />
      </g>
      <mask id="cal-c" width="154" height="152" x="19" y="20" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
        <path fill="#3186ff" d="M19.867 49.392C17.818 33.82 29.94 20 45.645 20h100.71c15.706 0 27.827 13.82 25.778 29.392L166 96l6.133 46.608C174.182 158.18 162.061 172 146.355 172H45.645c-15.706 0-27.827-13.82-25.778-29.392L26 96z" />
      </mask>
      <g mask="url(#cal-c)">
        <path fill="url(#cal-d)" d="M32 27.2C32 16.596 40.596 8 51.2 8h89.6c10.604 0 19.2 8.596 19.2 19.2V96H32z" filter="url(#cal-e)" />
      </g>
      <path fill="#fff" d="M75.353 133.336q-6.282 0-10.777-2.043t-7.61-5.465q-3.065-3.474-4.342-6.793T51.603 115a2.07 2.07 0 0 1 1.021-1.124l5.67-2.247q.714-.357 1.43-.102.714.204 1.685 2.349 1.022 2.145 2.86 4.546a14.3 14.3 0 0 0 4.495 3.728q2.606 1.328 6.435 1.328 6.18 0 9.807-3.575 3.677-3.575 3.677-9.091 0-5.976-3.882-9.194-3.881-3.269-10.266-3.269h-5.362a1.9 1.9 0 0 1-1.328-.51q-.51-.562-.511-1.277v-5.465q0-.767.51-1.277a1.82 1.82 0 0 1 1.329-.562h4.647q5.721 0 9.194-3.116t3.473-8.07q0-4.902-3.116-7.916t-8.58-3.014q-3.065 0-5.312 1.022a11.5 11.5 0 0 0-3.882 2.86 22.7 22.7 0 0 0-2.809 3.78q-1.174 1.941-1.89 2.145-.714.153-1.379-.255l-5.363-2.605q-.664-.358-.868-1.124t1.226-3.575q1.481-2.86 4.494-5.823a21 21 0 0 1 7.049-4.597q4.035-1.635 9.398-1.634 9.96 0 15.782 5.26 5.823 5.21 5.823 13.791 0 5.925-2.86 10.266-2.81 4.34-7.968 6.13v.204q6.231 1.838 9.806 6.741 3.627 4.853 3.626 11.594 0 9.654-6.742 15.834-6.74 6.18-17.57 6.18zm51.25-1.175q-.868 0-1.533-.664a2.25 2.25 0 0 1-.612-1.583V73.118l-11.492 8.274q-.614.46-1.431.307a1.96 1.96 0 0 1-1.225-.766l-3.32-4.7a1.98 1.98 0 0 1-.358-1.43q.153-.816.817-1.276l20.379-14.557q.256-.204.562-.306.307-.153.715-.153h4.291q.868 0 1.379.613.562.56.562 1.43v69.36q0 .92-.664 1.583a2 2 0 0 1-1.533.664z" />
      <defs>
        <linearGradient id="cal-b" x1="83" x2="83" y1="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4fa0ff" />
          <stop offset="1" stopColor="#3186ff" />
        </linearGradient>
        <linearGradient id="cal-d" x1="89.06" x2="89.06" y1="21.75" y2="96.39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a9a8ff" />
          <stop offset=".8" stopColor="#3c90ff" />
        </linearGradient>
        <filter id="cal-e" width="152" height="112" x="20" y="-4" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_37330_7673" stdDeviation="6" />
        </filter>
      </defs>
    </svg>
  );
}

export function GoogleDriveIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 192 192">
      <mask id="drv-a" width="168" height="154" x="12" y="18" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
        <path fill="#b43333" d="M63.09 37c14.626-25.333 51.193-25.334 65.819 0l45.033 78c14.626 25.334-3.657 57.001-32.91 57.001H50.967c-29.253 0-47.536-31.667-32.91-57.001z" />
      </mask>
      <g mask="url(#drv-a)">
        <path fill="url(#drv-b)" d="M206.905 172.02h-91.888l-19.015-32.934 45.944-79.578z" />
        <path fill="url(#drv-c)" d="M-14.919 172.006 50.04 59.494v.002L31.032 92.422h38.02L115 172.004l-129.918.001z" />
        <path fill="url(#drv-d)" d="M96.007-20.085 141.954 59.5l-19.011 32.928H31.048z" />
      </g>
      <defs>
        <linearGradient id="drv-b" x1="193.6" x2="103.09" y1="165.6" y2="111.21" gradientUnits="userSpaceOnUse">
          <stop offset=".09" stopColor="#ffe921" />
          <stop offset="1" stopColor="#fec700" />
        </linearGradient>
        <linearGradient id="drv-c" x1="114.4" x2="15.53" y1="181.61" y2="121.8" gradientUnits="userSpaceOnUse">
          <stop offset=".15" stopColor="#a9a8ff" />
          <stop offset=".33" stopColor="#6d97ff" />
          <stop offset=".48" stopColor="#3186ff" />
        </linearGradient>
        <linearGradient id="drv-d" x1="128.88" x2="28.7" y1="37.88" y2="84.64" gradientUnits="userSpaceOnUse">
          <stop offset=".55" stopColor="#0ebc5f" />
          <stop offset=".85" stopColor="#78c9ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}


const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'gmail': GmailIcon,
  'google-calendar': GoogleCalendarIcon,
  'google-drive': GoogleDriveIcon,
  'notion': NotionIcon,
};

interface IntegrationIconProps {
  provider: string;
  className?: string;
}

export function IntegrationIcon({ provider, className = 'w-8 h-8' }: IntegrationIconProps) {
  const Icon = ICON_MAP[provider];
  if (Icon) return <Icon className={className} />;

  // Fallback: monogram box
  return (
    <div
      className={`${className} rounded bg-[#26262B] flex items-center justify-center text-[#A1A1AA] text-xs font-mono uppercase`}
      aria-label={provider}
    >
      {provider[0]}
    </div>
  );
}
