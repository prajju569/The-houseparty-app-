import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: Record<string, unknown>) {
  if (navigationRef.isReady()) {
    // @ts-ignore — loose typing intentional while nav types are being built out
    navigationRef.navigate(name, params);
  }
}
