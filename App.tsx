import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AuthScreen } from './src/screens/AuthScreen';

function MainNavigator() {
  const { isLoggedIn, initializing } = useAuth();
  const { colors, isDark } = useTheme();

  if (initializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.loadingLogoText}>M</Text>
        </View>
        <Text style={[styles.loadingText, { color: colors.textHeading }]}>
          Loading mindspace...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isLoggedIn ? <DashboardScreen /> : <AuthScreen />}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  loadingLogoText: {
    color: '#FAF8F5',
    fontWeight: '800',
    fontSize: 22,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
