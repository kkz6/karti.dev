// React-based dark mode strategy for table module
// Since we're using React, we'll use a simple strategy that works with the shared appearance system

const darkModeStrategy = 'class'; // Use CSS classes for dark mode

export const getDarkModeStrategy = () => darkModeStrategy;
export const setDarkModeStrategy = (strategy) => {
    // In React apps, we typically use 'class' strategy with Tailwind CSS
    // This is handled by the shared appearance system
    console.log('Dark mode strategy set to:', strategy);
};
