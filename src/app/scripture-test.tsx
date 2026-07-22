import { DisplayTestScripture } from '@/components/ui/DisplayTestScripture';
import { View, StyleSheet } from 'react-native';




export const TestScripture = () => {
    return (
        <View style={styles.container}>
            <DisplayTestScripture />
        </View>
  );
}

export default TestScripture;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 25
    }
});
