// PhantomConnect.js
import React, { useState, useEffect, useCallback } from 'react';
import { Button, View, Text, Linking, Alert, Platform, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as SecureStore from 'expo-secure-store';

// Use a unique key for storing the dapp keypair in SecureStore
const DAPP_KEYPAIR_STORAGE_KEY = 'phantom_dapp_keypair';

// --- Keypair Management ---

const generateAndStoreKeyPair = async () => {
  console.log('Generating new keypair...');
  const newKeyPair = nacl.box.keyPair();
  // Store keys as base58 strings
  const keyPairString = JSON.stringify({
    publicKey: bs58.encode(newKeyPair.publicKey),
    secretKey: bs58.encode(newKeyPair.secretKey),
  });
  try {
    await SecureStore.setItemAsync(DAPP_KEYPAIR_STORAGE_KEY, keyPairString);
    console.log('New keypair generated and stored securely.');
    return {
      publicKey: newKeyPair.publicKey, // Return raw Uint8Arrays
      secretKey: newKeyPair.secretKey,
    };
  } catch (e) {
      console.error("Failed to store keypair securely:", e);
      Alert.alert("Storage Error", "Could not save app keys securely. Please try restarting.");
      // Fallback: Return keys but indicate storage failure (app might not work on restart)
       return {
         publicKey: newKeyPair.publicKey,
         secretKey: newKeyPair.secretKey,
       };
  }
};

const getOrCreateKeyPair = async () => {
  console.log('Attempting to retrieve stored keypair...');
  try {
      const storedKeyPairString = await SecureStore.getItemAsync(DAPP_KEYPAIR_STORAGE_KEY);
      if (storedKeyPairString) {
          console.log('Found stored keypair.');
          const storedKeyPair = JSON.parse(storedKeyPairString);
          // Decode keys from base58 back to Uint8Array
          return {
              publicKey: bs58.decode(storedKeyPair.publicKey),
              secretKey: bs58.decode(storedKeyPair.secretKey),
          };
      } else {
          console.log('No stored keypair found.');
          // Generate and store if not found
          return await generateAndStoreKeyPair();
      }
  } catch (e) {
    console.error('Failed to retrieve or parse stored keypair:', e);
    // Fallback to generating a new one if retrieval/parsing fails
    Alert.alert("Key Error", "Could not retrieve existing app keys. Generating new ones. If issues persist, try reinstalling the app.");
    return await generateAndStoreKeyPair();
  }
};

// --- Component ---

const PhantomConnect = () => {
  const [dappKeyPair, setDappKeyPair] = useState(null);
  const [sharedSecret, setSharedSecret] = useState(null);
  const [session, setSession] = useState(null);
  const [userPublicKey, setUserPublicKey] = useState(null); // Store as string for display
  const [status, setStatus] = useState('Initializing'); // Initializing | Disconnected | Connecting | Connected | Error
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Effect to load or generate keypair on mount
  useEffect(() => {
    const initialize = async () => {
      setStatus('Initializing');
      try {
        const keyPair = await getOrCreateKeyPair();
        if (keyPair?.publicKey) {
           setDappKeyPair(keyPair);
           console.log('Dapp Public Key (base58):', bs58.encode(keyPair.publicKey));
           setStatus('Disconnected');
        } else {
            throw new Error("Keypair generation/retrieval failed silently.");
        }
      } catch (error) {
        console.error('Failed to initialize component:', error);
        Alert.alert('Initialization Error', `Could not initialize app keys: ${error.message}`);
        setStatus('Error');
      }
    };
    initialize();
  }, []);

  // Function to build the Phantom connection URL
  const buildConnectionUrl = useCallback(() => {
    if (!dappKeyPair) {
      console.error('Cannot build URL: Dapp keypair not ready.');
      return null;
    }

    const appUrl = 'https://my-phantom-test-app.local'; // Placeholder for display in Phantom
    const dappPublicKeyB58 = bs58.encode(dappKeyPair.publicKey);
    const redirectLink = ExpoLinking.createURL('onconnect'); // Creates exp+... or yourscheme://...

    console.log(`Using redirect link: ${redirectLink}`);

    const params = new URLSearchParams({
      app_url: appUrl, // No need to encode manually, URLSearchParams handles it
      dapp_encryption_public_key: dappPublicKeyB58,
      redirect_link: redirectLink,
      cluster: 'devnet', // Or 'mainnet-beta' or 'testnet'
    });

    const url = `https://phantom.app/ul/v1/connect?${params.toString()}`;
    console.log('Constructed Phantom URL:', url);
    return url;
  }, [dappKeyPair]); // Rebuild only if keypair changes

  // Function to initiate the connection request
  const connectToPhantom = useCallback(async () => {
    if (status === 'Connected') {
        Alert.alert('Already Connected', `Wallet ${userPublicKey.slice(0, 8)}... is connected.`);
        return;
    }
    if (!dappKeyPair || status === 'Initializing' || status === 'Error') {
      Alert.alert('Not Ready', 'The application is still initializing or encountered an error. Please wait or restart.');
      return;
    }

    const url = buildConnectionUrl();
    if (!url) {
        Alert.alert('Error', 'Could not construct the connection URL.');
        return;
    }

    setStatus('Connecting...');
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
      setStatus('Disconnected'); // Reset status on failure
    }
  }, [status, dappKeyPair, userPublicKey, buildConnectionUrl]);

  // Function to handle the deep link redirect from Phantom
  const handleDeepLink = useCallback(async (event) => {
    const urlString = event.url;
    console.log('Received deep link:', urlString);

    const urlObject = ExpoLinking.parse(urlString); // Use ExpoLinking.parse for robustness
    
    // Check if it's the expected redirect path/hostname from createURL('onconnect')
    // This check might need adjustment depending on exact createURL output structure
    const isConnectRedirect = urlObject.path === 'onconnect' || urlObject.hostname === 'onconnect' || urlString.includes('onconnect');

    if (!isConnectRedirect) {
        console.log("Deep link is not the expected Phantom connect redirect, ignoring.");
        return;
    }
     // Only proceed if we were actually in the 'Connecting' state
     if (status !== 'Connecting...') {
        console.log("Received connect redirect but wasn't in 'Connecting' state, ignoring.");
        return;
     }

    console.log("Processing Phantom connect redirect...");
    const params = urlObject.queryParams;

    // Check for errors from Phantom
    if (params.errorCode) {
      const error = params.errorMessage || 'Unknown error';
      console.error('Phantom connection rejected or failed:', error);
      Alert.alert('Connection Failed', `Phantom returned an error: ${error}`);
      setStatus('Disconnected');
      return;
    }

    // Extract connection details
    const phantomPublicKeyB58 = params.phantom_encryption_public_key;
    const nonceB58 = params.nonce;
    const dataB58 = params.data;

    if (!phantomPublicKeyB58 || !nonceB58 || !dataB58 || !dappKeyPair) {
      console.error('Missing parameters or keypair in redirect data:', {phantomPublicKeyB58, nonceB58, dataB58, hasDappKeyPair: !!dappKeyPair });
      Alert.alert('Error', 'Received invalid or incomplete data from Phantom.');
      setStatus('Disconnected'); // Reset status
      return;
    }

    try {
      // Decode parameters
      const phantomPublicKey = bs58.decode(phantomPublicKeyB58);
      const nonce = bs58.decode(nonceB58);
      const encryptedData = bs58.decode(dataB58);

      // Calculate shared secret
      console.log("Calculating shared secret...");
      const calculatedSharedSecret = nacl.box.before(
        phantomPublicKey,
        dappKeyPair.secretKey
      );
      setSharedSecret(calculatedSharedSecret); // Store for potential later use

      // Decrypt data
      console.log("Decrypting data...");
      const decryptedDataUint8 = nacl.box.open.after(
        encryptedData,
        nonce,
        calculatedSharedSecret
      );

      if (!decryptedDataUint8) {
        throw new Error('Failed to decrypt data. Nonce or keys might be incorrect.');
      }

      // Convert decrypted data (Uint8Array) to string and parse JSON
      const decryptedDataString = new TextDecoder().decode(decryptedDataUint8);
      const decryptedData = JSON.parse(decryptedDataString);

      console.log('Decrypted Data:', decryptedData);

      if (!decryptedData.public_key || !decryptedData.session) {
           throw new Error("Decrypted data is missing public_key or session.");
      }

      // Store session and public key (store public key as base58 string)
      setSession(decryptedData.session);
      setUserPublicKey(decryptedData.public_key); // Already base58 string from Phantom

      setStatus('Connected');
      console.log(`Successfully connected to wallet: ${decryptedData.public_key}`);
      Alert.alert('Success', `Connected to wallet: ${decryptedData.public_key.slice(0, 8)}...`);

    } catch (error) {
      console.error('Failed to handle Phantom redirect decryption/processing:', error);
      Alert.alert('Connection Error', `Failed to process response: ${error.message}`);
      setStatus('Disconnected'); // Reset status on error
    }
  }, [dappKeyPair, status]); // Dependencies for the handler

  const handleSignup = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert('Error', 'Name and username are required');
      return;
    }

    setIsRegistering(true);
    try {
      // route to backend
      const response = await fetch('http://10.0.0.125:3000/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: userPublicKey,
          name: name.trim(),
          username: username.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      Alert.alert('Success', 'Account created successfully!');
      setName('');
      setUsername('');
    } catch (error) {
      console.error('Error in signup:', error);
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setIsRegistering(false);
    }
  };


  // --- Deep Link Listeners ---

  // Handles links opened while app is running or resuming
  const linkingUrl = ExpoLinking.useURL();
  useEffect(() => {
    if (linkingUrl) {
        handleDeepLink({ url: linkingUrl });
    }
  }, [linkingUrl, handleDeepLink]);

  // Handles links that open the app from a closed state
  useEffect(() => {
    const subscription = ExpoLinking.addEventListener('url', handleDeepLink);
    // Cleanup listener on unmount
    return () => subscription.remove();
  }, [handleDeepLink]);

  // --- Render ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phantom Wallet Connect</Text>
      <View style={styles.buttonContainer}>
        {status === 'Initializing' || status === 'Connecting...' ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button
            title={status === 'Connected' ? 'Connected' : 'Connect Phantom Wallet'}
            onPress={connectToPhantom}
            disabled={status === 'Initializing' || status === 'Error' || status === 'Connecting...'}
          />
        )}
      </View>
      <Text style={styles.statusText}>Status: {status}</Text>
      {userPublicKey && status === 'Connected' && (
        <><Text style={styles.infoText}>
          Wallet PubKey: {userPublicKey.slice(0, 8)}...{userPublicKey.slice(-4)}
        </Text><View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              editable={!isRegistering} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              editable={!isRegistering} />
            <Button
              title={isRegistering ? 'Signing up...' : 'Sign Up'}
              onPress={handleSignup}
              disabled={isRegistering} />
          </View></>
      )}
       {session && status === 'Connected' && (
        <><Text style={styles.infoTextSmall}>
          Session Token: {session.slice(0, 10)}...
        </Text></>
      )}
       {status === 'Error' && (
           <Text style={styles.errorText}>An initialization error occurred. Please restart the app.</Text>
       )}
      {/* Optionally display the redirect URL for debugging */}
      {/* <Text style={{fontSize: 10, color: 'grey', marginTop: 15}}>
            Redirect URL: {dappKeyPair ? ExpoLinking.createURL('onconnect') : 'Initializing...'}
      </Text> */}
      {status === 'Error' && (
        <Text style={styles.errorText}>An error occurred. Please restart the app.</Text>
      )}
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    buttonContainer: {
        height: 50, // Give space for button or activity indicator
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    infoText: {
        marginTop: 8,
        fontSize: 14,
        color: '#333',
    },
    infoTextSmall: {
        marginTop: 5,
        fontSize: 10,
        color: '#666',
    },
    errorText: {
        marginTop: 10,
        color: 'red',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        padding: 20,
        marginTop: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      padding: 10,
      marginBottom: 15,
      width: '100%',
    },
});


export default PhantomConnect;