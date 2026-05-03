import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 justify-center">
      <View className="my-6 mx-4">
        <Pressable
          onPress={() => router.navigate("/profile")}
          className={`mb-3 h-14 flex-row items-center rounded-2xl border border-border bg-card px-4 active:opacity-90`}
        >
          <Text>Iniciar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
