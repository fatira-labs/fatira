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
  Linking, // Added
  Alert,   // Added
  ActivityIndicator // Added
} from 'react-native';

// Import Expo and cryptographic libraries
import * as ExpoLinking from 'expo-linking'; // Added
import nacl from 'tweetnacl';                 // Added
import bs58 from 'bs58';                     // Added
import * as SecureStore from 'expo-secure-store'; // Added

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

// --- Asset Placeholders ---
const logoAsset = require('./assets/logologin.png');
const arrowButtonAsset = require('./assets/backbutton.png');
const phantomButtonAsset = require('./assets/phantom.png');

// --- Constants for Phantom Connect ---
const DAPP_KEYPAIR_STORAGE_KEY = 'phantom_dapp_keypair'; // Key for storing dapp's keypair
const APP_URL = 'https://yourappname.com'; // Replace with your app's URL (for display in Phantom)
const CLUSTER = 'devnet'; // Or 'mainnet-beta', 'testnet'

// --- Keypair Management (Adapted from PhantomConnect.js) ---
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
    return { publicKey: newKeyPair.publicKey, secretKey: newKeyPair.secretKey }; // Return anyway
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


// --- LoginScreen Component (Remains largely the same) ---
const LoginScreen = ({ onNavigate, setGlobalUsername }) => {
  const [usernameInput, setUsernameInput] = useState('');

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.welcomeText}>Welcome to</Text>
      <Image source={logoAsset} style={styles.logo} resizeMode="contain" />
      <Text style={styles.promptText}>please input your username</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={usernameInput}
        onChangeText={setUsernameInput}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.arrowButtonContainer}
        onPress={() => {
          if (usernameInput.trim()) {
            setGlobalUsername(usernameInput.trim()); // Set username globally for the app
            onNavigate('ConnectWallet');
          } else {
            Alert.alert('Input Required', 'Username cannot be empty.');
          }
        }}
      >
        <Image source={arrowButtonAsset} style={styles.arrowButton} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

// --- ConnectWalletScreen Component (Integrates Phantom Logic) ---
const ConnectWalletScreen = ({
  onNavigateBack,
  dappKeyPair,
  userPublicKey,
  connectionStatus,
  connectToPhantom,
  disconnectWallet, // Function to disconnect/reset
  username // Display the username passed from LoginScreen
}) => {

  return (
    <View style={styles.screenContainer}>
      <TouchableOpacity style={styles.backButtonPlacement} onPress={onNavigateBack}>
        <Image source={arrowButtonAsset} style={[styles.arrowButton, styles.backArrowIcon]} resizeMode="contain" />
      </TouchableOpacity>

      <Text style={styles.welcomeText}>Welcome {username || 'User'}</Text>
      <Image source={logoAsset} style={styles.logo} resizeMode="contain" />

      {connectionStatus !== 'Connected' && (
        <Text style={styles.promptText}>Finish connecting wallet</Text>
      )}

      {/* Phantom Wallet Button & Status Display */}
      {connectionStatus === 'Initializing' || connectionStatus === 'Connecting' ? (
        <ActivityIndicator size="large" color="#A08FF8" style={{ marginVertical: 20 }}/>
      ) : connectionStatus === 'Connected' && userPublicKey ? (
        <View style={styles.connectionSuccessContainer}>
          <Text style={styles.successText}>Wallet Connected!</Text>
          <Text style={styles.addressTextLabel}>Address:</Text>
          <Text style={styles.addressText}>{`${userPublicKey.slice(0, 6)}...${userPublicKey.slice(-4)}`}</Text>
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectWallet}>
            <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.phantomImageButton} onPress={connectToPhantom} disabled={!dappKeyPair || connectionStatus === 'Error'}>
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

// --- Main App Component (Manages state and logic for Phantom Connect) ---
const App = () => {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [appUsername, setAppUsername] = useState(''); // Store the username from LoginScreen

  // Phantom Connect States
  const [dappKeyPair, setDappKeyPair] = useState(null);
  const [userPublicKey, setUserPublicKey] = useState(null); // Connected wallet's public key (string)
  const [session, setSession] = useState(null); // Phantom session
  const [sharedSecret, setSharedSecret] = useState(null); // For decryption
  const [connectionStatus, setConnectionStatus] = useState('Initializing'); // Disconnected, Connecting, Connected, Error, Initializing

  // Initialize dApp KeyPair on Mount
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

  // Build Phantom Connection URL
  const buildConnectionUrl = useCallback(() => {
    if (!dappKeyPair) {
      console.error('Cannot build URL: Dapp keypair not ready.');
      return null;
    }
    // redirectLink must be a path that your app can handle.
    // For Expo Go, it's often exp://<host>/<path>
    // For standalone apps, it's yourscheme://<path>
    const redirectLink = ExpoLinking.createURL('onconnect'); // Creates a deep link for your app

    const params = new URLSearchParams({
      app_url: APP_URL,
      dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
      redirect_link: redirectLink,
      cluster: CLUSTER,
    });
    const url = `https://phantom.app/ul/v1/connect?${params.toString()}`;
    console.log('Constructed Phantom URL:', url);
    console.log('Redirect link for this app:', redirectLink);
    return url;
  }, [dappKeyPair]);

  // Initiate Connection to Phantom
  const connectToPhantom = useCallback(async () => {
    if (connectionStatus === 'Connected') {
      Alert.alert('Already Connected', `Wallet ${userPublicKey.slice(0,8)}... is connected.`);
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
    // Reset previous connection details
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
  }, [connectionStatus, dappKeyPair, userPublicKey, buildConnectionUrl]);

  // Handle Deep Link Redirect from Phantom
  const handleDeepLink = useCallback(async (event) => {
    const urlString = event.url;
    console.log('Received deep link:', urlString);

    const urlObject = ExpoLinking.parse(urlString);
    // Ensure this is the redirect we expect. createURL('onconnect') might result in 'onconnect' as path or hostname.
    const isConnectRedirect = urlObject.path === 'onconnect' || urlObject.hostname === 'onconnect' || urlString.includes('onconnect');


    if (!isConnectRedirect) {
        console.log("Deep link is not for Phantom connect, ignoring.");
        return;
    }
    if (connectionStatus !== 'Connecting') {
       console.log("Received connect redirect but wasn't in 'Connecting' state. Current status:", connectionStatus);
       // Potentially handle if user manually comes back without completing Phantom flow.
       // Or if a link is triggered inadvertently.
       // if (connectionStatus !== 'Connected') setConnectionStatus('Disconnected'); // Optional: reset if not already connected
       return;
    }

    console.log("Processing Phantom connect redirect...");
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
    const dataB58 = params.data; // This is the encrypted session and public_key

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

      console.log("Calculating shared secret...");
      const calculatedSharedSecret = nacl.box.before(phantomPublicKeyBytes, dappKeyPair.secretKey);
      setSharedSecret(calculatedSharedSecret); // Store for potential future use (e.g. signTransaction)

      console.log("Decrypting data...");
      const decryptedDataUint8 = nacl.box.open.after(encryptedDataBytes, nonceBytes, calculatedSharedSecret);

      if (!decryptedDataUint8) {
        throw new Error('Failed to decrypt data from Phantom. Nonce or keys might be incorrect.');
      }

      const decryptedDataString = new TextDecoder().decode(decryptedDataUint8);
      const decryptedPayload = JSON.parse(decryptedDataString);
      console.log('Decrypted Payload:', decryptedPayload);

      if (!decryptedPayload.public_key || !decryptedPayload.session) {
        throw new Error("Decrypted data is missing public_key or session.");
      }

      setUserPublicKey(decryptedPayload.public_key); // This is the user's wallet public key (base58)
      setSession(decryptedPayload.session);         // Phantom session token

      setConnectionStatus('Connected');
      console.log(`Successfully connected to wallet: ${decryptedPayload.public_key}`);
      Alert.alert('Success!', `Connected to wallet: ${decryptedPayload.public_key.slice(0, 8)}...`);

    } catch (error) {
      console.error('Failed to handle Phantom redirect (decryption/processing):', error);
      Alert.alert('Connection Error', `Failed to process response: ${error.message}`);
      setConnectionStatus('Disconnected');
    }
  }, [dappKeyPair, connectionStatus]); // Dependencies for the handler

  // Disconnect Wallet Function
  const disconnectWallet = () => {
    console.log("Disconnecting wallet...");
    setUserPublicKey(null);
    setSession(null);
    setSharedSecret(null);
    setConnectionStatus('Disconnected');
    Alert.alert("Disconnected", "Wallet has been disconnected.");
    // Optionally, you might want to make a call to Phantom to formally disconnect if their API supports it via deep link
    // For now, this is a client-side disconnect.
  };


  // --- Deep Link Listeners (Adapted from PhantomConnect.js) ---
  const linkingUrl = ExpoLinking.useURL(); // Handles links opened while app is running or resuming
  useEffect(() => {
    if (linkingUrl) {
      console.log("App opened with URL (or URL changed):", linkingUrl);
      handleDeepLink({ url: linkingUrl });
    }
  }, [linkingUrl, handleDeepLink]); // Re-run if linkingUrl or handler changes

  useEffect(() => { // Handles links that open the app from a closed state
    const subscription = ExpoLinking.addEventListener('url', handleDeepLink);
    return () => subscription.remove(); // Cleanup on unmount
  }, [handleDeepLink]); // Re-subscribe if handler changes


  // Navigation Logic
  const handleNavigation = (screenName) => setCurrentScreen(screenName);
  const handleNavigateBack = () => {
    if (connectionStatus === 'Connected' || connectionStatus === 'Connecting') {
        // If user navigates back from wallet screen while connected/connecting, treat as disconnect
        // disconnectWallet(); // Or ask for confirmation
    }
    setCurrentScreen('Login');
  };
  const handleSetUsername = (name) => setAppUsername(name);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      {currentScreen === 'Login' && (
        <LoginScreen onNavigate={handleNavigation} setGlobalUsername={handleSetUsername} />
      )}
      {currentScreen === 'ConnectWallet' && (
        <ConnectWalletScreen
          onNavigateBack={handleNavigateBack}
          dappKeyPair={dappKeyPair}
          userPublicKey={userPublicKey}
          connectionStatus={connectionStatus}
          connectToPhantom={connectToPhantom}
          disconnectWallet={disconnectWallet}
          username={appUsername}
        />
      )}
    </SafeAreaView>
  );
};

// --- Styles ---
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
    fontSize: width * 0.06,
    color: '#FFFFFF',
    fontFamily: 'System',
    marginBottom: height * 0.005,
    textAlign: 'center',
  },
  promptText: {
    fontSize: width * 0.045,
    color: '#CCCCCC',
    fontFamily: 'System',
    marginBottom: height * 0.03,
    textAlign: 'center',
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
  backButtonPlacement: {
    position: 'absolute',
    top: height * 0.06,
    left: width * 0.05,
    zIndex: 10,
  },
  backArrowIcon: {
    width: width * 0.1,
    height: width * 0.1,
    transform: [{ rotate: '180deg' }],
  },
  phantomImageButton: {
    marginTop: height * 0.02,
  },
  phantomButtonImage: {
    width: width * 0.7,
    height: height * 0.1,
  },
  // Styles for connection status display
  connectionSuccessContainer: {
    alignItems: 'center',
    marginTop: height * 0.03,
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    width: '100%',
  },
  successText: {
    fontSize: width * 0.055,
    color: '#4CAF50', // Green for success
    fontWeight: 'bold',
    marginBottom: height * 0.015,
  },
  addressTextLabel: {
    fontSize: width * 0.04,
    color: '#BBBBBB',
    marginBottom: 2,
  },
  addressText: {
    fontSize: width * 0.045,
    color: '#FFFFFF',
    fontFamily: 'monospace', // Good for addresses
    marginBottom: height * 0.03,
    textAlign: 'center',
  },
  disconnectButton: {
    backgroundColor: '#F44336', // Red for disconnect
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: width * 0.04,
    color: '#FF7070', // Light red for errors
    marginTop: height * 0.02,
    textAlign: 'center',
  },
  statusHelperText: {
      fontSize: width * 0.035,
      color: '#888888',
      marginTop: height * 0.015,
      textAlign: 'center',
  }
});

export default App;
