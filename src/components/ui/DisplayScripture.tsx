import { Text, View, StyleSheet, TouchableOpacity } from "react-native"
import { SCRIPTURE } from "../../../data/scriptures"
import { router } from "expo-router"



type Props = {
    index: number;
};

export const DisplayScripture = ({ index }: Props) => {
    return (
        <View>
            <Text style={{ color: "black", fontSize: 18, marginTop: 10, fontWeight: "bold" }}>
                {SCRIPTURE[index].book} {SCRIPTURE[index].chapter} : {SCRIPTURE[index].verse}
            </Text>
            <Text style={{ color: "grey", fontSize: 24 }}>
                {SCRIPTURE[index].text}
            </Text>

            <View style={styles.start_button}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        router.replace({
                            pathname: "/scripture-test",
                            params: { id: String(index) },
                        })
                    }
                >
                    <Text style={{ color: "white", fontSize: 20 }}>Start</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({

    start_button: {
        marginTop: 20
    },
    button: {
        height: 25,
        width: 50,
        backgroundColor: "red",
        justifyContent: "center",
        alignItems: "center"
    }
});
