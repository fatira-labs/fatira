// App.js
// Import necessary React Native components
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
  // ScrollView is no longer needed here directly as GroupsScreen handles its own
} from 'react-native';

// Import Expo and cryptographic libraries
import * as ExpoLinking from 'expo-linking';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as SecureStore from 'expo-secure-store';

// Import the new GroupsScreen component
import GroupsScreen from './GroupsScreen'; // Assuming GroupsScreen.js is in the same directory

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

// --- Asset Placeholders ---
// These assets are used by components within App.js or passed as props
const logoAsset = require('./assets/logologin.png');
const arrowButtonAsset = require('./assets/backbutton.png');
const phantomButtonAsset = require('./assets/phantom.png');
// const topPieAsset = require('./assets/toppie1.png'); // Moved to GroupsScreen.js
// const plusButtonAsset = require('./assets/pieplus.png'); // Moved to GroupsScreen.js


// --- Constants for Phantom Connect ---
const DAPP_KEYPAIR_STORAGE_KEY = 'phantom_dapp_keypair';
const APP_URL = 'https://yourappname.com'; // Replace with your app's URL
const CLUSTER = 'devnet'; // Or 'mainnet-beta', 'testnet'

// --- Keypair Management (No changes) ---
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


// --- SetupUsernameScreen Component (No changes) ---
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
      <TouchableOpacity
        style={styles.arrowButtonContainer}
        onPress={handleSubmit}
      >
        <Image source={arrowButtonAsset} style={styles.arrowButton} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

// --- ConnectWalletScreen Component (No changes) ---
const ConnectWalletScreen = ({
  dappKeyPair,
  userPublicKey,
  connectionStatus,
  connectToPhantom,
}) => {
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
      {connectionStatus === 'Error' && (
        <Text style={styles.errorText}>Connection failed. Please try again.</Text>
      )}
      {connectionStatus !== 'Connected' && connectionStatus !== 'Initializing' && connectionStatus !== 'Connecting' && (
         <Text style={styles.statusHelperText}>
            {dappKeyPair ? "Ready to connect." : "Initializing app keys..."}
        </Text>
      )}
    </View>
  );
};

// GroupsScreen component is now imported from ./GroupsScreen.js

// --- Main App Component (Manages state and logic) ---
const App = () => {
  // Screen states: 'ConnectWallet', 'SetupUsername', 'GroupsScreen'
  const [currentScreen, setCurrentScreen] = useState('ConnectWallet');
  const [appUsername, setAppUsername] = useState('');
  const [userGroups, setUserGroups] = useState([]);

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
          console.log('Dapp Public Key (base58 for connect URL):', bs58.encode(keyPair.publicKey));
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

  // --- MOCK USER DATA ---
  const MOCK_USER_CREDENTIALS = {
    "B8yQuZiC4Ku6VNuGDLRrUQnVRC4LJFnzGVUC6ArrMk51": "luckenson", // Example: Pre-existing user
  };
  const MOCK_USER_GROUPS = {
    "B8yQuZiC4Ku6VNuGDLRrUQnVRC4LJFnzGVUC6ArrMk51": [{name: "Colesseum"}, {name: "ETHDenver"}, {name: "NEXUS"}, {name: "NEXUS"}, {name: "NEXUS"}, {name: "NEXUS"}], // Groups for pre-existing user
    "defaultNewUser": [{name: "My First Pie"}], // Default groups for a brand new user
    "defaultExistingUserNoGroups": [{name: "Explore Pies"}] // Default if user exists but has no specific groups listed
  };

  const checkDatabaseForUser = async (walletKey) => {
    console.log(`Checking database for user with wallet: ${walletKey}`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
    const username = MOCK_USER_CREDENTIALS[walletKey];
    if (username) {
      console.log(`User found: ${username}`);
      const groups = MOCK_USER_GROUPS[walletKey] || MOCK_USER_GROUPS["defaultExistingUserNoGroups"] || [];
      setUserGroups(groups);
      return username;
    } else {
      console.log('User not found in mock database.');
      setUserGroups(MOCK_USER_GROUPS["defaultNewUser"] || []); // Assign default groups for new user
      return null;
    }
  };

  const saveUserToDatabase = async (walletKey, username) => {
    console.log(`Saving user to database: Wallet: ${walletKey}, Username: ${username}`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
    MOCK_USER_CREDENTIALS[walletKey] = username;
    // Assign default groups if this new user doesn't have specific ones yet
    // (checkDatabaseForUser would have already set defaultNewUser groups if they were truly new)
    // This ensures if they were somehow missed, they get some groups.
    const groups = MOCK_USER_GROUPS[walletKey] || MOCK_USER_GROUPS["defaultNewUser"] || [];
    setUserGroups(groups);
    console.log('User saved to mock database. Credentials:', MOCK_USER_CREDENTIALS);
    console.log('User groups set to:', groups);
    return true;
  };
  // --- END MOCK USER DATA ---

  const buildConnectionUrl = useCallback(() => {
    if (!dappKeyPair) {
      console.error('Cannot build URL: Dapp keypair not ready.');
      return null;
    }
    const redirectLink = ExpoLinking.createURL('onconnect');
    const params = new URLSearchParams({
      app_url: APP_URL,
      dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
      redirect_link: redirectLink,
      cluster: CLUSTER,
    });
    const url = `https://phantom.app/ul/v1/connect?${params.toString()}`;
    console.log('Constructed Phantom URL:', url);
    return url;
  }, [dappKeyPair]);

  const connectToPhantom = useCallback(async () => {
    if (connectionStatus === 'Connected' && currentScreen !== 'ConnectWallet') {
      Alert.alert('Already Connected', `Wallet ${userPublicKey ? userPublicKey.slice(0,8) : ''}... is connected.`);
      return;
    }
    if (!dappKeyPair || connectionStatus === 'Initializing' || connectionStatus === 'Error') {
      Alert.alert('Not Ready', 'The application is still initializing or encountered an error. Please wait or restart.');
      return;
    }
    const url = buildConnectionUrl();
    if (!url) {
      Alert.alert('Connection Error', 'Could not construct the Phantom connection URL.');
      return;
    }
    setConnectionStatus('Connecting');
    setUserPublicKey(null);
    setSession(null);
    setSharedSecret(null);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error("Cannot open Phantom URL. Is Phantom Wallet installed?");
      }
    } catch (error) {
      console.error("Failed to open Phantom URL:", error);
      Alert.alert('Error', error.message || 'Could not open Phantom. Is it installed?');
      setConnectionStatus('Disconnected');
    }
  }, [connectionStatus, dappKeyPair, userPublicKey, buildConnectionUrl, currentScreen]);

  const handleDeepLink = useCallback(async (event) => {
    const urlString = event.url;
    console.log('Received deep link:', urlString);
    const urlObject = ExpoLinking.parse(urlString);
    const isConnectRedirect = urlObject.path === 'onconnect' || urlObject.hostname === 'onconnect' || urlString.includes('onconnect');

    if (!isConnectRedirect) {
        console.log("Deep link is not for Phantom connect, ignoring.");
        return;
    }
    if (connectionStatus !== 'Connecting' && connectionStatus !== 'Disconnected') {
       console.log("Received connect redirect but wasn't in 'Connecting' or 'Disconnected' state. Current status:", connectionStatus);
       if(connectionStatus !== 'Connected') setConnectionStatus('Disconnected');
       return;
    }
    console.log("Processing Phantom connect redirect...");
    setConnectionStatus('Connecting');
    const params = urlObject.queryParams;

    if (params.errorCode) {
      const error = params.errorMessage || 'Unknown error from Phantom.';
      console.error('Phantom connection rejected or failed:', error);
      Alert.alert('Connection Failed', `Phantom returned an error: ${error}`);
      setConnectionStatus('Disconnected');
      return;
    }

    const phantomPublicKeyB58 = params.phantom_encryption_public_key;
    const nonceB58 = params.nonce;
    const dataB58 = params.data;

    if (!phantomPublicKeyB58 || !nonceB58 || !dataB58 || !dappKeyPair?.secretKey) {
      console.error('Missing parameters or dApp secretKey in redirect data:', {params, hasDappSecretKey: !!dappKeyPair?.secretKey });
      Alert.alert('Connection Error', 'Received invalid or incomplete data from Phantom.');
      setConnectionStatus('Disconnected');
      return;
    }

    try {
      const phantomPublicKeyBytes = bs58.decode(phantomPublicKeyB58);
      const nonceBytes = bs58.decode(nonceB58);
      const encryptedDataBytes = bs58.decode(dataB58);
      const calculatedSharedSecret = nacl.box.before(phantomPublicKeyBytes, dappKeyPair.secretKey);
      const decryptedDataUint8 = nacl.box.open.after(encryptedDataBytes, nonceBytes, calculatedSharedSecret);

      if (!decryptedDataUint8) {
        throw new Error('Failed to decrypt data from Phantom.');
      }
      const decryptedDataString = new TextDecoder().decode(decryptedDataUint8);
      const decryptedPayload = JSON.parse(decryptedDataString);
      console.log('Decrypted Payload:', decryptedPayload);

      if (!decryptedPayload.public_key || !decryptedPayload.session) {
        throw new Error("Decrypted data is missing public_key or session.");
      }

      const connectedWalletKey = decryptedPayload.public_key;
      setUserPublicKey(connectedWalletKey);
      setSession(decryptedPayload.session);
      setSharedSecret(calculatedSharedSecret);
      setConnectionStatus('Connected');
      console.log(`Successfully connected to wallet: ${connectedWalletKey}`);
      // Removed Alert here, will show welcome on GroupsScreen or after username setup.

      const existingUsername = await checkDatabaseForUser(connectedWalletKey);
      if (existingUsername) {
        setAppUsername(existingUsername);
        setCurrentScreen('GroupsScreen');
        console.log(`User '${existingUsername}' found. Navigating to GroupsScreen.`);
      } else {
        setCurrentScreen('SetupUsername');
        console.log('No user found. Navigating to SetupUsername.');
      }

    } catch (error) {
      console.error('Failed to handle Phantom redirect (decryption/processing):', error);
      Alert.alert('Connection Error', `Failed to process response: ${error.message}`);
      setUserPublicKey(null);
      setSession(null);
      setSharedSecret(null);
      setConnectionStatus('Disconnected');
    }
  }, [dappKeyPair, connectionStatus, checkDatabaseForUser]);

  const handleLogout = () => {
    console.log("Logging out / Disconnecting wallet...");
    setUserPublicKey(null);
    setSession(null);
    setSharedSecret(null);
    setAppUsername('');
    setUserGroups([]);
    setConnectionStatus('Disconnected');
    setCurrentScreen('ConnectWallet');
    Alert.alert("Logged Out", "You have been successfully logged out.");
  };

  const linkingUrl = ExpoLinking.useURL();
  useEffect(() => {
    if (linkingUrl) {
      console.log("App opened with URL (or URL changed):", linkingUrl);
      handleDeepLink({ url: linkingUrl });
    }
  }, [linkingUrl, handleDeepLink]);

  useEffect(() => {
    const subscription = ExpoLinking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [handleDeepLink]);

  const handleUsernameSubmitted = async (username) => {
    if (userPublicKey) {
      setAppUsername(username);
      const success = await saveUserToDatabase(userPublicKey, username);
      if (success) {
        setCurrentScreen('GroupsScreen');
        console.log(`Username '${username}' set. Navigating to GroupsScreen.`);
        Alert.alert("Welcome!", `Username ${username} created successfully.`);
      } else {
        Alert.alert("Save Error", "Could not save username. Please try again.");
      }
    } else {
      Alert.alert("Error", "Wallet public key not available. Please reconnect.");
      setCurrentScreen('ConnectWallet');
    }
  };

  const handleAddGroup = () => {
    Alert.alert("Add Group", "This feature is coming soon!");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      {currentScreen === 'ConnectWallet' && (
        <ConnectWalletScreen
          dappKeyPair={dappKeyPair}
          userPublicKey={userPublicKey}
          connectionStatus={connectionStatus}
          connectToPhantom={connectToPhantom}
        />
      )}
      {currentScreen === 'SetupUsername' && userPublicKey && (
        <SetupUsernameScreen
          onUsernameSubmitted={handleUsernameSubmitted}
          walletAddress={userPublicKey}
        />
      )}
      {currentScreen === 'GroupsScreen' && userPublicKey && appUsername && (
        <GroupsScreen
          username={appUsername}
          userGroups={userGroups}
          onLogout={handleLogout}
          onAddGroup={handleAddGroup}
          // Pass assets if GroupsScreen expects them as props
          // topPieAsset={topPieAsset}
          // plusButtonAsset={plusButtonAsset}
        />
      )}
      {(currentScreen === 'SetupUsername' && !userPublicKey) && (
        <View style={styles.screenContainer}>
            <Text style={styles.errorText}>Error: Wallet not connected. Cannot setup username.</Text>
            <TouchableOpacity onPress={() => setCurrentScreen('ConnectWallet')} style={styles.genericButton}>
                <Text style={styles.genericButtonText}>Retry Connection</Text>
            </TouchableOpacity>
        </View>
      )}
       {(currentScreen === 'GroupsScreen' && (!userPublicKey || !appUsername)) && (
        <View style={styles.screenContainer}>
            <Text style={styles.errorText}>Error: Session invalid. Please log in again.</Text>
             <TouchableOpacity onPress={() => handleLogout()} style={styles.genericButton}>
                <Text style={styles.genericButtonText}>Login Again</Text>
            </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// --- Styles for App.js (excluding GroupsScreen specific styles) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  screenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.1,
    backgroundColor: '#1A1A1A',
  },
  logo: {
    width: width * 0.4,
    height: height * 0.1,
    marginBottom: height * 0.02,
  },
  welcomeText: {
    fontSize: width * 0.065,
    color: '#FFFFFF',
    fontFamily: 'System',
    marginBottom: height * 0.015,
    textAlign: 'center',
    fontWeight: '600',
  },
  promptText: {
    fontSize: width * 0.045,
    color: '#CCCCCC',
    fontFamily: 'System',
    marginBottom: height * 0.03,
    textAlign: 'center',
    lineHeight: width * 0.06,
  },
  input: {
    width: '100%',
    height: height * 0.07,
    backgroundColor: '#4A4A4A',
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.04,
    fontSize: width * 0.04,
    color: '#FFFFFF',
    marginBottom: height * 0.05,
    borderWidth: 1,
    borderColor: '#555555',
  },
  arrowButtonContainer: {
    marginTop: height * 0.02,
  },
  arrowButton: {
    width: width * 0.18,
    height: width * 0.18,
  },
  phantomImageButton: {
    marginTop: height * 0.02,
  },
  phantomButtonImage: {
    width: width * 0.7,
    height: height * 0.08,
  },
  addressTextSmall: {
    fontSize: width * 0.04,
    color: '#A0A0A0',
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: width * 0.04,
    color: '#FF7070',
    marginTop: height * 0.02,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  statusHelperText: {
      fontSize: width * 0.035,
      color: '#888888',
      marginTop: height * 0.015,
      textAlign: 'center',
  },
  genericButton: {
    backgroundColor: '#A08FF8',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  genericButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  // Styles previously for GroupsScreen have been moved to GroupsScreen.js
});

export default App;
