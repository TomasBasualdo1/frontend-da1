import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos",
          "Se requieren permisos para acceder a la galería.",
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets && result.assets[0]?.uri;
      if (uri) setImageUri(uri);
    } catch (err) {
      setMessage(String(err));
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return Alert.alert("Seleccione imagen primero");

    const baseUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!baseUrl) return setMessage("EXPO_PUBLIC_API_URL no está configurada");

    setUploading(true);
    setMessage(null);

    try {
      const filename = imageUri.split("/").pop() || `photo_${Date.now()}.jpg`;

      const presignRes = await fetch(
        `${baseUrl.replace(/\/$/, "")}/uploads/presign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename, bucket: "imagenes" }),
        },
      );

      if (!presignRes.ok) {
        const txt = await presignRes.text();
        setMessage(`Error presign: ${presignRes.status} ${txt}`);
        return;
      }

      const presignData = await presignRes.json();
      const uploadUrl = presignData.upload_url;
      const publicUrl = presignData.public_url;

      // Read local file and upload as blob
      const fileResp = await fetch(imageUri);
      const blob = await fileResp.blob();
      const contentType = blob.type || "image/jpeg";

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": contentType },
      });

      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        setMessage(`Error upload: ${uploadRes.status} ${t}`);
        return;
      }

      setMessage(`Subida OK. URL pública: ${publicUrl}`);
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      setMessage(`Error: ${text}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subir imagen a Supabase</Text>
      <Text style={styles.subtitle}>Bucket: imagenes</Text>

      <View style={styles.controls}>
        <Button title="Seleccionar imagen" onPress={pickImage} />
        <View style={{ height: 12 }} />
        <Button
          title="Subir"
          onPress={uploadImage}
          disabled={!imageUri || uploading}
        />
      </View>

      {uploading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.statusText}>Subiendo...</Text>
        </View>
      )}

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      {message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 18,
  },
  controls: {
    gap: 8,
    marginBottom: 16,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  statusText: {
    marginTop: 8,
    color: "#334155",
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginTop: 12,
  },
  messageBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  messageText: {
    color: "#0F172A",
  },
});
