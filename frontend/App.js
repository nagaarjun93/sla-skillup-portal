import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import FloatingScrollButtons from './src/components/FloatingScrollButtons';
import BottomNavBar from './src/components/BottomNavBar';

import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import StudentLoginScreen from './src/screens/StudentLoginScreen';
import StudentRegisterScreen from './src/screens/StudentRegisterScreen';
import StudentForgotPasswordScreen from './src/screens/StudentForgotPasswordScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategorySelectScreen from './src/screens/CategorySelectScreen';
import ExamScreen from './src/screens/ExamScreen';
import TopicQuestionsScreen from './src/screens/TopicQuestionsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import PreviousTestsScreen from './src/screens/PreviousTestsScreen';
import StudentMockExamScreen from './src/screens/StudentMockExamScreen';
import StudentProfileScreen from './src/screens/StudentProfileScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AddQuestionScreen from './src/screens/AddQuestionScreen';
import EditQuestionScreen from './src/screens/EditQuestionScreen';
import ViewQuestionsScreen from './src/screens/ViewQuestionsScreen';
import QuestionUploadScreen from './src/screens/QuestionUploadScreen';
import WeeklyTestManagementScreen from './src/screens/WeeklyTestManagementScreen';
import StudentManagementScreen from './src/screens/StudentManagementScreen';
import StudentResultsScreen from './src/screens/StudentResultsScreen';
import ViewMistakesScreen from './src/screens/ViewMistakesScreen';
import MockTestManagementScreen from './src/screens/MockTestManagementScreen';
import MockResultsScreen from './src/screens/MockResultsScreen';
import ThisWeekQuestionsScreen from './src/screens/ThisWeekQuestionsScreen';
import AdminProfileScreen from './src/screens/AdminProfileScreen';

// Math Game Screens
import MathGameHomeScreen from './src/screens/game/MathGameHomeScreen';
import MathGameLevelsScreen from './src/screens/game/MathGameLevelsScreen';
import MathGamePlayScreen from './src/screens/game/MathGamePlayScreen';
import MathGameResultScreen from './src/screens/game/MathGameResultScreen';
import MathGameTricksScreen from './src/screens/game/MathGameTricksScreen';
import MathGameMultiplayerScreen from './src/screens/game/MathGameMultiplayerScreen';
import MathGameLeaderboardScreen from './src/screens/game/MathGameLeaderboardScreen';
import MathGameStoreScreen from './src/screens/game/MathGameStoreScreen';

const Stack = createStackNavigator();

export default function App() {
  const navigationRef = React.useRef(null);
  const [currentRoute, setCurrentRoute] = React.useState('RoleSelection');

  const updateCurrentRoute = () => {
    const route = navigationRef.current?.getCurrentRoute();
    if (route?.name) {
      setCurrentRoute(route.name);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider style={styles.container}>
        <NavigationContainer
          ref={navigationRef}
          onReady={updateCurrentRoute}
          onStateChange={updateCurrentRoute}
        >
          <AuthProvider>
            <View style={styles.contentWrapper}>
              <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="RoleSelection">
                <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                <Stack.Screen name="student-login" component={StudentLoginScreen} />
                <Stack.Screen name="student-register" component={StudentRegisterScreen} />
                <Stack.Screen name="student-forgot-password" component={StudentForgotPasswordScreen} />
                <Stack.Screen name="admin-login" component={AdminLoginScreen} />
                <Stack.Screen name="home" component={HomeScreen} />
                <Stack.Screen name="category-select" component={CategorySelectScreen} />
                <Stack.Screen name="exam" component={ExamScreen} />
                <Stack.Screen name="topic-questions" component={TopicQuestionsScreen} />
                <Stack.Screen name="leaderboard" component={LeaderboardScreen} />
                <Stack.Screen name="previous-tests" component={PreviousTestsScreen} />
                <Stack.Screen name="student-mock-exam" component={StudentMockExamScreen} />
                <Stack.Screen name="student-profile" component={StudentProfileScreen} />
                <Stack.Screen name="admin-dashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="admin-profile" component={AdminProfileScreen} />
                <Stack.Screen name="add-question" component={AddQuestionScreen} />
                <Stack.Screen name="edit-question" component={EditQuestionScreen} />
                <Stack.Screen name="view-questions" component={ViewQuestionsScreen} />
                <Stack.Screen name="question-upload" component={QuestionUploadScreen} />
                <Stack.Screen name="weekly-test-management" component={WeeklyTestManagementScreen} />
                <Stack.Screen name="student-management" component={StudentManagementScreen} />
                <Stack.Screen name="student-results" component={StudentResultsScreen} />
                <Stack.Screen name="view-mistakes" component={ViewMistakesScreen} />
                <Stack.Screen name="mock-test-management" component={MockTestManagementScreen} />
                <Stack.Screen name="mock-results" component={MockResultsScreen} />
                <Stack.Screen name="this-week-questions" component={ThisWeekQuestionsScreen} />

                {/* Math Game Stack Routes */}
                <Stack.Screen name="math-game-home" component={MathGameHomeScreen} />
                <Stack.Screen name="math-game-levels" component={MathGameLevelsScreen} />
                <Stack.Screen name="math-game-play" component={MathGamePlayScreen} />
                <Stack.Screen name="math-game-result" component={MathGameResultScreen} />
                <Stack.Screen name="math-game-tricks" component={MathGameTricksScreen} />
                <Stack.Screen name="math-game-multiplayer" component={MathGameMultiplayerScreen} />
                <Stack.Screen name="math-game-leaderboard" component={MathGameLeaderboardScreen} />
                <Stack.Screen name="math-game-store" component={MathGameStoreScreen} />
              </Stack.Navigator>
              <BottomNavBar currentRoute={currentRoute} navigationRef={navigationRef} />
            </View>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
      {/* Global floating ▲/▼ scroll buttons — fixed to LEFT side on ALL pages (web only) */}
      <FloatingScrollButtons />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
});