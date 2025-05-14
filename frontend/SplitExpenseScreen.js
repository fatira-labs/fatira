// SplitExpenseScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  Alert
} from 'react-native';

// Assuming CheckBox is from a library like @react-native-community/checkbox
// If not using a library, a custom TouchableOpacity can simulate a checkbox.
// For simplicity, I'll use a custom one here.
const CustomCheckbox = ({ value, onValueChange, disabled }) => (
  <TouchableOpacity
    style={[styles.checkboxBase, value && styles.checkboxChecked]}
    onPress={onValueChange}
    disabled={disabled}
  >
    {value && <Text style={styles.checkboxCheckmark}>✓</Text>}
  </TouchableOpacity>
);


const { width, height } = Dimensions.get('window');

// --- Asset Imports ---
const evenIcon = require('./assets/even.png');
const unevenCostIcon = require('./assets/uneven.png'); // Assuming 'uneven.png' is for by cost
const unevenPercentIcon = require('./assets/percent.png');

// --- Constants ---
const NEGATIVE_BALANCE_COLOR = '#D32F2F'; // Standard red color for negative values

const SPLIT_TYPES = {
  EVEN: 'even',
  COST: 'cost',
  PERCENT: 'percent',
};

const SplitExpenseScreen = ({
  isVisible,
  onClose,
  onSplitDone,
  totalExpenseAmount,
  groupMembers = [], // Array of member name strings
  currentUsername
}) => {
  const [splitType, setSplitType] = useState(SPLIT_TYPES.EVEN);
  // memberSplits will store:
  // For 'even': { [username]: { selected: boolean, amount: number } }
  // For 'cost': { [username]: { amount: string } } // Store as string for input, convert to number for calculation
  // For 'percent': { [username]: { percent: string } } // Store as string
  const [memberSplits, setMemberSplits] = useState({});

  // Initialize memberSplits when component mounts or props change
  useEffect(() => {
    const initialSplits = {};
    groupMembers.forEach(member => {
      if (splitType === SPLIT_TYPES.EVEN) {
        // By default, select the current user if they are in the groupMembers list
        initialSplits[member] = { selected: member === currentUsername, amount: 0 };
      } else if (splitType === SPLIT_TYPES.COST) {
        initialSplits[member] = { amount: '' };
      } else if (splitType === SPLIT_TYPES.PERCENT) {
        initialSplits[member] = { percent: '' };
      }
    });
    setMemberSplits(initialSplits);
  }, [groupMembers, splitType, currentUsername, isVisible]); // Re-initialize if modal becomes visible


  // --- Even Split Logic ---
  const selectedEvenlyCount = useMemo(() => {
    if (splitType !== SPLIT_TYPES.EVEN) return 0;
    return Object.values(memberSplits).filter(s => s.selected).length;
  }, [memberSplits, splitType]);

  const amountPerEvenPerson = useMemo(() => {
    if (splitType !== SPLIT_TYPES.EVEN || selectedEvenlyCount === 0 || totalExpenseAmount === 0) return 0;
    return totalExpenseAmount / selectedEvenlyCount;
  }, [splitType, selectedEvenlyCount, totalExpenseAmount]);

  // --- Uneven Cost Split Logic ---
  const totalCostAssigned = useMemo(() => {
    if (splitType !== SPLIT_TYPES.COST) return 0;
    return Object.values(memberSplits).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }, [memberSplits, splitType]);
  const remainingCost = totalExpenseAmount - totalCostAssigned;

  // --- Uneven Percent Split Logic ---
  const totalPercentAssigned = useMemo(() => {
    if (splitType !== SPLIT_TYPES.PERCENT) return 0;
    return Object.values(memberSplits).reduce((sum, s) => sum + (parseFloat(s.percent) || 0), 0);
  }, [memberSplits, splitType]);
  const remainingPercent = 100 - totalPercentAssigned;


  const handleMemberSplitChange = (username, value) => {
    setMemberSplits(prev => {
      const updatedUserSplit = { ...prev[username] };
      if (splitType === SPLIT_TYPES.EVEN) {
        updatedUserSplit.selected = !updatedUserSplit.selected;
      } else if (splitType === SPLIT_TYPES.COST) {
        updatedUserSplit.amount = value;
      } else if (splitType === SPLIT_TYPES.PERCENT) {
        updatedUserSplit.percent = value;
      }
      return { ...prev, [username]: updatedUserSplit };
    });
  };

  const validateAndSubmit = () => {
    let finalSplits = [];
    let isValid = true;

    if (splitType === SPLIT_TYPES.EVEN) {
      if (selectedEvenlyCount === 0 && totalExpenseAmount > 0) {
        Alert.alert("Validation Error", "Please select at least one member for an even split.");
        return;
      }
      finalSplits = groupMembers
        .filter(member => memberSplits[member]?.selected)
        .map(member => ({ username: member, amount: amountPerEvenPerson }));
    }
    else if (splitType === SPLIT_TYPES.COST) {
      if (Math.abs(totalCostAssigned - totalExpenseAmount) > 0.01 && totalExpenseAmount > 0) { // Allow for small floating point discrepancies
        Alert.alert("Validation Error", `The sum of assigned costs ($${totalCostAssigned.toFixed(2)}) does not match the total expense ($${totalExpenseAmount.toFixed(2)}). Remaining: $${remainingCost.toFixed(2)}`);
        return;
      }
      finalSplits = groupMembers
        .map(member => ({ username: member, amount: parseFloat(memberSplits[member]?.amount) || 0 }))
        .filter(s => s.amount > 0);
    }
    else if (splitType === SPLIT_TYPES.PERCENT) {
      if (Math.abs(totalPercentAssigned - 100) > 0.01 && totalExpenseAmount > 0) { // Allow for small floating point discrepancies
         Alert.alert("Validation Error", `The sum of assigned percentages (${totalPercentAssigned.toFixed(2)}%) does not equal 100%. Remaining: ${remainingPercent.toFixed(2)}%`);
        return;
      }
      finalSplits = groupMembers
        .map(member => ({
          username: member,
          amount: (parseFloat(memberSplits[member]?.percent) / 100) * totalExpenseAmount || 0
        }))
        .filter(s => s.amount > 0);
    }

    if (isValid) {
      onSplitDone({ type: splitType, splits: finalSplits, totalAmount: totalExpenseAmount });
      onClose(); // Close modal after successful submission
    }
  };


  const renderMemberRow = (memberName) => {
    const userSplit = memberSplits[memberName] || {};

    return (
      <View key={memberName} style={styles.memberRow}>
        <Text style={styles.memberNameText}>{memberName === currentUsername ? "You" : memberName}</Text>
        <View style={styles.memberInputContainer}>
          {splitType === SPLIT_TYPES.EVEN && (
            <>
              <Text style={styles.memberAmountText}>
                {userSplit.selected ? `$${amountPerEvenPerson.toFixed(2)}` : '$0.00'}
              </Text>
              <CustomCheckbox
                value={userSplit.selected}
                onValueChange={() => handleMemberSplitChange(memberName, null)} // Value is not used for checkbox toggle
              />
            </>
          )}
          {splitType === SPLIT_TYPES.COST && (
            <>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#777"
                value={userSplit.amount}
                onChangeText={(val) => handleMemberSplitChange(memberName, val)}
              />
            </>
          )}
          {splitType === SPLIT_TYPES.PERCENT && (
            <>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#777"
                value={userSplit.percent}
                onChangeText={(val) => handleMemberSplitChange(memberName, val)}
              />
              <Text style={styles.currencySymbol}>%</Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Split Expense (${totalExpenseAmount.toFixed(2)})</Text>

          {/* Split Type Selector */}
          <View style={styles.splitTypeSelector}>
            <TouchableOpacity onPress={() => setSplitType(SPLIT_TYPES.EVEN)} style={[styles.splitTypeButton, splitType === SPLIT_TYPES.EVEN && styles.splitTypeButtonActive]}>
              <Image source={evenIcon} style={styles.splitTypeIcon} />
              <Text style={[styles.splitTypeText, splitType === SPLIT_TYPES.EVEN && styles.splitTypeTextActive]}>Evenly</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSplitType(SPLIT_TYPES.COST)} style={[styles.splitTypeButton, splitType === SPLIT_TYPES.COST && styles.splitTypeButtonActive]}>
              <Image source={unevenCostIcon} style={styles.splitTypeIcon} />
              <Text style={[styles.splitTypeText, splitType === SPLIT_TYPES.COST && styles.splitTypeTextActive]}>By Cost</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSplitType(SPLIT_TYPES.PERCENT)} style={[styles.splitTypeButton, splitType === SPLIT_TYPES.PERCENT && styles.splitTypeButtonActive]}>
              <Image source={unevenPercentIcon} style={styles.splitTypeIcon} />
              <Text style={[styles.splitTypeText, splitType === SPLIT_TYPES.PERCENT && styles.splitTypeTextActive]}>By %</Text>
            </TouchableOpacity>
          </View>

          {/* Members List */}
          <ScrollView style={styles.membersScrollView}>
            {groupMembers.length > 0 ? groupMembers.map(renderMemberRow) : <Text style={styles.noMembersText}>No group members found.</Text>}
          </ScrollView>

          {/* Remaining Info */}
          {(splitType === SPLIT_TYPES.COST && totalExpenseAmount > 0) && (
            <Text style={[styles.remainingInfo, remainingCost < 0 && styles.remainingError]}>
              {remainingCost >= 0 ? `$${remainingCost.toFixed(2)} undistributed` : `$${Math.abs(remainingCost).toFixed(2)} over-assigned`}
            </Text>
          )}
          {(splitType === SPLIT_TYPES.PERCENT && totalExpenseAmount > 0) && (
            <Text style={[styles.remainingInfo, remainingPercent < 0 && styles.remainingError]}>
              {remainingPercent >= 0 ? `${remainingPercent.toFixed(2)}% undistributed` : `${Math.abs(remainingPercent).toFixed(2)}% over-assigned`}
            </Text>
          )}


          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.doneButton]} onPress={validateAndSubmit}>
              <Text style={styles.actionButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.95,
    maxHeight: height * 0.85,
    backgroundColor: '#2C2C2C', // Dark background for modal
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: width * 0.06,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  splitTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 5,
  },
  splitTypeButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  splitTypeButtonActive: {
    backgroundColor: '#F0A829', // Highlight color
  },
  splitTypeIcon: {
    width: width * 0.08,
    height: width * 0.08,
    marginBottom: 5,
  },
  splitTypeText: {
    fontSize: width * 0.035,
    color: '#E0E0E0',
  },
  splitTypeTextActive: {
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
  membersScrollView: {
    maxHeight: height * 0.4, // Limit height of scrollable members list
    marginBottom: 15,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  memberNameText: {
    fontSize: width * 0.042,
    color: '#FFFFFF',
    flex: 1, // Allow name to take space
  },
  memberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: width * 0.3, // Ensure space for input/checkbox
    justifyContent: 'flex-end',
  },
  memberAmountText: {
    fontSize: width * 0.04,
    color: '#E0E0E0',
    marginRight: 10,
  },
  amountInput: {
    borderBottomWidth: 1,
    borderColor: '#777',
    color: '#FFFFFF',
    fontSize: width * 0.04,
    paddingVertical: Platform.OS === 'ios' ? 5 : 2,
    paddingHorizontal: 8,
    minWidth: 60,
    textAlign: 'right',
  },
  currencySymbol: {
    fontSize: width * 0.04,
    color: '#FFFFFF',
    marginLeft: 5,
    marginRight: 5,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0A829',
    borderRadius: 4,
    marginLeft: 10,
  },
  checkboxChecked: {
    backgroundColor: '#F0A829',
  },
  checkboxCheckmark: {
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
  remainingInfo: {
    fontSize: width * 0.038,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  remainingError: {
    color: NEGATIVE_BALANCE_COLOR, // Use your defined red color
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    minWidth: width * 0.35,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#5A5A5A',
  },
  doneButton: {
    backgroundColor: '#F0A829',
  },
  actionButtonText: {
    color: '#1A1A1A',
    fontSize: width * 0.042,
    fontWeight: 'bold',
  },
  noMembersText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: width * 0.04,
  }
});

export default SplitExpenseScreen;
