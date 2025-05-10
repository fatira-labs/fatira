// GroupsScreen.js
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

// --- Asset Placeholders ---
// These assets are expected to be passed as props or defined globally in App.js
// For better encapsulation, you might consider passing the direct require paths as props
// or requiring them directly here if they are static.
// For now, we assume topPieAsset and plusButtonAsset are passed via props if defined in App.js
// If they are static and always the same, you could do:
const topPieAsset = require('./assets/toppie1.png');
const plusButtonAsset = require('./assets/pieplus.png');

const GroupsScreen = ({ username, userGroups, onLogout, onAddGroup }) => {
  return (
    <View style={styles.groupsScreenContainer}>
      <Image source={topPieAsset} style={styles.topPieImage} resizeMode="contain" />
      {/* <TouchableOpacity style={styles.logoutButtonPlacement} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity> */}

      <Text style={styles.groupsTitle}>{username}'s groups:</Text>
      <ScrollView style={styles.groupsListContainer} contentContainerStyle={styles.groupsListContentContainer}>
        {userGroups && userGroups.length > 0 ? (
          userGroups.map((group, index) => (
            <TouchableOpacity key={index} style={styles.groupBar} onPress={() => Alert.alert("Group Tapped", `You tapped on ${group.name}`)}>
              <Text style={styles.groupBarText}>{group.name}</Text>
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
  logoutButtonPlacement: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.04 : height * 0.04, 
    right: width * 0,
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
    marginTop: height * 0.15, // Reduced from 0.22 to 0.15 to move it up
    marginBottom: height * 0.025,
    alignSelf: 'flex-start', // Added to align text to the left
    marginLeft: width * 0.05, // Added left margin to align with the groups list
  },
  groupsListContainer: {
    width: '90%',
    flexGrow: 0,
    maxHeight: height * 0.55, // Reduced from 0.65 to 0.55 to prevent overlap with plus button
    marginBottom: height * 0.15, // Added margin to ensure space for plus button
  },
  groupsListContentContainer: {
    paddingBottom: height * 0.02,
  },
  groupBar: {
    backgroundColor: '#F0A829',
    borderColor: '#C97108',
    borderWidth: 3,
    borderRadius: 12, // Slightly more rounded
    paddingVertical: height * 0.022, // Slightly taller bars
    paddingHorizontal: width * 0.05, // More horizontal padding
    marginBottom: height * 0.018, // Slightly more space
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000", // Adding a subtle shadow for depth
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  groupBarText: {
    color: '#2C1E0A', // Darker brown for better readability on orange
    fontSize: width * 0.048, // Slightly larger text
    fontWeight: 'bold',
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
    bottom: height * 0.04,
    alignSelf: 'center',
  },
  plusButtonImage: {
    width: width * 0.25, // Increased from 0.16 to 0.25
    height: width * 0.25, // Increased from 0.16 to 0.25
  },
});

export default GroupsScreen;
