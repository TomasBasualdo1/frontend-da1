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
