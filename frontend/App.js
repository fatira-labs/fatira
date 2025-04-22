// App.js
import 'react-native-get-random-values'; // <-- Polyfill for crypto.getRandomValues, MUST BE FIRST

import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import PhantomConnect from './PhantomConnect'; // Make sure path is correct

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <PhantomConnect />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Optional background color
    alignItems: 'center',
    justifyContent: 'center',
  },
});