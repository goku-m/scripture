import { DisplayScripture } from '@/components/ui/DisplayScripture';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SCRIPTURE } from '../../data/scriptures';




export const HomeScreen = () => {
  const { index } = useLocalSearchParams<{ index?: string | string[] }>();
  const requestedIndex = Array.isArray(index) ? Number(index[0]) : Number(index);
  const safeIndex = Number.isFinite(requestedIndex)
    ? Math.min(Math.max(requestedIndex, 0), SCRIPTURE.length - 1)
    : 0;

  return (
    <View style={styles.container}>
      <DisplayScripture index={safeIndex} />
    </View>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25
  },
  start_button: {
    marginTop: 20
  }
});
