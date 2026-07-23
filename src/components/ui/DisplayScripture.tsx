import { Text, View, StyleSheet, Pressable } from "react-native";
import { SCRIPTURE } from "../../../data/scriptures";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";



type Props = {
    index: number;
};

const COUNTDOWN_SECONDS = 10;

export const DisplayScripture = ({ index }: Props) => {
    const [progress, setProgress] = useState(0);
    const [shouldNavigate, setShouldNavigate] = useState(false);
    const hasNavigatedRef = useRef(false);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        setProgress(0);
        setShouldNavigate(false);
        hasNavigatedRef.current = false;

        const durationMs = COUNTDOWN_SECONDS * 1000;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const nextProgress = Math.min(elapsed / durationMs, 1);
            setProgress(nextProgress);

            if (nextProgress >= 1) {
                setShouldNavigate(true);
                return;
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [index]);

    useEffect(() => {
        if (!shouldNavigate || hasNavigatedRef.current) {
            return;
        }

        hasNavigatedRef.current = true;
        router.replace({
            pathname: "/scripture-test",
            params: { id: String(index), rep: "1" },
        });
    }, [shouldNavigate, index]);

    const navigateToQuiz = () => {
        if (hasNavigatedRef.current) {
            return;
        }

        hasNavigatedRef.current = true;
        setShouldNavigate(true);
        router.replace({
            pathname: "/scripture-test",
            params: { id: String(index), rep: "1" },
        });
    };

    const progressAngle = Math.max(0, Math.min(360, progress * 360));
    const ringStyle = {
        backgroundImage: `conic-gradient(#5b9bd5 0deg ${progressAngle}deg, #e4e1de ${progressAngle}deg 360deg)`,
    } as any;

    return (
        <View>
            <Text style={styles.referenceText}>
                {SCRIPTURE[index].book} {SCRIPTURE[index].chapter} : {SCRIPTURE[index].verse}
            </Text>
            <Text style={styles.verseText}>
                {SCRIPTURE[index].text}
            </Text>

            <Pressable style={styles.timerWrap} onPress={navigateToQuiz}>
                <View style={[styles.ring, ringStyle]}>
                    <View style={styles.centerButton}>
                        <Text style={styles.centerLabel}>Start</Text>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};


const styles = StyleSheet.create({
    timerWrap: {
        marginTop: 22,
        alignSelf: "center",
    },
    ring: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f1ec",
        padding: 10,
    },
    centerButton: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: "#5b9bd5",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
    },
    centerLabel: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "Poppins_700Bold",
    },
    referenceText: {
        color: "#111827",
        fontSize: 18,
        marginTop: 10,
        fontFamily: "Poppins_700Bold",
    },
    verseText: {
        color: "#6b7280",
        fontSize: 24,
        fontFamily: "Poppins_400Regular",
    },
});
