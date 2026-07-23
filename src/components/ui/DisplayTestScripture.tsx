import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SCRIPTURE } from "../../../data/scriptures";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import LottieView from "lottie-react-native";

const SUCCESS_ANIMATION = require("../../../assets/animations/sprinkles.json");

const OLD_FONT_FAMILY = Platform.select({
    ios: "System",
    android: "sans-serif",
    web: "system-ui",
});

function getRandomIndices(n: number, count = 5) {
    const uniqueNumbers: number[] = [];
    const targetCount = Math.min(count, n);

    while (uniqueNumbers.length < targetCount) {
        const randomNumber = Math.floor(Math.random() * n);
        if (!uniqueNumbers.includes(randomNumber)) {
            uniqueNumbers.push(randomNumber);
        }
    }

    return uniqueNumbers;
}

function shuffleArray<T>(items: T[]) {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function getAnswerChoices(pool: string[], correctAnswer: string, wrongCount = 5) {
    const distractors = shuffleArray(pool.filter((item) => item !== correctAnswer)).slice(
        0,
        wrongCount
    );

    return shuffleArray([correctAnswer, ...distractors]);
}

function cleanWord(word: string) {
    return word.replace(/[.,;:!?]+$/g, "");
}

function getEligibleIndices(words: string[]) {
    return words
        .map((word, index) => ({ word: cleanWord(word), index }))
        .filter(({ word }) => word.length > 3)
        .map(({ index }) => index);
}

const WORD_POOL = Array.from(
    new Set(
        SCRIPTURE.flatMap((entry) =>
            entry.text
                .split(" ")
                .map((word) => cleanWord(word.trim()))
                .filter(Boolean)
        )
    )
);

export const DisplayTestScripture = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);
    const [pendingSelection, setPendingSelection] = useState<{
        blankIndex: number;
        word: string;
    } | null>(null);
    const [resultsChecked, setResultsChecked] = useState(false);
    const [celebratingSuccess, setCelebratingSuccess] = useState(false);
    const allowLeaveRef = useRef(false);
    const advancedRef = useRef(false);

    const { id, rep } = useLocalSearchParams<{ id?: string | string[]; rep?: string | string[] }>();
    const scriptIndex = Array.isArray(id) ? Number(id[0]) : Number(id);
    const requestedRepetition = Array.isArray(rep) ? Number(rep[0]) : Number(rep);
    const repetition = Number.isFinite(requestedRepetition)
        ? Math.min(Math.max(requestedRepetition, 1), 3)
        : 1;
    const scripture = SCRIPTURE[scriptIndex];

    if (!scripture) {
        return (
            <View>
                <Text>No scripture found.</Text>
            </View>
        );
    }

    const words = useMemo(() => scripture.text.split(" "), [scripture.text]);
    const eligibleIndices = useMemo(() => getEligibleIndices(words), [words]);
    const hiddenCount = repetition === 1 ? 3 : repetition === 2 ? 5 : eligibleIndices.length;
    const hiddenIndices = useMemo(
        () => {
            const pickedEligibleIndices = getRandomIndices(eligibleIndices.length, hiddenCount);
            return pickedEligibleIndices.map((index) => eligibleIndices[index]);
        },
        [eligibleIndices, hiddenCount]
    );
    const answerChoices = useMemo(() => {
        if (activeBlankIndex === null) {
            return [];
        }

        return getAnswerChoices(WORD_POOL, cleanWord(words[activeBlankIndex]));
    }, [activeBlankIndex, words]);

    const allBlanksFilled = hiddenIndices.every((index) => selectedAnswers[index] !== undefined);
    const correctCount = hiddenIndices.filter(
        (index) => selectedAnswers[index] === cleanWord(words[index])
    ).length;
    const quizLocked = resultsChecked;

    useEffect(() => {
        if (Platform.OS === "web") {
            window.history.pushState(null, "", window.location.href);

            const onPopState = () => {
                if (allowLeaveRef.current) {
                    return;
                }

                const shouldLeave = window.confirm(
                    "Leave this quiz? Your current answers will be lost."
                );

                if (shouldLeave) {
                    allowLeaveRef.current = true;
                    window.removeEventListener("popstate", onPopState);
                    window.history.back();
                    return;
                }

                window.history.pushState(null, "", window.location.href);
            };

            const onBeforeUnload = (event: BeforeUnloadEvent) => {
                if (allowLeaveRef.current) {
                    return;
                }

                event.preventDefault();
                event.returnValue = "";
            };

            window.addEventListener("popstate", onPopState);
            window.addEventListener("beforeunload", onBeforeUnload);
            return () => {
                window.removeEventListener("popstate", onPopState);
                window.removeEventListener("beforeunload", onBeforeUnload);
            };
        }

        const onBackPress = () => true;
        const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        return () => subscription.remove();
    }, []);

    const openModalForBlank = (blankIndex: number) => {
        if (quizLocked) {
            return;
        }

        setActiveBlankIndex(blankIndex);
        setModalVisible(true);
    };

    const handleWordPick = (word: string) => {
        if (quizLocked || activeBlankIndex === null) {
            return;
        }

        setPendingSelection({ blankIndex: activeBlankIndex, word });
        setResultsChecked(false);
        setModalVisible(false);
    };

    const handleModalDismiss = () => {
        if (pendingSelection) {
            setSelectedAnswers((current) => ({
                ...current,
                [pendingSelection.blankIndex]: pendingSelection.word,
            }));
        }

        setPendingSelection(null);
        setActiveBlankIndex(null);
    };

    const handleCheckAnswers = () => {
        if (!allBlanksFilled) {
            return;
        }

        setResultsChecked(true);
        if (correctCount === hiddenIndices.length) {
            setCelebratingSuccess(true);
        }
    };

    const handleTryAgain = () => {
        setSelectedAnswers({});
        setResultsChecked(false);
        setCelebratingSuccess(false);
        setActiveBlankIndex(null);
        setModalVisible(false);
    };

    const advanceAfterSuccess = () => {
        if (advancedRef.current) {
            return;
        }

        advancedRef.current = true;
        allowLeaveRef.current = true;
        if (repetition < 3) {
            router.replace({
                pathname: "/scripture-test",
                params: { id: String(scriptIndex), rep: String(repetition + 1) },
            });
            return;
        }
    };

    useEffect(() => {
        if (!celebratingSuccess || correctCount !== hiddenIndices.length || repetition === 3) {
            return;
        }

        const timer = setTimeout(() => {
            advanceAfterSuccess();
        }, 2200);

        return () => clearTimeout(timer);
    }, [celebratingSuccess, correctCount, hiddenIndices.length, repetition, scriptIndex]);

    return (
        <View>
            {resultsChecked && correctCount === hiddenIndices.length ? (
                <View pointerEvents="none" style={styles.successBackground}>
                    <LottieView
                        source={SUCCESS_ANIMATION}
                        autoPlay
                        loop={false}
                        style={styles.successAnimation}
                        onAnimationFinish={() => {
                            if (celebratingSuccess) {
                                advanceAfterSuccess();
                            }
                        }}
                    />
                </View>
            ) : null}

            <Text style={styles.referenceText}>
                {scripture.book} {scripture.chapter} : {scripture.verse}
            </Text>
            <View style={styles.progressSteps}>
                {[1, 2, 3].map((step) => {
                    const isComplete = repetition > step;
                    const isActive = repetition === step;

                    return (
                        <View key={step} style={styles.progressStepTrack}>
                            <View
                                style={[
                                    styles.progressStepFill,
                                    isComplete && styles.progressStepFillComplete,
                                    isActive && styles.progressStepFillActive,
                                ]}
                            />
                        </View>
                    );
                })}
            </View>
            <View style={styles.scriptureLine}>
                {words.map((word, index) => {
                    const isBlank = hiddenIndices.includes(index);

                    if (!isBlank) {
                        return (
                            <Text style={styles.visibleWord} key={index}>
                                {word + " "}
                            </Text>
                        );
                    }

                    const selectedWord = selectedAnswers[index];
                    const correctWord = cleanWord(words[index]);
                    const isCorrect = resultsChecked && selectedWord === correctWord;
                    const isWrong =
                        resultsChecked &&
                        selectedWord !== undefined &&
                        selectedWord !== correctWord;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.blankWord}
                            disabled={quizLocked}
                            onPress={() => openModalForBlank(index)}
                        >
                            {selectedWord !== undefined ? (
                                <View
                                    style={[
                                        styles.blankPlaceholder,
                                        isCorrect && styles.correctBlankPlaceholder,
                                        isWrong && styles.wrongBlankPlaceholder,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.blankWordText,
                                            isCorrect && styles.correctWordText,
                                            isWrong && styles.wrongWordText,
                                        ]}
                                    >
                                        {selectedWord}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.blankPlaceholder} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {!allBlanksFilled ? (
                <Text style={styles.progressText}>Fill all blanks to check your answers.</Text>
            ) : !resultsChecked ? (
                <Pressable style={styles.checkButton} onPress={handleCheckAnswers}>
                    <Text style={styles.checkButtonText}>Done</Text>
                </Pressable>
            ) : null}

            {resultsChecked && correctCount !== hiddenIndices.length ? (
                <Pressable style={styles.tryAgainButton} onPress={handleTryAgain}>
                    <Text style={styles.tryAgainButtonText}>Try Again</Text>
                </Pressable>
            ) : null}

            {resultsChecked && correctCount === hiddenIndices.length && repetition === 3 ? (
                <Pressable
                    style={styles.nextButton}
                    onPress={() => {
                        allowLeaveRef.current = true;
                        router.replace({
                            pathname: "/",
                            params: { index: String(scriptIndex + 1) },
                        });
                    }}
                >
                    <Text style={styles.nextButtonText}>Next</Text>
                </Pressable>
            ) : null}

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
                onDismiss={handleModalDismiss}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Scripture Test</Text>
                        <Text style={styles.modalBody}>
                            Choose the answer for the selected blank.
                        </Text>

                        {/* {activeBlankIndex !== null ? (
                            <Text style={styles.activeBlankText}>Blank selected</Text>
                        ) : null} */}

                        <View style={styles.wordList}>
                            {answerChoices.map((answer) => (
                                <TouchableOpacity
                                    key={answer}
                                    style={styles.wordChip}
                                    disabled={quizLocked}
                                    onPress={() => handleWordPick(answer)}
                                >
                                    <Text style={styles.wordChipText}>{answer}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Pressable
                            style={styles.closeButton}
                            onPress={() => {
                                setPendingSelection(null);
                                setModalVisible(false);
                                setActiveBlankIndex(null);
                            }}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    scriptureLine: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-start",
    },
    blankWord: {
        marginRight: 6,
        marginBottom: 6,
    },
    blankWordText: {
        color: "black",
        fontSize: 24,
        fontFamily: OLD_FONT_FAMILY,
    },
    blankPlaceholder: {
        minWidth: 44,
        minHeight: 34,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "rgba(17, 24, 39, 0.04)",
        borderWidth: 1,
        borderColor: "rgba(17, 24, 39, 0.12)",
        justifyContent: "center",
        alignItems: "center",
    },
    correctBlankPlaceholder: {
        backgroundColor: "rgba(34, 197, 94, 0.10)",
        borderColor: "rgba(34, 197, 94, 0.25)",
    },
    wrongBlankPlaceholder: {
        backgroundColor: "rgba(239, 68, 68, 0.10)",
        borderColor: "rgba(239, 68, 68, 0.25)",
    },
    correctWordText: {
        color: "green",
    },
    wrongWordText: {
        color: "red",
    },
    visibleWord: {
        color: "#6b7280",
        fontSize: 24,
        fontFamily: "Poppins_400Regular",
    },
    progressText: {
        marginTop: 16,
        fontSize: 14,
        color: "#374151",
    },
    progressSteps: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
        alignSelf: "flex-start",
    },
    progressStepTrack: {
        width: 28,
        height: 6,
        borderRadius: 999,
        backgroundColor: "rgba(17, 24, 39, 0.10)",
        overflow: "hidden",
    },
    progressStepFill: {
        width: "100%",
        height: "100%",
        borderRadius: 999,
        backgroundColor: "rgba(17, 24, 39, 0.10)",
    },
    progressStepFillComplete: {
        backgroundColor: "#5b9bd5",
    },
    progressStepFillActive: {
        backgroundColor: "#8cbbe6",
    },
    checkButton: {
        marginTop: 16,
        alignSelf: "flex-start",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#1f2937",
    },
    checkButtonText: {
        color: "#fff",
        fontFamily: "Poppins_700Bold",
    },
    tryAgainButton: {
        marginTop: 12,
        alignSelf: "flex-start",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#b91c1c",
    },
    tryAgainButtonText: {
        color: "#fff",
        fontFamily: "Poppins_700Bold",
    },
    nextButton: {
        marginTop: 12,
        alignSelf: "flex-start",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#166534",
    },
    nextButtonText: {
        color: "#fff",
        fontFamily: "Poppins_700Bold",
    },
    successPanel: {
        marginTop: 16,
        alignItems: "center",
        alignSelf: "flex-start",
    },
    successBackground: {
        ...StyleSheet.absoluteFill,
        zIndex: -1,
        opacity: 0.95,
    },
    successAnimation: {
        width: "100%",
        height: "100%",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    modalContent: {
        width: "100%",
        maxWidth: 360,
        borderRadius: 20,
        backgroundColor: "#fff8ef",
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 10,
        color: "#1f2937",
        fontFamily: "Poppins_700Bold",
    },
    modalBody: {
        fontSize: 16,
        lineHeight: 22,
        color: "#374151",
        marginBottom: 16,
        fontFamily: "Poppins_400Regular",
    },
    wordList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 16,
    },
    wordChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: "#e0e7ff",
    },
    wordChipText: {
        color: "#1d4ed8",
        fontFamily: "Poppins_600SemiBold",
    },
    closeButton: {
        alignSelf: "flex-end",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#b45309",
    },
    closeButtonText: {
        color: "#fff",
        fontFamily: "Poppins_700Bold",
    },
    referenceText: {
        color: "#111827",
        fontSize: 18,
        marginBottom: 10,
        fontFamily: "Poppins_700Bold",
    },
});
