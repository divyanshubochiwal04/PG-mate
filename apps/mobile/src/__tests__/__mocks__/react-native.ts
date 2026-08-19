export const Platform = {
  OS: 'ios',
  select: (obj: any) => obj.ios || obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
};

export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const ScrollView = 'ScrollView';
export const FlatList = 'FlatList';
export const TextInput = 'TextInput';
export const ActivityIndicator = 'ActivityIndicator';
export const Modal = 'Modal';
export const Alert = {
  alert: () => {},
};
