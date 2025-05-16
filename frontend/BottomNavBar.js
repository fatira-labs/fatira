// BottomNavBar.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const ICON_SIZE = width *0.2
const BAR_HEIGHT = 90;

// Assets
const homeIcon    = require('./assets/homeNavBar.png');
const addIcon     = require('./assets/pieplus.png');
const moneyIcon   = require('./assets/moneyNavBar.png');
const profileIcon = require('./assets/profileNavBar.png');

const BottomNavBar = ({ active, onNavigateHome, onNavigateAdd, onNavigateMoney, onNavigateProfile }) => {
  const buttonData = [
    { key: 'home',   icon: homeIcon,    action: onNavigateHome },
    { key: 'add',    icon: addIcon,     action: onNavigateAdd },
    { key: 'money',  icon: moneyIcon,   action: onNavigateMoney },
    { key: 'profile',icon: profileIcon, action: onNavigateProfile },
  ];

  return (
    <View style={styles.navBarContainer}>
      {buttonData.map(btn => (
        <TouchableOpacity
          key={btn.key}
          style={styles.navBarButton}
          onPress={btn.action}
          activeOpacity={0.7}
        >
          <Image
            source={btn.icon}
            style={[
              styles.navBarIcon,
              btn.key === active && styles.activeIcon
            ]}
            contentFit="contain"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  navBarContainer: {
    flexDirection:      'row',
    justifyContent:     'space-around',
    alignItems:         'center',
    height:             BAR_HEIGHT,
 //   paddingBottom:      Platform.OS === 'ios' ? 20 : 0, // safe-area for iPhone
    backgroundColor:    '#1A1A1A',
    borderTopLeftRadius: 16,
    borderTopRightRadius:16,
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius:  4,
      },
      android: {
        elevation: 8,
      }
    }),
  },
  navBarButton: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  navBarIcon: {
    width:  ICON_SIZE,
    height: ICON_SIZE,
    
  },
  activeIcon: {
    tintColor: '#D4A32A',         // highlight color
  },
});

export default BottomNavBar;
