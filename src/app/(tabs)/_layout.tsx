import { AppIcon } from '@/components/common/icon';
import { FontFamily } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenListeners={{
        // Selection tick on tab switches, matching the other navigation taps.
        tabPress: () => haptics.fire('selection'),
      }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.sansMedium,
          fontSize: 11,
          letterSpacing: 0.15,
        },
        tabBarItemStyle: { paddingTop: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="home"
              size={20}
              strokeWidth={focused ? 1.9 : 1.6}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="brew"
        options={{
          title: t.tabs.brew,
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="timer"
              size={20}
              strokeWidth={focused ? 1.9 : 1.6}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: t.tabs.recipes,
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="book-open"
              size={20}
              strokeWidth={focused ? 1.9 : 1.6}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="grinder"
        options={{
          title: t.tabs.grinder,
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="disc"
              size={20}
              strokeWidth={focused ? 1.9 : 1.6}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t.tabs.journal,
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="notebook-pen"
              size={20}
              strokeWidth={focused ? 1.9 : 1.6}
              color={typeof color === 'string' ? color : theme.text}
            />
          ),
        }}
      />
    </Tabs>
  );
}
