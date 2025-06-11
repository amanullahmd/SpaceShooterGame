// Script to install additional dependencies for the Space Shooter game
const { execSync } = require('child_process');

const dependencies = [
  'expo-linear-gradient',
  'expo-blur',
  '@expo/vector-icons',
  'react-native-game-engine',
  'react-native-svg',
  'react-native-vector-icons',
  '@react-native-async-storage/async-storage',
  'react-native-sound',
  'expo-av',
  'expo-haptics',
  'expo-sensors',
  'socket.io-client',
  '@types/socket.io-client',
  'react-native-reanimated',
  'react-native-gesture-handler'
];

console.log('Installing additional dependencies...');

try {
  const installCommand = `npm install ${dependencies.join(' ')}`;
  console.log(`Running: ${installCommand}`);
  execSync(installCommand, { stdio: 'inherit' });
  console.log('✅ All dependencies installed successfully!');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}