import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { useAppFonts, colors } from "./src/theme";

export default function App() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
