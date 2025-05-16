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
import colors from "./color.js"
const { width, height } = Dimensions.get('window');
const backArrowAsset = require('./assets/backbutton.png');
const topPieAsset    = require('./assets/toppie1.png');
const receiptAsset   = require('./assets/recieptexample.png');
let a = 0;
export default function ViewExpenseScreen({
  onBack,
  currentGroup,
  expense,     
  MOCK_USER_GROUPS_DB,
  
  onNavigateHome,
  onNavigateAdd,
  onNavigateMoney,
  onNavigateProfile,
}) {
 console.log(expense);
 const { date, paidBy, totalAmount, yourShare } = expense;
  
  let members = [...MOCK_USER_GROUPS_DB.members]
  let newMembers = members;

  

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
        <Text style={[styles.text, styles.paid]}>{paidBy[0].toUpperCase()+paidBy.slice(1)} paid</Text>
        <Text style={[styles.text, styles.paid]}>${totalAmount.toFixed(2)}</Text>
      </View>

      {/* RED SCROLLABLE LIST ONLY */}
      <View style={styles.redBox}>
        <ScrollView howsVerticalScrollIndicator={false}>
          {newMembers.map((name, idx) => (
            <View key={`${name}-${idx}`} style={styles.splitRow}>
              <Text style={[styles.text, styles.owed]}>{name[0].toUpperCase()+name.slice(1)}</Text>
              <Text style={[styles.text, styles.owed]}>${yourShare.toFixed(2)}</Text>
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
    borderTopWidth:2,
    borderColor:'#D4A32A',
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
