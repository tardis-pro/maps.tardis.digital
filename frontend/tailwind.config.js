export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                secondary: '#1e40af',
                background: '#0f172a',
                border: '#334155',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
