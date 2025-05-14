import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import BottomNavBar from './BottomNavBar';

const { width, height } = Dimensions.get('window');
const backArrowAsset = require('./assets/backbutton.png'); 
const topPieAsset    = require('./assets/toppie1.png');

export default function ProfilePage({
  onBack,
  currentGroup,
  userPublicKey,
  MOCK_USER_GROUPS_DB,
  MOCK_USER_CREDENTIALS,
  onNavigateHome,
  onNavigateAdd,
  onNavigateMoney,
  onNavigateProfile,
}) {
  const name = MOCK_USER_CREDENTIALS[userPublicKey];
  const groupLen = MOCK_USER_GROUPS_DB.length;
  const totalAmount = MOCK_USER_GROUPS_DB
    .reduce((sum, g) => sum + g.balance, 0)
    .toFixed(2);

  const isDebt = totalAmount < 0;
  const displayAmount = Math.abs(totalAmount);

  return (
    <View style={styles.container}>
      {/* Big background pie */}
      <Image source={topPieAsset} style={styles.topPie} resizeMode="contain" />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Image source={backArrowAsset} style={styles.backIcon}  />
      </TouchableOpacity>
      <View style={{padding:10,}}></View>
      {/* Content Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Current Group:</Text>
        <Text style={styles.value}>{currentGroup}</Text>
        <View style={{padding:10,}}></View>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{name}</Text>
        <View style={{padding:10,}}></View>
        <Text style={styles.label}># of groups:</Text>
        <Text style={styles.value}>{groupLen}</Text>
        <View style={{padding:10,}}></View>
        <TouchableOpacity onPress={() => Alert.alert('Wallet Connected: ', userPublicKey)}>
          <Text style={styles.label}>Wallet connected:</Text>
          <Text style={styles.value}>
            {userPublicKey.slice(0, 5)}...{userPublicKey.slice(-4)}
          </Text>
        </TouchableOpacity>
        <View style={{padding:10,}}></View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Across {groupLen} groups,</Text>
          <Text style={[styles.statusText, isDebt && styles.debtText, !isDebt && styles.owedText]}>
             {isDebt ? 'YOU OWE' : 'YOU ARE OWED'}
          </Text>
        </View>
        <View style={{padding:10,}}></View>
        <Text style={[styles.amount, isDebt ? styles.debtText : styles.owedText]}>
          ${displayAmount}
        </Text>
        
      </View>

      <View style={styles.spacer} />

      {/* Bottom nav */}
      <BottomNavBar
        onNavigateHome={onNavigateHome}
        onNavigateAdd={onNavigateAdd}
        onNavigateMoney={onNavigateMoney}
        onNavigateProfile={onNavigateProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingTop: Platform.OS === 'android'
      ? StatusBar.currentHeight
      : height * 0.04,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: height * 0.04,
    left: width * 0.02,
    zIndex: 10,
    padding: 8,
  },
  backIcon: {
    width: width * 0.12,
    height: width * 0.12,
    transform: [{ rotate: '180deg' }],
  },
  topPie: {
    position: 'absolute',
    width: '100%',
    height,
    top: -height * 0.38,
  },
  backgroundPie: {
    position: 'absolute',
    top: -height * 0.35,
    width: width * 1.2,
    height: width * 1.2,
    opacity: 0.1,
  },
 

  card: {
    width: '90%',
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    marginTop: 80,
    alignItems: 'center',
    borderWidth: 1,
    
  },
  label: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 12,
  },
  value: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  statusText: {
    color: '#DDD',
    fontSize: 16,
    marginHorizontal: 4,
  },
  owedText: {
    color: '#3CB043',
    fontWeight: '700',
  },
  debtText: {
    color: '#D2222D',
    fontWeight: '700',
  },
  amount: {
    fontSize: 60,
    marginTop: 10,
  },
  spacer: {
    flex: 1,
  },
});
