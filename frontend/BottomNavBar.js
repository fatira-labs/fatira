// BottomNavBar.js
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Dimensions, Alert } from 'react-native';

const { width } = Dimensions.get('window');

// --- Asset Imports ---
// Ensure these assets are in your ./assets folder
const homeIcon = require('./assets/homeNavBar.png');
const addIcon = require('./assets/pieplus.png'); // Assuming this is the correct plus icon for the nav bar
const moneyIcon = require('./assets/moneyNavBar.png');
const profileIcon = require('./assets/profileNavBar.png');

const BottomNavBar = ({ onNavigateHome, onNavigateAdd, onNavigateMoney, onNavigateProfile }) => {
  return (
    <View style={styles.navBarContainer}>
      <TouchableOpacity style={styles.navBarButton} onPress={onNavigateHome}>
        <Image source={homeIcon} style={styles.navBarIcon} resizeMode="contain" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navBarButton} onPress={onNavigateAdd}>
        <Image source={addIcon} style={styles.navBarIcon} resizeMode="contain" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navBarButton} onPress={onNavigateMoney}>
        <Image source={moneyIcon} style={styles.navBarIcon} resizeMode="contain" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navBarButton} onPress={onNavigateProfile}>
        <Image source={profileIcon} style={styles.navBarIcon} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // backgroundColor: '#111111', // Dark background for the nav bar
    // borderTopWidth: 0.5,
    // borderTopColor: '#333333', // Subtle top border
    // height: 30, // Adjust height as needed  
    width: '100%',
    marginBottom: 0,
    paddingBottom: 0,
  },
  navBarButton: {
    flex: 1, // Each button takes equal space
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 0,
  },
  navBarIcon: {
    width: width * 0.2, // Adjust icon size as needed
    height: width * 0.2,
  },
});

export default BottomNavBar;
