import React, { useState } from "react";
import { Text, TextInput, Pressable, View } from "react-native";
import { useRouter } from "expo-router";

export default function Login() {
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    console.log("Documento:", documento, "Password:", password);
    router.push("/");
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-3xl font-bold text-gray-900 mb-8">Iniciar Sesión</Text>

      <View className="w-full mb-4">
        <Text className="text-base text-gray-700 mb-2">Documento</Text>
        <TextInput
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="Ingrese su documento"
          keyboardType="numeric"
          value={documento}
          onChangeText={setDocumento}
        />
      </View>

      <View className="w-full mb-6">
        <Text className="text-base text-gray-700 mb-2">Contraseña</Text>
        <TextInput
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="Ingrese su contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Pressable
        className="w-full bg-blue-600 rounded-lg py-4 items-center mb-4"
        onPress={handleLogin}
      >
        <Text className="text-white text-lg font-semibold">Ingresar</Text>
      </Pressable>

      <Pressable
        className="w-full border border-gray-300 rounded-lg py-4 items-center"
        onPress={() => router.push("/")}
      >
        <Text className="text-gray-700 text-base">Ir al Home</Text>
      </Pressable>
    </View>
  );
}
