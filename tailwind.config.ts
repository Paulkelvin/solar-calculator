import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	colors: {
  		white: '#ffffff',
  		black: '#000000',
  		transparent: 'transparent',
  		background: '#f5f5f5',
  		foreground: '#111111',
  		primary: {
  			DEFAULT: '#10b981',
  			foreground: '#ffffff'
  		},
  		secondary: {
  			DEFAULT: '#f3f4f6',
  			foreground: '#374151'
  		},
  		muted: {
  			DEFAULT: '#f3f4f6',
  			foreground: '#6b7280'
  		},
  		border: '#e5e7eb',
  		ring: '#10b981',
  		red: {
  			'500': '#ef4444'
  		},
  		green: {
  			'500': '#10b981'
  		},
  		gray: {
  			'50': '#f9fafb',
  			'100': '#f3f4f6',
  			'200': '#e5e7eb',
  			'300': '#d1d5db',
  			'400': '#9ca3af',
  			'500': '#6b7280',
  			'600': '#4b5563',
  			'700': '#374151',
  			'800': '#1f2937',
  			'900': '#111827'
  		}
  	},
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
