// GroupsScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Alert // Alert can be removed if no longer used directly here
} from 'react-native';
import { Image } from 'expo-image';

import AntDesign from '@expo/vector-icons/AntDesign';
import { Entypo } from '@expo/vector-icons';
// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

// --- Asset Placeholders ---
// Ensure these assets are in your ./assets folder
const topPieAsset = require('./assets/toppie1.png');
const plusButtonAsset = require('./assets/pieplus.png');

// Added onSelectGroup to props
const GroupsScreen = ({ username, userGroups, onLogout, onAddGroup, onSelectGroup }) => {
  return (
    <View style={styles.groupsScreenContainer}>
      <Image source={topPieAsset} style={styles.topPieImage} resizeMode="contain" />
    
      <Text style={styles.groupsTitle}>{username[0].toUpperCase() + username.slice(1)}'s groups</Text>
      <ScrollView style={styles.groupsListContainer} contentContainerStyle={styles.groupsListContentContainer}>
        {userGroups && userGroups.length > 0 ? (
          userGroups.map((group) => ( // Changed from (group, index) to (group)
           <TouchableOpacity onPress={() => onSelectGroup(group)} key={group.id || group.name} style={styles.groupBar}>
  <Text style={styles.groupBarText}>{group.name}</Text>
  <View style={styles.iconRow}>
    <AntDesign
      name="checkcircle"
      size={35}
      color="#388E3C"
      onPress={() => Alert.alert("Accept group request", "Are you sure you want to accept this group request?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Accept",
          onPress: () => {
            // ACCEPT group request logic here
          },
        },
      ])}
    />
    <Entypo
      name="circle-with-cross"
      size={35}
      color="#D32F2F"
      onPress={() => Alert.alert("Deny group request", "Are you sure you want to accept this group request?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Accept",
          onPress: () => {
            // deny group request logic here
          },
        },
      ])}
      style={{ marginLeft: 12 }}
    />
  </View>
</TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noGroupsText}>You are not part of any groups yet. Tap '+' to create or join one!</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.plusButtonContainer} onPress={onAddGroup}>
        <Image source={plusButtonAsset} style={styles.plusButtonImage} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

// --- Styles for GroupsScreen ---
// These styles are taken from your uploaded GroupsScreen.js.
// Ensure they match your desired layout.
const styles = StyleSheet.create({
  groupsScreenContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Consistent dark background
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : height * 0.02, // Handle Android status bar, provide some top padding for iOS
  },
  topPieImage: {
    width: '100%', // Changed to 100% to ensure full width
    height: height, // Increased height slightly for better coverage
    position: 'absolute',
    top: -height * 0.38,
    left: 0,
    right: 0, // Added right: 0 to ensure full width
  },
  // Styles for Logout Button (re-enabled)
  logoutButtonPlacement: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.06 : height * 0.04, // Adjusted to be visible
    right: width * 0.05,
    zIndex: 10,
    padding: 10,
  },
  logoutButtonText: {
    color: '#A08FF8',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  groupsTitle: {
    fontSize: width * 0.06,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: height * 0.15, // Reduced from 0.22 to 0.15 to move it up
    marginBottom: height * 0.025,
    alignSelf: 'center', // Added to align text to the left
   // marginLeft: width * 0.05, // Added left margin to align with the groups list
  },
  groupsListContainer: {
    width: '90%',
    flexGrow: 0,
    maxHeight: height * 0.75, // Reduced from 0.65 to 0.55 to prevent overlap with plus button
    marginBottom: height * 0.15, // Added margin to ensure space for plus button
  },
  groupsListContentContainer: {
    paddingBottom: height * 0.02,
  },
  groupBar: {
    backgroundColor: '#F0A829',
    borderColor: '#C97108',
    borderWidth: 3,
    borderRadius: 12,
    paddingVertical: height * 0.022,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.018,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',  // ← spread text and icons
    elevation: 4,
  },
  groupBarText: {
    color: '#2C1E0A',
    fontSize: width * 0.048,
    fontWeight: 'bold',
    flex: 1,                           // ← take up all left space
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupBarText: {
    color: '#2C1E0A', // Darker brown for better readability on orange
    fontSize: width * 0.048, // Slightly larger text
    fontWeight: 'bold',
    textAlign:'center',
    alignSelf:'center',
    marginLeft:100,
    
  },
  noGroupsText: {
    color: '#B0B0B0', // Lighter grey
    fontSize: width * 0.042,
    textAlign: 'center',
    marginTop: height * 0.03, // More margin top
    paddingHorizontal: width * 0.05,
  },
  plusButtonContainer: {
    position: 'absolute',
    bottom: height * 0,
    alignSelf: 'center',
  },
  plusButtonImage: {
    width: width * 0.25, // Increased from 0.16 to 0.25
    height: width * 0.25, // Increased from 0.16 to 0.25
  },
});

export default GroupsScreen;
