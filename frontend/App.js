// App.js
// Import necessary React Native components
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

// Import Expo and cryptographic libraries
import * as ExpoLinking from 'expo-linking';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values'; // Required by some crypto libraries
import { Image } from 'expo-image';


// Import screen components
import GroupsScreen from './GroupsScreen';
import CreateGroupScreen from './CreateGroupScreen';
import GroupMainScreen from './GroupMainScreen';
import AddExpenseScreen from './AddExpenseScreen'; // Import the new AddExpenseScreen

// TODO: handle solana transaction

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

// --- Asset Placeholders ---
const logoAsset = require('./assets/logologin.png');
const arrowButtonAsset = require('./assets/backbutton.png');
const phantomButtonAsset = require('./assets/phantom.png');

// --- Constants for Phantom Connect ---
const DAPP_KEYPAIR_STORAGE_KEY = 'phantom_dapp_keypair';
const APP_URL = 'https://yourappname.com'; // Replace with your app's URL
const CLUSTER = 'devnet'; // Or 'mainnet-beta', 'testnet'

// --- Keypair Management ---
const generateAndStoreKeyPair = async () => {
  console.log('Generating new dApp keypair...');
  const newKeyPair = nacl.box.keyPair();
  const keyPairString = JSON.stringify({
    publicKey: bs58.encode(newKeyPair.publicKey),
    secretKey: bs58.encode(newKeyPair.secretKey),
  });
  try {
    await SecureStore.setItemAsync(DAPP_KEYPAIR_STORAGE_KEY, keyPairString);
    console.log('New dApp keypair generated and stored securely.');
    return { publicKey: newKeyPair.publicKey, secretKey: newKeyPair.secretKey };
  } catch (e) {
    console.error("Failed to store dApp keypair securely:", e);
    Alert.alert("Storage Error", "Could not save app keys. Wallet features may not work reliably.");
    return { publicKey: newKeyPair.publicKey, secretKey: newKeyPair.secretKey };
  }
};

const getOrCreateKeyPair = async () => {
  console.log('Attempting to retrieve stored dApp keypair...');
  try {
    const storedKeyPairString = await SecureStore.getItemAsync(DAPP_KEYPAIR_STORAGE_KEY);
    if (storedKeyPairString) {
      console.log('Found stored dApp keypair.');
      const storedKeyPair = JSON.parse(storedKeyPairString);
      return {
        publicKey: bs58.decode(storedKeyPair.publicKey),
        secretKey: bs58.decode(storedKeyPair.secretKey),
      };
    } else {
      console.log('No stored dApp keypair found.');
      return await generateAndStoreKeyPair();
    }
  } catch (e) {
    console.error('Failed to retrieve or parse stored dApp keypair:', e);
    Alert.alert("Key Error", "Error with app keys. Generating new ones. Functionality may be affected.");
    return await generateAndStoreKeyPair();
  }
};

// --- SetupUsernameScreen Component ---
const SetupUsernameScreen = ({ onUsernameSubmitted, walletAddress }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const handleSubmit = () => {
    if (usernameInput.trim()) {
      onUsernameSubmitted(usernameInput.trim());
    } else {
      Alert.alert('Input Required', 'Username cannot be empty.');
    }
  };
  return (
    <View style={styles.screenContainer}>
      <Image source={logoAsset} style={styles.logo} resizeMode="contain" />
      <Text style={styles.promptText}>
        Wallet Connected: <Text style={styles.addressTextSmall}>{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'N/A'}</Text>
      </Text>
      <Text style={styles.promptText}>Please create a username to continue:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        placeholderTextColor="#888"
        value={usernameInput}
        onChangeText={setUsernameInput}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.arrowButtonContainer} onPress={handleSubmit}>
        <Image source={arrowButtonAsset} style={styles.arrowButton} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

// --- ConnectWalletScreen Component ---
const ConnectWalletScreen = ({ dappKeyPair, connectionStatus, connectToPhantom }) => {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.welcomeText}>Connect your Wallet</Text>
      <Image source={logoAsset} style={styles.logo} resizeMode="contain" />
      <Text style={styles.promptText}>Please connect your Phantom wallet to get started.</Text>
      {connectionStatus === 'Initializing' || connectionStatus === 'Connecting' ? (
        <ActivityIndicator size="large" color="#A08FF8" style={{ marginVertical: 20 }}/>
      ) : (
        <TouchableOpacity style={styles.phantomImageButton} onPress={connectToPhantom} disabled={!dappKeyPair || connectionStatus === 'Error' || connectionStatus === 'Connecting'}>
          <Image source={phantomButtonAsset} style={styles.phantomButtonImage} resizeMode="contain" />
        </TouchableOpacity>
      )}
      {connectionStatus === 'Error' && <Text style={styles.errorText}>Connection failed. Please try again.</Text>}
      {connectionStatus !== 'Connected' && connectionStatus !== 'Initializing' && connectionStatus !== 'Connecting' && (
         <Text style={styles.statusHelperText}>{dappKeyPair ? "Ready to connect." : "Initializing app keys..."}</Text>
      )}
    </View>
  );
};

// --- Main App Component ---
const App = () => {
  // Screen states: 'ConnectWallet', 'SetupUsername', 'GroupsScreen', 'CreateGroupScreen', 'GroupMainScreen', 'AddExpenseScreen'
  const [currentScreen, setCurrentScreen] = useState('ConnectWallet');
  const [appUsername, setAppUsername] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [previousScreen, setPreviousScreen] = useState('GroupsScreen'); // To track where to go back from AddExpense

  // Phantom Connect States
  const [dappKeyPair, setDappKeyPair] = useState(null);
  const [userPublicKey, setUserPublicKey] = useState(null);
  const [session, setSession] = useState(null);
  const [sharedSecret, setSharedSecret] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Initializing');

  useEffect(() => {
    const initialize = async () => {
      setConnectionStatus('Initializing');
      try {
        const keyPair = await getOrCreateKeyPair();
        if (keyPair?.publicKey) {
          setDappKeyPair(keyPair);
          setConnectionStatus('Disconnected');
        } else {
          throw new Error("Keypair generation/retrieval failed.");
        }
      } catch (error) {
        console.error('Failed to initialize dApp keys:', error);
        Alert.alert('Initialization Error', `Could not initialize app keys: ${error.message}`);
        setConnectionStatus('Error');
      }
    };
    initialize();
  }, []);

  // --- MOCK DATA ---
  const MOCK_USER_CREDENTIALS = {
    "B8yQuZiC4Ku6VNuGDLRrUQnVRC4LJFnzGVUC6ArrMk51": "luckenson",
    "AnotherWalletKeyForTesting123": "TestUser2",
  };

  const MOCK_USER_GROUPS_DB = {
    "B8yQuZiC4Ku6VNuGDLRrUQnVRC4LJFnzGVUC6ArrMk51": [
      { id: "group_luckenson_1", name: "Colesseum", balance: 20, token: "USDC", members: ["luckenson", "Alice", "Bob"] },
      { id: "group_luckenson_2", name: "ETHDenver", balance: -15, token: "SOL", members: ["luckenson", "Charlie"] },
      { id: "group_luckenson_3", name: "NEXUS", balance: 0, token: "EURC", members: ["luckenson", "David", "Eve"] },
    ],
    "AnotherWalletKeyForTesting123": [
      { id: "group_testuser2_1", name: "Gaming Crew", balance: 5, token: "USDC", members: ["TestUser2", "Gamer1"] },
    ],
    "defaultNewUser": [],
  };

  const MOCK_GROUP_TRANSACTIONS = {
    "group_luckenson_1": [
      { id: "tx_col_1", date: "05/10", title: "Hackathon Pizza", paidBy: "Alice", totalAmount: 60, yourShare: 20, type: "group_expense_involved", fullDetail: "Alice paid $60 for pizzas" },
      { id: "tx_col_2", date: "05/09", title: "Cloud Credits", paidBy: "You", totalAmount: 25, yourShare: 25, type: "lent", fullDetail: "You paid $25 for cloud credits" },
    ],
    "group_luckenson_2": [
      { id: "tx_ethd_1", date: "04/26", title: "Chipotle", paidBy: "Charlie", totalAmount: 40, yourShare: 20, type: "borrowed", fullDetail: "Charlie paid $40, you owe $20" },
      { id: "tx_ethd_2", date: "04/20", title: "Uber", paidBy: "You", totalAmount: 15, yourShare: 15, type: "lent", fullDetail: "You paid $15 for Uber" },
    ],
    "group_luckenson_3": [],
    "group_testuser2_1": [
      { id: "tx_gaming_1", date: "05/05", title: "New Game Purchase", paidBy: "Gamer1", totalAmount: 70, yourShare: 35, type: "group_expense_involved", fullDetail: "Gamer1 bought a new game for $70" },
    ],
  };
  // --- END MOCK DATA ---

  const checkDatabaseForUser = async (walletKey) => {
    console.log(`Checking database for user with wallet: ${walletKey}`);
    await new Promise(resolve => setTimeout(resolve, 700));
    const username = MOCK_USER_CREDENTIALS[walletKey];
    if (username) {
      console.log(`User found: ${username}`);
      const groups = MOCK_USER_GROUPS_DB[walletKey] || MOCK_USER_GROUPS_DB["defaultNewUser"] || [];
      setUserGroups(groups);
      return username;
    } else {
      console.log('User not found in mock database.');
      setUserGroups(MOCK_USER_GROUPS_DB["defaultNewUser"] || []);
      return null;
    }
  };

  const saveUserToDatabase = async (walletKey, username) => {
    console.log(`Saving user to database: Wallet: ${walletKey}, Username: ${username}`);
    await new Promise(resolve => setTimeout(resolve, 700));
    MOCK_USER_CREDENTIALS[walletKey] = username;
    if (!MOCK_USER_GROUPS_DB[walletKey]) {
      MOCK_USER_GROUPS_DB[walletKey] = [...(MOCK_USER_GROUPS_DB["defaultNewUser"] || [])];
    }
    setUserGroups(MOCK_USER_GROUPS_DB[walletKey]);
    console.log('User saved. Credentials:', MOCK_USER_CREDENTIALS);
    console.log('User groups set to:', MOCK_USER_GROUPS_DB[walletKey]);
    return true;
  };

  const buildConnectionUrl = useCallback(() => {
    if (!dappKeyPair) { console.error('Cannot build URL: Dapp keypair not ready.'); return null; }
    const redirectLink = ExpoLinking.createURL('onconnect');
    const params = new URLSearchParams({ app_url: APP_URL, dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey), redirect_link: redirectLink, cluster: CLUSTER });
    return `https://phantom.app/ul/v1/connect?${params.toString()}`;
  }, [dappKeyPair]);

  const connectToPhantom = useCallback(async () => {
    if (connectionStatus === 'Connected' && currentScreen !== 'ConnectWallet') { return; }
    if (!dappKeyPair || connectionStatus === 'Initializing' || connectionStatus === 'Error') { Alert.alert('Not Ready', 'App initializing...'); return; }
    const url = buildConnectionUrl();
    if (!url) { Alert.alert('Connection Error', 'Could not build Phantom URL.'); return; }
    setConnectionStatus('Connecting'); setUserPublicKey(null); setSession(null); setSharedSecret(null);
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url); else throw new Error("Cannot open Phantom URL.");
    } catch (error) { Alert.alert('Error', error.message || 'Could not open Phantom.'); setConnectionStatus('Disconnected'); }
  }, [connectionStatus, dappKeyPair, userPublicKey, buildConnectionUrl, currentScreen]);

  const handleDeepLink = useCallback(async (event) => {
    const urlString = event.url;
    const urlObject = ExpoLinking.parse(urlString);
    const isConnectRedirect = urlObject.path === 'onconnect' || urlObject.hostname === 'onconnect' || urlString.includes('onconnect');
    if (!isConnectRedirect) return;
    if (connectionStatus !== 'Connecting' && connectionStatus !== 'Disconnected') { if(connectionStatus !== 'Connected') setConnectionStatus('Disconnected'); return; }
    setConnectionStatus('Connecting');
    const params = urlObject.queryParams;
    if (params.errorCode) { Alert.alert('Connection Failed', params.errorMessage || 'Unknown error.'); setConnectionStatus('Disconnected'); return; }
    const { phantom_encryption_public_key: pkB58, nonce: nB58, data: dB58 } = params;
    if (!pkB58 || !nB58 || !dB58 || !dappKeyPair?.secretKey) { Alert.alert('Connection Error', 'Invalid data from Phantom.'); setConnectionStatus('Disconnected'); return; }
    try {
      const pkBytes = bs58.decode(pkB58); const nBytes = bs58.decode(nB58); const dBytes = bs58.decode(dB58);
      const secret = nacl.box.before(pkBytes, dappKeyPair.secretKey);
      const decrypted = nacl.box.open.after(dBytes, nBytes, secret);
      if (!decrypted) throw new Error('Decryption failed.');
      const payload = JSON.parse(new TextDecoder().decode(decrypted));
      if (!payload.public_key || !payload.session) throw new Error("Decrypted data missing key info.");
      setUserPublicKey(payload.public_key); setSession(payload.session); setSharedSecret(secret); setConnectionStatus('Connected');
      console.log(`Successfully connected to wallet: ${payload.public_key}`);
      const existingUsername = await checkDatabaseForUser(payload.public_key);
      if (existingUsername) { setAppUsername(existingUsername); setCurrentScreen('GroupsScreen'); }
      else { setCurrentScreen('SetupUsername'); }
    } catch (error) { console.error('Deep link error:', error); Alert.alert('Connection Error', error.message); setUserPublicKey(null); setSession(null); setSharedSecret(null); setConnectionStatus('Disconnected'); }
  }, [dappKeyPair, connectionStatus, checkDatabaseForUser]);

  const handleLogout = () => {
    setUserPublicKey(null); setSession(null); setSharedSecret(null);
    setAppUsername(''); setUserGroups([]); setSelectedGroup(null);
    setConnectionStatus('Disconnected'); setCurrentScreen('ConnectWallet');
    Alert.alert("Logged Out", "Successfully logged out.");
  };

  const linkingUrl = ExpoLinking.useURL();
  useEffect(() => { if (linkingUrl) handleDeepLink({ url: linkingUrl }); }, [linkingUrl, handleDeepLink]);
  useEffect(() => { const sub = ExpoLinking.addEventListener('url', handleDeepLink); return () => sub.remove(); }, [handleDeepLink]);

  const handleUsernameSubmitted = async (username) => {
    if (userPublicKey) {
      setAppUsername(username);
      if (await saveUserToDatabase(userPublicKey, username)) {
        setCurrentScreen('GroupsScreen'); Alert.alert("Welcome!", `Username ${username} created.`);
      } else Alert.alert("Save Error", "Could not save username.");
    } else { Alert.alert("Error", "Wallet not connected."); setCurrentScreen('ConnectWallet'); }
  };

  // Navigation to Create Group Screen
  const handleNavigateToCreateGroup = () => {
    setPreviousScreen(currentScreen); // Store current screen
    setCurrentScreen('CreateGroupScreen');
  };

  // Navigation back to Groups Screen (from CreateGroup or GroupMain or AddExpense)
  const handleBackToGroups = () => {
    setSelectedGroup(null); // Clear selected group when returning to the list
    setCurrentScreen('GroupsScreen');
  };

  // Create Group Logic
  const handleCreateGroup = (groupData) => {
    console.log('Creating group with data:', groupData);
    const newGroupId = `group_${appUsername.toLowerCase()}_${Date.now()}`;
    const newGroup = {
      id: newGroupId,
      name: groupData.title,
      token: groupData.token,
      balance: 0,
      members: groupData.members,
    };

    if (userPublicKey) {
      const updatedGroupsForUser = [...(MOCK_USER_GROUPS_DB[userPublicKey] || []), newGroup];
      MOCK_USER_GROUPS_DB[userPublicKey] = updatedGroupsForUser;
      setUserGroups(updatedGroupsForUser);
      MOCK_GROUP_TRANSACTIONS[newGroupId] = [];
      console.log("Updated MOCK_USER_GROUPS_DB:", MOCK_USER_GROUPS_DB);
      console.log("Updated MOCK_GROUP_TRANSACTIONS:", MOCK_GROUP_TRANSACTIONS);
    }
    Alert.alert('Group Created!', `Group "${groupData.title}" has been successfully created.`);
    setCurrentScreen('GroupsScreen');
  };

  // Navigate to the main page for a selected group
  const handleNavigateToGroupMain = (group) => {
    setPreviousScreen(currentScreen); // Store current screen
    setSelectedGroup(group);
    setCurrentScreen('GroupMainScreen');
  };

  // Navigate to Add Expense Screen
  const handleNavigateToAddExpense = () => {
    setPreviousScreen(currentScreen); // Store current screen
    setCurrentScreen('AddExpenseScreen');
  };

  // Handle creation of an expense
  const handleCreateExpense = (expenseData) => {
    console.log('Creating expense with data:', expenseData);
    // Determine the target group for the expense
    // If selectedGroup is set (i.e., adding expense from within a group), use that.
    // Otherwise, this logic might need adjustment based on UX (e.g., prompt user to select a group).
    const targetGroupId = selectedGroup ? selectedGroup.id : (userGroups[0] ? userGroups[0].id : null); // Fallback for now

    if (targetGroupId) {
        const newExpenseId = `exp_${targetGroupId}_${Date.now()}`;
        const newExpense = {
            id: newExpenseId,
            date: expenseData.date,
            title: expenseData.name,
            paidBy: appUsername, // Assume current user paid
            totalAmount: expenseData.totalAmount,
            yourShare: expenseData.totalAmount, // Simplified: assume user paid full, actual share depends on split
            type: 'group_expense_involved', // Default type, can be refined by splitDetails
            fullDetail: `${appUsername} paid $${expenseData.totalAmount} for ${expenseData.name}`,
            imageUri: expenseData.imageUri,
            splitDetails: expenseData.splitDetails,
        };
        if (!MOCK_GROUP_TRANSACTIONS[targetGroupId]) {
            MOCK_GROUP_TRANSACTIONS[targetGroupId] = [];
        }
        MOCK_GROUP_TRANSACTIONS[targetGroupId].unshift(newExpense); // Add to beginning of list
        console.log("Updated transactions for group", targetGroupId, MOCK_GROUP_TRANSACTIONS[targetGroupId]);

        // Optional: Update group balance if this expense directly affects it for the current user
        // This is a complex part depending on your app's accounting logic.
        // For example, if you paid, your balance with the group might change.
        // For now, we'll keep it simple and not auto-update balance here.

    } else {
        console.warn("Could not determine target group for the expense. Expense not added to a specific group's transaction list.");
    }
    Alert.alert('Expense Added!', `Expense "${expenseData.name}" has been recorded.`);
    // Navigate back to the previous screen (e.g., GroupMainScreen or GroupsScreen)
    setCurrentScreen(previousScreen);
  };

  // Navigate back from AddExpenseScreen
  const handleBackFromAddExpense = () => {
    setCurrentScreen(previousScreen); // Go back to the screen user was on before AddExpense
  };

  // Placeholder Navigations for BottomNavBar items and Group Settings
  const handleNavMoney = () => Alert.alert("Navigate", "Money/Summary page (To be implemented)");
  const handleNavProfile = () => Alert.alert("Navigate", "User Profile page (To be implemented)");
  const handleNavGroupSettings = () => Alert.alert("Navigate", "Group Settings page (To be implemented)");

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      {currentScreen === 'ConnectWallet' && (
        <ConnectWalletScreen dappKeyPair={dappKeyPair} connectionStatus={connectionStatus} connectToPhantom={connectToPhantom} />
      )}
      {currentScreen === 'SetupUsername' && userPublicKey && (
        <SetupUsernameScreen onUsernameSubmitted={handleUsernameSubmitted} walletAddress={userPublicKey} />
      )}
      {currentScreen === 'GroupsScreen' && userPublicKey && appUsername && (
        <GroupsScreen
          username={appUsername}
          userGroups={userGroups}
          onLogout={handleLogout}
          onAddGroup={handleNavigateToCreateGroup}
          onSelectGroup={handleNavigateToGroupMain}
        />
      )}
      {currentScreen === 'CreateGroupScreen' && userPublicKey && appUsername && (
        <CreateGroupScreen
          onBack={handleBackToGroups}
          onCreateGroup={handleCreateGroup}
          currentUsername={appUsername}
        />
      )}
      {currentScreen === 'GroupMainScreen' && selectedGroup && userPublicKey && appUsername && (
        <GroupMainScreen
          groupName={selectedGroup.name}
          groupBalance={selectedGroup.balance}
          transactions={MOCK_GROUP_TRANSACTIONS[selectedGroup.id] || []}
          onNavigateToSettings={handleNavGroupSettings}
          // BottomNavBar props
          onNavigateHome={handleBackToGroups}
          onNavigateAdd={handleNavigateToAddExpense} // Navigate to Add Expense
          onNavigateMoney={handleNavMoney}
          onNavigateProfile={handleNavProfile}
        />
      )}
      {currentScreen === 'AddExpenseScreen' && userPublicKey && appUsername && (
        <AddExpenseScreen
            onBack={handleBackFromAddExpense}
            onCreateExpense={handleCreateExpense}
            // currentGroup={selectedGroup} // Pass if AddExpenseScreen needs specific group context immediately
            // BottomNavBar props
            onNavigateHome={handleBackToGroups}
            onNavigateAdd={() => setCurrentScreen('AddExpenseScreen')} // Or handleNavigateToAddExpense
            onNavigateMoney={handleNavMoney}
            onNavigateProfile={handleNavProfile}
        />
      )}

      {/* Fallback Screens */}
      {(currentScreen === 'SetupUsername' && !userPublicKey) && (
        <View style={styles.screenContainer}><Text style={styles.errorText}>Error: Wallet not connected.</Text>
            <TouchableOpacity onPress={() => setCurrentScreen('ConnectWallet')} style={styles.genericButton}>
                <Text style={styles.genericButtonText}>Retry Connection</Text>
            </TouchableOpacity></View>
      )}
      {( (currentScreen !== 'ConnectWallet' && currentScreen !== 'SetupUsername') && (!userPublicKey || !appUsername) ) && (
        <View style={styles.screenContainer}><Text style={styles.errorText}>Error: Session invalid.</Text>
            <TouchableOpacity onPress={() => handleLogout()} style={styles.genericButton}>
                <Text style={styles.genericButtonText}>Login Again</Text>
            </TouchableOpacity></View>
      )}
    </SafeAreaView>
  );
};

// --- Styles for App.js (shared styles) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  screenContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: width * 0.1, backgroundColor: '#1A1A1A' },
  logo: { width: width * 0.4, height: height * 0.1, marginBottom: height * 0.02 },
  welcomeText: { fontSize: width * 0.065, color: '#FFFFFF', fontFamily: 'System', marginBottom: height * 0.015, textAlign: 'center', fontWeight: '600' },
  promptText: { fontSize: width * 0.045, color: '#CCCCCC', fontFamily: 'System', marginBottom: height * 0.03, textAlign: 'center', lineHeight: width * 0.06 },
  input: { width: '100%', height: height * 0.07, backgroundColor: '#4A4A4A', borderRadius: width * 0.03, paddingHorizontal: width * 0.04, fontSize: width * 0.04, color: '#FFFFFF', marginBottom: height * 0.05, borderWidth: 1, borderColor: '#555555' },
  arrowButtonContainer: { marginTop: height * 0.02 },
  arrowButton: { width: width * 0.18, height: width * 0.18 },
  phantomImageButton: { marginTop: height * 0.02 },
  phantomButtonImage: { width: width * 0.7, height: height * 0.08 },
  addressTextSmall: { fontSize: width * 0.04, color: '#A0A0A0', fontFamily: 'monospace' },
  errorText: { fontSize: width * 0.04, color: '#FF7070', marginTop: height * 0.02, textAlign: 'center', paddingHorizontal: 10 },
  statusHelperText: { fontSize: width * 0.035, color: '#888888', marginTop: height * 0.015, textAlign: 'center' },
  genericButton: { backgroundColor: '#A08FF8', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, marginTop: 20 },
  genericButtonText: { color: '#FFFFFF', fontSize: width * 0.04, fontWeight: 'bold' },
});

export default App;
