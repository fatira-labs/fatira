// CreateGroupScreen.js
import React, { useState } from 'react';
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
  Modal,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import colors from "./color.js"

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// --- Assets ---
const topPieAsset = require('./assets/toppie1.png');
const createButtonAsset = require('./assets/piecreate.png');
const backArrowAsset = require('./assets/backbutton.png'); // Assuming you want to use the same back arrow

// --- Constants ---
const TOKEN_OPTIONS = ['USDC', 'USD*', 'EURC', 'SOL', 'Custom'];
const GROUP_BAR_BACKGROUND_COLOR = colors.GROUP_BAR_BACKGROUND_COLOR;
const GROUP_BAR_BORDER_COLOR = colors.GROUP_BAR_BORDER_COLOR; // C97108 with 80% opacity

const inputHeight = height * 0.055;

const CreateGroupScreen = ({ onBack, onCreateGroup, currentUsername ,MOCK_USER_GROUPS_DB}) => {
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKEN_OPTIONS[0]);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [isTokenModalVisible, setTokenModalVisible] = useState(false);
  const [memberUsernameInput, setMemberUsernameInput] = useState('');
  const [members, setMembers] = useState([]); // Start with the creator as the first member
console.log(MOCK_USER_GROUPS_DB)
  // Add creator to members list automatically on mount or when currentUsername is available
  useState(() => {
    if (currentUsername && !members.some(member => member.username === currentUsername)) {
      setMembers([{ username: currentUsername, id: Date.now().toString() }]);
    }
  }, [currentUsername]);


  const handleAddMember = () => {
    if (memberUsernameInput.trim() === '') {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }
    if (members.some(member => member.username.toLowerCase() === memberUsernameInput.trim().toLowerCase())) {
      Alert.alert('Error', 'This member has already been added.');
      return;
    }
    setMembers([...members, { username: memberUsernameInput.trim(), id: Date.now().toString() }]);
    setMemberUsernameInput(''); // Clear input after adding
  };

  const handleRemoveMember = (idToRemove) => {
    const memberToRemove = members.find(member => member.id === idToRemove);
    if (memberToRemove && memberToRemove.username.toLowerCase() === currentUsername.toLowerCase()) {
        Alert.alert("Cannot Remove", "You cannot remove yourself as the group creator.");
        return;
    }
    setMembers(members.filter(member => member.id !== idToRemove));
  };

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
    setTokenModalVisible(false);
    if (token !== 'Custom') {
      setCustomTokenAddress(''); // Clear custom address if not selected
    }
  };

  const handleSubmitCreateGroup = () => {
    if (groupTitle.trim() === '') {
      Alert.alert('Error', 'Group title cannot be empty.');
      return;
    }
    if (selectedToken === 'Custom' && customTokenAddress.trim() === '') {
      Alert.alert('Error', 'Please enter the custom token address.');
      return;
    }
    if (members.length === 0) {
        Alert.alert('Error', 'A group must have at least one member (the creator).');
        return;
    }

    const groupData = {
      title: groupTitle.trim(),
      token: selectedToken === 'Custom' ? customTokenAddress.trim() : selectedToken,
      isCustomToken: selectedToken === 'Custom',
      members: members.map(m => m.username), // Send only usernames
    };
    onCreateGroup(groupData); // Pass data to App.js handler
  };

  return (
    <View style={styles.screenContainer}>
      <Image source={topPieAsset} style={styles.topPieImage} resizeMode="contain" />
      <TouchableOpacity style={styles.backButtonPlacement} onPress={onBack}>
        <Image source={backArrowAsset} style={styles.backArrowIcon} resizeMode="contain" />
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Create Group</Text>

      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContentContainer}>
        {/* Group Title Input */}
        <TextInput
          style={[styles.inputBar, styles.textInput]}
          placeholder="Enter Group Name"
         
            placeholderTextColor="black"
          value={groupTitle}
          onChangeText={setGroupTitle}
        />

        {/* Token Selector */}
        <Text style={styles.label}>Token:</Text>
        <TouchableOpacity style={styles.inputBar} onPress={() => setTokenModalVisible(true)}>
          <Text style={styles.dropdownText}>{selectedToken}</Text>
        </TouchableOpacity>

        {selectedToken === 'Custom' && (
          <TextInput
            style={[styles.inputBar, styles.textInput, { marginTop: 10 }]}
            placeholder="Custom Token Name"
              placeholderTextColor="black"
            value={customTokenAddress}
            onChangeText={setCustomTokenAddress}
            autoCapitalize="none"
          />
        )}

        {/* Add Members Section */}
        <Text style={styles.label}>Members:</Text>
        <View style={styles.addMemberContainer}>
          <TextInput
            style={[styles.textInput, styles.memberInput]}
            placeholder="Enter username to add"
            placeholderTextColor="black"
            value={memberUsernameInput}
            onChangeText={setMemberUsernameInput}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addMemberButton} onPress={handleAddMember}>
            <Text style={styles.addMemberButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Members List */}
        {members.length > 0 && (
          <View style={styles.membersList}>
            {members.map((member) => (
              <View key={member.id} style={{...styles.inputBar,... styles.memberListItem,borderColor:colors.WHITE,
    borderBottomWidth:0.5,}}>
                <Text style={styles.memberText}>{member.username[0].toUpperCase()+member.username.slice(1)}</Text>
                {member.username.toLowerCase() !== currentUsername.toLowerCase() && (
                    <TouchableOpacity onPress={() => handleRemoveMember(member.id)}>
                        <Text style={styles.removeMemberText}>Remove</Text>
                    </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Group Button */}
      <TouchableOpacity style={styles.createButtonContainer} onPress={handleSubmitCreateGroup}>
        <Image source={createButtonAsset} style={styles.createButtonImage} resizeMode="contain" />
      </TouchableOpacity>

      {/* Token Selection Modal */}
      <Modal
        transparent={true}
        visible={isTokenModalVisible}
        animationType="fade"
        onRequestClose={() => setTokenModalVisible(false)}
      >
      
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setTokenModalVisible(false)}>
          <View style={styles.modalContent}>
            {TOKEN_OPTIONS.map((token) => (
              <TouchableOpacity key={token} style={styles.modalOption} onPress={() => handleTokenSelect(token)}>
                <Text style={styles.modalOptionText}>{token}</Text>
              </TouchableOpacity>
            ))}            
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.SCREEN_COLOR,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : height * 0.02,
    },
    topPieImage: {
    width: '100%', // Changed to 100% to ensure full width
    height: height, // Increased height slightly for better coverage
    position: 'absolute',
    top: -height * 0.38,
    left: 0,
    right: 0, // Added right: 0 to ensure full width
    },
  backButtonPlacement: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.04 : height * 0.04,
    left: width * 0.01,
    zIndex: 10,
  //  padding: 10,
  },
  backArrowIcon: {
    width: width * 0.2, // Adjust size as needed
    height: width * 0.2,
    transform: [{ rotate: '180deg' }], // Assuming arrow points right by default
  },
  pageTitle: {
    fontSize: width * 0.06,
    color: colors.WHITE,
    fontWeight: 'bold',
    marginTop: height * 0.18,
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  formContainer: {
    width: '90%',
    maxHeight: height * 0.5, // Adjust to leave space for create button
  },
  formContentContainer: {
   // paddingBottom: height * 0.22, // Ensure space for the absolute positioned create button
  },
  label: {
    fontSize: width * 0.045,
    color: colors.WHITE,
    fontWeight: '500',
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
    alignSelf: 'flex-start',
  },
  inputBar: {
    backgroundColor: GROUP_BAR_BACKGROUND_COLOR,
    
   borderRadius: 10,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
   //marginBottom: height * 0.015,
    flexDirection: 'row', // For member list items
    justifyContent: 'space-between', // For member list items
    alignItems: 'center', // For member list items
  },
  textInput: { // Specific to TextInput components using inputBar style
    color: 'black', // White text for input
    fontSize: width * 0.04,
    textAlignVertical: 'center', // Ensure text is centered vertically

  },
  dropdownText: {
    color: 'black',
    fontSize: width * 0.04,
  },
  addMemberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  //  marginBottom: height * 0.01,
  },
  memberInput: {
    flex: 1,
    marginRight: width * 0.02,
    height: inputHeight,
    backgroundColor: GROUP_BAR_BACKGROUND_COLOR, // match the inputBar color
    borderColor: GROUP_BAR_BORDER_COLOR,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: width * 0.04,
    color: 'black',
    fontSize: width * 0.04,
  },
  addMemberButton: {
    backgroundColor: '#A08FF8',
    borderRadius: 8,
    height: inputHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
  },
  addMemberButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  membersList: {
    marginTop: height * 0.05,
    borderTopWidth:0.5,
    borderTopColor:colors.WHITE
  },
  memberListItem: {
    //rgba(235, 188, 93, 0.95) 
    backgroundColor: "#1A1A1A", // Lighter orange for member list holders
  },
  memberText: {
    color: colors.WHITE, // Dark text on the orange bar
    fontSize: 15,
    fontWeight: '500',
    fontFamily:'AmaticBold'
    
  },
  removeMemberText: {
    color: colors.REMOVE_BTN_COLOR, // A red color for removal
    fontSize: width * 0.035,
    fontWeight: 'bold',
    
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: -15,
    alignSelf: 'center',
  },
  createButtonImage: {
    width: width * 0.4, // Adjust size as needed
    height: width * 0.4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.BLACK, // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2C2C2C', // Dark modal background
    borderRadius: 10,
   // paddingVertical: height * 0.02,
    width: width * 0.8,
    maxHeight: height * 0.5,
    borderWidth: 1,
    borderColor: '#444444',
  },
  modalOption: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    borderBottomWidth: 2,
    borderBottomColor: '#444444',
  },
  modalOptionText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    textAlign: 'center',
  },
});

export default CreateGroupScreen;
