// AddExpenseScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
// expo-image is a good choice for optimized images, ensure it's installed if you use it.
// If you haven't installed it, you can revert to the built-in Image from 'react-native'.
import { Image } from 'expo-image'; // Using expo-image as in your uploaded file
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import BottomNavBar from './BottomNavBar';
import SplitExpenseScreen from './SplitExpenseScreen'; // Import the SplitExpenseScreen modal

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// --- Asset Imports ---
const topPieAsset = require('./assets/toppie1.png');
const backArrowAsset = require('./assets/backbutton.png');
const cameraIconAsset = require('./assets/piecamera.png');
const createButtonAsset = require('./assets/piecreate.png');
import colors from "./color.js"
// --- Constants ---
const INPUT_BAR_BACKGROUND_COLOR = colors.GROUP_BAR_BACKGROUND_COLOR
const INPUT_BAR_BORDER_COLOR = colors.GROUP_BAR_BORDER_COLOR
// const PLACEHOLDER_IMAGE_URI = 'https://placehold.co/200x200/E0A829/2C1E0A?text=Receipt'; // Not used if ImagePicker is active

const AddExpenseScreen = ({
  onBack,
  onCreateExpense,
  onNavigateHome,
  onNavigateAdd,
  onNavigateMoney,
  onNavigateProfile,
  currentUsername, // Needed for SplitExpenseScreen
  currentGroupMembers = [], // Array of member name strings in the current group
}) => {
  const [expenseName, setExpenseName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date()); // Initialize with current date
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expenseImageUri, setExpenseImageUri] = useState(null);
  const [splitDetails, setSplitDetails] = useState(null); // Will hold data from SplitExpenseScreen
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false); // State for modal visibility

  const onDateChange = (event, selectedDate) => {
   
    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
    //setShowDatePicker(false);
  };

  const formatDate = (date) => {
    // Ensure date is a Date object
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libraryPermission.status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return false;
      }
    }
    return true;
  };

  const handleChoosePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      "Add Photo",
      "Choose an option:", // Message part of Alert
      [
        {
          text: "From Library",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1], // Square aspect ratio for consistency
                quality: 0.8, // Compress image slightly
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                setExpenseImageUri(result.assets[0].uri);
              }
            } catch (error) {
              console.error("ImagePicker Library Error: ", error);
              Alert.alert('Error', 'Failed to pick image from library. Please try again.');
            }
          }
        },
        {
          text: "Take Photo",
          onPress: async () => {
            try {
              // Request camera permissions separately for clarity, though launchCameraAsync might do it.
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.status !== 'granted') {
                Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                setExpenseImageUri(result.assets[0].uri);
              }
            } catch (error) {
              console.error("ImagePicker Camera Error: ", error);
              Alert.alert('Error', 'Failed to take photo. Please try again.');
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Updated to open the SplitExpenseScreen modal
  const handleOpenSplitModal = () => {
    let amount = parseFloat(totalAmount);
    amount = parseFloat(amount.toFixed(2)); // Ensure two decimal places
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Enter Amount First', 'Please enter a valid total amount for the expense before splitting.');
      return;
    }
    if (!currentGroupMembers || currentGroupMembers.length === 0) {
        Alert.alert('No Members', 'This expense needs group members to be split. Please ensure the group has members.',
        [{text: "OK", onPress: () => {
            // Optionally, if no members, default to "paid by self, split with self"
            setSplitDetails({ type: 'individual', splits: [{username: currentUsername, amount: amount}], totalAmount: amount });
        }}]
        );
        // If you absolutely require group members for splitting:
        // return;
    }
    setIsSplitModalVisible(true);
  };

  // Callback function for when the split is done in the modal
  const handleSplitDone = (detailsFromModal) => {
    console.log("Split details received in AddExpenseScreen:", detailsFromModal);
    setSplitDetails(detailsFromModal);
    setIsSplitModalVisible(false); // Close the modal
  };


  const handleSubmitExpense = () => {
    if (!expenseName.trim()) {
      Alert.alert('Error', 'Please enter an expense name.');
      return;
    }
    let amount = parseFloat(totalAmount);
    amount = parseFloat(amount.toFixed(2)); // Ensure two decimal places
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount.');
      return;
    }
    // Date is already a Date object, no need to check if it's an empty string
    // if (!expenseDate.trim()) { // This check is not valid for Date objects
    //     Alert.alert('Error', 'Please enter a date for the expense.');
    //     return;
    // }
    if (!splitDetails) {
        Alert.alert('Split Required', 'Please use the "Split" button to define how this expense is shared.',
            [{text: "OK"}]
        );
        return;
    }
    proceedWithCreation();
  };

  const proceedWithCreation = () => {
    const expenseData = {
      name: expenseName.trim(),
      totalAmount: parseFloat(totalAmount),
      date: formatDate(expenseDate), // Format date to string before sending
      imageUri: expenseImageUri,
      splitDetails: splitDetails,
      // currentGroupId: currentGroup ? currentGroup.id : null, // Pass if needed by backend
    };
    onCreateExpense(expenseData);
  };


  return (
    <View style={styles.screenOuterContainer}>
      <Image source={topPieAsset} style={styles.topPieImage} resizeMode="contain" />
      <TouchableOpacity style={styles.backButtonPlacement} onPress={onBack}>
        <Image source={backArrowAsset} style={styles.backArrowIcon} resizeMode="contain" />
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Add Expense</Text>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Name:</Text>
          <TextInput
            style={[styles.inputBar, styles.textInput]}
            placeholder="e.g., Dinner, Groceries, Uber"
            placeholderTextColor="black"
            value={expenseName}
            onChangeText={setExpenseName}
          />

          <Text style={styles.label}>Total $:</Text>
          <TextInput
            style={[styles.inputBar, styles.textInput]}
            placeholder="0.00"
            placeholderTextColor="black"
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Date:</Text>
          <TouchableOpacity
            style={[styles.inputBar, styles.dateInput]}
            onPress={() => showDatePicker ? setShowDatePicker(false) : setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(expenseDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expenseDate}
              mode="date"
              display={'spinner'}
               onChange={onDateChange}
          
              
              maximumDate={new Date()} // Users can't select future dates for expenses
               textColor={colors.WHITE} // textColor for DateTimePicker is not universally supported
              //themeVariant="dark" // For a dark theme if supported by the native picker
            />
          )}

          <Text style={styles.label}>Photo:</Text>
          <TouchableOpacity style={styles.photoButtonContainer} onPress={handleChoosePhoto}>
            {expenseImageUri ? (
              <Image source={{ uri: expenseImageUri }} style={styles.chosenImage} contentFit="cover" />
            ) : (
              <Image source={cameraIconAsset} style={styles.cameraIcon} contentFit="contain" />
            )}
          </TouchableOpacity>
          {expenseImageUri && (
            <TouchableOpacity onPress={() => setExpenseImageUri(null)}>
                <Text style={styles.removeImageText}>Remove Photo</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Split Method:</Text>
          <TouchableOpacity style={styles.splitButton} onPress={handleOpenSplitModal}>
            <Text style={styles.splitButtonText}>
                {splitDetails ? `Split: ${splitDetails.type} (${splitDetails.splits?.length || 0} involved)` : "How to Split?"}
            </Text>
          </TouchableOpacity>
          {splitDetails && splitDetails.splits && ( // Check if splitDetails.splits exists
            <Text style={styles.splitDetailText} numberOfLines={2} ellipsizeMode="tail">
                {splitDetails.splits.map(s => `${s.username[0].toUpperCase()+s.username.slice(1)}: $${s.amount?.toFixed(2)}`).join('; ')}
            </Text>
          )}

        <TouchableOpacity style={styles.createButtonContainer} onPress={handleSubmitExpense}>
            <Image source={createButtonAsset} style={styles.createButtonImage} contentFit="contain" />
        </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavBar
        onNavigateHome={onNavigateHome}
        onNavigateAdd={onNavigateAdd}
        onNavigateMoney={onNavigateMoney}
        onNavigateProfile={onNavigateProfile}
      />

      {/* Conditionally render the SplitExpenseScreen Modal */}
      {isSplitModalVisible && (
        <SplitExpenseScreen
          isVisible={isSplitModalVisible}
          onClose={() => setIsSplitModalVisible(false)}
          onSplitDone={handleSplitDone}
          totalExpenseAmount={parseFloat(totalAmount) || 0}
          groupMembers={currentGroupMembers || []} // Ensure currentGroupMembers is passed
          currentUsername={currentUsername}     // Pass currentUsername
        />
      )}
    </View>
  );
};

// Styles from your uploaded AddExpenseScreen.js, with minor adjustments if needed
const styles = StyleSheet.create({
  screenOuterContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    // alignItems: 'center', // Removed to allow ScrollView to manage its width
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // SafeAreaView in App.js handles top for iOS
  },
  scrollView: {
    flex: 1, // Allows ScrollView to take up space needed by BottomNavBar
    width: '100%',
    borderTopWidth: 2,
    borderBlockColor: colors.GROUP_BAR_BORDER_COLOR,
   
    
  },
  scrollContentContainer: {
    flexGrow: 1, // Important for ScrollView to scroll properly
    alignItems: 'center', // Center the formContainer
  
  },
  topPieImage: { // This style was from your uploaded file
    
    width:'100%',
    height:height,
    position:'absolute',
    top:-height * 0.38,
    left:0,
    right:0
  },
  backButtonPlacement: { // This style was from your uploaded file
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.04 + (StatusBar.currentHeight || 0) : height * 0.02 + (StatusBar.currentHeight || 0), // Adjusted for status bar
    left: width * 0.01,
    zIndex: 10, // Ensure it's above topPieImage
    padding: 10,
  },
  backArrowIcon: { // This style was from your uploaded file
    width: width * 0.15, // This was quite large
    height: width * 0.15,
    transform: [{ rotate: '180deg' }],
  },
  pageTitle: { // This style was from your uploaded file
    fontSize: width * 0.06,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: height * 0.12, // This might be too low if topPieImage is very tall or positioned high
    marginBottom: height * 0.02,
    textAlign: 'center',
    zIndex: 5, // Ensure title is above the pie image
  },
  formContainer: { // This style was from your uploaded file
    width: '100%',
    paddingHorizontal: width * 0.05, // Consistent padding
    marginTop: height * 0.02, // Added some margin from the title
    // backgroundColor: 'rgba(0,255,0,0.1)', // For debugging
  },
  label: { // This style was from your uploaded file
    fontSize: width * 0.045,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: height * 0.02,
    marginBottom: height * 0.008,
    alignSelf: 'flex-start',
  },
  inputBar: { // This style was from your uploaded file
    backgroundColor: INPUT_BAR_BACKGROUND_COLOR,
    borderColor: INPUT_BAR_BORDER_COLOR,
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: Platform.OS === 'ios' ? height * 0.018 : height * 0.015,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.015,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: { // This style was from your uploaded file
    flex: 1,
    color: colors.BLACK,
    fontSize: width * 0.042,
  },
  dateInput: { // This style was from your uploaded file
    justifyContent: 'center',
  },
  dateText: { // This style was from your uploaded file
    color: colors.BLACK,
    fontSize: width * 0.042,
  },
  datePicker: { // This style was from your uploaded file, might need adjustment for dark theme
    // width: width * 0.9, // Handled by DateTimePicker's own sizing
    // height: height * 0.3, // This is quite large for a date picker
    alignSelf: 'center',
    marginTop: height * 0.01,
    borderRadius: 10,
    // For Android dark theme, you might need to wrap it or use specific props if available
  },
  photoButtonContainer: { // This style was from your uploaded file
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: INPUT_BAR_BACKGROUND_COLOR,
    borderColor: INPUT_BAR_BORDER_COLOR,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: height * 0.01,
    marginBottom: height * 0.005,
    overflow: 'hidden',
  },
  cameraIcon: { // This style was from your uploaded file
    width: width * 0.15,
    height: width * 0.15,
  },
  chosenImage: { // This style was from your uploaded file
    width: '100%',
    height: '100%',
  },
  removeImageText: { // This style was from your uploaded file
    color: '#A08FF8',
    fontSize: width * 0.035,
    textAlign: 'center',
    marginBottom: height * 0.02,
    textDecorationLine: 'underline',
  },
  splitButton: { // This style was from your uploaded file
    backgroundColor: '#5A5A5A',
    borderColor: '#444444',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.01,
    marginBottom: height * 0.005,
  },
  splitButtonText: { // This style was from your uploaded file
    color: '#FFFFFF',
    fontSize: width * 0.042,
    fontWeight: 'bold',
  },
  splitDetailText: { // This style was from your uploaded file
    color: '#B0B0B0',
    fontSize: width * 0.035,
    textAlign: 'center',
    marginBottom: height * 0.02,
    fontStyle: 'italic', // Added for better distinction
  },
  createButtonContainer: { // Your uploaded file had createButtonImage with these styles
    marginTop: height * 0.02,
    alignSelf: 'center',
    // width: width * 0.32, // Moved to createButtonImage
    // height: width * 0.32, // Moved to createButtonImage
  },
  createButtonImage: { // This style was from your uploaded file
    width: width * 0.4,
    height: width * 0.4,
  },
});

export default AddExpenseScreen;
