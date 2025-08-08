// Quick date check
console.log('August 7, 2025 is:', new Date(2025, 7, 7).toDateString()); // Month is 0-based
console.log('August 10, 2025 is:', new Date(2025, 7, 10).toDateString());
console.log('August 11, 2025 is:', new Date(2025, 7, 11).toDateString());

// Check day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
console.log('August 10, 2025 day of week:', new Date(2025, 7, 10).getDay());
console.log('August 11, 2025 day of week:', new Date(2025, 7, 11).getDay());
