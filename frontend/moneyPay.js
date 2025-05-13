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
  Alert,
  
} from 'react-native';
import { Image } from 'expo-image';
import BottomNavBar from './BottomNavBar';

const { width, height } = Dimensions.get('window');
const backArrowAsset = require('./assets/backbutton.png');
const topPieAsset    = require('./assets/toppie1.png');
const getImageSource = require('./assets/getLogoBtn.png');
const payImageSource = require('./assets/payLogoBtn.png');
let a = 0;
export default function MoneyPay({
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
  let members = MOCK_USER_GROUPS_DB[0].members.filter(m => m !== paidBy);
  a = members.length;
  
    console.log(paidBy);
  return (
    <View style={styles.container}>
      {/* Pie graphic */}
      <Image source={topPieAsset} style={styles.topPie} resizeMode="contain" />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Image source={backArrowAsset} style={styles.backIcon} resizeMode="contain" />
      </TouchableOpacity>

      {/* HEADER */}
     <View style={{height:height*0.02}}></View>
       {paidBy === "You" ? (
        <View style={{ ...styles.headerRow,justifyContent:'center' }}>
            
             <Text style={styles.groupText}>{currentGroup}  <Text style={styles.dateText}>owes you</Text></Text>
             </View>
       ) : (
          
        <View style={{ ...styles.headerRow,justifyContent:'center' }}>
             <Text style={styles.dateText}>you owe    <Text style={styles.groupText}>{currentGroup}</Text></Text>
            
             </View>
     
       )}
       <View style={styles.redBox}>
          <Text style={{color:'white',fontSize:125,fontWeight:'bold'}}>${yourShare}</Text>
       </View>
       <View style={{height:height*0.04}} />

       <View style={{...styles.redBox}}>
     
       <TouchableOpacity  style={{...StyleSheet.absoluteFill}}     onPress={() =>Alert.alert("HELLO WORLD")} activeOpacity={0.7}>
    <Image
      source={paidBy === "You" ? getImageSource : payImageSource}
      style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
      resizeMode="contain"
    />
  </TouchableOpacity>
     
       </View>
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
    width: width * 0.2,
    height: width * 0.2,
    transform: [{ rotate: '180deg' }],
  },

  headerRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.1,
    marginBottom: 12,
  },
  dateText: { color: '#FFF', fontSize: 23 },
  groupText: { color: '#D4A32A', fontSize: 23, fontWeight: 'bold' },

  payerRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  redBox: {
    width: '90%',
    height: height * (0.2),      // fixed 30% of screen
   // backgroundColor: 'red',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent:'center',
    alignItems:'center'
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
    height: height * 0.3,
    marginTop: 20,
    borderRadius: 8,
  },

  spacer: { flex: 1 },
});
