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
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import BottomNavBar from './BottomNavBar'; // Assuming BottomNavBar.js is in the same directory

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// --- Asset Imports ---
const topPieAsset = require('./assets/toppie1.png');
const backArrowAsset = require('./assets/backbutton.png');
const cameraIconAsset = require('./assets/piecamera.png');
const createButtonAsset = require('./assets/piecreate.png'); // Assuming this is the 'CREATE' button image

// --- Constants ---
const INPUT_BAR_BACKGROUND_COLOR = 'rgba(240, 168, 41, 0.8)'; // F0A829 with 80% opacity
const INPUT_BAR_BORDER_COLOR = 'rgba(201, 113, 8, 0.8)';     // C97108 with 80% opacity
const PLACEHOLDER_IMAGE_URI = 'https://placehold.co/200x200/E0A829/2C1E0A?text=Receipt'; // Placeholder for chosen image

const AddExpenseScreen = ({
  onBack, // To navigate back (e.g., to GroupMainScreen or GroupsScreen)
  onCreateExpense, // Function to call when 'CREATE' is pressed
  // Props for BottomNavBar
  onNavigateHome,
  onNavigateAdd, // Current screen, might be disabled or navigate to self
  onNavigateMoney,
  onNavigateProfile,
  // Optional: Pass the group context if adding expense to a specific group
  // currentGroup
}) => {
  const [expenseName, setExpenseName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expenseImageUri, setExpenseImageUri] = useState(null);
  const [splitDetails, setSplitDetails] = useState(null);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
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
      [
        { 
          text: "From Library", 
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                setExpenseImageUri(result.assets[0].uri);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to pick image from library');
            }
          }
        },
        { 
          text: "Take Photo", 
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                setExpenseImageUri(result.assets[0].uri);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to take photo');
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleSplitExpense = () => {
    // This will navigate to the "Split Expense" page in the future
    // For now, it can set some mock split details or show an alert
    Alert.alert(
      "Split Expense",
      "This will open the expense splitting page. For now, let's assume it's split equally among 2 people (mock).",
      [
        {text: "OK", onPress: () => setSplitDetails({ type: 'equal', count: 2, amountPerPerson: parseFloat(totalAmount) / 2 || 0})}
      ]
    );
    // Later, data from the split page will update `splitDetails` state.
  };

  const handleSubmitExpense = () => {
    if (!expenseName.trim()) {
      Alert.alert('Error', 'Please enter an expense name.');
      return;
    }
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount.');
      return;
    }
    if (!expenseDate.trim()) { // Basic validation for date
        Alert.alert('Error', 'Please enter a date for the expense.');
        return;
    }
    // Basic validation for split (in a real app, this would be more complex)
    if (!splitDetails) {
        Alert.alert('Reminder', 'Please specify how the expense is split using the "Split" button.',
            [
                {text: "Split Later / OK", onPress: () => proceedWithCreation()},
                {text: "Cancel", style: "cancel"}
            ]
        );
        return; // Or proceed if splitting later is an option
    }

    proceedWithCreation();
  };

  const proceedWithCreation = () => {
    const expenseData = {
      name: expenseName.trim(),
      totalAmount: parseFloat(totalAmount),
      date: expenseDate.trim(), // Ideally, this would be a Date object
      imageUri: expenseImageUri,
      splitDetails: splitDetails || { type: 'individual', paidBy: 'self' }, // Default if not split
      // currentGroupId: currentGroup ? currentGroup.id : null, // If context of group is passed
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
          {/* Expense Name */}
          <Text style={styles.label}>Name:</Text>
          <TextInput
            style={[styles.inputBar, styles.textInput]}
            placeholder="e.g., Dinner, Groceries, Uber"
            placeholderTextColor="#BBBCCC"
            value={expenseName}
            onChangeText={setExpenseName}
          />

          {/* Total Amount */}
          <Text style={styles.label}>Total $:</Text>
          <TextInput
            style={[styles.inputBar, styles.textInput]}
            placeholder="0.00"
            placeholderTextColor="#BBBCCC"
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="numeric"
          />

          {/* Date Input */}
          <Text style={styles.label}>Date:</Text>
          <TouchableOpacity 
            style={[styles.inputBar, styles.dateInput]} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(expenseDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expenseDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              textColor="#FFFFFF"
              themeVariant="light"
              style={styles.datePicker}
            />
          )}

          {/* Add Photo */}
          <Text style={styles.label}>Photo:</Text>
          <TouchableOpacity style={styles.photoButtonContainer} onPress={handleChoosePhoto}>
            {expenseImageUri ? (
              <Image source={{ uri: expenseImageUri }} style={styles.chosenImage} resizeMode="cover" />
            ) : (
              <Image source={cameraIconAsset} style={styles.cameraIcon} resizeMode="contain" />
            )}
          </TouchableOpacity>
          {expenseImageUri && (
            <TouchableOpacity onPress={() => setExpenseImageUri(null)}>
                <Text style={styles.removeImageText}>Remove Photo</Text>
            </TouchableOpacity>
          )}


          {/* Split Button */}
          <Text style={styles.label}>Split Method:</Text>
          <TouchableOpacity style={styles.splitButton} onPress={handleSplitExpense}>
            <Text style={styles.splitButtonText}>
                {splitDetails ? `Split: ${splitDetails.type} (${splitDetails.count || ''} people)` : "How to Split?"}
            </Text>
          </TouchableOpacity>
          {splitDetails && (
            <Text style={styles.splitDetailText}>
                Amount per person: ${splitDetails.amountPerPerson?.toFixed(2) || 'N/A'}
            </Text>
          )}

                        {/* Create Expense Button */}
        <TouchableOpacity style={styles.createButtonPlacement} onPress={handleSubmitExpense}>
            <Image source={createButtonAsset} style={styles.createButtonImage} resizeMode="contain" />
        </TouchableOpacity>


        </View>
      </ScrollView>



      {/* Bottom Navigation Bar */}
      <BottomNavBar
        onNavigateHome={onNavigateHome}
        onNavigateAdd={onNavigateAdd} // This is the current screen
        onNavigateMoney={onNavigateMoney}
        onNavigateProfile={onNavigateProfile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenOuterContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : height * 0.02,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  screenHeaderContainer: { // Container for top image, back button, and title
    alignItems: 'center', // Center title horizontally if back button wasn't absolute
    // backgroundColor: 'blue', // For debugging layout
  },
  topPieImage: {
    width: '100%',
    height: height,
    position: 'absolute',
    top: -height * 0.38,
    left: 0,
    right: 0,
  },
  backButtonPlacement: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.04 : height * 0.04,
    left: width * 0.01,
    zIndex: 10,
    padding: 10,
  },
  backArrowIcon: {
    width: width * 0.15,
    height: width * 0.15,
    transform: [{ rotate: '180deg' }],
  },
  pageTitle: {
    fontSize: width * 0.06,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: height * 0.1,
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: width * 0.05,
  },
  label: {
    fontSize: width * 0.045,
    color: '#FFFFFF', // Lighter text for labels
    fontWeight: '500',
    marginTop: height * 0.02,
    marginBottom: height * 0.008,
    alignSelf: 'flex-start',
  },
  inputBar: {
    backgroundColor: INPUT_BAR_BACKGROUND_COLOR,
    borderColor: INPUT_BAR_BORDER_COLOR,
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: Platform.OS === 'ios' ? height * 0.018 : height * 0.015, // Adjusted padding for consistency
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.015,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1, // Allow text input to take available space if inputBar is row
    color: '#FFFFFF',
    fontSize: width * 0.042,
    // For single line TextInput within an inputBar styled View, paddingVertical might not be needed
    // paddingVertical: 0,
  },
  photoButtonContainer: {
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: INPUT_BAR_BACKGROUND_COLOR,
    borderColor: INPUT_BAR_BORDER_COLOR,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', // Center the camera button/image
    marginTop: height * 0.01,
    marginBottom: height * 0.005,
    overflow: 'hidden', // To ensure chosenImage respects borderRadius
  },
  cameraIcon: {
    width: width * 0.15,
    height: width * 0.15,
  },
  chosenImage: {
    width: '100%',
    height: '100%',
  },
  removeImageText: {
    color: '#A08FF8',
    fontSize: width * 0.035,
    textAlign: 'center',
    marginBottom: height * 0.02,
    textDecorationLine: 'underline',
  },
  splitButton: {
    backgroundColor: '#5A5A5A', // A different color for the split button
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
  splitButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.042,
    fontWeight: 'bold',
  },
  splitDetailText: {
    color: '#B0B0B0',
    fontSize: width * 0.035,
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  createButtonImage: {
    marginTop: height * 0.02,
    alignSelf: 'center',
    width: width * 0.32,
    height: width * 0.32,
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: width * 0.042,
  },
  datePicker: {
    textColor: '#FFFFFF',
    width: width * 0.9,
    height: height * 0.3,
    alignSelf: 'center',
    marginTop: height * 0.01,
    borderRadius: 10,
  },
});

export default AddExpenseScreen;
