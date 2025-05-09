// App.js
// Import necessary React Native components
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions
} from 'react-native';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

// --- Asset Placeholders ---
// IMPORTANT: Replace these with the actual paths to your images in your project
// For example, if your logologin.png is in an 'assets' folder:

const logoAsset = require('./assets/logologin.png'); // Path to your logo image
const arrowButtonAsset = require('./assets/backbutton.png'); // Path to your arrow/next button image
const phantomButtonAsset = require('./assets/phantom.png'); // Path to your full Phantom button image from sign.png

// --- LoginScreen Component ---
const LoginScreen = ({ onNavigate }) => {
  const [username, setUsername] = useState('');

  return (
    <View style={styles.screenContainer}>
      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Welcome to</Text>

      {/* App Logo */}
      <Image source={logoAsset} style={styles.logo} resizeMode="contain" />

      {/* Prompt Text */}
      <Text style={styles.promptText}>please input your username</Text>

      {/* Username Input Field */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      {/* Submission/Next Button */}
      <TouchableOpacity
        style={styles.arrowButtonContainer}
        onPress={() => {
          if (username.trim()) { // Only navigate if username is not empty
            onNavigate('ConnectWallet');
          } else {
            // Optionally, show an alert or message if username is empty
            console.warn('Username cannot be empty');
            // You could also use Alert.alert('Input Required', 'Username cannot be empty.');
            // Don't forget to import Alert from 'react-native' if you use it.
          }
        }}
      >
        <Image source={arrowButtonAsset} style={styles.arrowButton} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

// --- ConnectWalletScreen Component ---
const ConnectWalletScreen = ({ onNavigateBack }) => {
  return (
    <View style={styles.screenContainer}>
       {/* Back button */}
      <TouchableOpacity style={styles.backButtonPlacement} onPress={onNavigateBack}>
        {/* Using the arrow asset, rotated to point left */}
        <Image source={arrowButtonAsset} style={[styles.arrowButton, styles.backArrowIcon]} resizeMode="contain" />
      </TouchableOpacity>

      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Welcome to</Text>

      {/* App Logo */}
      <Image source={logoAsset} style={styles.logo} resizeMode="contain" />

      {/* Prompt Text */}
      <Text style={styles.promptText}>finish connecting wallet</Text>

      {/* Phantom Wallet Button (Image-based) */}
      <TouchableOpacity style={styles.phantomImageButton} onPress={() => console.log('Phantom Button Pressed')}>
        {/* Using the phantomButtonAsset which is the full button image from 'sign.png' */}
        <Image source={phantomButtonAsset} style={styles.phantomButtonImage} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

// --- Main App Component ---
const App = () => {
  // State to manage the current screen being displayed
  const [currentScreen, setCurrentScreen] = useState('Login'); // Initial screen is 'Login'

  // Function to handle navigation to a different screen
  const handleNavigation = (screenName) => {
    setCurrentScreen(screenName);
  };

  // Function to handle navigating back (in this case, to the Login screen)
  const handleNavigateBack = () => {
    setCurrentScreen('Login');
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Configure the status bar style */}
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Conditional rendering based on the currentScreen state */}
      {currentScreen === 'Login' && <LoginScreen onNavigate={handleNavigation} />}
      {currentScreen === 'ConnectWallet' && <ConnectWalletScreen onNavigateBack={handleNavigateBack} />}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Dark background color consistent with images
  },
  screenContainer: {
    flex: 1,
    alignItems: 'center', // Center items horizontally
    justifyContent: 'center', // Center items vertically
    paddingHorizontal: width * 0.1, // Horizontal padding based on screen width
    backgroundColor: '#1A1A1A', // Screen background color
  },
  logo: {
    width: width * 0.4, // Logo width as a percentage of screen width
    height: height * 0.1, // Logo height as a percentage of screen height
    marginBottom: height * 0.02, // Margin below the logo
  },
  welcomeText: {
    fontSize: width * 0.06, // Responsive font size
    color: '#FFFFFF', // White text color
    fontFamily: 'System', // Default system font (consider custom fonts for specific branding)
    marginBottom: height * 0.005, // Small margin below welcome text
  },
  // appNameText style was removed as the logo image now contains "fatira"
  promptText: {
    fontSize: width * 0.045, // Responsive font size
    color: '#CCCCCC', // Light grey text color
    fontFamily: 'System',
    marginBottom: height * 0.03, // Margin below prompt text
    textAlign: 'center', // Center align the text
  },
  input: {
    width: '100%', // Input field takes full width of its padded container
    height: height * 0.07, // Responsive height
    backgroundColor: '#4A4A4A', // Background color of the input field
    borderRadius: width * 0.03, // Rounded corners for the input field
    paddingHorizontal: width * 0.04, // Horizontal padding inside the input field
    fontSize: width * 0.04, // Font size for input text
    color: '#FFFFFF', // Text color for input
    marginBottom: height * 0.05, // Margin below the input field
    borderWidth: 1, // Border for the input field
    borderColor: '#555555', // Border color
  },
  arrowButtonContainer: {
    marginTop: height * 0.02, // Margin above the arrow button
  },
  arrowButton: {
    width: width * 0.18, // Width of the arrow button image
    height: width * 0.18, // Height of the arrow button image (maintaining aspect ratio)
  },
  backButtonPlacement: {
    position: 'absolute', // Position absolutely for overlay
    top: height * 0.06, // Position from the top (adjust for status bar if visible and opaque)
    left: width * 0.05, // Position from the left
    zIndex: 10, // Ensure button is above other elements
  },
  backArrowIcon: {
    width: width * 0.1, // Smaller size for the back arrow icon
    height: width * 0.1,
    transform: [{ rotate: '180deg' }], // Rotate the right-pointing arrow to make it a back arrow
  },
  // Styles for the Phantom button when it's just an image from 'sign.png'
  phantomImageButton: {
    marginTop: height * 0.02, // Margin above the Phantom button
    // The TouchableOpacity will adapt to the size of the Image component within it.
    // Add padding here if a larger touch target is desired around the image.
  },
  phantomButtonImage: {
    width: width * 0.7, // Desired width of the Phantom button image (from sign.png)
    height: height * 0.1, // Desired height of the Phantom button image
    // It's important that these dimensions maintain the aspect ratio of your 'sign.png'
    // or the image might appear stretched or compressed.
  },
  // The following styles (phantomButton, phantomIcon, phantomButtonText) are not currently used
  // as the Phantom button is now a single image. They are kept for reference or future use.
  /*
  phantomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A08FF8',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.1,
    borderRadius: width * 0.08,
    marginTop: height * 0.02,
    width: '90%',
    justifyContent: 'center',
  },
  phantomIcon: {
    width: width * 0.08,
    height: width * 0.08,
    marginRight: width * 0.03,
  },
  phantomButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.05,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  */
});

export default App;


// // App.js
// import 'react-native-get-random-values'; // <-- Polyfill for crypto.getRandomValues, MUST BE FIRST

// import React from 'react';
// import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
// import PhantomConnect from './PhantomConnect'; // Make sure path is correct

// export default function App() {
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
//       <PhantomConnect />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff', // Optional background color
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });