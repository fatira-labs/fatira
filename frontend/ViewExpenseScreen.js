import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  
} from 'react-native';
import { Image } from 'expo-image';
import BottomNavBar from './BottomNavBar';

const { width, height } = Dimensions.get('window');
const backArrowAsset = require('./assets/backbutton.png');
const topPieAsset    = require('./assets/toppie1.png');
const receiptAsset   = require('./assets/recieptexample.png');
let a = 0;
export default function ViewExpenseScreen({
  onBack,
  currentGroup,

  MOCK_USER_GROUPS_DB,
  expense,      // [{ date, paidBy, totalAmount, yourShare }]
  onNavigateHome,
  onNavigateAdd,
  onNavigateMoney,
  onNavigateProfile,
}) {
  const { date, paidBy, totalAmount, yourShare } = expense[0];
  console.log(currentGroup);
  let members = [...MOCK_USER_GROUPS_DB[0].members]
  let newMembers = members.filter(m => m !== paidBy);

  

  return (
    <View style={styles.container}>
      {/* Pie graphic */}
      <Image source={topPieAsset} style={styles.topPie} resizeMode="contain" />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Image source={backArrowAsset} style={styles.backIcon} resizeMode="contain" />
      </TouchableOpacity>

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>{date}</Text>
        <Text style={styles.groupText}>{currentGroup}</Text>
      </View>

      {/* WHO PAID */}
      <View style={styles.payerRow}>
        <Text style={[styles.text, styles.paid]}>{paidBy} paid</Text>
        <Text style={[styles.text, styles.paid]}>${totalAmount}</Text>
      </View>

      {/* RED SCROLLABLE LIST ONLY */}
      <View style={styles.redBox}>
        <ScrollView howsVerticalScrollIndicator={false}>
          {newMembers.map((name, idx) => (
            <View key={`${name}-${idx}`} style={styles.splitRow}>
              <Text style={[styles.text, styles.owed]}>{name}</Text>
              <Text style={[styles.text, styles.owed]}>${yourShare}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* RECEIPT (fixed under the list) */}
      <ScrollView
  style={{ width: '90%', maxHeight: height * 0.4 }}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ alignItems: 'center' }}
>
  <Image
    source={receiptAsset}
    style={styles.receipt}
    resizeMode="contain"
  />
</ScrollView>
      {/* PUSH NAV TO BOTTOM */}
      <View style={styles.spacer} />

      {/* BOTTOM NAV */}
      <BottomNavBar
        onNavigateHome={onNavigateHome}
        onNavigateAdd={onNavigateAdd}
        onNavigateMoney={onNavigateMoney}
        onNavigateProfile={onNavigateProfile}
      />
    </View>
  );
}
console.log(a);
const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingTop: Platform.OS === 'android'
      ? StatusBar.currentHeight
      : height * 0.04,
    alignItems: 'center',
  },

  topPie: {
    position: 'absolute',
    width: '100%',
    height,
    top: -height * 0.38,
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

  headerRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.1,
    marginBottom: 12,
  },
  dateText: { color: '#FFF', fontSize: 20 },
  groupText: { color: '#D4A32A', fontSize: 20, fontWeight: 'bold' },

  payerRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  redBox: {
    width: '90%',
    height: height * (0.15),      // fixed 30% of screen
    //backgroundColor: '',a// dark red
    borderRadius: 8,
    overflow: 'hidden',
  },

  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  text: { fontSize: 20 },
  paid: { color: '#3CB043', fontWeight: '600' },
  owed: { color: '#D2222D' },

  receipt: {
    width: '90%',
    height: height * 0.4,
    marginTop: 20,
    borderRadius: 8,
  },

  spacer: { flex: 1 },
});
