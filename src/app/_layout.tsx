import { Link, Stack, usePathname } from "expo-router";

export default function RootLayout() {
  const pathname = usePathname();


  return (
    <>
      {/* <View style={styles.navbar}>
        <Link href="/" asChild>
          <Pressable >
            <Text >Index</Text>
          </Pressable>
        </Link>

        <Link href="/scripture-test" asChild>
          <Pressable>
            <Text>
              Scripture Test
            </Text>
          </Pressable>
        </Link>
      </View> */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="scripture-test"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />
      </Stack>
    </>


  );
}

