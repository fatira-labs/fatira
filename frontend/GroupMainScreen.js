// GroupMainScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { Image } from 'expo-image';

import BottomNavBar from './BottomNavBar'; // Import the BottomNavBar

const { width, height } = Dimensions.get('window');

// --- Asset Imports ---
const settingsIcon = require('./assets/piesettings.png');
// Transaction icons (optional, if you want to add icons to transactions)
// const borrowedIcon = require('./assets/borrowed_icon.png');
// const lentIcon = require('./assets/lent_icon.png');
// const paidIcon = require('./assets/paid_icon.png');

// --- Colors ---
const POSITIVE_BALANCE_COLOR = '#3E8000';
const NEGATIVE_BALANCE_COLOR = '#AD0000';
const TRANSACTION_BAR_BACKGROUND = 'rgba(240, 168, 41, 0.9)'; // F0A829 with 90% opacity (slightly less transparent)
const TRANSACTION_BAR_BORDER = 'rgba(201, 113, 8, 0.9)';     // C97108 with 90% opacity

const GroupMainScreen = ({
  groupName,
  groupBalance, // e.g., 20 or -15
  transactions, // Array of transaction objects
  onNavigateToSettings, // Placeholder for settings navigation
  // Props for BottomNavBar
  onNavigateHome,
  onNavigateAdd,
  onNavigateMoney,
  onNavigateProfile,
}) => {
  const balanceText = groupBalance >= 0 ? 'Total owed to you' : 'Total you owe';
  const balanceColor = groupBalance >= 0 ? POSITIVE_BALANCE_COLOR : NEGATIVE_BALANCE_COLOR;
  const displayBalance = groupBalance >= 0 ? `$${groupBalance}` : `-$${Math.abs(groupBalance)}`;

  // Function to render each transaction item
  const renderTransaction = (transaction, index) => {
    let involvementText = '';
    let amountColor = '#000000'; // Default black
    let amountPrefix = '';

    switch (transaction.type) {
      case 'borrowed': // You borrowed from the group or someone in it
        involvementText = `you borrowed:`;
        amountColor = NEGATIVE_BALANCE_COLOR; // Red for borrowed
        amountPrefix = '$';
        break;
      case 'lent': // You lent to the group or someone in it
        involvementText = `you lent:`;
        amountColor = POSITIVE_BALANCE_COLOR; // Green for lent
        amountPrefix = '$';
        break;
      case 'paid_to_group': // You paid the group (e.g. settling up)
        involvementText = `you paid:`;
        amountColor = NEGATIVE_BALANCE_COLOR; // Red from your perspective (money out)
        amountPrefix = '$';
        break;
      case 'received_from_group': // You received from group (e.g. someone settled up with you via group)
        involvementText = `you received:`;
        amountColor = POSITIVE_BALANCE_COLOR; // Green for money in
        amountPrefix = '$';
        break;
      case 'group_expense_involved': // Group expense you were part of
        involvementText = transaction.paidBy === 'You' ? `you paid for group:` : `${transaction.paidBy} paid:`;
        amountColor = transaction.paidBy === 'You' ? NEGATIVE_BALANCE_COLOR : '#555555'; // If you paid, it's red, else neutral
        amountPrefix = '$';
        break;
      case 'group_expense_not_involved':
        involvementText = "You weren't involved";
        amountColor = '#555555'; // Neutral color
        amountPrefix = ''; // No amount directly related to "you"
        transaction.amount = ''; // Clear amount if not involved
        break;
      default:
        involvementText = transaction.detail || ''; // Fallback
    }


    return (
      <View key={transaction.id || index} style={styles.transactionBar}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionDate}>{transaction.date}</Text>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={styles.transactionDetail}>{transaction.fullDetail || `${transaction.paidBy || 'Someone'} paid $${transaction.totalAmount || transaction.amount}`}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={styles.transactionInvolvement}>{involvementText}</Text>
          {transaction.amount !== '' && (
            <Text style={[styles.transactionAmount, { color: amountColor }]}>
              {transaction.type === 'borrowed' || (transaction.type === 'paid_to_group' && transaction.paidBy === 'You') ? '-' : ''}{amountPrefix}{Math.abs(transaction.yourShare || transaction.amount)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.groupNameText}>{groupName || 'Group Details'}</Text>
          <TouchableOpacity onPress={onNavigateToSettings} style={styles.settingsButton}>
            <Image source={settingsIcon} style={styles.settingsIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabelText}>{balanceText}</Text>
          <Text style={[styles.balanceAmountText, { color: balanceColor }]}>{displayBalance}</Text>
        </View>
        <View style={styles.separator} />

        {/* Transaction History */}
        <Text style={styles.transactionHistoryTitle}>Transaction History:</Text>
        <ScrollView style={styles.transactionsScrollView}>
          {transactions && transactions.length > 0 ? (
            transactions.map(renderTransaction)
          ) : (
            <Text style={styles.noTransactionsText}>No transactions yet.</Text>
          )}
        </ScrollView>
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        onNavigateHome={onNavigateHome}
        onNavigateAdd={onNavigateAdd}
        onNavigateMoney={onNavigateMoney}
        onNavigateProfile={onNavigateProfile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  groupNameText: {
    fontSize: width * 0.08,
    color: '#FFFFFF',
    fontWeight: 'bold',
    maxWidth: '80%', // Prevent long names from pushing settings icon too far
  },
  settingsButton: {
    padding: 5, // Easier to tap
  },
  settingsIcon: {
    width: width * 0.175,
    height: width * 0.175,
    marginTop: 0,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    marginTop: height * 0.02,
    marginBottom: height * 0.015,
  },
  balanceLabelText: {
    fontSize: width * 0.05,
    color: '#E0E0E0',
  },
  balanceAmountText: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
  },
  separator: {
    height: 1.5, // Thicker separator
    backgroundColor: '#F0A829', // Gold color from your design
    marginHorizontal: width * 0.05,
    marginBottom: height * 0.02,
  },
  transactionHistoryTitle: {
    fontSize: width * 0.05,
    color: '#FFFFFF',
    fontWeight: 'bold',
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
  },
  transactionsScrollView: {
    flex: 1,
    paddingHorizontal: width * 0.05,
  },
  transactionBar: {
    backgroundColor: TRANSACTION_BAR_BACKGROUND,
    borderColor: TRANSACTION_BAR_BORDER,
    borderWidth: 2, // Kept border consistent with other bars
    borderRadius: 12, // More rounded
    paddingVertical: height * 0.018, // Made thicker
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.015,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to the top for multi-line text
  },
  transactionLeft: {
    flex: 1, // Takes more space for title and detail
    marginRight: width * 0.02,
  },
  transactionDate: {
    fontSize: width * 0.033,
    color: '#444444', // Darker grey for date
    marginBottom: 2,
  },
  transactionTitle: {
    fontSize: width * 0.048,
    color: '#1A1A1A', // Dark text for title
    fontWeight: 'bold',
    marginBottom: 3,
  },
  transactionDetail: {
    fontSize: width * 0.035,
    color: '#333333', // Slightly lighter grey for subtitle
  },
  transactionRight: {
    alignItems: 'flex-end', // Align text to the right
    justifyContent: 'center', // Vertically center if single line
    minWidth: width * 0.25, // Ensure some minimum width for amounts
  },
  transactionInvolvement: {
    fontSize: width * 0.04,
    color: '#1A1A1A', // Dark text
    marginBottom: 3,
  },
  transactionAmount: {
    fontSize: width * 0.058,
    fontWeight: 'bold',
  },
  noTransactionsText: {
    color: '#CCCCCC',
    fontSize: width * 0.04,
    textAlign: 'center',
    marginTop: height * 0.05,
  },
});

export default GroupMainScreen;
