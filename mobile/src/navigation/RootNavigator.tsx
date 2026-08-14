import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";

export type RootStackParamList = {
  Home: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
