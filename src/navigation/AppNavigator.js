import React, { useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ExpoLinking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemedStylesProvider } from "../theme/ThemedStylesProvider";
import HomeScreen from "../screens/HomeScreen";
import PaperScreen from "../screens/PaperScreen";
import { ROUTES } from "./routes";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const linking = useMemo(
    () => ({
      prefixes: [ExpoLinking.createURL("/")],
      config: {
        screens: {
          [ROUTES.HOME]: "",
          [ROUTES.PAPER]: "paper/:paperId",
        },
      },
    }),
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedStylesProvider>
        <NavigationContainer linking={linking}>
          <SafeAreaProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
              <Stack.Screen name={ROUTES.PAPER} component={PaperScreen} />
            </Stack.Navigator>
          </SafeAreaProvider>
        </NavigationContainer>
      </ThemedStylesProvider>
    </GestureHandlerRootView>
  );
}
export { HomeScreen, PaperScreen };
