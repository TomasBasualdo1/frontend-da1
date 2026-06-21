import { MaterialIcons } from "@expo/vector-icons";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      labelVisibilityMode="labeled"
      rippleColor="rgba(184, 148, 28, 0.1)"
      indicatorColor="rgba(184, 148, 28, 0.15)"
      iconColor={{
        default: "#6B7280",
        selected: "#8B6914",
      }}
      labelStyle={{
        default: {
          color: "#6B7280",
          fontSize: 12,
        },
        selected: {
          color: "#8B6914",
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <NativeTabs.Trigger name="index">
        <Label>Inicio</Label>
        <Icon
          sf="house.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="home-filled" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="live">
        <Label>En Vivo</Label>
        <Icon
          sf="dot.radiowaves.left.and.right"
          androidSrc={<VectorIcon family={MaterialIcons} name="cell-tower" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="subastas">
        <Label>Subastas</Label>
        <Icon
          sf="hammer.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="gavel" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Perfil</Label>
        <Icon
          sf="person.crop.circle"
          androidSrc={
            <VectorIcon family={MaterialIcons} name="person-outline" />
          }
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
