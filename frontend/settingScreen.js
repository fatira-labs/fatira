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
import BottomNavBar from './BottomNavBar';

const { width, height } = Dimensions.get('window');
const TRANSACTION_BAR_BACKGROUND = '#F0A829';
const ICON_SIZE = 50;

export default function SettingScreen({
  onBack,
  currentGroup,
  expense,
  userPublicKey,
  appUsername,
  MOCK_USER_GROUPS_DB,
  MOCK_USER_CREDENTIALS,
  onNavigateHome,
  onNavigateAdd,
  onNavigateMoney,
  onNavigateProfile,
}) {
   // appUsername = "bob";
  // find the group by id under this user
  console.log(MOCK_USER_GROUPS_DB);
  let members = [...MOCK_USER_GROUPS_DB.members];
  console.log(appUsername);
  console.log(currentGroup);
  console.log(members[0]);
  // determine owner: first member is appUsername
  const owner = members[0] === appUsername;

  const handleRemove = (member) => Alert.alert(`Remove ${member}?`);
  const handleLeave = () => Alert.alert('Leave group?');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>{currentGroup}</Text>
      </View>

      {/* Members list */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {members.map((m, idx) => {
          const isOwner = idx === 0;
          const isSelf = m === appUsername;
          let label = isSelf ? 'You' : m;
          if (isOwner) label += ' (Owner)';

          return (
            <View key={m} style={styles.memberRow}>
              <Text style={styles.memberName}>{label}</Text>
              {owner && !isOwner && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(m)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Leave section */}
        <View style={styles.leaveContainer}>
          <Text style={styles.leaveLabel}>If settled you can:</Text>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeave}
            activeOpacity={0.7}
          >
            <Text style={styles.leaveText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom navigation */}
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
    paddingTop:
      Platform.OS === 'android' ? StatusBar.currentHeight : height * 0.04,
  },
  headerBar: {
    height: height * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TRANSACTION_BAR_BACKGROUND,
  },
  listContainer: {
    padding: 16,
    paddingBottom: ICON_SIZE + 32,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  memberName: {
    flex: 1,
    fontSize: 18,
    color: '#FFF',
  },
  removeButton: {
    backgroundColor: '#D2222D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  removeText: {
    color: '#FFF',
    fontSize: 16,
  },
  leaveContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  leaveLabel: {
    fontSize: 22,
    color: '#FFF',
    marginBottom: 12,
  },
  leaveButton: {
    backgroundColor: '#D2222D',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
  },
  leaveText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
