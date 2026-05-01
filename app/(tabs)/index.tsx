import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Pais = {
  numero: number;
  nombre: string;
  capital: string;
};

export default function HomeScreen() {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadPaises = async () => {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL;

      if (!baseUrl) {
        setError(
          "No está definida la variable de entorno EXPO_PUBLIC_API_URL.",
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${baseUrl.replace(/\/$/, "")}/paises`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as Pais[];
        setPaises(data);
      } catch (err) {
        if (
          typeof err === "object" &&
          err !== null &&
          "name" in err &&
          err.name === "AbortError"
        ) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Error desconocido al conectar con el backend.";
        setError(`No se pudo obtener /paises: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPaises();

    return () => controller.abort();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prueba de conexión con FastAPI</Text>
      <Text style={styles.subtitle}>
        GET {process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "")}/paises
      </Text>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.statusText}>Cargando países...</Text>
        </View>
      ) : error ? (
        <View style={[styles.centerContent, styles.errorBox]}>
          <Text style={styles.errorTitle}>Error de red</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.hintText}>
            Revisá que tu backend esté levantado, que la IP local sea accesible
            y que EXPO_PUBLIC_API_URL apunte al host correcto.
          </Text>
        </View>
      ) : (
        <FlatList
          data={paises}
          keyExtractor={(item) => item.numero.toString()}
          contentContainerStyle={
            paises.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={
            <Text style={styles.statusText}>
              La API respondió sin registros.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.countryName}>{item.nombre}</Text>
              <Text style={styles.countryMeta}>Número: {item.numero}</Text>
              <Text style={styles.countryMeta}>Capital: {item.capital}</Text>
            </View>
          )}
        />
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
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    color: "#334155",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 16,
    padding: 18,
    alignItems: "flex-start",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: "#7F1D1D",
    lineHeight: 21,
  },
  hintText: {
    marginTop: 12,
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 19,
  },
  list: {
    paddingBottom: 24,
    gap: 12,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  countryName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  countryMeta: {
    fontSize: 14,
    color: "#334155",
    marginTop: 2,
  },
});
