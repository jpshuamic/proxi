import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import WelcomeScreen from "./src/screens/auth/WelcomeScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import HomeScreen from "./src/screens/main/HomeScreen";
import SearchScreen from "./src/screens/main/SearchScreen";
import PostScreen from "./src/screens/main/PostScreen";
import MessagesScreen from "./src/screens/main/MessagesScreen";
import ProfileScreen from "./src/screens/main/ProfileScreen";
import PostListingScreen from "./src/screens/main/PostListingScreen";
import PostTaskScreen from "./src/screens/main/PostTaskScreen";
import TaskDetailScreen from "./src/screens/main/TaskDetailScreen";
import WalletScreen from "./src/screens/main/WalletScreen";
import ListingDetailScreen from "./src/screens/main/ListingDetailScreen";
import ChatScreen from "./src/screens/main/ChatScreen";
import ReviewsScreen from "./src/screens/main/ReviewsScreen";
import PostVehicleScreen from "./src/screens/main/PostVehicleScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0A0A0A", borderTopColor: "#1A1A1A", borderTopWidth: 1, paddingBottom: 8, paddingTop: 8, height: 65 },
        tabBarActiveTintColor: "#1DB954",
        tabBarInactiveTintColor: "#555",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Explore" component={SearchScreen} options={{ tabBarLabel: "Explore", tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Post" component={PostScreen} options={{ tabBarLabel: "", tabBarIcon: () => (
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center", marginBottom: 4 }}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </View>
      )}} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: "Messages", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0A0A" }}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      {!user ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="PostListing" component={PostListingScreen} />
          <Stack.Screen name="PostTask" component={PostTaskScreen} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
          <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} />
          <Stack.Screen name="PostVehicle" component={PostVehicleScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
