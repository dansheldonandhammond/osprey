/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 't-',
  important: true, // Set to false so custom.css text styles can override Tailwind text utilities
  corePlugins: {
    preflight: false, // Disable Tailwind's base reset to prevent conflicts with custom.css
  },
  content: [
    './layout/**/*.liquid',
    './sections/**/*.liquid',
    './sections/**/*.json', // Include section JSON files (header-group, footer-group)
    './snippets/**/*.liquid',
    './templates/**/*.liquid',
    './templates/**/*.json', // Include template JSON files
    './templates/customers/**/*.liquid',
    './blocks/**/*.liquid', // Include custom blocks
    './assets/**/*.js',
    './config/settings_data.json', // Include theme settings (may contain class references)
  ],
  theme: {
    fontSize: {
      'header-0': '11.5rem',
      'header-1': '5.5rem',
      'header-2': '4.8rem',
      'header-3': '3.2rem',
      'header-4': '2.3rem',
      'header-5': '2.6rem',
      'header-6': '1.9rem',
      'header-7': '1.44rem',
      'header-8': '2rem',
      'header-9': '1.6rem',
      'body-0': '5.5rem',
      'body-1': '3.4rem',
      'body-2': '3.8rem',
      'body-3': '2.9rem',
      'body-4': '2.4rem',
      'body-5': '1.9rem',
      'body-6': '1.6rem',
      'body-7': '1rem',
      'body-8': '0.875rem',
      'body-9': '0.8125rem',
      // Additional font sizes from previous config (for backward compatibility)
      'header-1-old': '7.5rem',
      'header-2-old': '5.4rem',
      'header-5-old': '1.8rem',
      'header-5-light': '1.7rem',
      'header-4-light': '2.4rem',
      'body-xxl': '5.5rem',
      'body-xl': '3.4rem',
      'body-l': '2.5rem',
      'body-ml': '2.2rem',
      'body-ms': '1.9rem',
      'body-s': '1.5rem',
      'body-xs': '1.3rem',
      'body-xxs': '1.1rem',
      'body-sm': '1.5rem',
    },
    letterSpacing: {
      'h5': '0.36rem',
      'h4': '0.32rem',
      'h3': '0.28rem',
      'h2': '0.24rem',
      'h1': '0.20rem',
    },
    lineHeight: {
      'h5': '1.11',
      'h4': '1.15',
      'h3': '1.2',
      'h2': '1.25',
      'h1': '1.3',
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '1xl': '1440px',
      '2xl': '1536px', // Tailwind default - keep this to maintain compatibility with existing 2xl: classes
      '3xl': '1920px', // Custom breakpoint for ultra-wide screens
    },
    container: {
      center: true,
      screens: {
        sm: '1024px',
        md: '1280px',
        lg: '1920px',
      },
    },
    keyframes: {
      stretch: {
        '0%': { width: '0%' },
        '100%': { width: '95%' },
      },
      gradientMove: {
        '0%, 100%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
      },
    },
    animation: {
      stretch: 'stretch 0.6s ease-in-out forwards',
      gradient: 'gradientMove 8s ease infinite',
    },
    extend: {
      maxWidth: {
        'page': '1300px',
        'content': '1308px',
      },
      typography: {
        DEFAULT: {
          css: {
            fontSize: 'inherit',
            maxWidth: 'none',
            lineHeight: 'inherit',
            p: {
              marginBottom: '1.5rem',
            },
            h1: {
              fontWeight: '700',
              letterSpacing: '0.02em',
            },
            h2: {
              fontWeight: '600',
              letterSpacing: '0.02em',
            },
            h3: {
              fontWeight: '500',
              letterSpacing: '0.02em',
            },
          },
        },
      },
      backgroundImage: {
        'xl-custom-gradient': 'linear-gradient(0deg,#0006,rgba(0,0,0,.302) 57%,#0000)',
        '2xl-custom-gradient': 'linear-gradient(0deg, #0003, rgba(0, 0, 0, .102) 79%, #0000)',
        'default-custom-gradient': 'linear-gradient(0deg, rgba(0,0,0,.302),#0003 50%,#0000)',
      },
      colors: {
        primary: {
          DEFAULT: 'var(--primary-colour)',
          100: 'var(--primary-colour-100)',
          200: 'var(--primary-colour-200)',
          300: 'var(--primary-colour-300)',
          400: 'var(--primary-colour-400)',
          500: 'var(--primary-colour-500)',
          600: 'var(--primary-colour-600)',
          700: 'var(--primary-colour-700)',
          800: 'var(--primary-colour-800)',
          900: 'var(--primary-colour-900)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-colour)',
          100: 'var(--secondary-colour-100)',
          200: 'var(--secondary-colour-200)',
          300: 'var(--secondary-colour-300)',
          400: 'var(--secondary-colour-400)',
          500: 'var(--secondary-colour-500)',
          600: 'var(--secondary-colour-600)',
          700: 'var(--secondary-colour-700)',
          800: 'var(--secondary-colour-800)',
          900: 'var(--secondary-colour-900)',
        },
        text_primary: {
          DEFAULT: 'var(--text-primary)',
          100: 'var(--text-primary-100)',
          200: 'var(--text-primary-200)',
          300: 'var(--text-primary-300)',
          400: 'var(--text-primary-400)',
          500: 'var(--text-primary-500)',
          600: 'var(--text-primary-600)',
          700: 'var(--text-primary-700)',
          800: 'var(--text-primary-800)',
          900: 'var(--text-primary-900)',
        },
        black: '#000',
        grey: '#666666',
        green: '#698c8a',
        white: '#fff',
      },
      fontFamily: {
        'sans': ['motiva-sans', 'sans-serif'],
        'body': ['motiva-sans', 'sans-serif'],
        'heading': ['motiva-sans', 'sans-serif'],
      },
      borderRadius: {
        'lg': '8px',
        'full': '9999px',
      },
      zIndex: {
        '1': '1',
        '10': '10',
        '50': '50',
      },
      textColor: ['group-hover'],
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  safelist: [
    // Swiper pagination classes (dynamically generated in JavaScript)
    'swiper-pagination-track',
    'swiper-pagination-indicator',
    'swiper-pagination-custom',
    'swiper-pagination-horizontal',
    'swiper-wrapper',
    'swiper-slide',
    // Essential classes that might be dynamically generated
    't-absolute',
    't-relative',
    't-transform',
    't-left-1/2',
    't--translate-x-1/2',
    't--translate-y-1/2',
    't-top-1/2',
    // Ring utilities (dynamically added/removed in custom.js for variant thumbnails)
    't-ring-2',
    't-ring-primary',
    // Visibility and display utilities (dynamically toggled in JavaScript)
    't-opacity-0',
    't-opacity-100',
    't-visible',
    't-invisible',
    't-hidden',
    't-block',
    't-flex',
    // Font size classes used in codebase
    't-text-header-0',
    't-text-header-1',
    't-text-header-2',
    't-text-header-3',
    't-text-header-4',
    't-text-header-5',
    't-text-header-6',
    't-text-header-7',
    't-text-header-8',
    't-text-header-9',
    't-text-body-0',
    't-text-body-1',
    't-text-body-2',
    't-text-body-3',
    't-text-body-4',
    't-text-body-5',
    't-text-body-6',
    't-text-body-7',
    't-text-body-8',
    't-text-body-9',
    // Legacy font size classes (for backward compatibility)
    't-text-body-xxl',
    't-text-body-xl',
    't-text-body-l',
    't-text-body-ml',
    't-text-body-ms',
    't-text-body-s',
    't-text-body-xs',
    't-text-body-xxs',
    't-text-body-sm',
    // Patterns for positioning and transform utilities that might be dynamically generated
    // {
    //   pattern: /^t-(left|right|top|bottom)-(\d+\/2|\[.+\])/,
    // },
    // {
    //   pattern: /^t-(-)?translate-(x|y)-(\d+\/2|\[.+\]|\d+)/,
    // },
  ],
};
