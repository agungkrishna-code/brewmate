import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/common/icon';

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.sansMedium,
          fontSize: 10.5,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: { paddingTop: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={21}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="brew"
        options={{
          title: 'Brew',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'timer' : 'timer-outline'}
              size={22}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={21}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="grinder"
        options={{
          title: 'Grinder',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'disc' : 'disc-outline'}
              size={22}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'journal' : 'journal-outline'}
              size={21}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
    </Tabs>
  );
}
