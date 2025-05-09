// App.js
import 'react-native-get-random-values'; // <-- Polyfill for crypto.getRandomValues, MUST BE FIRST
import React from 'react';
import PhantomConnect from './PhantomConnect';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './screens/Home';

const Stack = createNativeStackNavigator();

export default function App() {
  return <NavigationContainer>
    <Stack.Navigator initialRouteName="PhantomConnect">
      <Stack.Screen 
        name="PhantomConnect" 
        component={PhantomConnect}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Home" 
        component={Home} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  </NavigationContainer>;
}
