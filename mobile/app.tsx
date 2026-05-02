import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "./services/authStore";
import { LinearGradient } from "expo-linear-gradient";

// Auth Screens
import { LoginScreen } from "./screens/Auth/LoginScreen";
import { SignupScreen } from "./screens/Auth/SignupScreen";

// Admin Screens
import { AdminDashboardScreen } from "./screens/Admin/AdminDashboardScreen";
import { HostelScreen } from "./screens/Admin/HostelScreen";
import { LibraryScreen } from "./screens/Admin/LibraryScreen";
import { StudentHistoryScreen } from "./screens/Admin/StudentHistoryScreen";

// Shared Screens
import { CalendarScreen } from "./screens/Shared/CalendarScreen";

// Student Screens
import { StudentFaceAuthScreen } from "./screens/Student/StudentFaceAuthScreen";
import { StudentDashboardScreen } from "./screens/Student/StudentDashboardScreen";

// Parent Screens
import { ParentCommunicationScreen } from "./screens/Parent/ParentCommunicationScreen";

// Teacher Screens
import { TeacherAssignmentsScreen } from "./screens/Teacher/TeacherAssignmentsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1f2937",
          borderBottomColor: "rgba(255,255,255,0.1)",
          borderBottomWidth: 1,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarStyle: {
          backgroundColor: "#1f2937",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
        }}
      />
      <Tab.Screen
        name="Hostel"
        component={HostelScreen}
        options={{
          title: "Hostel",
          tabBarLabel: "Hostel",
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          title: "Library",
          tabBarLabel: "Library",
        }}
      />
      <Tab.Screen
        name="StudentHistory"
        component={StudentHistoryScreen}
        options={{
          title: "History",
          tabBarLabel: "History",
        }}
      />
      <Tab.Screen
        name="AdminCalendar"
        component={CalendarScreen}
        options={{
          title: "Calendar",
          tabBarLabel: "Calendar",
        }}
      />
    </Tab.Navigator>
  );
};

const StudentTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1f2937",
          borderBottomColor: "rgba(255,255,255,0.1)",
          borderBottomWidth: 1,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarStyle: {
          backgroundColor: "#1f2937",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="FaceAuth"
        component={StudentFaceAuthScreen}
        options={{
          title: "Check In",
          tabBarLabel: "Check In",
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={StudentDashboardScreen}
        options={{
          title: "My Grades",
          tabBarLabel: "Grades",
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: "Calendar",
          tabBarLabel: "Calendar",
        }}
      />
    </Tab.Navigator>
  );
};

const ParentTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1f2937",
          borderBottomColor: "rgba(255,255,255,0.1)",
          borderBottomWidth: 1,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarStyle: {
          backgroundColor: "#1f2937",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="StudentGrades"
        component={StudentDashboardScreen}
        options={{
          title: "Child's Grades",
          tabBarLabel: "Grades",
        }}
      />
      <Tab.Screen
        name="Communication"
        component={ParentCommunicationScreen}
        options={{
          title: "Teacher Communication",
          tabBarLabel: "Messages",
        }}
        initialParams={{ teacherId: "" }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: "Calendar",
          tabBarLabel: "Calendar",
        }}
      />
    </Tab.Navigator>
  );
};

const TeacherTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1f2937",
          borderBottomColor: "rgba(255,255,255,0.1)",
          borderBottomWidth: 1,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarStyle: {
          backgroundColor: "#1f2937",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="Assignments"
        component={TeacherAssignmentsScreen}
        options={{
          title: "Assignments",
          tabBarLabel: "Assignments",
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: "Calendar",
          tabBarLabel: "Calendar",
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const restoreToken = useAuthStore((state) => state.restoreToken);

  useEffect(() => {
    restoreToken();
  }, []);

  if (isLoading) {
    return (
      <LinearGradient colors={["#111827", "#1a1a2e"]} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === "admin" ? (
        <AdminTabs />
      ) : user.role === "student" ? (
        <StudentTabs />
      ) : user.role === "parent" ? (
        <ParentTabs />
      ) : user.role === "teacher" ? (
        <TeacherTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
