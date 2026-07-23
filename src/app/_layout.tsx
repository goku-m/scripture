import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { Text, TextInput } from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

const POPPINS_FAMILY = "Poppins_400Regular";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    const mutableText = Text as typeof Text & { defaultProps?: { style?: unknown } };
    mutableText.defaultProps = mutableText.defaultProps ?? {};
    mutableText.defaultProps.style = [{ fontFamily: POPPINS_FAMILY }, mutableText.defaultProps.style];

    const mutableTextInput = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };
    mutableTextInput.defaultProps = mutableTextInput.defaultProps ?? {};
    mutableTextInput.defaultProps.style = [
      { fontFamily: POPPINS_FAMILY },
      mutableTextInput.defaultProps.style,
    ];
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="scripture-test"
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
