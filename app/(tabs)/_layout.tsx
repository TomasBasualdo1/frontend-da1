import { MaterialIcons } from "@expo/vector-icons";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Inicio</Label>
        <Icon
          sf="house.fill"
          androidSrc={<VectorIcon family={MaterialIcons} name="home" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="live">
        <Icon
          sf="play"
          androidSrc={<VectorIcon family={MaterialIcons} name="play-circle" />}
        />
        <Label>En Vivo</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="subastas">
        <Icon
          sf="plus"
          androidSrc={<VectorIcon family={MaterialIcons} name="gavel" />}
        />
        <Label>Subastas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon
          sf="person"
          androidSrc={<VectorIcon family={MaterialIcons} name="person" />}
        />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
